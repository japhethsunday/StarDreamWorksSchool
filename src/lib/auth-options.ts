import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { logActivity } from "./activity";

export const authOptions: NextAuthOptions = {
  trustHost: true,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid email or password");
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
