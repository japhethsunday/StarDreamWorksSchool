import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Question types supported by auto-grading (multiple choice / true-false).
export const AUTO_GRADABLE_TYPES = ["MULTIPLE_CHOICE", "TRUE_FALSE"];

const STATUS_PRIORITY: Record<string, number> = {
  ARCHIVED: 4,
  COMPLETED: 3,
  ACTIVE: 2,
  SCHEDULED: 1,
  DRAFT: 0,
};

/**
 * Derives the effective examination status. A persisted status of SCHEDULED is
 * promoted to ACTIVE once the window has started (and left ACTIVE once it has
 * ended, matching the intended lifecycle). Explicitly persisted DRAAFT/COMPLETED/
 * ARCHIVED always take precedence and are never overridden by time.
 */
export function effectiveStatus(
  status: string,
  startAt: Date | string,
  endAt: Date | string
): string {
  if (status === "ARCHIVED" || status === "COMPLETED" || status === "DRAFT") {
    return status;
  }
  const now = Date.now();
  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();
  if (now < start) return "SCHEDULED";
  if (now >= end) return "COMPLETED";
  return "ACTIVE";
}

export function hasMovedOn(a: string, b: string): boolean {
  return (STATUS_PRIORITY[a] ?? 0) < (STATUS_PRIORITY[b] ?? 0);
}

export function movesArchived(a: string, b: string): boolean {
  return b === "ARCHIVED" && a !== "ARCHIVED";
}

/**
 * Computes a stable total-marks sum for an exam from its questions.
 */
export function totalMarksFromQuestions(
  questions: Array<{ marks: number | null }>
): number {
  return questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);
}

export interface AutoGradeResult {
  autoScore: number;
  answers: Array<{
    questionId: string;
    questionType: string;
    questionMarks: number;
    selectedKey?: string;
    textValue?: string;
    isCorrect?: boolean;
    awardedMarks?: number;
  }>;
}

const findCorrectKey = (
  options: Array<{ key: string; isCorrect: boolean }> | undefined
): string | undefined => {
  if (!options) return undefined;
  return options.find((o) => o.isCorrect)?.key;
};

/**
 * Auto-grades available answers for the multiple-choice and true-false
 * questions. Written answers are stored unevaluated (isCorrect stays null) so
 * the teacher assigns marks manually. Returns the running auto score and the
 * full answer set to persist.
 */
export function gradeAuto(
  questions: Array<{
    id: string;
    type: string;
    marks: number;
    correctAnswer?: string | null;
    options?: Array<{ key: string; isCorrect: boolean }>;
  }>,
  answers: Record<string, { selectedKey?: string; textValue?: string }>
): AutoGradeResult {
  let autoScore = 0;
  const persisted: AutoGradeResult["answers"] = [];

  for (const q of questions) {
    const ans = answers[q.id];
    const base = {
      questionId: q.id,
      questionType: q.type,
      questionMarks: q.marks,
    };
    if (!ans) {
      persisted.push({ ...base });
      continue;
    }
    if (AUTO_GRADABLE_TYPES.includes(q.type)) {
      const correct = q.correctAnswer ?? findCorrectKey(q.options);
      const chosen = ans.selectedKey ?? null;
      const isCorrect = correct !== undefined && chosen === correct;
      const awarded = isCorrect ? q.marks : 0;
      if (isCorrect) autoScore += awarded;
      persisted.push({ ...base, selectedKey: chosen ?? undefined, isCorrect, awardedMarks: awarded });
    } else {
      persisted.push({ ...base, textValue: ans.textValue ?? "" });
    }
  }

  return { autoScore, answers: persisted };
}

/**
 * Refreshes persisted SCHEDULED exams to ACTIVE once their window opens, and to
 * COMPLETED once it closes. Called opportunistically from list/read routes so
 * no scheduler/cron is required.
 */
export async function refreshExamStatuses(): Promise<void> {
  try {
    const now = new Date();
    const exams = await prisma.exam.findMany({
      where: { status: { in: ["SCHEDULED", "ACTIVE"] } },
      select: { id: true, status: true, startAt: true, endAt: true },
    });
    const idsToUpdate: string[] = [];
    for (const e of exams) {
      const next = effectiveStatus(e.status, e.startAt, e.endAt);
      if (next !== e.status) idsToUpdate.push(e.id);
    }
    if (idsToUpdate.length) {
      for (const id of idsToUpdate) {
        const e = exams.find((x) => x.id === id);
        // eslint-disable-next-line no-await-in-loop
        const next = e ? effectiveStatus(e.status, e.startAt, e.endAt) : "COMPLETED";
        // eslint-disable-next-line no-await-in-loop
        await prisma.exam.update({ where: { id }, data: { status: next } });
      }
    }
  } catch {
    // best-effort, never throw
  }
}

export type { Prisma };