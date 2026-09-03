"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  BookOpen,
  Users,
  ClipboardList,
  CheckCircle2,
  Plus,
  Megaphone,
  FileText,
  GraduationCap,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import StatsCard from "@/components/dashboard/StatsCard";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";
import EmptyState from "@/components/dashboard/EmptyState";

interface Stats {
  myClasses: number;
  myStudents: number;
  activeAssignments: number;
  pendingReviews: number;
  assignmentsPerClass?: { name: string; assignments: number }[];
  recentSubmissions?: {
    id: string;
    studentName: string;
    assignmentTitle: string;
    submittedAt: string;
    status: string;
    class: string;
  }[];
}

export default function TeacherDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/teacher/stats");
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

  if (loading) return <LoadingSpinner text="Loading teacher dashboard..." fullScreen />;

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

  const teacherName = (session?.user as any)?.name?.split(" ")[0] || "Teacher";
  const chartData =
    stats?.assignmentsPerClass && stats.assignmentsPerClass.length > 0
      ? stats.assignmentsPerClass
      : [{ name: "No data", assignments: 0 }];

  const quickActions = [
    {
      label: "Create Assignment",
      icon: <Plus className="w-4 h-4" />,
      href: "/dashboard/teacher/assignments",
      color: "from-school-blue to-primary",
    },
    {
      label: "Post Announcement",
      icon: <Megaphone className="w-4 h-4" />,
      href: "/dashboard/teacher/announcements",
      color: "from-school-gold to-secondary",
    },
    {
      label: "Upload Material",
      icon: <FileText className="w-4 h-4" />,
      href: "/dashboard/teacher/materials",
      color: "from-school-green to-accent",
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h2 className="font-[family-name:var(--font-poppins)] text-2xl font-bold text-school-dark">
          Welcome back, {teacherName}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Here&apos;s what&apos;s happening in your classes today.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatsCard
          title="My Classes"
          value={stats?.myClasses ?? 0}
          icon={<BookOpen className="w-5 h-5" />}
          color="blue"
        />
        <StatsCard
          title="My Students"
          value={stats?.myStudents ?? 0}
          icon={<Users className="w-5 h-5" />}
          color="green"
        />
        <StatsCard
          title="Active Assignments"
          value={stats?.activeAssignments ?? 0}
          icon={<ClipboardList className="w-5 h-5" />}
          color="gold"
        />
        <StatsCard
          title="Pending Reviews"
          value={stats?.pendingReviews ?? 0}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={() => router.push(action.href)}
            className={`flex items-center gap-3 px-4 py-3 bg-gradient-to-r ${action.color} text-white text-sm font-semibold rounded-xl shadow-soft-sm hover:shadow-soft-md hover:scale-[1.02] transition-all duration-200`}
          >
            {action.icon}
            {action.label}
            <ArrowRight className="w-4 h-4 ml-auto" />
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-soft-sm p-5 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-[family-name:var(--font-poppins)] font-bold text-school-dark">
              Assignments Per Class
            </h3>
            <GraduationCap className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                  }}
                />
                <Bar dataKey="assignments" fill="#0f4c81" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft-sm p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-[family-name:var(--font-poppins)] font-bold text-school-dark">
              Recent Submissions
            </h3>
            <button
              onClick={() => router.push("/dashboard/teacher/assignments")}
              className="text-xs text-school-blue font-medium hover:underline"
            >
              Review All
            </button>
          </div>
          {!stats?.recentSubmissions || stats.recentSubmissions.length === 0 ? (
            <EmptyState
              icon={<ClipboardList className="w-8 h-8 text-gray-400" />}
              title="No submissions yet"
              description="Submissions from your students will appear here for review."
            />
          ) : (
            <div className="space-y-3">
              {stats.recentSubmissions.map((sub) => (
                <div
                  key={sub.id}
                  className="p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => router.push("/dashboard/teacher/assignments")}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-gray-800 line-clamp-1">
                      {sub.studentName}
                    </p>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                        sub.status === "GRADED"
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {sub.status === "GRADED" ? "Graded" : "Pending"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                    {sub.assignmentTitle} · {sub.class}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {new Date(sub.submittedAt).toLocaleDateString("en-NG", {
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
  );
}
