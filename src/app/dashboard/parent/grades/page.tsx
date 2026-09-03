"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  AlertCircle,
  Baby,
  TrendingUp,
} from "lucide-react";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";
import EmptyState from "@/components/dashboard/EmptyState";

interface ChildGrades {
  childId: string;
  childName: string;
  className?: string;
  grades: {
    id: string;
    subject: { name: string } | string;
    score: number;
    grade: string;
    term: string;
  }[];
}

interface GradesData {
  children?: ChildGrades[];
}

export default function ParentGrades() {
  const [data, setData] = useState<GradesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchGrades = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/parent/grades");
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to load grades.");
      }
      const json = await res.json();
      setData(json.data || json);
    } catch (err: any) {
      setError(err.message || "Failed to load grades.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGrades();
  }, [fetchGrades]);

  if (loading) return <LoadingSpinner text="Loading grades..." fullScreen />;

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

  const children = data?.children || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-[family-name:var(--font-poppins)] text-2xl font-bold text-school-dark">
          Children&apos;s Grades
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Academic performance for all your linked children.
        </p>
      </div>

      {children.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft-sm">
          <EmptyState
            icon={<Baby className="w-9 h-9 text-gray-400" />}
            title="No children linked"
            description="Link your children to your account to view their grades."
          />
        </div>
      ) : (
        children.map((child) => {
          const avg = child.grades.length
            ? (
                child.grades.reduce((s, g) => s + g.score, 0) /
                child.grades.length
              ).toFixed(1)
            : "—";
          return (
            <div
              key={child.childId}
              className="bg-white rounded-2xl border border-gray-100 shadow-soft-sm overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-school-blue to-primary rounded-xl flex items-center justify-center text-sm font-bold text-white">
                    {child.childName?.split(" ").map((n) => n[0]).join("").slice(0, 2) || "?"}
                  </div>
                  <div>
                    <h3 className="font-[family-name:var(--font-poppins)] font-bold text-school-dark">
                      {child.childName}
                    </h3>
                    {child.className && (
                      <p className="text-xs text-gray-400">{child.className}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <TrendingUp className="w-4 h-4 text-school-green" />
                  Average:{" "}
                  <span className="font-bold text-school-dark">{avg}</span>
                </div>
              </div>

              {child.grades.length === 0 ? (
                <div className="py-10 text-center">
                  <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No grades recorded yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Subject</th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Term</th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Score</th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {child.grades.map((g) => (
                        <tr key={g.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 font-medium text-gray-800">
                            {typeof g.subject === "string" ? g.subject : g.subject?.name}
                          </td>
                          <td className="px-6 py-4 text-gray-600 capitalize">{g.term?.toLowerCase()}</td>
                          <td className="px-6 py-4 font-bold text-school-dark">{g.score}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-school-blue/10 text-school-blue font-bold text-sm">
                              {g.grade}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
