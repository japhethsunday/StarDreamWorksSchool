"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  GraduationCap,
  BookOpen,
  FileText,
  Megaphone,
  Plus,
  Calendar,
  TrendingUp,
  AlertCircle,
  UserCheck,
  ShieldCheck,
  ClipboardList,
  Activity,
  UserPlus,
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
import { formatDistanceToNow } from "date-fns";

interface DashboardData {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalSubjects: number;
  totalParents: number;
  totalAdmins: number;
  totalUsers: number;
  activeStudents: number;
  activeTeachers: number;
  newStudentsThisMonth: number;
  newTeachersThisMonth: number;
  pendingAssignments: number;
  studentsPerClass: { name: string; students: number }[];
  recentAdmissions: {
    id: string;
    firstName: string;
    lastName: string;
    studentId: string;
    admissionDate: string;
    user: { email: string };
    class: { name: string } | null;
  }[];
  recentActivity: {
    id: string;
    action: string;
    details?: string | null;
    createdAt: string;
    user: { name: string; email: string; role: string } | null;
  }[];
}

interface Announcement {
  id: string;
  title: string;
  createdAt: string;
  priority: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, announcementsRes] = await Promise.allSettled([
          fetch("/api/admin/stats"),
          fetch("/api/admin/announcements?limit=5"),
        ]);

        if (statsRes.status === "fulfilled" && statsRes.value.ok) {
          const statsData = await statsRes.value.json();
          const d = statsData.data || statsData;
          setData(d);
          setAnnouncements(d.recentAnnouncements || []);
        }
      } catch {
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner text="Loading admin dashboard..." fullScreen />;

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-gray-600 font-medium">{error || "Failed to load dashboard."}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-school-blue text-white text-sm font-medium rounded-xl hover:bg-primary transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const chartData = data.studentsPerClass || [];
  const hasChartData = chartData.length > 0;

  const quickActions = [
    { label: "Add Teacher", icon: <GraduationCap className="w-4 h-4" />, href: "/dashboard/admin/teachers", color: "bg-brand-navy hover:bg-brand-navy/90" },
    { label: "Add Student", icon: <Users className="w-4 h-4" />, href: "/dashboard/admin/students", color: "bg-brand-navy hover:bg-brand-navy/90" },
    { label: "Create Class", icon: <BookOpen className="w-4 h-4" />, href: "/dashboard/admin/classes", color: "bg-brand-navy hover:bg-brand-navy/90" },
    { label: "Post Announcement", icon: <Megaphone className="w-4 h-4" />, href: "/dashboard/admin/announcements", color: "bg-brand-red hover:bg-brand-red-dark" },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h2 className="font-[family-name:var(--font-poppins)] text-2xl font-bold text-school-dark">
          Welcome back, Admin
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Here&apos;s what&apos;s happening at STAR DreamWorks Schools today.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatsCard
          title="Total Students"
          value={data.totalStudents}
          icon={<Users className="w-5 h-5" />}
          color="blue"
          change={`+${data.newStudentsThisMonth} this month`}
        />
        <StatsCard
          title="Total Teachers"
          value={data.totalTeachers}
          icon={<GraduationCap className="w-5 h-5" />}
          color="gold"
          change={`+${data.newTeachersThisMonth} this month`}
        />
        <StatsCard
          title="Total Parents"
          value={data.totalParents}
          icon={<UserCheck className="w-5 h-5" />}
          color="green"
        />
        <StatsCard
          title="Total Admins"
          value={data.totalAdmins}
          icon={<ShieldCheck className="w-5 h-5" />}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={() => router.push(action.href)}
            className={`flex items-center gap-3 px-4 py-3 ${action.color} text-white text-sm font-semibold rounded-lg transition-all duration-150 hover:-translate-y-0.5 hover:shadow-soft-md`}
          >
            <Plus className="w-4 h-4" />
            {action.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-soft-sm p-5 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-[family-name:var(--font-poppins)] font-bold text-school-dark">
              Students Per Class
            </h3>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          {!hasChartData ? (
            <div className="h-72 flex flex-col items-center justify-center gap-2 text-gray-400">
              <FileText className="w-8 h-8" />
              <p className="text-sm">No students assigned to classes yet.</p>
            </div>
          ) : (
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
                  <Bar dataKey="students" fill="#1f2a5e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft-sm p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-[family-name:var(--font-poppins)] font-bold text-school-dark">
              Recent Announcements
            </h3>
            <button
              onClick={() => router.push("/dashboard/admin/announcements")}
              className="text-xs text-school-blue font-medium hover:underline"
            >
              View All
            </button>
          </div>
          {announcements.length === 0 ? (
            <div className="text-center py-8">
              <Megaphone className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No announcements yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  className="p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-gray-800 line-clamp-1">{ann.title}</p>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                        ann.priority === "HIGH"
                          ? "bg-red-100 text-red-700"
                          : ann.priority === "MEDIUM"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {ann.priority}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(ann.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-soft-sm p-5 sm:p-6">
        <h3 className="font-[family-name:var(--font-poppins)] font-bold text-school-dark mb-5">
          Quick Overview
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl">
            <div className="w-10 h-10 bg-school-blue/10 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-school-blue" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Active Teachers</p>
              <p className="text-lg font-bold text-school-dark">{data.activeTeachers}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-green-50 rounded-xl">
            <div className="w-10 h-10 bg-school-green/10 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-school-green" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Enrolled Students</p>
              <p className="text-lg font-bold text-school-dark">{data.activeStudents}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-xl">
            <div className="w-10 h-10 bg-school-gold/10 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-brand-red" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Classes</p>
              <p className="text-lg font-bold text-school-dark">{data.totalClasses}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-xl">
            <div className="w-10 h-10 bg-purple-100/50 rounded-lg flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-purple-700" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Pending Assignments</p>
              <p className="text-lg font-bold text-school-dark">{data.pendingAssignments}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft-sm p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-[family-name:var(--font-poppins)] font-bold text-school-dark flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-school-blue" /> Recent Admissions
            </h3>
            <button
              onClick={() => router.push("/dashboard/admin/admissions")}
              className="text-xs text-school-blue font-medium hover:underline"
            >
              View All
            </button>
          </div>
          {data.recentAdmissions.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <UserPlus className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm">No recent admissions</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.recentAdmissions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => router.push(`/dashboard/admin/students/${s.id}`)}
                  className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 bg-gradient-to-br from-school-green to-accent rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {`${s.firstName?.[0] || ""}${s.lastName?.[0] || ""}`.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {s.firstName} {s.lastName}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {s.class?.name || "Unassigned"} · {s.studentId}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft-sm p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-[family-name:var(--font-poppins)] font-bold text-school-dark flex items-center gap-2">
              <Activity className="w-5 h-5 text-school-blue" /> Recent Activity
            </h3>
            <button
              onClick={() => router.push("/dashboard/admin/activity")}
              className="text-xs text-school-blue font-medium hover:underline"
            >
              View All
            </button>
          </div>
          {data.recentActivity.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Activity className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.recentActivity.map((log) => (
                <div key={log.id} className="p-3 rounded-xl bg-gray-50 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-navy/10 flex items-center justify-center shrink-0">
                    <Activity className="w-4 h-4 text-brand-navy" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 line-clamp-1">
                      {log.details ||
                        log.action
                          .toLowerCase()
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (c) => c.toUpperCase())}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {log.user ? log.user.name : "System"} ·{" "}
                      {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}