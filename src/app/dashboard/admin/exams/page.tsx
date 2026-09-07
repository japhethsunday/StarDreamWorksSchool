"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  AlertCircle,
  Trash2,
  Pencil,
  Send,
  Archive,
  ShieldCheck,
  Users,
  Filter,
  BarChart3,
  X,
} from "lucide-react";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";
import EmptyState from "@/components/dashboard/EmptyState";
import Modal from "@/components/dashboard/Modal";
import ConfirmDialog from "@/components/dashboard/ConfirmDialog";
import DataTable from "@/components/dashboard/DataTable";

interface AdminExamRow {
  id: string;
  title: string;
  className: string;
  classLevel: string;
  subjectName: string;
  teacherName: string | null;
  academicSession: string;
  term: string;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  totalMarks: number;
  passMark: number;
  status: string;
  effectiveStatus: string;
  showResults: boolean;
  allowAnswerReview: boolean;
  questionsCount: number;
  attemptsCount: number;
  resultsCount: number;
}

interface AdminStats {
  totalExams: number;
  activeExams: number;
  completedExams: number;
  totalAttempts: number;
  avgPercentage: number;
  passRate: number;
  gradedCount: number;
}

interface OptionRow {
  id: string;
  name: string;
  level?: string;
}

interface ExamQuestionUI {
  id?: string;
  type: string;
  question: string;
  marks: number;
  correctAnswer?: string;
  guidance?: string;
  options: { key: string; text: string; isCorrect: boolean }[];
}

interface AdminDetail {
  exam: {
    id: string;
    title: string;
    description?: string | null;
    instructions?: string | null;
    classId: string;
    subjectId: string;
    teacherName: string | null;
    academicSession: string;
    term: string;
    startAt: string;
    endAt: string;
    durationMinutes: number;
    totalMarks: number;
    passMark: number;
    maxAttempts: number;
    status: string;
    restrictToAssigned: boolean;
    showResults: boolean;
    allowAnswerReview: boolean;
    shuffleQuestions: boolean;
  };
  questions: ExamQuestionUI[];
  attempts: Array<{
    id: string;
    attemptNumber: number;
    studentName: string;
    studentId: string;
    status: string;
    totalScore: number | null;
    percentage: number | null;
    passed: boolean | null;
  }>;
  results: Array<{
    id: string;
    studentName: string;
    studentId: string;
    score: number;
    percentage: number;
    grade: string | null;
    passed: boolean;
    releasedAt: string | null;
  }>;
  assignedStudentIds: string[];
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-600",
    SCHEDULED: "bg-blue-100 text-blue-700",
    ACTIVE: "bg-green-100 text-green-700",
    COMPLETED: "bg-amber-100 text-amber-700",
    ARCHIVED: "bg-red-100 text-red-700",
  };
  return (
    <span className={`inline-flex text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${map[status] ?? map.DRAFT}`}>
      {status}
    </span>
  );
}

