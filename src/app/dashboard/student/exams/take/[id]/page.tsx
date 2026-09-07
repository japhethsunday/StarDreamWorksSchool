"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  CloudUpload,
  Play,
  Send,
} from "lucide-react";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";
import Modal from "@/components/dashboard/Modal";

interface OptionDTO {
  key: string;
  text: string;
}

interface QuestionDTO {
  id: string;
  type: string;
  question: string;
  marks: number;
  guidance: string | null;
  position: number;
  options: OptionDTO[];
}

interface ExamDTO {
  id: string;
  title: string;
  subjectName: string;
  className: string;
  instructions: string | null;
  durationMinutes: number;
  totalMarks: number;
  questionsCount: number;
  shuffleQuestions: boolean;
}

type Answers = Record<string, { selectedKey?: string; textValue?: string }>;

const TYPE_LABEL: Record<string, string> = {
  MULTIPLE_CHOICE: "Multiple Choice",
  TRUE_FALSE: "True / False",
  SHORT_ANSWER: "Short Answer",
  LONG_ANSWER: "Long Answer",
};

function fmtRemaining(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export default function TakeExamPage({ params }: { params: { id: string } }) {
  return <StudentTakeExam examId={params.id} />;
}

function StudentTakeExam({ examId }: { examId: string }) {
  const router = useRouter();
  const [phase, setPhase] = useState<"loading" | "start" | "running" | "error">("loading");
  const [failed, setFailed] = useState("");
  const [exam, setExam] = useState<ExamDTO | null>(null);
  const [questions, setQuestions] = useState<QuestionDTO[]>([]);
  const [order, setOrder] = useState<QuestionDTO[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [remaining, setRemaining] = useState<number | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [autosubmitted, setAutosubmitted] = useState(false);

  const answersRef = useRef<Answers>({});
  answersRef.current = answers;
  const submittedRef = useRef(false);

  const shuffleArr = useCallback((arr: QuestionDTO[]) => {
    const out = [...arr];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }, []);

  const loadExam = useCallback(async () => {
    try {
      const res = await fetch(`/api/student/exams/${examId}`);
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to load examination.");
      }
      const json = await res.json();
      const d = json.data;
      setExam(d.exam as ExamDTO);
      const qs = (d.questions || []) as QuestionDTO[];
      setQuestions(qs);
      setOrder(d.exam.shuffleQuestions ? shuffleArr(qs) : qs);

      if (d.attempt && d.attempt.status === "IN_PROGRESS") {
        setAttemptId(d.attempt.id);
        setRemaining(Math.max(0, new Date(d.attempt.expiresAt).getTime() - Date.now()));
        const saved: Answers = {};
        for (const [qid, val] of Object.entries(d.savedAnswers || {})) {
          const v = val as { selectedKey?: string | null; textValue?: string | null };
          saved[qid] = { selectedKey: v.selectedKey ?? undefined, textValue: v.textValue ?? undefined };
        }
        setAnswers(saved);
        setPhase("running");
      } else {
        setPhase("start");
      }
    } catch (err: any) {
      setFailed(err.message || "Failed to load examination.");
      setPhase("error");
    }
  }, [examId, shuffleArr]);

  useEffect(() => {
    loadExam();
  }, [loadExam]);

  const startExam = async () => {
    setFailed("");
    try {
      const res = await fetch(`/api/student/exams/${examId}?action=start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Failed to start examination.");
      setAttemptId(j.data?.attemptId || null);
      await loadExam();
    } catch (err: any) {
      setFailed(err.message || "Failed to start examination.");
      setPhase("error");
    }
  };

  const doSubmit = useCallback(
    async () => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      setSubmitting(true);
      try {
        const res = await fetch(`/api/student/exams/${examId}?action=submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: answersRef.current }),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j.error || "Failed to submit examination.");
        setSubmitOpen(false);
        router.replace(`/dashboard/student/exams/result/${examId}`);
      } catch (err: any) {
        submittedRef.current = false;
        setSubmitting(false);
        setFailed(err.message || "Failed to submit examination.");
        setPhase("error");
      }
    },
    [examId, router]
  );

  // Countdown driven by the server-set expiry timestamp.
  useEffect(() => {
    if (phase !== "running" || !attemptId) return;
    const tick = () => setRemaining((r) => {
      return r === null ? null : Math.max(0, r - 1000);
    });
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [phase, attemptId]);

  // Auto-submit when time runs out (server enforces as well).
  useEffect(() => {
    if (phase !== "running" || remaining === null || remaining > 0 || autosubmitted) return;
    if (!submittedRef.current) {
      setAutosubmitted(true);
      doSubmit();
    }
  }, [phase, remaining, autosubmitted, doSubmit]);

  // Debounced autosave shortly after each answer change.
  useEffect(() => {
    if (phase !== "running" || !attemptId) return;
    const save = async () => {
      setSaveState("saving");
      try {
        await fetch(`/api/student/exams/${examId}/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: answersRef.current }),
        });
        setSaveState("saved");
      } catch {
        setSaveState("idle");
      }
    };
    const t = setTimeout(save, 4000);
    return () => clearTimeout(t);
  }, [answers, phase, attemptId, examId]);

  // Periodic belt-and-braces autosave.
  useEffect(() => {
    if (phase !== "running" || !attemptId) return;
    const t = setInterval(() => {
      fetch(`/api/student/exams/${examId}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: answersRef.current }),
      })
        .then(() => setSaveState("saved"))
        .catch(() => setSaveState("idle"));
    }, 25000);
    return () => clearInterval(t);
  }, [phase, attemptId, examId]);

  // Revert "saved" indicator after a moment.
  useEffect(() => {
    if (saveState !== "saved") return;
    const t = setTimeout(() => setSaveState("idle"), 5000);
    return () => clearTimeout(t);
  }, [saveState]);

  // Warn on accidental navigation away mid-exam.
  useEffect(() => {
    if (phase !== "running") return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [phase]);

  if (phase === "loading") return <LoadingSpinner text="Loading examination..." fullScreen />;

  if (phase === "error") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-gray-600 font-medium max-w-md text-center">{failed}</p>
        <button
          onClick={() => router.push("/dashboard/student/exams")}
          className="px-4 py-2 bg-school-blue text-white text-sm font-medium rounded-xl hover:bg-primary transition-colors"
        >
          Back to Examinations
        </button>
      </div>
    );
  }

  if (phase === "start" && exam) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-6">
        <div className="bg-white rounded-xl border border-brand-line overflow-hidden">
          <div className="bg-brand-navy-deep px-6 py-5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-brand-yellow">
              {exam.subjectName} · {exam.className}
            </p>
            <h1 className="font-heading text-2xl font-bold text-white mt-1">{exam.title}</h1>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-brand-paper border border-brand-line py-3">
                <Clock className="w-4 h-4 mx-auto text-brand-red mb-1" />
                <p className="text-sm font-bold text-brand-navy">{exam.durationMinutes} min</p>
                <p className="text-[11px] text-gray-500 font-medium">Duration</p>
              </div>
              <div className="rounded-lg bg-brand-paper border border-brand-line py-3">
                <CloudUpload className="w-4 h-4 mx-auto text-brand-red mb-1" />
                <p className="text-sm font-bold text-brand-navy">{exam.questionsCount}</p>
                <p className="text-[11px] text-gray-500 font-medium">Questions</p>
              </div>
              <div className="rounded-lg bg-brand-paper border border-brand-line py-3">
                <Check className="w-4 h-4 mx-auto text-brand-red mb-1" />
                <p className="text-sm font-bold text-brand-navy">{exam.totalMarks}</p>
                <p className="text-[11px] text-gray-500 font-medium">Total Marks</p>
              </div>
            </div>

            {exam.instructions && (
              <div className="rounded-lg bg-brand-paper border border-brand-line p-4">
                <p className="text-[11px] font-bold uppercase tracking-widest text-brand-navy mb-2">Instructions</p>
                <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{exam.instructions}</p>
              </div>
            )}

            <ul className="text-[13px] text-gray-600 space-y-1.5 list-disc list-inside">
              <li>Your answers are saved automatically every few seconds.</li>
              <li>The timer starts when you click begin and cannot be paused.</li>
              <li>The examination will be submitted automatically when time runs out.</li>
              <li>Do not close this window while the examination is running.</li>
            </ul>

            <button
              onClick={startExam}
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-red text-white font-bold text-sm hover:bg-brand-red/90 transition-colors disabled:opacity-60"
            >
              <Play className="w-4 h-4" /> Begin Examination
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase !== "running" || !exam) return null;

  const q = order[current];
  const answeredCount = order.filter((o) => {
    const a = answers[o.id];
    if (!a) return false;
    if (a.selectedKey !== undefined && a.selectedKey !== "") return true;
    if (a.textValue !== undefined && a.textValue.trim() !== "") return true;
    return false;
  }).length;

  const setAnswer = (qid: string, patch: Partial<{ selectedKey: string; textValue: string }>) => {
    setAnswers((prev) => {
      const cur = prev[qid] ?? {};
      const next = { ...cur, ...patch };
      const empty = !next.selectedKey && !next.textValue?.trim();
      const out = { ...prev };
      if (empty) delete out[qid];
      else out[qid] = next;
      return out;
    });
  };

  return (
    <div className="space-y-5 pb-10">
      {/* Top bar */}
      <div className="bg-brand-navy-deep rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-widest text-brand-yellow">
            {exam.subjectName} · {exam.className}
          </p>
          <h1 className="font-heading text-lg font-bold text-white truncate">{exam.title}</h1>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {saveState === "saving" && <span className="text-[12px] text-white/60 inline-flex items-center gap-1"><CloudUpload className="w-4 h-4 animate-pulse" /> Saving…</span>}
          {saveState === "saved" && <span className="text-[12px] text-green-400 inline-flex items-center gap-1"><Check className="w-4 h-4" /> Saved</span>}
          <div className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2">
            <Clock className="w-4 h-4 text-brand-red" />
            <span className={`font-mono font-bold tabular-nums ${remaining !== null && remaining <= 60000 ? "text-red-600" : "text-brand-navy-deep"}`}>
              {remaining === null ? "—" : fmtRemaining(remaining)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_240px] gap-5 items-start">
        {/* Question card */}
        <div className="bg-white rounded-xl border border-brand-line overflow-hidden">
          <div className="border-b border-brand-line px-5 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-brand-paper border border-brand-line flex items-center justify-center text-[13px] font-bold text-brand-navy">
                {current + 1}
              </span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                {TYPE_LABEL[q.type] ?? q.type}
              </span>
            </div>
            <span className="text-[12px] font-medium text-gray-500">{q.marks} mark{q.marks === 1 ? "" : "s"}</span>
          </div>

          <div className="p-6">
            <p className="text-[15px] text-brand-navy-deep font-medium leading-relaxed mb-5">{q.question}</p>

            {q.type === "MULTIPLE_CHOICE" && (
              <div className="space-y-2.5">
                {q.options.map((opt) => {
                  const selected = answers[q.id]?.selectedKey === opt.key;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => setAnswer(q.id, { selectedKey: opt.key })}
                      className={`w-full text-left flex items-start gap-3 px-4 py-3 rounded-lg border text-sm transition-colors ${
                        selected
                          ? "border-brand-red bg-brand-red/5 text-brand-navy-deep"
                          : "border-brand-line bg-white hover:bg-brand-paper/60 text-gray-700"
                      }`}
                    >
                      <span
                        className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                          selected ? "border-brand-red" : "border-gray-300"
                        }`}
                      >
                        {selected && <span className="w-2 h-2 rounded-full bg-brand-red" />}
                      </span>
                      <span className="font-medium leading-snug">{opt.text}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {q.type === "TRUE_FALSE" && (
              <div className="grid grid-cols-2 gap-3">
                {["true", "false"].map((val) => {
                  const selected = answers[q.id]?.selectedKey === val;
                  return (
                    <button
                      key={val}
                      onClick={() => setAnswer(q.id, { selectedKey: val })}
                      className={`px-4 py-3 rounded-lg border text-sm font-bold text-center transition-colors ${
                        selected
                          ? "border-brand-red bg-brand-red/5 text-brand-red"
                          : "border-brand-line bg-white hover:bg-brand-paper/60 text-gray-600"
                      }`}
                    >
                      {val === "true" ? "True" : "False"}
                    </button>
                  );
                })}
              </div>
            )}

            {q.type === "SHORT_ANSWER" && (
              <textarea
                value={answers[q.id]?.textValue ?? ""}
                onChange={(e) => setAnswer(q.id, { textValue: e.target.value })}
                rows={3}
                placeholder="Type your answer here…"
                className="w-full rounded-lg border border-brand-line bg-white px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-red/40"
              />
            )}

            {q.type === "LONG_ANSWER" && (
              <>
                <textarea
                  value={answers[q.id]?.textValue ?? ""}
                  onChange={(e) => setAnswer(q.id, { textValue: e.target.value })}
                  rows={8}
                  placeholder="Write your full answer here…"
                  className="w-full rounded-lg border border-brand-line bg-white px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-red/40"
                />
                <p className="text-[12px] text-gray-400 mt-2">
                  {q.guidance ? `Guidance: ${q.guidance}` : `Answer thoroughly. ${q.marks} mark${q.marks === 1 ? "" : "s"} available.`}
                </p>
              </>
            )}

            {q.guidance && q.type !== "LONG_ANSWER" && (
              <p className="text-[12px] text-gray-400 mt-4">{q.guidance}</p>
            )}

            <div className="flex items-center justify-between mt-6">
              <button
                onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                disabled={current === 0}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-medium text-brand-navy border border-brand-line hover:bg-brand-paper transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              {current < order.length - 1 ? (
                <button
                  onClick={() => setCurrent((c) => Math.min(order.length - 1, c + 1))}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-medium bg-brand-navy-deep text-white hover:bg-brand-navy transition-colors"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setSubmitOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-bold bg-brand-red text-white hover:bg-brand-red/90 transition-colors"
                >
                  <Send className="w-4 h-4" /> Submit Examination
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Navigator */}
        <div className="bg-white rounded-xl border border-brand-line overflow-hidden">
          <div className="border-b border-brand-line px-5 py-3 flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-widest text-brand-navy">Questions</p>
            <span className="text-[12px] text-gray-500 font-medium">{answeredCount}/{order.length}</span>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-5 gap-2">
              {order.map((o, idx) => {
                const a = answers[o.id];
                const answered = !!a && (!!a.selectedKey || (!!a.textValue && a.textValue.trim() !== ""));
                return (
                  <button
                    key={o.id}
                    onClick={() => setCurrent(idx)}
                    className={`h-9 rounded-lg text-[13px] font-bold border flex items-center justify-center transition-colors ${
                      idx === current
                        ? "bg-brand-red text-white border-brand-red"
                        : answered
                        ? "bg-green-100 text-green-800 border-green-200"
                        : "bg-white text-gray-500 border-brand-line hover:bg-brand-paper"
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 space-y-1.5 text-[12px] text-gray-500">
              <p className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-green-100 border border-green-200" /> Answered</p>
              <p className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-brand-red" /> Current</p>
              <p className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-white border border-brand-line" /> Unanswered</p>
            </div>

            <button
              onClick={() => setSubmitOpen(true)}
              className="mt-5 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-brand-red text-white text-[13px] font-bold hover:bg-brand-red/90 transition-colors"
            >
              <Send className="w-4 h-4" /> Submit
            </button>
          </div>
        </div>
      </div>

      <Modal isOpen={submitOpen} onClose={() => !submitting && setSubmitOpen(false)} title="Submit Examination?" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            You have answered <span className="font-bold text-brand-navy">{answeredCount}</span> of{" "}
            <span className="font-bold text-brand-navy">{order.length}</span> questions. Once submitted, you cannot
            change your answers.
          </p>
          {answeredCount < order.length && (
            <p className="text-[13px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Warning: {order.length - answeredCount} question{order.length - answeredCount === 1 ? "" : "s"} left unanswered.
            </p>
          )}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setSubmitOpen(false)}
              disabled={submitting}
              className="flex-1 px-4 py-2.5 rounded-lg border border-brand-line text-[13px] font-medium text-gray-600 hover:bg-brand-paper transition-colors disabled:opacity-50"
            >
              Keep Writing
            </button>
            <button
              onClick={() => doSubmit()}
              disabled={submitting}
              className="flex-1 px-4 py-2.5 rounded-lg bg-brand-red text-white text-[13px] font-bold hover:bg-brand-red/90 transition-colors disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Yes, Submit"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}