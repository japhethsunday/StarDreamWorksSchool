"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  AlertCircle,
  TrendingUp,
  Award,
  BookOpen,
  Percent,
} from "lucide-react";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";
import EmptyState from "@/components/dashboard/EmptyState";
import StatsCard from "@/components/dashboard/StatsCard";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Grade {
  id: string;
  subject: { name: string; code?: string } | string;
  term: string;
  academicSession: string;
  score: number;
  grade: string;
  remarks?: string;
}

interface GradesData {
  grades?: Grade[];
  average?: number | string;
  totalSubjects?: number;
  bestSubject?: string;
}

export default function StudentGrades() {
  const [data, setData] = useState<GradesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchGrades = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/student/grades");
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to load grades.");
      }
      const json = await res.json();
      const payload = json.data || json;
      setData(payload);
    } catch (err: any) {
      setError(err.message || "Failed to load grades.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGrades();
  }, [fetchGrades]);

  if (loading) return <LoadingSpinner text="Loading your grades..." fullScreen />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-gray-600 font-medium">{error}</p>
        <button
          onClick={fetchGrades}
          className="px-4 py-2 bg-school-blue text-white text-sm font-medium rounded-xl hover:bg-primary transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const grades = data?.grades || [];
  const average = data?.average ?? (
    grades.length
      ? (grades.reduce((s, g) => s + g.score, 0) / grades.length).toFixed(1)
      : "—"
  );

  const chartData = grades.map((g) => ({
    name:
      typeof g.subject === "string"
        ? g.subject
        : g.subject?.name || "Subject",
    score: g.score,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-[family-name:var(--font-poppins)] text-2xl font-bold text-school-dark">
          My Grades
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Your academic performance across subjects.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatsCard
          title="Average Score"
          value={average}
          icon={<TrendingUp className="w-5 h-5" />}
          color="blue"
        />
        <StatsCard
          title="Subjects"
          value={data?.totalSubjects ?? grades.length}
          icon={<BookOpen className="w-5 h-5" />}
          color="green"
        />
        <StatsCard
          title="Best Subject"
          value={
            data?.bestSubject ||
            (grades.length
              ? (() => {
                  const best = [...grades].sort((a, b) => b.score - a.score)[0];
                  return typeof best.subject === "string" ? best.subject : best.subject?.name;
                })()
              : "—")
          }
          icon={<Award className="w-5 h-5" />}
          color="gold"
        />
        <StatsCard
          title="Highest Score"
          value={
            grades.length
              ? Math.max(...grades.map((g) => g.score))
              : "—"
          }
          icon={<Percent className="w-5 h-5" />}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-soft-sm p-5 sm:p-6">
          <h3 className="font-[family-name:var(--font-poppins)] font-bold text-school-dark mb-6">
            Performance by Subject
          </h3>
          {grades.length === 0 ? (
            <p className="text-sm text-gray-400 py-10 text-center">
              No grades available to display.
            </p>
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
                    domain={[0, 100]}
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
                  <Bar dataKey="score" fill="#0f4c81" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft-sm p-5 sm:p-6">
          <h3 className="font-[family-name:var(--font-poppins)] font-bold text-school-dark mb-5">
            Performance Summary
          </h3>
          {grades.length === 0 ? (
            <EmptyState
              icon={<FileText className="w-8 h-8 text-gray-400" />}
              title="No grades yet"
              description="Your grades will appear here once your teachers record them."
            />
          ) : (
            <div className="space-y-3">
              {grades.map((g) => {
                const name =
                  typeof g.subject === "string" ? g.subject : g.subject?.name;
                const colorClass =
                  g.score >= 70
                    ? "bg-brand-green text-white"
                    : g.score >= 50
                    ? "bg-brand-yellow text-brand-navy-deep"
                    : "bg-brand-red text-white";
                return (
                  <div key={g.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{name}</p>
                      <p className="text-xs text-gray-400 capitalize">
                        {g.term?.toLowerCase()} Term
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-school-dark">{g.score}</span>
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold ${colorClass}`}
                      >
                        {g.grade}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {grades.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="font-[family-name:var(--font-poppins)] font-bold text-school-dark">
              Full Grade Record
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Subject</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Term</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Session</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Score</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Grade</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {grades.map((g) => (
                  <tr key={g.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {typeof g.subject === "string" ? g.subject : g.subject?.name}
                    </td>
                    <td className="px-6 py-4 text-gray-600 capitalize">{g.term?.toLowerCase()}</td>
                    <td className="px-6 py-4 text-gray-500">{g.academicSession}</td>
                    <td className="px-6 py-4 font-bold text-school-dark">{g.score}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-school-blue/10 text-school-blue font-bold text-sm">
                        {g.grade}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{g.remarks || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
