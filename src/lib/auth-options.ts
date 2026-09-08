import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { logActivity } from "./activity";
import { rateLimit } from "./rate-limit";

/** 10 login attempts per client IP per 15-minute window. */
const LOGIN_LIMIT = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

/** Reads a header from either a WHATWG Headers instance or a plain object. */
function headerValue(
  headers: Record<string, unknown> | Headers | undefined,
  key: string
): string | undefined {
  if (!headers) return undefined;
  if (headers instanceof Headers) return headers.get(key) ?? undefined;
  const value = headers[key] as string | string[] | undefined;
  return Array.isArray(value) ? value[0] : value;
}

/** Resolves the best-effort client IP from the request headers. */
function loginIp(req: { headers?: Record<string, unknown> | Headers } | undefined): string {
  if (!req) return "unknown";
  return (
    headerValue(req.headers, "x-forwarded-for")?.split(",")[0]?.trim() ||
    headerValue(req.headers, "x-real-ip") ||
    "unknown"
  );
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid email or password");
        }

        // Distributed brute-force protection. Runs BEFORE the user lookup and
        // password verification so attackers cannot force expensive bcrypt
        // work against the database-backed limiter.
        const rl = await rateLimit(`login:${loginIp(req)}`, LOGIN_LIMIT, LOGIN_WINDOW_MS);
        if (!rl.ok) {
          throw new Error("Too many login attempts. Please try again later.");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });

        // Generic error for all auth failures — prevents account enumeration
        if (!user || !user.isActive) {
          throw new Error("Invalid email or password");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isSuperAdmin: user.isSuperAdmin,
          image: user.image,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.isSuperAdmin = (user as any).isSuperAdmin;
        token.permissions = (user as any).permissions ?? [];
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
        (session.user as any).isSuperAdmin =
          token.isSuperAdmin as boolean;
        (session.user as any).permissions =
          token.permissions as string[];

        try {
          const fresh = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              isActive: true,
              role: true,
              isSuperAdmin: true,
              permissions: true,
            },
          });

          if (!fresh?.isActive) {
            return { ...session, expires: new Date(0).toISOString() };
          }

          (session.user as any).role = fresh.role;
          (session.user as any).isSuperAdmin = fresh.isSuperAdmin;
          (session.user as any).permissions = fresh.permissions ?? [];
        } catch {
          // Ignore session refresh failures; keep prior token values.
        }
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (user?.id) {
        await logActivity(
          user.id,
          "LOGIN",
          `Signed in as ${(user as any).role || "user"}`
        );
      }
    },
    async signOut({ token }) {
      const id = (token as any)?.id;
      if (id) {
        await logActivity(
          id as string,
          "LOGOUT",
          "Signed out"
        );
      }
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
