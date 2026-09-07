"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  FileText,
  Trophy,
  MinusCircle,
} from "lucide-react";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";

interface ResultData {
  exam: {
    title: string;
    subjectName: string;
    className: string;
    showResults: boolean;
    allowAnswerReview: boolean;
  };
  result: {
    id: string;
    score: number;
    totalMarks: number;
    percentage: number;
    grade: string | null;
    passed: boolean;
    teacherFeedback: string | null;
    releasedAt: string;
    attempt: { attemptNumber: number; submittedAt: string | null };
  };
  details: { label: string; value: string }[];
  questionReview: Array<{
    question: string | null;
    type: string;
    selectedKey: string | null;
    textValue: string | null;
    correctAnswer: string | null;
    options: { key: string; text: string }[];
    isCorrect: boolean | null;
    awardedMarks: number;
    questionMarks: number;
    feedback: string | null;
  }>;
}

const TYPE_LABEL: Record<string, string> = {
  MULTIPLE_CHOICE: "Multiple Choice",
  TRUE_FALSE: "True / False",
  SHORT_ANSWER: "Short Answer",
  LONG_ANSWER: "Long Answer",
};

export default function StudentExamResult({ params }: { params: { examId: string } }) {
  const router = useRouter();
  const [data, setData] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/student/exams/${params.examId}/result`);
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to load result.");
      }
      const json = await res.json();
      setData(json.data);
    } catch (err: any) {
      setError(err.message || "Failed to load result.");
    } finally {
      setLoading(false);
    }
  }, [params.examId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingSpinner text="Loading result..." fullScreen />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-gray-600 font-medium max-w-md text-center">{error}</p>
        <button
          onClick={() => router.push("/dashboard/student/exams")}
          className="px-4 py-2 bg-school-blue text-white text-sm font-medium rounded-xl hover:bg-primary transition-colors"
        >
          Back to Examinations
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { exam, result } = data;

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.push("/dashboard/student/exams")}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-500 hover:text-brand-navy transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Examinations
      </button>

      <div className="bg-white rounded-xl border border-brand-line overflow-hidden">
        <div className="bg-brand-navy-deep px-6 py-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-brand-yellow">
            {exam.subjectName} · {exam.className}
          </p>
          <h1 className="font-heading text-2xl font-bold text-white mt-1">{exam.title}</h1>
        </div>

        <div className="px-6 py-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div
              className={`w-28 h-28 rounded-2xl border-2 flex flex-col items-center justify-center shrink-0 ${
                result.passed ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
              }`}
            >
              <Trophy className={`w-6 h-6 ${result.passed ? "text-green-600" : "text-red-500"}`} />
              <span className={`mt-1 font-mono text-2xl font-bold ${result.passed ? "text-green-700" : "text-red-600"}`}>
                {Math.round(result.percentage)}%
              </span>
              <span className="text-[11px] text-gray-500 font-medium">scored</span>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                {result.passed ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase px-2.5 py-1 rounded-full bg-green-100 text-green-700">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Passed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase px-2.5 py-1 rounded-full bg-red-100 text-red-700">
                    <XCircle className="w-3.5 h-3.5" /> Did not pass
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase px-2.5 py-1 rounded-full bg-brand-paper text-brand-navy border border-brand-line">
                  <FileText className="w-3.5 h-3.5" /> Grade {result.grade ?? "—"}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-6 gap-y-1 text-sm text-gray-600">
                <span className="font-medium">
                  Score <span className="font-bold text-brand-navy">{result.score} / {result.totalMarks}</span>
                </span>
                <span className="text-gray-400">
                  Attempt {result.attempt.attemptNumber}
                </span>
              </div>

              {result.teacherFeedback && (
                <div className="mt-3 rounded-lg bg-brand-paper border border-brand-line px-4 py-3 text-left">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-brand-navy mb-1">Teacher Feedback</p>
                  <p className="text-sm text-gray-600">{result.teacherFeedback}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {data.questionReview.length > 0 ? (
        <div className="space-y-3">
          <h2 className="font-heading text-lg font-bold text-brand-navy">Answer Review</h2>
          {data.questionReview.map((qr, i) => {
            const answered = qr.selectedKey !== null || (qr.textValue !== null && qr.textValue.trim() !== "");
            return (
              <div key={i} className="bg-white rounded-xl border border-brand-line p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="mt-0.5 w-7 h-7 rounded-lg bg-brand-paper border border-brand-line flex items-center justify-center text-[13px] font-bold text-brand-navy shrink-0">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                        {TYPE_LABEL[qr.type] ?? qr.type}
                      </p>
                      <p className="text-sm text-brand-navy-deep font-medium leading-relaxed">{qr.question}</p>
                    </div>
                  </div>
                  {qr.awardedMarks > 0 ? (
                    <span className="inline-flex items-center gap-1 text-[12px] font-bold text-green-700 shrink-0">
                      <MinusCircle className="w-3.5 h-3.5" /> +{qr.awardedMarks}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[12px] font-bold text-gray-400 shrink-0">
                      <MinusCircle className="w-3.5 h-3.5" /> {qr.awardedMarks}
                    </span>
                  )}
                </div>

                <div className="mt-3 space-y-2">
                  {qr.type === "MULTIPLE_CHOICE" || qr.type === "TRUE_FALSE" ? (
                    <div className="space-y-1.5">
                      {qr.options.map((opt) => {
                        const isChosen = qr.selectedKey === opt.key;
                        const isCorrect = qr.correctAnswer === opt.key;
                        return (
                          <div
                            key={opt.key}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border text-left ${
                              isCorrect
                                ? "border-green-200 bg-green-50 text-green-800"
                                : isChosen
                                ? "border-red-200 bg-red-50 text-red-700"
                                : "border-brand-line bg-white text-gray-600"
                            }`}
                          >
                            <span className="font-bold shrink-0">{opt.key}.</span>
                            <span className="flex-1">{opt.text}</span>
                            {isCorrect && <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />}
                            {isChosen && !isCorrect && <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-lg bg-brand-paper border border-brand-line px-4 py-3">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                        {answered ? "Your answer" : "No answer given"}
                      </p>
                      <p className="text-sm text-gray-700 whitespace-pre-line">{qr.textValue ?? "—"}</p>
                      {qr.feedback && (
                        <p className="text-[13px] text-brand-navy mt-2">
                          <span className="font-bold">Feedback: </span>{qr.feedback}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}