"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  Baby,
  AlertCircle,
  ArrowLeft,
  FileText,
  ClipboardList,
  BookOpen,
  Mail,
  ChevronRight,
} from "lucide-react";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";
import EmptyState from "@/components/dashboard/EmptyState";
import Modal from "@/components/dashboard/Modal";
import StatsCard from "@/components/dashboard/StatsCard";

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
  gender: string;
  className?: string;
  class?: { name: string } | null;
  status: string;
  average?: number | string;
  pendingAssignments?: number;
}

interface ChildDetail extends Child {
  grades?: {
    id: string;
    subject: { name: string } | string;
    score: number;
    grade: string;
    term: string;
  }[];
  assignments?: {
    id: string;
    title: string;
    subject?: { name: string } | string;
    dueDate: string;
    status: string;
    grade?: number | null;
  }[];
  email?: string;
}

export default function ParentChildren() {
  const searchParams = useSearchParams();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selected, setSelected] = useState<ChildDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const fetchChildren = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/parent/children");
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to load children.");
      }
      const json = await res.json();
      setChildren(json.data || json || []);
    } catch (err: any) {
      setError(err.message || "Failed to load children.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  useEffect(() => {
    const id = searchParams.get("id");
    if (id && !selected) {
      openProfile(id);
    }
  }, [searchParams]);

  const openProfile = async (id: string) => {
    setDetailLoading(true);
    setDetailError("");
    try {
      const res = await fetch(`/api/parent/children/${id}`);
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to load child profile.");
      }
      const json = await res.json();
      setSelected(json.data || json);
    } catch (err: any) {
      setDetailError(err.message || "Failed to load child profile.");
      setSelected(null);
    } finally {
      setDetailLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading your children..." fullScreen />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-gray-600 font-medium">{error}</p>
        <button
          onClick={fetchChildren}
          className="px-4 py-2 bg-school-blue text-white text-sm font-medium rounded-xl hover:bg-primary transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-[family-name:var(--font-poppins)] text-2xl font-bold text-school-dark">
          My Children
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Children linked to your account.
        </p>
      </div>

      {children.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft-sm">
          <EmptyState
            icon={<Baby className="w-9 h-9 text-gray-400" />}
            title="No children linked"
            description="Children linked to your account will appear here. Contact the school to link your children."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {children.map((child) => {
            const avg =
              child.average != null && child.average !== "—"
                ? child.average
                : "—";
            return (
              <button
                key={child.id}
                onClick={() => openProfile(child.id)}
                className="text-left bg-white rounded-2xl border border-gray-100 shadow-soft-sm p-5 sm:p-6 hover:shadow-soft-md hover:scale-[1.01] transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-school-blue to-primary rounded-xl flex items-center justify-center text-base font-bold text-white shrink-0">
                    {child.firstName?.[0]}
                    {child.lastName?.[0]}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-school-dark truncate">
                      {child.firstName} {child.lastName}
                    </h3>
                    <p className="text-xs text-gray-400 font-mono">{child.studentId}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-gray-600">
                  {child.className || child.class?.name || "No class"}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-[11px] text-gray-400">Average</p>
                    <p className="text-lg font-bold text-school-green">{avg}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-[11px] text-gray-400">Pending</p>
                    <p className="text-lg font-bold text-school-dark">
                      {child.pendingAssignments ?? 0}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-3 text-xs font-medium text-school-blue">
                  View profile
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Child Profile Modal */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title="Child Profile"
        size="lg"
      >
        {detailLoading ? (
          <LoadingSpinner text="Loading child profile..." />
        ) : detailError ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <p className="text-sm text-gray-600">{detailError}</p>
          </div>
        ) : selected ? (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-school-blue to-primary rounded-2xl flex items-center justify-center text-xl font-bold text-white shrink-0">
                {selected.firstName?.[0]}
                {selected.lastName?.[0]}
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-lg font-bold text-school-dark font-[family-name:var(--font-poppins)]">
                  {selected.firstName} {selected.lastName}
                </h3>
                <p className="text-sm text-gray-500">
                  {selected.className || selected.class?.name || "No class"} ·{" "}
                  <span className="font-mono">{selected.studentId}</span>
                </p>
                {selected.email && (
                  <p className="text-sm text-gray-400 mt-0.5 flex items-center justify-center sm:justify-start gap-1">
                    <Mail className="w-3.5 h-3.5" />
                    {selected.email}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StatsCard
                title="Average Score"
                value={
                  selected.average != null && selected.average !== "—"
                    ? selected.average
                    : "—"
                }
                icon={<FileText className="w-5 h-5" />}
                color="green"
              />
              <StatsCard
                title="Pending Assignments"
                value={selected.pendingAssignments ?? 0}
                icon={<ClipboardList className="w-5 h-5" />}
                color="blue"
              />
            </div>

            <div>
              <h4 className="font-semibold text-school-dark mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-school-blue" />
                Grades
              </h4>
              {!selected.grades || selected.grades.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">No grades recorded yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Subject</th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Term</th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Score</th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {selected.grades.map((g) => (
                        <tr key={g.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 text-gray-800">
                            {typeof g.subject === "string" ? g.subject : g.subject?.name}
                          </td>
                          <td className="px-4 py-3 text-gray-500 capitalize">{g.term?.toLowerCase()}</td>
                          <td className="px-4 py-3 font-medium text-gray-800">{g.score}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-school-blue/10 text-school-blue font-bold text-xs">
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

            <div>
              <h4 className="font-semibold text-school-dark mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-school-gold" />
                Assignments
              </h4>
              {!selected.assignments || selected.assignments.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">No assignments yet.</p>
              ) : (
                <div className="space-y-2">
                  {selected.assignments.map((a) => {
                    const subjectName =
                      typeof a.subject === "string" ? a.subject : a.subject?.name;
                    return (
                      <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{a.title}</p>
                          <p className="text-xs text-gray-400">
                            {subjectName} · Due{" "}
                            {new Date(a.dueDate).toLocaleDateString("en-NG", {
                              day: "numeric",
                              month: "short",
                            })}
                          </p>
                        </div>
                        <span
                          className={`ml-3 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                            a.status === "GRADED"
                              ? "bg-green-100 text-green-700"
                              : a.status === "SUBMITTED"
                              ? "bg-blue-100 text-blue-700"
                              : a.status === "LATE"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {a.status === "GRADED" && a.grade != null
                            ? `${a.grade}%`
                            : a.status.toLowerCase()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <EmptyState
            icon={<ArrowLeft className="w-8 h-8 text-gray-400" />}
            title="No profile found"
          />
        )}
      </Modal>
    </div>
  );
}
