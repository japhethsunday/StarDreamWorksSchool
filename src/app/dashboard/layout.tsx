"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-paper/60">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-brand-navy animate-spin" />
          <p className="text-sm text-brand-muted font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const role = (session.user as any)?.role || "ADMIN";
  const isSuperAdmin = (session.user as any)?.isSuperAdmin === true;
  const permissions = (session.user as any)?.permissions || [];

  return (
    <div className="min-h-screen bg-brand-paper/60">
      <Sidebar role={role} isSuperAdmin={isSuperAdmin} permissions={permissions} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-72 min-h-screen flex flex-col">
        <Header
          title="Dashboard"
          onMenuToggle={() => setSidebarOpen(true)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
