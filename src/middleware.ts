import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that are fully public — no session required
const PUBLIC_ROUTES = [
  "/api/admissions/enquiries",
  "/api/public/",
  "/api/site-settings",
  "/api/educational-levels",
  "/api/auth/",
  "/api/webhooks/resend",
];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((p) => pathname.startsWith(p));
}

// Role → allowed API prefixes
const ROLE_PREFIXES: Record<string, string[]> = {
  ADMIN: ["/api/admin/"],
  TEACHER: ["/api/teacher/"],
  STUDENT: ["/api/student/"],
  PARENT: ["/api/parent/"],
};

// Simple in-memory rate limit for login (POST only)
const LOGIN_ATTEMPTS = new Map<string, { count: number; resetAt: number }>();

function checkLoginRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = LOGIN_ATTEMPTS.get(key);
  if (!entry || now > entry.resetAt) {
    LOGIN_ATTEMPTS.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count++;
  return entry.count <= limit;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // ── Security Headers ──────────────────────────────────────────────
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "0"); // Modern browsers; CSP replaces this
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()"
  );
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );
  response.headers.set("X-DNS-Prefetch-Control", "off");
  // Remove server identity
  response.headers.delete("X-Powered-By");
  response.headers.delete("Server");

  // Content-Security-Policy — restrictive baseline
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://res.cloudinary.com https://placehold.co https://*.cloudinary.com",
      "frame-src https://www.openstreetmap.org",
      "connect-src 'self' https://api.cloudinary.com https://*.supabase.co wss://ws-us1.pusher.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ")
  );

  // ── Login Rate Limiting ──────────────────────────────────────────
  if (pathname === "/api/auth/callback/credentials" && request.method === "POST") {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "unknown";
    if (!checkLoginRateLimit(`login:${ip}`, 10, 15 * 60 * 1000)) {
      return NextResponse.json(
        { success: false, error: "Too many login attempts. Please try again later." },
        { status: 429 }
      );
    }
  }

  // ── API Auth Guard ────────────────────────────────────────────────
  if (pathname.startsWith("/api/") && !isPublicRoute(pathname)) {
    const token = request.cookies.get("next-auth.session-token")?.value
      || request.cookies.get("__Secure-next-auth.session-token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Decode JWT payload (no verification — just to read role for route guard)
    // NextAuth still verifies the token server-side in getServerSession()
    try {
      const payload = JSON.parse(
        Buffer.from(token.split(".")[1], "base64url").toString()
      );
      const role = payload.role as string | undefined;

      if (role) {
        const allowedPrefixes = ROLE_PREFIXES[role] ?? [];
        const isAllowed = allowedPrefixes.some((p) => pathname.startsWith(p));

        // Admin can access everything
        if (role !== "ADMIN" && !isAllowed) {
          return NextResponse.json(
            { success: false, error: "Forbidden" },
            { status: 403 }
          );
        }
      }
    } catch {
      // Malformed token — let the route handler deal with it via getServerSession()
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/).*)"],
};