function fmt(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function AdminExams() {
  const [exams, setExams] = useState<AdminExamRow[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [classes, setClasses] = useState<OptionRow[]>([]);
  const [subjects, setSubjects] = useState<OptionRow[]>([]);
  const [teachers, setTeachers] = useState<Array<{ id: string; firstName: string; lastName: string }>>([]);
  const [students, setStudents] = useState<Array<{ id: string; firstName: string; lastName: string; studentId: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState({ classId: "", subjectId: "", status: "" });

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<AdminExamRow | null>(null);
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [createError, setCreateError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    instructions: "",
    classId: "",
    subjectId: "",
    teacherId: "",
    academicSession: "",
    term: "FIRST",
    startAt: "",
    endAt: "",
    durationMinutes: "60",
    passMark: "0",
    maxAttempts: "1",
    status: "DRAFT",
    restrictToAssigned: false,
    showResults: false,
    allowAnswerReview: false,
    shuffleQuestions: true,
  });
  const [assigned, setAssigned] = useState<string[]>([]);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<AdminDetail | null>(null);
  const [activeExam, setActiveExam] = useState<AdminExamRow | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [questionsOpen, setQuestionsOpen] = useState(false);
  const [questions, setQuestions] = useState<ExamQuestionUI[]>([]);
  const [questionsTarget, setQuestionsTarget] = useState<AdminExamRow | null>(null);
  const [savingQuestions, setSavingQuestions] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminExamRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchExams = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams();
      if (filter.classId) qs.set("classId", filter.classId);
      if (filter.subjectId) qs.set("subjectId", filter.subjectId);
      if (filter.status) qs.set("status", filter.status);
      const res = await fetch(`/api/admin/exams?${qs.toString()}`);
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to load examinations.");
      }
      const json = await res.json();
      setExams(json.data || []);
      setStats(json.stats || null);
    } catch (err: any) {
      setError(err.message || "Failed to load examinations.");
    } finally {
      setLoading(false);
    }
  }, [filter.classId, filter.subjectId, filter.status]);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  const openCreate = useCallback(async () => {
    setCreateError("");
    setEditing(null);
    setAssigned([]);
    setForm({
      title: "",
      description: "",
      instructions: "",
      classId: "",
      subjectId: "",
      teacherId: "",
      academicSession: "",
      term: "FIRST",
      startAt: "",
      endAt: "",
      durationMinutes: "60",
      passMark: "0",
      maxAttempts: "1",
      status: "DRAFT",
      restrictToAssigned: false,
      showResults: false,
      allowAnswerReview: false,
      shuffleQuestions: true,
    });
    try {
      const [cRes, sRes, tRes] = await Promise.all([
        fetch("/api/admin/classes"),
        fetch("/api/admin/subjects"),
        fetch("/api/admin/teachers"),
      ]);
      const cj = await cRes.json();
      const sj = await sRes.json();
      const tj = await tRes.json();
      setClasses(Array.isArray(cj.data) ? cj.data : []);
      setSubjects(Array.isArray(sj.data) ? sj.data : []);
      setTeachers(Array.isArray(tj.data) ? tj.data : []);
      setCreateOpen(true);
    } catch {
      setCreateOpen(true);
    }
  }, []);

  const loadStudents = async (classId: string) => {
    try {
      const res = await fetch(`/api/admin/classes/${classId}/students`);
      if (res.ok) {
        const j = await res.json();
        setStudents(Array.isArray(j.data) ? j.data : []);
      }
    } catch {
      setStudents([]);
    }
  };

  const submitCreate = async () => {
    setCreateError("");
    setSubmittingCreate(true);
    try {
      const res = await fetch("/api/admin/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description || undefined,
          instructions: form.instructions || undefined,
          classId: form.classId,
          subjectId: form.subjectId,
          teacherId: form.teacherId || undefined,
          academicSession: form.academicSession,
          term: form.term,
          startAt: form.startAt,
          endAt: form.endAt,
          durationMinutes: Number(form.durationMinutes),
          passMark: Number(form.passMark),
          maxAttempts: Number(form.maxAttempts),
          status: form.status,
          restrictToAssigned: form.restrictToAssigned,
          showResults: form.showResults,
          allowAnswerReview: form.allowAnswerReview,
          shuffleQuestions: form.shuffleQuestions,
          assignedStudentIds: form.restrictToAssigned ? assigned : undefined,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Failed to create examination.");
      setCreateOpen(false);
      fetchExams();
    } catch (err: any) {
      setCreateError(err.message || "Failed to create examination.");
    } finally {
      setSubmittingCreate(false);
    }
  };

  const openDetail = async (exam: AdminExamRow) => {
    setActiveExam(exam);
    setDetailOpen(true);
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await fetch(`/api/admin/exams/${exam.id}`);
      const j = await res.json();
      if (res.ok) setDetail(j.data);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const openQuestions = async (exam: AdminExamRow) => {
    setQuestionsTarget(exam);
    setQuestionsOpen(true);
    setQuestions([]);
    try {
      const res = await fetch(`/api/admin/exams/${exam.id}`);
      const j = await res.json();
      if (res.ok && j.data?.questions) {
        setQuestions(
          j.data.questions.map((q: any) => ({
            id: q.id,
            type: q.type,
            question: q.question,
            marks: q.marks,
            guidance: q.guidance ?? undefined,
            correctAnswer: q.type === "TRUE_FALSE" ? q.correctAnswer : undefined,
            options: q.options ?? [],
          }))
        );
      }
    } catch {
      setQuestions([]);
    }
  };

  const updateQuestion = (idx: number, patch: Partial<ExamQuestionUI>) => {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  };
  const removeQuestion = (idx: number) => setQuestions((prev) => prev.filter((_, i) => i !== idx));

  const addQuestion = (type: string) => {
    setQuestions((prev) => [
      ...prev,
      {
        type,
        question: "",
        marks: 1,
        options: type === "MULTIPLE_CHOICE"
          ? [{ key: "A", text: "", isCorrect: false }, { key: "B", text: "", isCorrect: false }]
          : [],
      },
    ]);
  };

  const saveQuestions = async () => {
    if (!questionsTarget) return;
    setCreateError("");
    setSavingQuestions(true);
    try {
      const res = await fetch(`/api/admin/exams/${questionsTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Failed to save questions.");
      setQuestionsOpen(false);
      fetchExams();
    } catch (err: any) {
      setCreateError(err.message || "Failed to save questions.");
    } finally {
      setSavingQuestions(false);
    }
  };

  const runAction = async (exam: AdminExamRow, action: string, extra?: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/admin/exams/${exam.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Action failed.");
      fetchExams();
      openDetail(exam);
    } catch (err: any) {
      window.alert(err.message || "Action failed.");
    }
  };

  const confirmDelete = () => setDeleteOpen(true);
  const doDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/exams/${deleteTarget.id}`, { method: "DELETE" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Failed to delete examination.");
      setDeleteOpen(false);
      setDeleteTarget(null);
      fetchExams();
    } catch (err: any) {
      window.alert(err.message || "Failed to delete examination.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading examinations..." fullScreen />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-gray-600 font-medium">{error}</p>
        <button onClick={fetchExams} className="px-4 py-2 bg-school-blue text-white text-sm font-medium rounded-xl hover:bg-primary transition-colors">
          Retry
        </button>
      </div>
    );
  }

  const statCard = (label: string, value: string | number, cls = "text-brand-navy") => (
    <div className="bg-white rounded-xl border border-brand-line p-4">
      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
      <p className={`mt-1 font-heading text-2xl font-bold ${cls}`}>{value}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-navy">Examinations</h1>
          <p className="text-sm text-gray-500 mt-1">School-wide examination management and analytics.</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-red text-white text-sm font-bold hover:bg-brand-red/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Examination
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {statCard("Total", stats.totalExams)}
          {statCard("Open", stats.activeExams, "text-green-700")}
          {statCard("Closed", stats.completedExams, "text-amber-700")}
          {statCard("Attempts", stats.totalAttempts)}
          {statCard("Avg Score", `${Math.round(stats.avgPercentage)}%`, "text-brand-red")}
          {statCard("Pass Rate", `${stats.passRate}%`, "text-green-700")}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border border-brand-line p-3">
        <Filter className="w-4 h-4 text-gray-400" />
        <select value={filter.classId} onChange={(e) => setFilter({ ...filter, classId: e.target.value })} className="rounded-lg border border-brand-line px-3 py-2 text-[13px] bg-white focus:outline-none">
          <option value="">All classes</option>
          {classes.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
        </select>
        <select value={filter.subjectId} onChange={(e) => setFilter({ ...filter, subjectId: e.target.value })} className="rounded-lg border border-brand-line px-3 py-2 text-[13px] bg-white focus:outline-none">
          <option value="">All subjects</option>
          {subjects.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
        </select>
        <select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })} className="rounded-lg border border-brand-line px-3 py-2 text-[13px] bg-white focus:outline-none">
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="ACTIVE">Active</option>
          <option value="COMPLETED">Completed</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      {exams.length === 0 ? (
        <EmptyState
          title="No examinations found"
          description="Create examinations or adjust your filters."
          icon={<BarChart3 className="w-10 h-10" />}
        />
      ) : (
        <DataTable
          columns={[
            { key: "title", label: "Examination", render: (v, row: AdminExamRow) => (<div><p className="font-bold text-brand-navy">{v}</p><p className="text-[12px] text-gray-400">{row.subjectName} · {row.className} · {row.teacherName ?? "No teacher"}</p></div>) },
            { key: "status", label: "Status", render: (v) => <StatusBadge status={v} /> },
            { key: "startAt", label: "Window", render: (_v, row: AdminExamRow) => (<span className="text-[12px] text-gray-500">{fmt(row.startAt)} → {fmt(row.endAt)}</span>) },
            { key: "totalMarks", label: "Marks", render: (v, row: AdminExamRow) => (<span>{v}<span className="text-gray-400"> / pass {row.passMark}</span></span>) },
            { key: "questionsCount", label: "Q" },
            { key: "attemptsCount", label: "Attempts" },
            { key: "showResults", label: "Results", render: (v) => v ? <span className="text-green-600 font-bold text-[12px]">Released</span> : <span className="text-gray-400 text-[12px]">Hidden</span> },
            {
              key: "id", label: "Actions", className: "text-right", render: (_, row: AdminExamRow) => (
                <div className="flex items-center justify-end gap-1.5">
                  <button onClick={() => openQuestions(row)} title="Questions" className="p-2 rounded-lg border border-brand-line hover:bg-brand-paper transition-colors">
                    <Pencil className="w-4 h-4 text-brand-navy" />
                  </button>
                  <button onClick={() => openDetail(row)} title="Submissions & results" className="p-2 rounded-lg border border-brand-line hover:bg-brand-paper transition-colors">
                    <Users className="w-4 h-4 text-brand-navy" />
                  </button>
                  {row.status === "DRAFT" && (
                    <button onClick={() => runAction(row, "publish")} title="Publish" className="p-2 rounded-lg border border-brand-line hover:bg-brand-paper transition-colors">
                      <Send className="w-4 h-4 text-green-600" />
                    </button>
                  )}
                  {row.status === "SCHEDULED" && (
                    <button onClick={() => runAction(row, "activate")} title="Activate" className="p-2 rounded-lg border border-brand-line hover:bg-brand-paper transition-colors">
                      <ShieldCheck className="w-4 h-4 text-brand-navy" />
                    </button>
                  )}
                  {(row.status === "SCHEDULED" || row.status === "ACTIVE") && (
                    <button onClick={() => runAction(row, "archive")} title="Archive" className="p-2 rounded-lg border border-brand-line hover:bg-brand-paper transition-colors">
                      <Archive className="w-4 h-4 text-gray-500" />
                    </button>
                  )}
                  {row.attemptsCount === 0 && (
                    <button onClick={() => { setDeleteTarget(row); confirmDelete(); }} title="Delete" className="p-2 rounded-lg border border-brand-line hover:bg-red-50 transition-colors">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  )}
                </div>
              ),
            },
          ]}
          data={exams}
          emptyMessage="No examinations found"
        />
      )}

      {/* Create modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="New Examination">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {createError && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-[13px] text-red-700">{createError}</div>}
          <div>
            <label className="block text-[13px] font-medium text-gray-600 mb-1">Title *</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-lg border border-brand-line px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/40" placeholder="e.g. First Term Mathematics Examination" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-gray-600 mb-1">Class *</label>
              <select value={form.classId} onChange={(e) => { setForm({ ...form, classId: e.target.value }); loadStudents(e.target.value); }} className="w-full rounded-lg border border-brand-line px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-red/40">
                <option value="">Select class</option>
                {classes.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-gray-600 mb-1">Subject *</label>
              <select value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })} className="w-full rounded-lg border border-brand-line px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-red/40">
                <option value="">Select subject</option>
                {subjects.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[13px] font-medium text-gray-600 mb-1">Assigned teacher (optional)</label>
            <select value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })} className="w-full rounded-lg border border-brand-line px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-red/40">
              <option value="">No teacher assigned</option>
              {teachers.map((t) => (<option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-gray-600 mb-1">Academic Session *</label>
              <input value={form.academicSession} onChange={(e) => setForm({ ...form, academicSession: e.target.value })} className="w-full rounded-lg border border-brand-line px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/40" placeholder="e.g. 2025/2026" />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-gray-600 mb-1">Term *</label>
              <select value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value })} className="w-full rounded-lg border border-brand-line px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-red/40">
                <option value="FIRST">First Term</option>
                <option value="SECOND">Second Term</option>
                <option value="THIRD">Third Term</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-gray-600 mb-1">Starts *</label>
              <input type="datetime-local" value={form.startAt} onChange={(e) => setForm({ ...form, startAt: e.target.value })} className="w-full rounded-lg border border-brand-line px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/40" />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-gray-600 mb-1">Ends *</label>
              <input type="datetime-local" value={form.endAt} onChange={(e) => setForm({ ...form, endAt: e.target.value })} className="w-full rounded-lg border border-brand-line px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/40" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-gray-600 mb-1">Duration (min) *</label>
              <input type="number" min="1" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} className="w-full rounded-lg border border-brand-line px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/40" />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-gray-600 mb-1">Pass Mark</label>
              <input type="number" min="0" value={form.passMark} onChange={(e) => setForm({ ...form, passMark: e.target.value })} className="w-full rounded-lg border border-brand-line px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/40" />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-gray-600 mb-1">Attempts</label>
              <input type="number" min="1" max="10" value={form.maxAttempts} onChange={(e) => setForm({ ...form, maxAttempts: e.target.value })} className="w-full rounded-lg border border-brand-line px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/40" />
            </div>
          </div>
          <div>
            <label className="block text-[13px] font-medium text-gray-600 mb-1">Instructions</label>
            <textarea value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} rows={3} className="w-full rounded-lg border border-brand-line px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/40" />
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[13px] text-gray-600">
              <input type="checkbox" checked={form.restrictToAssigned} onChange={(e) => setForm({ ...form, restrictToAssigned: e.target.checked })} className="rounded border-brand-line" />
              Restrict to selected students
            </label>
            {form.restrictToAssigned && (
              <div className="rounded-lg border border-brand-line p-3 max-h-36 overflow-y-auto space-y-1.5">
                {students.length === 0 && <p className="text-[12px] text-gray-400">No students found for the selected class.</p>}
                {students.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-[13px] text-gray-700">
                    <input
                      type="checkbox"
                      checked={assigned.includes(s.id)}
                      onChange={(e) => {
                        if (e.target.checked) setAssigned((prev) => [...prev, s.id]);
                        else setAssigned((prev) => prev.filter((x) => x !== s.id));
                      }}
                      className="rounded border-brand-line"
                    />
                    {s.firstName} {s.lastName} <span className="text-gray-400 text-[12px]">({s.studentId})</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <label className="flex items-center gap-2 text-[13px] text-gray-600">
            <input type="checkbox" checked={form.shuffleQuestions} onChange={(e) => setForm({ ...form, shuffleQuestions: e.target.checked })} className="rounded border-brand-line" />
            Shuffle question order for students
          </label>
          <div>
            <label className="block text-[13px] font-medium text-gray-600 mb-1">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-lg border border-brand-line px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-red/40">
              <option value="DRAFT">Draft (save, don't notify)</option>
              <option value="SCHEDULED">Publish now (notify students)</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setCreateOpen(false)} className="px-4 py-2.5 rounded-lg border border-brand-line text-[13px] font-medium text-gray-600 hover:bg-brand-paper transition-colors">
              Cancel
            </button>
            <button onClick={submitCreate} disabled={submittingCreate} className="px-4 py-2.5 rounded-lg bg-brand-red text-white text-[13px] font-bold hover:bg-brand-red/90 transition-colors disabled:opacity-60">
              {submittingCreate ? "Creating…" : "Create Examination"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Detail / results modal */}
      <Modal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title={activeExam ? `${activeExam.title} — Submissions & Results` : "Details"} size="lg">
        {detailLoading ? (
          <LoadingSpinner text="Loading details…" />
        ) : detail ? (
          <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={detail.exam.status} />
              <span className="text-[13px] text-gray-500">
                {detail.exam.academicSession} · {detail.exam.term} · {detail.exam.durationMinutes} min · {detail.exam.totalMarks} marks
              </span>
            </div>

            {detail.attempts.length > 0 && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-brand-navy mb-2">Participation</p>
                <DataTable
                  columns={[
                    { key: "studentName", label: "Student" },
                    { key: "attemptNumber", label: "Attempt" },
                    { key: "status", label: "Status", render: (v) => <StatusBadge status={v} /> },
                    { key: "totalScore", label: "Score", render: (v) => (v !== null ? `${v}` : "—") },
                    { key: "percentage", label: "%", render: (v) => (v !== null ? `${Math.round(v)}%` : "—") },
                  ]}
                  data={detail.attempts}
                  emptyMessage="No attempts"
                />
              </div>
            )}

            {detail.results.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-brand-navy">Results</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => runAction(activeExam!, "showResults", { showResults: !detail.exam.showResults, allowAnswerReview: detail.exam.allowAnswerReview })}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-navy-deep text-white text-[12px] font-medium hover:bg-brand-navy transition-colors"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" /> {detail.exam.showResults ? "Hide results" : "Release results"}
                    </button>
                  </div>
                </div>
                <DataTable
                  columns={[
                    { key: "studentName", label: "Student" },
                    { key: "score", label: "Score", render: (v, row: AdminDetail["results"][number]) => `${v} / ${detail.exam.totalMarks}` },
                    { key: "percentage", label: "%", render: (v) => `${Math.round(v)}%` },
                    { key: "grade", label: "Grade", render: (v) => <span className="font-bold text-brand-navy">{v ?? "—"}</span> },
                    { key: "passed", label: "Passed", render: (v) => v ? <span className="text-green-600 font-bold">Yes</span> : <span className="text-red-600 font-bold">No</span> },
                    { key: "releasedAt", label: "Released", render: (v) => v ? `Yes (${fmt(v)})` : <span className="text-gray-400">Hidden</span> },
                  ]}
                  data={detail.results}
                  emptyMessage="No results yet"
                />
              </div>
            )}

            {detail.attempts.length === 0 && detail.results.length === 0 && (
              <p className="text-sm text-gray-500 py-6 text-center">No students have taken this examination yet.</p>
            )}
          </div>
        ) : null}
      </Modal>

      {/* Questions editor modal */}
      <Modal isOpen={questionsOpen} onClose={() => setQuestionsOpen(false)} title={questionsTarget ? `Questions — ${questionsTarget.title}` : "Questions"} size="lg">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {createError && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-[13px] text-red-700">{createError}</div>}
          <div className="flex flex-wrap gap-2">
            {["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER", "LONG_ANSWER"].map((t) => (
              <button key={t} onClick={() => addQuestion(t)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-brand-line text-[12px] font-medium text-brand-navy hover:bg-brand-paper transition-colors">
                <Plus className="w-3.5 h-3.5" /> {t.replace(/_/g, " ").toLowerCase()}
              </button>
            ))}
          </div>

          {questions.length === 0 && <p className="text-sm text-gray-500 text-center py-6">No questions yet.</p>}

          {questions.map((q, i) => (
            <div key={i} className="rounded-xl border border-brand-line p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Question {i + 1}</span>
                <button onClick={() => removeQuestion(i)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-gray-500 mb-1">Type</label>
                  <select value={q.type} onChange={(e) => updateQuestion(i, { type: e.target.value, options: e.target.value === "MULTIPLE_CHOICE" ? q.options.length ? q.options : [{ key: "A", text: "", isCorrect: false }, { key: "B", text: "", isCorrect: false }] : [], correctAnswer: e.target.value === "TRUE_FALSE" ? q.correctAnswer ?? "true" : undefined })} className="w-full rounded-lg border border-brand-line px-3 py-2 text-[13px] bg-white focus:outline-none">
                    <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                    <option value="TRUE_FALSE">True / False</option>
                    <option value="SHORT_ANSWER">Short Answer</option>
                    <option value="LONG_ANSWER">Long Answer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-gray-500 mb-1">Marks</label>
                  <input type="number" min="1" value={q.marks} onChange={(e) => updateQuestion(i, { marks: Number(e.target.value) || 1 })} className="w-full rounded-lg border border-brand-line px-3 py-2 text-[13px] focus:outline-none" />
                </div>
                {q.type === "TRUE_FALSE" && (
                  <div>
                    <label className="block text-[12px] font-medium text-gray-500 mb-1">Correct</label>
                    <select value={q.correctAnswer ?? "true"} onChange={(e) => updateQuestion(i, { correctAnswer: e.target.value })} className="w-full rounded-lg border border-brand-line px-3 py-2 text-[13px] bg-white focus:outline-none">
                      <option value="true">True</option>
                      <option value="false">False</option>
                    </select>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-[12px] font-medium text-gray-500 mb-1">Question text</label>
                <textarea value={q.question} onChange={(e) => updateQuestion(i, { question: e.target.value })} rows={2} className="w-full rounded-lg border border-brand-line px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-red/40" />
              </div>
              {q.type === "LONG_ANSWER" && (
                <div>
                  <label className="block text-[12px] font-medium text-gray-500 mb-1">Guidance (shown to students)</label>
                  <input value={q.guidance ?? ""} onChange={(e) => updateQuestion(i, { guidance: e.target.value })} className="w-full rounded-lg border border-brand-line px-3 py-2 text-[13px] focus:outline-none" />
                </div>
              )}
              {q.type === "MULTIPLE_CHOICE" && (
                <div className="space-y-1.5">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <span className="w-6 text-[12px] font-bold text-gray-400 shrink-0">{opt.key}.</span>
                      <input value={opt.text} onChange={(e) => updateQuestion(i, { options: q.options.map((o, x) => (x === oi ? { ...o, text: e.target.value } : o)) })} placeholder={`Option ${opt.key}`} className="flex-1 rounded-lg border border-brand-line px-3 py-2 text-[13px] focus:outline-none" />
                      <button
                        onClick={() => updateQuestion(i, { options: q.options.map((o, x) => ({ ...o, isCorrect: x === oi })), correctAnswer: opt.key })}
                        title="Mark as correct"
                        className={`px-3 py-2 rounded-lg text-[12px] font-bold border transition-colors ${opt.isCorrect ? "bg-green-100 border-green-300 text-green-700" : "border-brand-line text-gray-400 hover:bg-brand-paper"}`}
                      >
                        {opt.isCorrect ? "Correct" : "Correct?"}
                      </button>
                      {q.options.length > 2 && (
                        <button onClick={() => updateQuestion(i, { options: q.options.filter((_, x) => x !== oi) })} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                          <X className="w-4 h-4 text-red-400" />
                        </button>
                      )}
                    </div>
                  ))}
                  {q.options.length < 6 && (
                    <button onClick={() => { const nextKey = String.fromCharCode(65 + q.options.length); updateQuestion(i, { options: [...q.options, { key: nextKey, text: "", isCorrect: false }] }); }} className="text-[12px] font-medium text-brand-red inline-flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5" /> Add option
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setQuestionsOpen(false)} className="px-4 py-2.5 rounded-lg border border-brand-line text-[13px] font-medium text-gray-600 hover:bg-brand-paper transition-colors">
              Cancel
            </button>
            <button onClick={saveQuestions} disabled={savingQuestions || questions.length === 0} className="px-4 py-2.5 rounded-lg bg-brand-red text-white text-[13px] font-bold hover:bg-brand-red/90 transition-colors disabled:opacity-60">
              {savingQuestions ? "Saving…" : "Save Questions"}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Examination?"
        message={deleteTarget ? `"${deleteTarget.title}" will be permanently deleted.` : ""}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={doDelete}
      />
    </div>
  );
}