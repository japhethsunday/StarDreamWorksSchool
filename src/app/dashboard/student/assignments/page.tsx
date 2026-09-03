"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ClipboardList,
  AlertCircle,
  CalendarClock,
  Send,
  Eye,
  CheckCircle2,
  X,
  BookOpen,
  Link2,
} from "lucide-react";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";
import EmptyState from "@/components/dashboard/EmptyState";
import Modal from "@/components/dashboard/Modal";

interface Assignment {
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  dueDate: string;
  maxScore: number;
  subject?: { id: string; name: string } | null;
  subjectName?: string;
  submissionStatus?: string;
  mySubmission?: {
    id: string;
    content?: string;
    files?: string;
    submittedAt: string;
    grade?: number | null;
    feedback?: string;
    status: string;
  } | null;
  locked?: boolean;
}

type Filter = "ALL" | "PENDING" | "SUBMITTED" | "GRADED";

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");

  const [selected, setSelected] = useState<Assignment | null>(null);
  const [viewOpen, setViewOpen] = useState(false);

  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitForm, setSubmitForm] = useState({ content: "", files: "" });
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/student/assignments");
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

  const getStatus = (a: Assignment) => {
    if (a.mySubmission?.status) return a.mySubmission.status;
    if (a.mySubmission) return "SUBMITTED";
    if (a.locked) return "CLOSED";
    return "PENDING";
  };

  const isOverdue = (a: Assignment) => {
    return !a.mySubmission && new Date(a.dueDate) < new Date();
  };

  const filtered = assignments.filter((a) => {
    if (filter === "ALL") return true;
    const status = getStatus(a);
    if (filter === "GRADED") return status === "GRADED";
    if (filter === "SUBMITTED") return status === "SUBMITTED" || status === "LATE";
    return status === "PENDING" || status === "CLOSED";
  });

  const openView = (a: Assignment) => {
    setSelected(a);
    setViewOpen(true);
  };

  const openSubmit = (a: Assignment) => {
    setSelected(a);
    setViewOpen(false);
    setSubmitForm({ content: "", files: "" });
    setSubmitError("");
    setSubmitOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    if (!selected) return;
    if (!submitForm.content.trim() && !submitForm.files.trim()) {
      setSubmitError("Please provide content or a file link for your submission.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/student/assignments/${selected.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitForm),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to submit assignment.");
      setSubmitOpen(false);
      setSelected(null);
      fetchAssignments();
    } catch (err: any) {
      setSubmitError(err.message || "Failed to submit assignment.");
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = (a: Assignment) => {
    const status = getStatus(a);
    const map: Record<string, string> = {
      GRADED: "bg-green-100 text-green-700",
      SUBMITTED: "bg-blue-100 text-blue-700",
      PENDING: "bg-amber-100 text-amber-700",
      LATE: "bg-red-100 text-red-700",
      CLOSED: "bg-gray-100 text-gray-500",
    };
    const label =
      status === "GRADED" && a.mySubmission?.grade != null
        ? `${a.mySubmission.grade}%`
        : status.toLowerCase();
    return (
      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${map[status] || map.PENDING}`}>
        {label}
      </span>
    );
  };

  const filters: { key: Filter; label: string }[] = [
    { key: "ALL", label: "All" },
    { key: "PENDING", label: "Pending" },
    { key: "SUBMITTED", label: "Submitted" },
    { key: "GRADED", label: "Graded" },
  ];

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
      <div>
        <h2 className="font-[family-name:var(--font-poppins)] text-2xl font-bold text-school-dark">
          My Assignments
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          View and submit assignments for your class.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
              filter === f.key
                ? "bg-school-blue text-white shadow-sm"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft-sm">
          <EmptyState
            icon={<ClipboardList className="w-9 h-9 text-gray-400" />}
            title={
              assignments.length === 0
                ? "No assignments yet"
                : `No ${filter === "ALL" ? "" : filter.toLowerCase() + " "}assignments`
            }
            description={
              assignments.length === 0
                ? "Your teacher hasn't posted any assignments for your class yet."
                : "Try a different filter."
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((a) => {
            const subjectName = a.subject?.name || a.subjectName || "General";
            return (
              <div
                key={a.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-soft-sm p-5 hover:shadow-soft-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-school-blue to-primary rounded-xl flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  {statusBadge(a)}
                </div>
                <h3 className="mt-3 font-semibold text-school-dark">{a.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{subjectName}</p>
                {a.description && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{a.description}</p>
                )}
                <div className="mt-3 flex items-center gap-3">
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <CalendarClock className="w-3.5 h-3.5" />
                    Due {new Date(a.dueDate).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <span className="text-xs text-gray-400">Max {a.maxScore}</span>
                </div>
                {isOverdue(a) && (
                  <p className="mt-2 text-xs font-medium text-red-500">Overdue</p>
                )}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => openView(a)}
                    className="inline-flex items-center justify-center flex-1 gap-1.5 px-3 py-2 text-xs font-semibold text-school-blue bg-school-blue/10 rounded-lg hover:bg-school-blue/20 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View
                  </button>
                  {getStatus(a) === "PENDING" && !a.locked && (
                    <button
                      onClick={() => openSubmit(a)}
                      className="inline-flex items-center justify-center flex-1 gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-school-green rounded-lg hover:bg-school-green/90 transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Submit
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View Assignment Modal */}
      <Modal
        isOpen={viewOpen}
        onClose={() => setViewOpen(false)}
        title={selected?.title || "Assignment"}
        size="md"
      >
        {selected ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold text-gray-500 px-3 py-1 rounded-full bg-gray-100">
                {selected.subject?.name || selected.subjectName || "General"}
              </span>
              <span className="text-xs font-semibold text-gray-500 px-3 py-1 rounded-full bg-gray-100">
                Max Score: {selected.maxScore}
              </span>
              <span className="text-xs font-semibold text-gray-500 px-3 py-1 rounded-full bg-gray-100 flex items-center gap-1">
                <CalendarClock className="w-3 h-3" />
                Due {new Date(selected.dueDate).toLocaleDateString("en-NG", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>

            {selected.description && (
              <div>
                <h4 className="text-sm font-semibold text-school-dark mb-1">Description</h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{selected.description}</p>
              </div>
            )}

            {selected.instructions && (
              <div>
                <h4 className="text-sm font-semibold text-school-dark mb-1">Instructions</h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{selected.instructions}</p>
              </div>
            )}

            {selected.mySubmission && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-green-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Your Submission
                  </h4>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      selected.mySubmission.status === "GRADED"
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {selected.mySubmission.status.toLowerCase()}
                  </span>
                </div>
                {selected.mySubmission.content && (
                  <p className="text-sm text-gray-700 whitespace-pre-wrap bg-white rounded-lg p-3 border border-green-100">
                    {selected.mySubmission.content}
                  </p>
                )}
                {selected.mySubmission.files && (
                  <a
                    href={selected.mySubmission.files}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-school-blue hover:underline inline-flex items-center gap-1 mt-2"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    View attachment
                  </a>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Submitted {new Date(selected.mySubmission.submittedAt).toLocaleDateString("en-NG", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                {selected.mySubmission.grade != null && (
                  <div className="mt-3 flex items-center gap-3 pt-3 border-t border-green-200">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-school-green">
                        {selected.mySubmission.grade}
                      </span>
                      <span className="text-xs text-gray-500">/{selected.maxScore}</span>
                    </div>
                    {selected.mySubmission.feedback && (
                      <p className="text-sm text-gray-600 flex-1 bg-white rounded-lg p-2 border border-green-100">
                        <span className="font-semibold">Feedback: </span>
                        {selected.mySubmission.feedback}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {getStatus(selected) === "PENDING" && !selected.locked && (
              <button
                onClick={() => openSubmit(selected)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-school-green rounded-xl hover:bg-school-green/90 transition-colors"
              >
                <Send className="w-4 h-4" />
                Submit Assignment
              </button>
            )}
          </div>
        ) : null}
      </Modal>

      {/* Submit Modal */}
      <Modal
        isOpen={submitOpen}
        onClose={() => setSubmitOpen(false)}
        title={selected ? `Submit - ${selected.title}` : "Submit Assignment"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {submitError && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-sm text-red-700">{submitError}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Answer</label>
            <textarea
              rows={5}
              value={submitForm.content}
              onChange={(e) => setSubmitForm({ ...submitForm, content: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue transition-all"
              placeholder="Type your answer here..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              File / Attachment URL
            </label>
            <input
              type="url"
              value={submitForm.files}
              onChange={(e) => setSubmitForm({ ...submitForm, files: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue transition-all"
              placeholder="https://... (optional)"
            />
            <p className="text-xs text-gray-400 mt-1">
              Provide a link to a file if your answer is an attachment.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setSubmitOpen(false)}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-school-green rounded-xl hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {submitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
