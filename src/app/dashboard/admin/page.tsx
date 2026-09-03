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

interface Stats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalSubjects: number;
}

interface Announcement {
  id: string;
  title: string;
  createdAt: string;
  priority: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
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
          setStats({
            totalStudents: d.totalStudents ?? 0,
            totalTeachers: d.totalTeachers ?? 0,
            totalClasses: d.totalClasses ?? 0,
            totalSubjects: d.totalSubjects ?? 0,
          });
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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-gray-600 font-medium">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-school-blue text-white text-sm font-medium rounded-xl hover:bg-primary transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const chartData = [
    { name: "Nursery 1", students: 45 },
    { name: "Nursery 2", students: 38 },
    { name: "Primary 1", students: 52 },
    { name: "Primary 2", students: 48 },
    { name: "Primary 3", students: 55 },
    { name: "Primary 4", students: 42 },
    { name: "Primary 5", students: 39 },
    { name: "Primary 6", students: 36 },
    { name: "JSS 1", students: 40 },
    { name: "JSS 2", students: 35 },
    { name: "JSS 3", students: 30 },
  ];

  const quickActions = [
    { label: "Add Teacher", icon: <GraduationCap className="w-4 h-4" />, href: "/dashboard/admin/teachers", color: "from-school-blue to-primary" },
    { label: "Add Student", icon: <Users className="w-4 h-4" />, href: "/dashboard/admin/students", color: "from-school-green to-accent" },
    { label: "Create Class", icon: <BookOpen className="w-4 h-4" />, href: "/dashboard/admin/classes", color: "from-school-gold to-secondary" },
    { label: "Post Announcement", icon: <Megaphone className="w-4 h-4" />, href: "/dashboard/admin/announcements", color: "from-purple-500 to-purple-600" },
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
          value={stats?.totalStudents ?? 0}
          icon={<Users className="w-5 h-5" />}
          color="blue"
          change="+12 this month"
        />
        <StatsCard
          title="Total Teachers"
          value={stats?.totalTeachers ?? 0}
          icon={<GraduationCap className="w-5 h-5" />}
          color="gold"
          change="+2 this term"
        />
        <StatsCard
          title="Total Classes"
          value={stats?.totalClasses ?? 0}
          icon={<BookOpen className="w-5 h-5" />}
          color="green"
        />
        <StatsCard
          title="Total Subjects"
          value={stats?.totalSubjects ?? 0}
          icon={<FileText className="w-5 h-5" />}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={() => router.push(action.href)}
            className={`flex items-center gap-3 px-4 py-3 bg-gradient-to-r ${action.color} text-white text-sm font-semibold rounded-xl shadow-soft-sm hover:shadow-soft-md hover:scale-[1.02] transition-all duration-200`}
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
                <Bar
                  dataKey="students"
                  fill="#0f4c81"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl">
            <div className="w-10 h-10 bg-school-blue/10 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-school-blue" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Active Teachers</p>
              <p className="text-lg font-bold text-school-dark">{stats?.totalTeachers ?? 0}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-green-50 rounded-xl">
            <div className="w-10 h-10 bg-school-green/10 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-school-green" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Enrolled Students</p>
              <p className="text-lg font-bold text-school-dark">{stats?.totalStudents ?? 0}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-xl">
            <div className="w-10 h-10 bg-school-gold/10 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-school-gold" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Active Classes</p>
              <p className="text-lg font-bold text-school-dark">{stats?.totalClasses ?? 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
