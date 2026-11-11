// School grading rules: CA out of 40 + exam out of 60 = total out of 100.

export const CA_MAX = 40;
export const EXAM_MAX = 60;

export const GRADE_SCALE = [
  { grade: "A", min: 70, remark: "Excellent" },
  { grade: "B", min: 60, remark: "Very Good" },
  { grade: "C", min: 50, remark: "Good" },
  { grade: "D", min: 45, remark: "Fair" },
  { grade: "E", min: 40, remark: "Poor" },
  { grade: "F", min: 0, remark: "Fail" },
] as const;

export function gradeFor(total: number): { grade: string; remark: string } {
  const band = GRADE_SCALE.find((b) => total >= b.min) ?? GRADE_SCALE[GRADE_SCALE.length - 1];
  return { grade: band.grade, remark: band.remark };
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Converts an online exam percentage (0–100) into the exam share (0–60). */
export function examScoreFromPercentage(percentage: number): number {
  return round1((Math.max(0, Math.min(100, percentage)) / 100) * EXAM_MAX);
}

export function totalFor(ca: number | null | undefined, exam: number | null | undefined): number {
  return round1((ca ?? 0) + (exam ?? 0));
}

/** Dense-free "competition" ranking: equal totals share a position (1, 2, 2, 4). */
export function positions<T>(rows: T[], score: (r: T) => number): Map<T, number> {
  const sorted = [...rows].sort((a, b) => score(b) - score(a));
  const out = new Map<T, number>();
  sorted.forEach((r, i) => {
    const prev = sorted[i - 1];
    out.set(r, i > 0 && score(prev) === score(r) ? out.get(prev)! : i + 1);
  });
  return out;
}

export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
