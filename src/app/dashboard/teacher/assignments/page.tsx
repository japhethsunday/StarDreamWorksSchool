"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ClipboardList,
  Plus,
  AlertCircle,
  Trash2,
  Eye,
  BookOpen,
  Users,
  X,
  Save,
} from "lucide-react";
import { isSafeUrl } from "@/lib/utils";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";
import EmptyState from "@/components/dashboard/EmptyState";
import Modal from "@/components/dashboard/Modal";
import DataTable from "@/components/dashboard/DataTable";
import ConfirmDialog from "@/components/dashboard/ConfirmDialog";

interface Assignment {
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  dueDate: string;
  maxScore: number;
  subject?: { id: string; name: string } | null;
  class?: { id: string; name: string } | null;
  subjectId?: string;
  classId?: string;
  _count?: { submissions: number };
  submissionCount?: number;
  createdAt: string;
}

interface ClassOption {
  id: string;
  name: string;
  level: string;
}

interface SubjectOption {
  id: string;
  name: string;
  code: string;
}

interface Submission {
  id: string;
  studentName?: string;
  student?: { firstName: string; lastName: string; studentId: string };
  content?: string;
  files?: string;
  submittedAt: string;
  grade?: number | null;
  feedback?: string;
  status: string;
}

export default function TeacherAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    instructions: "",
    subjectId: "",
    classId: "",
    dueDate: "",
    maxScore: "100",
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [viewOpen, setViewOpen] = useState(false);
  const [active, setActive] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [subsLoading, setSubsLoading] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Assignment | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [gradeState, setGradeState] = useState<Record<string, string>>({});
  const [feedbackState, setFeedbackState] = useState<Record<string, string>>({});
  const [savingSubmission, setSavingSubmission] = useState<string | null>(null);

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/teacher/assignments");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load assignments.");
      }
      const json = await res.json();
      setAssignments(json.data || json || []);
    } catch (err: any) {
      setError(err.message || "Failed to load assignments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const openCreate = async () => {
    setFormError("");
    setForm({
      title: "",
      description: "",
      instructions: "",
      subjectId: "",
      classId: "",
      dueDate: "",
      maxScore: "100",
    });
    setCreateOpen(true);
    try {
      const [classesRes, subjectsRes] = await Promise.all([
        fetch("/api/teacher/classes"),
        fetch("/api/teacher/subjects"),
      ]);
      if (classesRes.ok) {
        const cj = await classesRes.json();
        setClasses(cj.data || cj || []);
      }
      if (subjectsRes.ok) {
        const sj = await subjectsRes.json();
        setSubjects(sj.data || sj || []);
      }
    } catch {
      // form can still open; options load from earlier fetch
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!form.title.trim() || !form.subjectId || !form.classId || !form.dueDate) {
      setFormError("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/teacher/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          maxScore: Number(form.maxScore) || 100,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create assignment.");
      setCreateOpen(false);
      fetchAssignments();
    } catch (err: any) {
      setFormError(err.message || "Failed to create assignment.");
    } finally {
      setSubmitting(false);
    }
  };

  const viewSubmissions = async (assignment: Assignment) => {
    setActive(assignment);
    setSubmissions([]);
    setGradeState({});
    setFeedbackState({});
    setViewOpen(true);
    setSubsLoading(true);
    try {
      const res = await fetch(
        `/api/teacher/assignments/${assignment.id}/submissions`
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load submissions.");
      }
      const json = await res.json();
      const data = json.data || json || [];
      setSubmissions(data);
      const grades: Record<string, string> = {};
      const feedbacks: Record<string, string> = {};
      data.forEach((s: Submission) => {
        if (s.grade != null) grades[s.id] = String(s.grade);
        if (s.feedback) feedbacks[s.id] = s.feedback;
      });
      setGradeState(grades);
      setFeedbackState(feedbacks);
    } catch (err: any) {
      setError(err.message || "Failed to load submissions.");
      setViewOpen(false);
    } finally {
      setSubsLoading(false);
    }
  };

  const saveGrade = async (sub: Submission) => {
    setSavingSubmission(sub.id);
    try {
      const res = await fetch(`/api/teacher/assignments/${active?.id}/submissions/${sub.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grade: gradeState[sub.id] != null ? Number(gradeState[sub.id]) : undefined,
          feedback: feedbackState[sub.id] || "",
          status: gradeState[sub.id] != null ? "GRADED" : "SUBMITTED",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save grade.");
      await viewSubmissions(active!);
    } catch (err: any) {
      alert(err.message || "Failed to save grade.");
    } finally {
      setSavingSubmission(null);
    }
  };

  const confirmDelete = (assignment: Assignment) => {
    setDeleteTarget(assignment);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/teacher/assignments/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to delete assignment.");
      setDeleteOpen(false);
      setDeleteTarget(null);
      fetchAssignments();
    } catch (err: any) {
      alert(err.message || "Failed to delete assignment.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading assignments..." fullScreen />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-gray-600 font-medium">{error}</p>
        <button
          onClick={fetchAssignments}
          className="px-4 py-2 bg-school-blue text-white text-sm font-medium rounded-xl hover:bg-primary transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-[family-name:var(--font-poppins)] text-2xl font-bold text-school-dark">
            Manage Assignments
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Create, view, and grade assignments for your classes.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-school-blue to-primary text-white text-sm font-semibold rounded-xl shadow-glow-blue hover:shadow-lg hover:scale-[1.02] transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Assignment
        </button>
      </div>

      {assignments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft-sm">
          <EmptyState
            icon={<ClipboardList className="w-9 h-9 text-gray-400" />}
            title="No assignments yet"
            description="Create your first assignment to start collecting submissions."
            action={{ label: "Create Assignment", onClick: openCreate }}
          />
        </div>
      ) : (
        <DataTable
          columns={[
            {
              key: "title",
              label: "Assignment",
              render: (v, row) => (
                <div>
                  <p className="font-medium text-gray-800">{v}</p>
                  {row.description && (
                    <p className="text-xs text-gray-400 line-clamp-1">{row.description}</p>
                  )}
                </div>
              ),
            },
            {
              key: "class",
              label: "Class",
              render: (_, row) => (
                <span className="text-gray-600">{row.class?.name || row.className || "—"}</span>
              ),
            },
            {
              key: "subject",
              label: "Subject",
              render: (_, row) => (
                <span className="text-gray-600">{row.subject?.name || row.subjectName || "—"}</span>
              ),
            },
            {
              key: "dueDate",
              label: "Due Date",
              render: (v) => (
                <span className="text-gray-600">
                  {new Date(v).toLocaleDateString("en-NG", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              ),
            },
            {
              key: "maxScore",
              label: "Max Score",
              render: (v) => <span className="font-semibold text-gray-700">{v}</span>,
            },
            {
              key: "submissions",
              label: "Submissions",
              render: (_, row) => {
                const count =
                  row.submissionCount ?? row._count?.submissions ?? 0;
                return (
                  <span className="inline-flex items-center gap-1 text-gray-600">
                    <Users className="w-3.5 h-3.5 text-gray-400" />
                    {count}
                  </span>
                );
              },
            },
            {
              key: "actions",
              label: "Actions",
              render: (_, row) => (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => viewSubmissions(row)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-school-blue bg-school-blue/10 rounded-lg hover:bg-school-blue/20 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Submissions
                  </button>
                  <button
                    onClick={() => confirmDelete(row)}
                    className="inline-flex items-center gap-1 p-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ),
            },
          ]}
          data={assignments}
          emptyMessage="No assignments yet"
        />
      )}

      {/* Create Assignment Modal */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Assignment"
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-5">
          {formError && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-sm text-red-700">{formError}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue transition-all"
              placeholder="e.g. Chapter 5 Assignment"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Class <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={form.classId}
                onChange={(e) => setForm({ ...form, classId: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue transition-all"
              >
                <option value="">Select class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Subject <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={form.subjectId}
                onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue transition-all"
              >
                <option value="">Select subject</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Max Score
              </label>
              <input
                type="number"
                min="1"
                value={form.maxScore}
                onChange={(e) => setForm({ ...form, maxScore: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue transition-all"
              placeholder="Brief description of the assignment"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Instructions</label>
            <textarea
              rows={4}
              value={form.instructions}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue transition-all"
              placeholder="Detailed instructions for students"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-school-blue to-primary rounded-xl hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {submitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Create
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Submissions Modal */}
      <Modal
        isOpen={viewOpen}
        onClose={() => setViewOpen(false)}
        title={active ? `Submissions - ${active.title}` : "Submissions"}
        size="lg"
      >
        <div className="space-y-4">
          {subsLoading ? (
            <LoadingSpinner text="Loading submissions..." />
          ) : submissions.length === 0 ? (
            <EmptyState
              icon={<Users className="w-9 h-9 text-gray-400" />}
              title="No submissions yet"
              description="Students haven't submitted work for this assignment."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {submissions.map((sub) => {
                const studentName = sub.student
                  ? `${sub.student.firstName} ${sub.student.lastName}`
                  : sub.studentName || "Student";
                return (
                  <div key={sub.id} className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{studentName}</p>
                        <p className="text-xs text-gray-400">
                          {sub.student?.studentId} ·{" "}
                          {new Date(sub.submittedAt).toLocaleDateString("en-NG")}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                          sub.status === "GRADED"
                            ? "bg-green-100 text-green-700"
                            : sub.status === "LATE"
                            ? "bg-red-100 text-red-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {sub.status.toLowerCase()}
                      </span>
                    </div>

                    {sub.content && (
                      <div className="text-xs text-gray-600 bg-white rounded-lg p-3 border border-gray-100">
                        {sub.content}
                      </div>
                    )}
                    {sub.files && isSafeUrl(sub.files) ? (
                      <a
                        href={sub.files}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-school-blue hover:underline inline-flex items-center gap-1"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        View attachment
                      </a>
                    ) : sub.files ? (
                      <span className="text-xs font-medium text-gray-400 inline-flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        Attachment unavailable
                      </span>
                    ) : null}

                    <div className="grid grid-cols-1 gap-2 pt-1 border-t border-gray-200">
                      <div>
                        <label className="block text-[11px] font-medium text-gray-500 mb-1">
                          Score / {active?.maxScore ?? 100}
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={active?.maxScore ?? 100}
                          value={gradeState[sub.id] ?? ""}
                          onChange={(e) =>
                            setGradeState({ ...gradeState, [sub.id]: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue transition-all"
                          placeholder="Grade"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-gray-500 mb-1">
                          Feedback
                        </label>
                        <textarea
                          rows={2}
                          value={feedbackState[sub.id] ?? ""}
                          onChange={(e) =>
                            setFeedbackState({ ...feedbackState, [sub.id]: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue transition-all"
                          placeholder="Feedback for the student"
                        />
                      </div>
                      <button
                        onClick={() => saveGrade(sub)}
                        disabled={savingSubmission === sub.id}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-school-green rounded-lg hover:bg-school-green/90 disabled:opacity-60 transition-colors"
                      >
                        {savingSubmission === sub.id ? (
                          <>
                            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5" />
                            Save Grade
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Assignment"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This will also remove all submissions.`}
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
}
