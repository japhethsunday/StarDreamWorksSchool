"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { Eye, EyeOff, LogIn, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { Crest } from "@/components/public/Logo";

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const role = (session.user as { role?: string } | null)?.role;
      if (role === "ADMIN") router.push("/dashboard/admin");
      else if (role === "TEACHER") router.push("/dashboard/teacher");
      else if (role === "STUDENT") router.push("/dashboard/student");
      else if (role === "PARENT") router.push("/dashboard/parent");
      else router.push("/");
    }
  }, [session, status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-navy-deep">
        <Loader2 className="w-8 h-8 text-brand-yellow animate-spin" />
      </div>
    );
  }

  if (status === "authenticated") {
    return null;
  }

  return (
    <div className="min-h-screen sd-hero-surface flex items-center justify-center p-4">

      <div className="relative w-full max-w-md">
        {/* Back to home */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-soft-xl p-8 sm:p-10">
          {/* Branding */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Crest className="w-16 h-16" />
            </div>
            <p className="text-[11px] font-bold uppercase text-brand-navy" style={{ letterSpacing: "0.32em" }}>
              Star
            </p>
            <p className="font-heading text-xl font-bold text-brand-red">
              DreamWorks Schools
            </p>
            <p className="text-sm text-brand-muted mt-2">
              Sign in to access your portal
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-1.5" aria-label="Available portals">
              {["Admin", "Teacher", "Student", "Parent"].map((role) => (
                <span
                  key={role}
                  className="text-[11px] font-bold uppercase tracking-widest text-brand-navy bg-brand-navy/5 border border-brand-line rounded-full px-2.5 py-1"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy transition-all"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy transition-all pr-12"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="sd-btn sd-btn-apply w-full px-6 py-3.5 text-[15px] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <p className="text-center text-xs text-gray-400 mt-8">
            Contact the school administrator if you forgot your password.
          </p>
        </div>

        {/* School branding below */}
        <p className="text-center text-white/40 text-xs mt-6">
          STAR DreamWorks Schools &mdash; Pre-School, Nursery, Primary & High School
        </p>
      </div>
    </div>
  );
}
