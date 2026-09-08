"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  PenLine,
  AlertCircle,
  Clock,
  ChevronRight,
  Play,
  CheckCircle2,
  XCircle,
  FileText,
  RotateCcw,
} from "lucide-react";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";
import EmptyState from "@/components/dashboard/EmptyState";

interface StudentExam {
  id: string;
  title: string;
  description?: string | null;
  instructions?: string | null;
  subjectName: string;
  className: string;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  totalMarks: number;
  passMark: number;
  maxAttempts: number;
  status: string;
  effectiveStatus: string;
  questionsCount: number;
  canStart: boolean;
  resumable: boolean;
  hasStarted: boolean;
  attemptsUsed: number;
  attempt: {
    id: string;
    attemptNumber: number;
    status: string;
    totalScore: number | null;
    percentage: number | null;
    passed: boolean | null;
  } | null;
  result: {
    id: string;
    releasedAt: string;
    score: number;
    percentage: number;
    grade: string | null;
    passed: boolean;
  } | null;
  showResults: boolean;
  allowAnswerReview: boolean;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    DRAFT: { label: "Draft", cls: "bg-gray-100 text-gray-600" },
    SCHEDULED: { label: "Scheduled", cls: "bg-blue-100 text-blue-700" },
    ACTIVE: { label: "Open", cls: "bg-green-100 text-green-700" },
    COMPLETED: { label: "Closed", cls: "bg-amber-100 text-amber-700" },
    ARCHIVED: { label: "Archived", cls: "bg-red-100 text-red-700" },
  };
  const s = map[status] ?? map.DRAFT;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${s.cls}`}>
      {s.label}
    </span>
  );
}

export default function StudentExams() {
  const router = useRouter();
  const [exams, setExams] = useState<StudentExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchExams = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/student/exams");
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to load examinations.");
      }
      const json = await res.json();
      setExams(json.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load examinations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  if (loading) return <LoadingSpinner text="Loading examinations..." fullScreen />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-gray-600 font-medium">{error}</p>
        <button
          onClick={fetchExams}
          className="px-4 py-2 bg-school-blue text-white text-sm font-medium rounded-xl hover:bg-primary transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (exams.length === 0) {
    return (
      <EmptyState
        title="No examinations available"
        description="Examinations assigned to your class will appear here when your teachers publish them."
        icon={<PenLine className="w-10 h-10" />}
      />
    );
  }

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-navy">Examinations</h1>
          <p className="text-sm text-gray-500 mt-1">Your scheduled examinations and results.</p>
        </div>
      </div>

      <div className="grid gap-4">
        {exams.map((exam) => {
          return (
            <div
              key={exam.id}
              className="bg-white rounded-xl border border-brand-line p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-brand-red">
                      {exam.subjectName}
                    </span>
                    <span className="text-[11px] text-gray-400 font-medium">· {exam.className}</span>
                    <StatusBadge status={exam.effectiveStatus} />
                  </div>
                  <h3 className="font-heading text-lg font-bold text-brand-navy leading-snug">{exam.title}</h3>
                  {exam.description && <p className="text-sm text-gray-500 mt-1">{exam.description}</p>}

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-3 text-[13px] text-gray-600">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-brand-muted" />
                      {exam.durationMinutes} min · {exam.questionsCount} questions
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-brand-muted" />
                      {exam.totalMarks} marks
                    </span>
                    <span className="text-gray-400">Starts {fmt(exam.startAt)}</span>
                  </div>

                  {exam.attempt && exam.attempt.status === "SUBMITTED" && !exam.result && (
                    <p className="text-[13px] text-amber-600 mt-3 inline-flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      Submitted — result not yet released.
                    </p>
                  )}
                  {exam.result && exam.result.releasedAt && (
                    <div className="mt-3 inline-flex items-center gap-3 rounded-lg bg-brand-paper border border-brand-line px-3 py-2">
                      <span className={`inline-flex items-center gap-1.5 text-[13px] font-bold ${exam.result.passed ? "text-green-700" : "text-red-700"}`}>
                        {exam.result.passed ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        {Math.round(exam.result.percentage)}%
                      </span>
                      <span className="text-[13px] text-gray-600 font-medium">Grade {exam.result.grade ?? "—"}</span>
                      <span className="text-[13px] text-gray-500">
                        {exam.result.score} / {exam.totalMarks}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  {exam.result && exam.result.releasedAt && exam.showResults && (
                    <button
                      onClick={() => router.push(`/dashboard/student/exams/result/${exam.id}`)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand-navy-deep text-white text-[13px] font-medium hover:bg-brand-navy transition-colors"
                    >
                      View Result <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                  {!exam.result && exam.canStart && (
                    <button
                      onClick={() => router.push(`/dashboard/student/exams/take/${exam.id}`)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand-red text-white text-[13px] font-medium hover:bg-brand-red/90 transition-colors"
                    >
                      <Play className="w-4 h-4" /> Start Exam
                    </button>
                  )}
                  {!exam.result && exam.resumable && (
                    <button
                      onClick={() => router.push(`/dashboard/student/exams/take/${exam.id}`)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand-yellow text-brand-navy-deep text-[13px] font-medium hover:bg-brand-yellow/90 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" /> Resume Exam
                    </button>
                  )}
                  {!exam.result && exam.hasStarted && !exam.canStart && !exam.resumable && (
                    <span className="text-[12px] text-gray-400 font-medium">
                      {exam.attemptsUsed}/{exam.maxAttempts} attempt{exam.maxAttempts === 1 ? "" : "s"} used
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}