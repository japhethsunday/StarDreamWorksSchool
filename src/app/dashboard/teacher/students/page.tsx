"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Users,
  AlertCircle,
  BookOpen,
  FileText,
  ClipboardList,
  GraduationCap,
  X,
} from "lucide-react";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";
import EmptyState from "@/components/dashboard/EmptyState";
import DataTable from "@/components/dashboard/DataTable";
import Modal from "@/components/dashboard/Modal";
import StatsCard from "@/components/dashboard/StatsCard";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  studentId: string;
  gender: string;
  status: string;
  class?: { id: string; name: string; level: string } | null;
  className?: string;
  classId?: string;
  user?: { email: string };
  email?: string;
  grades?: any[];
  submissions?: any[];
}

interface StudentDetail extends Student {
  grades?: {
    id: string;
    subject: { name: string } | string;
    term: string;
    academicSession: string;
    score: number;
    grade: string;
    remarks?: string;
  }[];
  submissions?: {
    id: string;
    assignment: { title: string; subject?: { name: string } | string };
    status: string;
    grade?: number | null;
    submittedAt: string;
  }[];
}

export default function TeacherStudents() {
  const searchParams = useSearchParams();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [classOptions, setClassOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState<StudentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/teacher/students");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load students.");
      }
      const json = await res.json();
      const data = json.data || json || [];
      setStudents(data);
      const options = Array.from(
        new Set(
          data
            .map((s: Student) => s.className || s.class?.name)
            .filter(Boolean)
        )
      ) as string[];
      setClassOptions(options);
    } catch (err: any) {
      setError(err.message || "Failed to load students.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

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
      const res = await fetch(`/api/teacher/students/${id}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load student profile.");
      }
      const json = await res.json();
      setSelected(json.data || json);
    } catch (err: any) {
      setDetailError(err.message || "Failed to load student profile.");
      setSelected(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const filtered = students.filter((s) => {
    const matchesSearch =
      !search ||
      `${s.firstName} ${s.lastName} ${s.studentId}`
        .toLowerCase()
        .includes(search.toLowerCase());
    const matchesClass =
      classFilter === "all" ||
      (s.className || s.class?.name) === classFilter;
    return matchesSearch && matchesClass;
  });

  const subjectCount = selected?.grades?.length ?? 0;
  const avgScore = selected?.grades?.length
    ? (
        selected.grades.reduce((sum, g) => sum + (g.score || 0), 0) /
        selected.grades.length
      ).toFixed(1)
    : "—";

  if (loading) return <LoadingSpinner text="Loading students..." fullScreen />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-gray-600 font-medium">{error}</p>
        <button
          onClick={fetchStudents}
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
          My Students
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          All students across your assigned classes.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or student ID..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue transition-all"
          />
        </div>
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue transition-all"
        >
          <option value="all">All Classes</option>
          {classOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft-sm">
          <EmptyState
            icon={<Users className="w-9 h-9 text-gray-400" />}
            title={students.length === 0 ? "No students found" : "No matching students"}
            description={
              students.length === 0
                ? "Students aren't assigned to your classes yet."
                : "Try adjusting your search or filter."
            }
          />
        </div>
      ) : (
        <DataTable
          columns={[
            {
              key: "name",
              label: "Student",
              render: (_, row) => (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-school-blue to-primary rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {row.firstName?.[0]}
                    {row.lastName?.[0]}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      {row.firstName} {row.middleName ? row.middleName + " " : ""}
                      {row.lastName}
                    </p>
                    <p className="text-xs text-gray-400 font-mono">{row.studentId}</p>
                  </div>
                </div>
              ),
            },
            {
              key: "class",
              label: "Class",
              render: (_, row) => (
                <span className="text-gray-600">{row.className || row.class?.name || "—"}</span>
              ),
            },
            {
              key: "gender",
              label: "Gender",
              render: (v) => <span className="capitalize text-gray-600">{v?.toLowerCase()}</span>,
            },
            {
              key: "status",
              label: "Status",
              render: (v) => (
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    v === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {v}
                </span>
              ),
            },
            {
              key: "actions",
              label: "Profile",
              render: (_, row) => (
                <button
                  onClick={() => openProfile(row.id)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-school-blue hover:underline"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  View Profile
                </button>
              ),
            },
          ]}
          data={filtered}
          emptyMessage="No students found"
        />
      )}

      {/* Student Profile Modal */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title="Student Profile"
        size="lg"
      >
        {detailLoading ? (
          <LoadingSpinner text="Loading profile..." />
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
                  {selected.firstName} {selected.middleName ? selected.middleName + " " : ""}
                  {selected.lastName}
                </h3>
                <p className="text-sm text-gray-500">
                  {selected.className || selected.class?.name || "No class"} ·{" "}
                  <span className="font-mono">{selected.studentId}</span>
                </p>
                <p className="text-sm text-gray-400 mt-0.5">
                  {selected.email || selected.user?.email || "No email on file"}
                </p>
              </div>
              <span
                className={`sm:ml-auto text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                  selected.status === "ACTIVE"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {selected.status}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatsCard
                title="Subjects"
                value={subjectCount}
                icon={<BookOpen className="w-5 h-5" />}
                color="blue"
              />
              <StatsCard
                title="Average Grade"
                value={avgScore}
                icon={<FileText className="w-5 h-5" />}
                color="green"
              />
              <StatsCard
                title="Submissions"
                value={selected.submissions?.length ?? 0}
                icon={<ClipboardList className="w-5 h-5" />}
                color="gold"
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
                      {selected.grades.map((g) => {
                        const subjectName =
                          typeof g.subject === "string" ? g.subject : g.subject?.name;
                        return (
                          <tr key={g.id} className="hover:bg-gray-50/50">
                            <td className="px-4 py-3 text-gray-800">{subjectName}</td>
                            <td className="px-4 py-3 text-gray-500 capitalize">{g.term?.toLowerCase()}</td>
                            <td className="px-4 py-3 font-medium text-gray-800">{g.score}</td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-school-blue/10 text-school-blue font-bold text-xs">
                                {g.grade}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div>
              <h4 className="font-semibold text-school-dark mb-3 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-school-gold" />
                Submissions
              </h4>
              {!selected.submissions || selected.submissions.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">No submissions yet.</p>
              ) : (
                <div className="space-y-2">
                  {selected.submissions.map((sub) => {
                    const subjectName =
                      typeof sub.assignment?.subject === "string"
                        ? sub.assignment.subject
                        : sub.assignment?.subject?.name;
                    return (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-800">{sub.assignment?.title}</p>
                          <p className="text-xs text-gray-400">
                            {subjectName} · {new Date(sub.submittedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span
                          className={`ml-3 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                            sub.status === "GRADED"
                              ? "bg-green-100 text-green-700"
                              : sub.status === "SUBMITTED"
                              ? "bg-blue-100 text-blue-700"
                              : sub.status === "LATE"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {sub.status === "GRADED" && sub.grade != null
                            ? `${sub.grade}%`
                            : sub.status.toLowerCase()}
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
            icon={<X className="w-8 h-8 text-gray-400" />}
            title="No profile found"
          />
        )}
      </Modal>
    </div>
  );
}
