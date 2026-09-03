"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  BookOpen,
  ClipboardList,
  FileText,
  GraduationCap,
  Megaphone,
  AlertCircle,
  ArrowRight,
  CalendarClock,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";
import EmptyState from "@/components/dashboard/EmptyState";

interface Stats {
  myClass?: string;
  student?: { class?: { name: string } | null } | null;
  subjects?: number;
  pendingAssignments?: number;
  pendingSubmissionCount?: number;
  averageGrade?: string | number;
  assignments?: {
    id: string;
    title: string;
    subject?: { name: string } | string;
    dueDate: string;
    status: string;
    grade?: number | null;
  }[];
  grades?: {
    id: string;
    subject: { name: string } | string;
    score: number;
    grade: string;
    term: string;
  }[];
  announcements?: {
    id: string;
    title: string;
    content: string;
    priority: string;
    createdAt: string;
    targetType: string;
  }[];
}

function getStatusBadge(status: string, grade?: number | null) {
  const map: Record<string, string> = {
    GRADED: "bg-green-100 text-green-700",
    SUBMITTED: "bg-blue-100 text-blue-700",
    PENDING: "bg-amber-100 text-amber-700",
    LATE: "bg-red-100 text-red-700",
  };
  return (
    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${map[status] || "bg-gray-100 text-gray-500"}`}>
      {status === "GRADED" && grade != null ? `${grade}%` : status.toLowerCase()}
    </span>
  );
}

export default function StudentDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/student/stats");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load dashboard data.");
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

  const firstName = (session?.user as any)?.name?.split(" ")[0] || "Student";
  const className =
    stats?.myClass || stats?.student?.class?.name || "—";
  const avg =
    stats?.averageGrade != null && stats.averageGrade !== "—"
      ? stats.averageGrade
      : "—";

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h2 className="font-[family-name:var(--font-poppins)] text-2xl font-bold text-school-dark">
          Welcome back, {firstName}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {className !== "—"
            ? `You're in ${className}. Here's your learning overview.`
            : "Here's your learning overview."}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatsCard
          title="My Class"
          value={className}
          icon={<BookOpen className="w-5 h-5" />}
          color="blue"
        />
        <StatsCard
          title="Subjects"
          value={stats?.subjects ?? 0}
          icon={<GraduationCap className="w-5 h-5" />}
          color="green"
        />
        <StatsCard
          title="Pending Assignments"
          value={stats?.pendingSubmissionCount ?? stats?.pendingAssignments ?? 0}
          icon={<ClipboardList className="w-5 h-5" />}
          color="gold"
        />
        <StatsCard
          title="Average Grade"
          value={avg}
          icon={<TrendingUp className="w-5 h-5" />}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-soft-sm p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-[family-name:var(--font-poppins)] font-bold text-school-dark">
              Recent Assignments
            </h3>
            <button
              onClick={() => router.push("/dashboard/student/assignments")}
              className="text-xs text-school-blue font-medium hover:underline"
            >
              View All
            </button>
          </div>
          {!stats?.assignments || stats.assignments.length === 0 ? (
            <EmptyState
              icon={<ClipboardList className="w-8 h-8 text-gray-400" />}
              title="No assignments"
              description="Assignments for your class will appear here."
            />
          ) : (
            <div className="space-y-3">
              {stats.assignments.map((a) => {
                const subjectName =
                  typeof a.subject === "string" ? a.subject : a.subject?.name;
                return (
                  <div
                    key={a.id}
                    onClick={() => router.push("/dashboard/student/assignments")}
                    className="p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{a.title}</p>
                        <p className="text-xs text-gray-400">{subjectName}</p>
                      </div>
                      {getStatusBadge(a.status, a.grade)}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1">
                      <CalendarClock className="w-3 h-3" />
                      Due {new Date(a.dueDate).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-soft-sm p-5 sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-[family-name:var(--font-poppins)] font-bold text-school-dark">
                Recent Grades
              </h3>
              <button
                onClick={() => router.push("/dashboard/student/grades")}
                className="text-xs text-school-blue font-medium hover:underline"
              >
                View All
              </button>
            </div>
            {!stats?.grades || stats.grades.length === 0 ? (
              <EmptyState
                icon={<FileText className="w-8 h-8 text-gray-400" />}
                title="No grades yet"
              />
            ) : (
              <div className="space-y-3">
                {stats.grades.slice(0, 5).map((g) => {
                  const subjectName =
                    typeof g.subject === "string" ? g.subject : g.subject?.name;
                  return (
                    <div
                      key={g.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-gray-50"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800">{subjectName}</p>
                        <p className="text-xs text-gray-400 capitalize">{g.term?.toLowerCase()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-school-dark">{g.score}</span>
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-school-blue/10 text-school-blue font-bold text-xs">
                          {g.grade}
                        </span>
                      </div>
                    </div>
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
                onClick={() => router.push("/dashboard/student/announcements")}
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
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => router.push("/dashboard/student/assignments")}
          className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-school-blue to-primary text-white text-sm font-semibold rounded-xl shadow-soft-sm hover:shadow-soft-md hover:scale-[1.02] transition-all"
        >
          <CheckCircle2 className="w-4 h-4" />
          View My Assignments
          <ArrowRight className="w-4 h-4 ml-auto" />
        </button>
        <button
          onClick={() => router.push("/dashboard/student/grades")}
          className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-school-green to-accent text-white text-sm font-semibold rounded-xl shadow-soft-sm hover:shadow-soft-md hover:scale-[1.02] transition-all"
        >
          <FileText className="w-4 h-4" />
          View My Grades
          <ArrowRight className="w-4 h-4 ml-auto" />
        </button>
      </div>
    </div>
  );
}
