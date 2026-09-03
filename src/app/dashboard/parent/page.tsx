"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Baby,
  ClipboardList,
  FileText,
  AlertCircle,
  ArrowRight,
  Megaphone,
  GraduationCap,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";
import EmptyState from "@/components/dashboard/EmptyState";

interface Stats {
  children: number;
  childCount?: number;
  childrenCount?: number;
  totalGrades?: number;
  activeAssignments: number;
  recentGrades: number;
  childrenData?: {
    id: string;
    firstName: string;
    lastName: string;
    className?: string;
    studentId?: string;
    average?: number | string;
    pendingAssignments?: number;
  }[];
  announcements?: {
    id: string;
    title: string;
    content: string;
    priority: string;
    createdAt: string;
  }[];
}

export default function ParentDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/parent/stats");
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to load dashboard data.");
      }
      const json = await res.json();
      setStats(json.data || json);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <LoadingSpinner text="Loading your dashboard..." fullScreen />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-gray-600 font-medium">{error}</p>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-school-blue text-white text-sm font-medium rounded-xl hover:bg-primary transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const parentName = (session?.user as any)?.name?.split(" ")[0] || "Parent";
  const children = stats?.childrenData || [];

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h2 className="font-[family-name:var(--font-poppins)] text-2xl font-bold text-school-dark">
          Welcome back, {parentName}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Stay updated on your children&apos;s academic progress.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        <StatsCard
          title="My Children"
          value={stats?.childCount ?? stats?.childrenCount ?? 0}
          icon={<Baby className="w-5 h-5" />}
          color="blue"
        />
        <StatsCard
          title="Active Assignments"
          value={stats?.activeAssignments ?? 0}
          icon={<ClipboardList className="w-5 h-5" />}
          color="gold"
        />
        <StatsCard
          title="Grades Recorded"
          value={stats?.totalGrades ?? 0}
          icon={<FileText className="w-5 h-5" />}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-soft-sm p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-[family-name:var(--font-poppins)] font-bold text-school-dark">
              My Children
            </h3>
            <button
              onClick={() => router.push("/dashboard/parent/children")}
              className="text-xs text-school-blue font-medium hover:underline"
            >
              View All
            </button>
          </div>
          {children.length === 0 ? (
            <EmptyState
              icon={<GraduationCap className="w-8 h-8 text-gray-400" />}
              title="No linked children"
              description="Children linked to your account will appear here."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {children.map((child) => {
                const avg =
                  child.average != null && child.average !== "—"
                    ? child.average
                    : "—";
                return (
                  <button
                    key={child.id}
                    onClick={() => router.push(`/dashboard/parent/children?id=${child.id}`)}
                    className="text-left bg-gray-50 hover:bg-gray-100 rounded-2xl p-5 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-school-blue to-primary rounded-xl flex items-center justify-center text-base font-bold text-white shrink-0">
                        {child.firstName?.[0]}
                        {child.lastName?.[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-school-dark truncate">
                          {child.firstName} {child.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{child.className || "No class"}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 ml-auto group-hover:translate-x-0.5 transition-transform shrink-0" />
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-xl p-3">
                        <p className="text-[11px] text-gray-400">Average</p>
                        <p className="text-lg font-bold text-school-green">{avg}</p>
                      </div>
                      <div className="bg-white rounded-xl p-3">
                        <p className="text-[11px] text-gray-400">Pending</p>
                        <p className="text-lg font-bold text-school-dark">
                          {child.pendingAssignments ?? 0}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft-sm p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-[family-name:var(--font-poppins)] font-bold text-school-dark">
              Latest Announcements
            </h3>
            <button
              onClick={() => router.push("/dashboard/parent/announcements")}
              className="text-xs text-school-blue font-medium hover:underline"
            >
              View All
            </button>
          </div>
          {!stats?.announcements || stats.announcements.length === 0 ? (
            <EmptyState
              icon={<Megaphone className="w-8 h-8 text-gray-400" />}
              title="No announcements"
            />
          ) : (
            <div className="space-y-3">
              {stats.announcements.slice(0, 4).map((ann) => (
                <div key={ann.id} className="p-3 rounded-xl bg-gray-50">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-gray-800 line-clamp-1">{ann.title}</p>
                    {ann.priority === "URGENT" && (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-700 shrink-0">
                        Urgent
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">{ann.content}</p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {new Date(ann.createdAt).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => router.push("/dashboard/parent/grades")}
          className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-school-blue to-primary text-white text-sm font-semibold rounded-xl shadow-soft-sm hover:shadow-soft-md hover:scale-[1.02] transition-all"
        >
          <TrendingUp className="w-4 h-4" />
          View Children&apos;s Grades
          <ArrowRight className="w-4 h-4 ml-auto" />
        </button>
        <button
          onClick={() => router.push("/dashboard/parent/children")}
          className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-school-green to-accent text-white text-sm font-semibold rounded-xl shadow-soft-sm hover:shadow-soft-md hover:scale-[1.02] transition-all"
        >
          <Baby className="w-4 h-4" />
          View My Children
          <ArrowRight className="w-4 h-4 ml-auto" />
        </button>
      </div>
    </div>
  );
}
