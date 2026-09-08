"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  AlertCircle,
  Eye,
  Trash2,
  Pencil,
  Send,
  Archive,
  X,
  ClipboardList,
  ShieldCheck,
  Users,
} from "lucide-react";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";
import EmptyState from "@/components/dashboard/EmptyState";
import Modal from "@/components/dashboard/Modal";
import ConfirmDialog from "@/components/dashboard/ConfirmDialog";
import DataTable from "@/components/dashboard/DataTable";

interface ExamRow {
  id: string;
  title: string;
  description?: string | null;
  className: string;
  classLevel: string;
  subjectName: string;
  academicSession: string;
  term: string;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  totalMarks: number;
  passMark: number;
  status: string;
  restrictToAssigned: boolean;
  showResults: boolean;
  allowAnswerReview: boolean;
  questionsCount: number;
  attemptsCount: number;
  assignmentsCount: number;
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

interface TeacherStudentOption {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
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

interface AttemptRow {
  id: string;
  attemptNumber: number;
  startedAt: string;
  submittedAt: string | null;
  status: string;
  autoScore: number | null;
  manualScore: number | null;
  totalScore: number | null;
  percentage: number | null;
  passed: boolean | null;
  student: { id: string; firstName: string; lastName: string; studentId: string };
}

interface GradingQuestion {
  id: string;
  type: string;
  question: string;
  marks: number;
  guidance: string | null;
  options: { key: string; text: string; isCorrect: boolean }[];
  answer?: {
    selectedKey?: string | null;
    textValue?: string | null;
    isCorrect?: boolean | null;
    awardedMarks?: number | null;
    feedback?: string | null;
  };
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

export default function TeacherExams() {
  const [exams, setExams] = useState<ExamRow[]>([]);
  const [classIds, setClassIds] = useState<string[]>([]);
  const [subjectIds, setSubjectIds] = useState<string[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [students, setStudents] = useState<TeacherStudentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [createError, setCreateError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    instructions: "",
    classId: "",
    subjectId: "",
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

  const [viewOpen, setViewOpen] = useState(false);
  const [activeExam, setActiveExam] = useState<ExamRow | null>(null);
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const [questionsOpen, setQuestionsOpen] = useState(false);
  const [questions, setQuestions] = useState<ExamQuestionUI[]>([]);
  const [questionsTarget, setQuestionsTarget] = useState<ExamRow | null>(null);
  const [savingQuestions, setSavingQuestions] = useState(false);

  const [gradeOpen, setGradeOpen] = useState(false);
  const [grading, setGrading] = useState<{ attemptId: string; studentName: string; questions: GradingQuestion[]; totalMarks: number } | null>(null);
  const [gradeValues, setGradeValues] = useState<Record<string, { awarded: string; feedback: string }>>({});
  const [savingGrade, setSavingGrade] = useState(false);
  const [gradeError, setGradeError] = useState("");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ExamRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchExams = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/teacher/exams");
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to load examinations.");
      }
      const json = await res.json();
      setExams(json.data || []);
      setClassIds(json.teacherClassIds || []);
      setSubjectIds(json.teacherSubjectIds || []);
    } catch (err: any) {
      setError(err.message || "Failed to load examinations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  const openCreate = useCallback(async () => {
    setCreateError("");
    setAssigned([]);
    setForm({
      title: "",
      description: "",
      instructions: "",
      classId: "",
      subjectId: "",
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
      const [cRes, sRes] = await Promise.all([fetch("/api/teacher/classes"), fetch("/api/teacher/subjects")]);
      const cj = await cRes.json();
      const sj = await sRes.json();
      setClasses(Array.isArray(cj.data) ? cj.data : []);
      setSubjects(Array.isArray(sj.data) ? sj.data : []);
      setCreateOpen(true);
    } catch {
      setCreateOpen(true);
    }
  }, []);

  const loadStudents = async (classId: string) => {
    try {
      const res = await fetch(`/api/teacher/classes/${classId}/students`);
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
      const res = await fetch("/api/teacher/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description || undefined,
          instructions: form.instructions || undefined,
          classId: form.classId,
          subjectId: form.subjectId,
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

  const openDetail = async (exam: ExamRow) => {
    setActiveExam(exam);
    setViewOpen(true);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/teacher/exams/${exam.id}`);
      const j = await res.json();
      if (res.ok) setAttempts(j.data?.attempts || []);
    } catch {
      setAttempts([]);
    } finally {
      setDetailLoading(false);
    }
  };

  const openQuestions = async (exam: ExamRow) => {
    setQuestionsTarget(exam);
    setQuestionsOpen(true);
    setQuestions([]);
    try {
      const res = await fetch(`/api/teacher/exams/${exam.id}`);
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
        options: type === "MULTIPLE_CHOICE" ? [
          { key: "A", text: "", isCorrect: false },
          { key: "B", text: "", isCorrect: false },
        ] : [],
      },
    ]);
  };

  const saveQuestions = async () => {
    if (!questionsTarget) return;
    setCreateError("");
    setSavingQuestions(true);
    try {
      const res = await fetch(`/api/teacher/exams/${questionsTarget.id}`, {
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

  const runAction = async (exam: ExamRow, action: string) => {
    try {
      const res = await fetch(`/api/teacher/exams?id=${exam.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Action failed.");
      fetchExams();
    } catch (err: any) {
      window.alert(err.message || "Action failed.");
    }
  };

  const toggleResultsVisibility = async (exam: ExamRow, show: boolean) => {
    try {
      const res = await fetch(`/api/teacher/exams?id=${exam.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "showResults", showResults: show, allowAnswerReview: exam.allowAnswerReview }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Action failed.");
      fetchExams();
    } catch (err: any) {
      window.alert(err.message || "Action failed.");
    }
  };

  const openGrading = async (attempt: AttemptRow) => {
    if (!activeExam) return;
    setGradeError("");
    setGradeOpen(true);
    setGrading({ attemptId: attempt.id, studentName: `${attempt.student.firstName} ${attempt.student.lastName}`, questions: [], totalMarks: 0 });
    setGradeValues({});
    try {
      const res = await fetch(`/api/teacher/exams/${activeExam.id}/attempts/${attempt.id}`);
      const j = await res.json();
      if (res.ok && j.data) {
        setGrading({
          attemptId: attempt.id,
          studentName: `${attempt.student.firstName} ${attempt.student.lastName}`,
          totalMarks: j.data.exam?.totalMarks ?? 0,
          questions: j.data.answers.map((a: any) => ({
            id: a.questionId,
            type: a.type,
            question: a.question,
            marks: a.marks,
            guidance: a.guidance,
            options: a.options ?? [],
            answer: a,
          })),
        });
        const vals: Record<string, { awarded: string; feedback: string }> = {};
        for (const a of j.data.answers) {
          if (a.type === "SHORT_ANSWER" || a.type === "LONG_ANSWER") {
            vals[a.questionId] = { awarded: String(a.awardedMarks ?? 0), feedback: a.feedback ?? "" };
          }
        }
        setGradeValues(vals);
      } else {
        const jj = await j.json().catch(() => ({}));
        throw new Error(jj.error || "Failed to load submission.");
      }
    } catch (err: any) {
      setGradeError(err.message || "Failed to load submission.");
    }
  };

  const saveGrade = async () => {
    if (!grading) return;
    setGradeError("");
    setSavingGrade(true);
    try {
      const answers: Record<string, { awardedMarks: number; feedback?: string }> = {};
      for (const [qid, v] of Object.entries(gradeValues)) {
        answers[qid] = { awardedMarks: Number(v.awarded) || 0, feedback: v.feedback || undefined };
      }
      const res = await fetch(`/api/teacher/exams/${activeExam!.id}/attempts/${grading.attemptId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Failed to save grades.");
      setGradeOpen(false);
      openDetail(activeExam!);
    } catch (err: any) {
      setGradeError(err.message || "Failed to save grades.");
    } finally {
      setSavingGrade(false);
    }
  };

  const confirmDelete = () => {
    setDeleteOpen(true);
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/teacher/exams?id=${deleteTarget.id}`, { method: "DELETE" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Failed to delete examination.");
      setDeleteOpen(false);
      setDeleteTarget(null);
      fetchExams();
    } catch (err: any) {
      window.alert(err.message || "Failed to delete examination.");
      setDeleteOpen(false);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-navy">Examinations</h1>
          <p className="text-sm text-gray-500 mt-1">Create, schedule, publish and grade online examinations.</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-red text-white text-sm font-bold hover:bg-brand-red/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Examination
        </button>
      </div>

      {exams.length === 0 ? (
        <EmptyState
          title="No examinations yet"
          description="Create your first online examination to get started."
          icon={<ClipboardList className="w-10 h-10" />}
        />
      ) : (
        <DataTable
          columns={[
            { key: "title", label: "Examination", render: (v, row: ExamRow) => (<div><p className="font-bold text-brand-navy">{v}</p><p className="text-[12px] text-gray-400">{row.subjectName} · {row.className} · {row.academicSession}</p></div>) },
            { key: "status", label: "Status", render: (v) => <StatusBadge status={v} /> },
            { key: "startAt", label: "Window", render: (_v, row: ExamRow) => (<span className="text-[12px] text-gray-500">{fmt(row.startAt)} → {fmt(row.endAt)}</span>) },
            { key: "totalMarks", label: "Marks", render: (v, row: ExamRow) => (<span>{v}<span className="text-gray-400"> / pass {row.passMark}</span></span>) },
            { key: "questionsCount", label: "Questions" },
            { key: "attemptsCount", label: "Attempts" },
            { key: "showResults", label: "Results", render: (v) => v ? <span className="text-green-600 font-bold text-[12px]">Released</span> : <span className="text-gray-400 text-[12px]">Hidden</span> },
            {
              key: "id", label: "Actions", className: "text-right", render: (_, row: ExamRow) => (
                <div className="flex items-center justify-end gap-1.5">
                  <button onClick={() => openQuestions(row)} title="Questions" className="p-2 rounded-lg border border-brand-line hover:bg-brand-paper transition-colors">
                    <Pencil className="w-4 h-4 text-brand-navy" />
                  </button>
                  <button onClick={() => openDetail(row)} title="Submissions" className="p-2 rounded-lg border border-brand-line hover:bg-brand-paper transition-colors">
                    <Users className="w-4 h-4 text-brand-navy" />
                  </button>
                  {row.status === "DRAFT" && (
                    <button onClick={() => runAction(row, "publish")} title="Publish" className="p-2 rounded-lg border border-brand-line hover:bg-brand-paper transition-colors">
                      <Send className="w-4 h-4 text-green-600" />
                    </button>
                  )}
                  {(row.status === "SCHEDULED" || row.status === "ACTIVE") && row.attemptsCount === 0 && (
                    <>
                      <button onClick={() => runAction(row, "unpublish")} title="Unpublish" className="p-2 rounded-lg border border-brand-line hover:bg-brand-paper transition-colors">
                        <X className="w-4 h-4 text-amber-600" />
                      </button>
                      <button onClick={() => runAction(row, "archive")} title="Archive" className="p-2 rounded-lg border border-brand-line hover:bg-brand-paper transition-colors">
                        <Archive className="w-4 h-4 text-gray-500" />
                      </button>
                    </>
                  )}
                  {row.status !== "ARCHIVED" && (
                    <button onClick={() => toggleResultsVisibility(row, !row.showResults)} title={row.showResults ? "Hide results" : "Release results"} className="p-2 rounded-lg border border-brand-line hover:bg-brand-paper transition-colors">
                      <ShieldCheck className={`w-4 h-4 ${row.showResults ? "text-green-600" : "text-gray-400"}`} />
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
        <div className="space-y-4">
          {createError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-[13px] text-red-700">{createError}</div>
          )}
          <div>
            <label className="block text-[13px] font-medium text-gray-600 mb-1">Title *</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-lg border border-brand-line px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/40" placeholder="e.g. First Term Mathematics Examination" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-gray-600 mb-1">Class *</label>
              <select value={form.classId} onChange={(e) => { setForm({ ...form, classId: e.target.value }); loadStudents(e.target.value); }} className="w-full rounded-lg border border-brand-line px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-red/40">
                <option value="">Select class</option>
                {classes.filter((c) => classIds.includes(c.id)).map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-gray-600 mb-1">Subject *</label>
              <select value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })} className="w-full rounded-lg border border-brand-line px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-red/40">
                <option value="">Select subject</option>
                {subjects.filter((s) => subjectIds.includes(s.id)).map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
              </select>
            </div>
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
            <textarea value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} rows={3} className="w-full rounded-lg border border-brand-line px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/40" placeholder="Instructions shown before the exam starts…" />
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
              <option value="DRAFT">Draft (save, don&apos;t notify)</option>
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

      {/* Submissions modal */}
      <Modal isOpen={viewOpen} onClose={() => setViewOpen(false)} title={activeExam ? `${activeExam.title} — Submissions` : "Submissions"} size="lg">
        {detailLoading ? (
          <LoadingSpinner text="Loading submissions…" />
        ) : attempts.length === 0 ? (
          <p className="text-sm text-gray-500 py-8 text-center">No students have taken this examination yet.</p>
        ) : (
          <DataTable
            columns={[
              { key: "studentName", label: "Student", render: (_v, row: AttemptRow) => `${row.student.firstName} ${row.student.lastName} (${row.student.studentId})` },
              { key: "attemptNumber", label: "Attempt" },
              { key: "status", label: "Status", render: (v) => <StatusBadge status={v} /> },
              { key: "totalScore", label: "Score", render: (v) => (v !== null ? `${v}` : "—") },
              { key: "percentage", label: "%", render: (v) => (v !== null ? `${Math.round(v)}%` : "—") },
              { key: "passed", label: "Passed", render: (v) => v === null ? "—" : v ? <span className="text-green-600 font-bold">Yes</span> : <span className="text-red-600 font-bold">No</span> },
              {
                key: "id", label: "", className: "text-right", render: (v, row: AttemptRow) => (
                  row.status === "SUBMITTED" ? (
                    <button onClick={() => openGrading(row)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-navy-deep text-white text-[12px] font-medium hover:bg-brand-navy transition-colors">
                      <Eye className="w-3.5 h-3.5" /> {row.totalScore !== null ? "Rescore" : "Grade"}
                    </button>
                  ) : (
                    <span className="text-[12px] text-gray-400">Not submitted</span>
                  )
                ),
              },
            ]}
            data={attempts.map((a) => ({ ...a, studentName: `${a.student.firstName} ${a.student.lastName}` }))}
            emptyMessage="No submissions"
          />
        )}
      </Modal>

      {/* Questions editor modal */}
      <Modal isOpen={questionsOpen} onClose={() => setQuestionsOpen(false)} title={questionsTarget ? `Questions — ${questionsTarget.title}` : "Questions"} size="lg">
        <div className="space-y-4">
          {createError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-[13px] text-red-700">{createError}</div>
          )}
          <div className="flex flex-wrap gap-2">
            {["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER", "LONG_ANSWER"].map((t) => (
              <button key={t} onClick={() => addQuestion(t)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-brand-line text-[12px] font-medium text-brand-navy hover:bg-brand-paper transition-colors">
                <Plus className="w-3.5 h-3.5" /> {t.replace(/_/g, " ").toLowerCase()}
              </button>
            ))}
          </div>

          {questions.length === 0 && <p className="text-sm text-gray-500 text-center py-6">No questions yet. Add some above, or reset them via the exam.</p>}

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

      {/* Grading modal */}
      <Modal isOpen={gradeOpen} onClose={() => setGradeOpen(false)} title={grading ? `Grade — ${grading.studentName}` : "Grade Submission"} size="lg">
        {gradeError && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-[13px] text-red-700 mb-4">{gradeError}</div>}
        {grading && grading.questions.length === 0 && !gradeError && <LoadingSpinner text="Loading submission…" />}
        {grading && grading.questions.length > 0 && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div className="flex items-center justify-between text-[13px] text-gray-600">
              <span className="font-medium">{grading.questions.length} questions · {grading.totalMarks} marks</span>
              <span>Auto-graded questions are locked</span>
            </div>
            {grading.questions.map((q, qi) => {
              const isWritten = q.type === "SHORT_ANSWER" || q.type === "LONG_ANSWER";
              const answer = q.answer;
              return (
                <div key={qi} className="rounded-xl border border-brand-line p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">{q.type.replace(/_/g, " ")} · {q.marks} marks</p>
                      <p className="text-sm font-medium text-brand-navy-deep mt-1">{q.question}</p>
                    </div>
                    {!isWritten && (
                      <span className={`shrink-0 text-[12px] font-bold ${answer?.isCorrect ? "text-green-600" : "text-red-600"}`}>
                        {answer?.isCorrect ? "Correct" : "Incorrect"} · +{answer?.awardedMarks ?? 0}
                      </span>
                    )}
                  </div>

                  {!isWritten ? (
                    <div className="space-y-1">
                      {q.options.map((opt) => {
                        const isChosen = answer?.selectedKey === opt.key;
                        const isCorrect = opt.isCorrect;
                        return (
                          <div key={opt.key} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] border ${isCorrect ? "border-green-200 bg-green-50 text-green-800" : isChosen ? "border-red-200 bg-red-50 text-red-700" : "border-brand-line text-gray-600"}`}>
                            <span className="font-bold">{opt.key}.</span> {opt.text}
                            {isCorrect && <span className="ml-auto text-[11px] font-bold">✓ correct</span>}
                            {isChosen && !isCorrect && <span className="ml-auto text-[11px] font-bold">student chose</span>}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <>
                      <div className="rounded-lg bg-brand-paper border border-brand-line px-3.5 py-2.5">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">Student&apos;s answer</p>
                        <p className="text-[13px] text-gray-700 whitespace-pre-line">{answer?.textValue || "— no answer given —"}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[12px] font-medium text-gray-500 mb-1">Marks awarded (max {q.marks})</label>
                          <input type="number" min="0" max={q.marks} value={gradeValues[q.id]?.awarded ?? ""} onChange={(e) => setGradeValues((prev) => ({ ...prev, [q.id]: { ...prev[q.id], awarded: e.target.value } }))} className="w-full rounded-lg border border-brand-line px-3 py-2 text-[13px] focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-[12px] font-medium text-gray-500 mb-1">Feedback</label>
                          <input value={gradeValues[q.id]?.feedback ?? ""} onChange={(e) => setGradeValues((prev) => ({ ...prev, [q.id]: { ...prev[q.id], feedback: e.target.value } }))} className="w-full rounded-lg border border-brand-line px-3 py-2 text-[13px] focus:outline-none" />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setGradeOpen(false)} className="px-4 py-2.5 rounded-lg border border-brand-line text-[13px] font-medium text-gray-600 hover:bg-brand-paper transition-colors">
                Cancel
              </button>
              <button onClick={saveGrade} disabled={savingGrade} className="px-4 py-2.5 rounded-lg bg-brand-red text-white text-[13px] font-bold hover:bg-brand-red/90 transition-colors disabled:opacity-60">
                {savingGrade ? "Saving…" : "Save Grades & Result"}
              </button>
            </div>
          </div>
        )}
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