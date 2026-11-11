import { prisma } from "./prisma";
import { CA_MAX, EXAM_MAX, examScoreFromPercentage, gradeFor, round1, totalFor } from "./results";

export const TERMS = ["FIRST", "SECOND", "THIRD"] as const;

export interface SheetQuery {
  classId: string;
  subjectId: string;
  academicSession: string;
  term: string;
}

export interface SheetRow {
  studentId: string;
  admissionNo: string;
  name: string;
  caScore: number | null;
  examScore: number | null;
  /** Exam share (out of 60) from the student's best released or graded online exam, if any. */
  onlineExamScore: number | null;
  total: number | null;
  grade: string | null;
  remark: string | null;
  saved: boolean;
  publishedAt: string | null;
}

export interface SaveRowInput {
  studentId: string;
  caScore: number | null;
  examScore: number | null;
  remarks?: string | null;
}

export function parseSheetQuery(url: URL): SheetQuery | string {
  const classId = url.searchParams.get("classId") || "";
  const subjectId = url.searchParams.get("subjectId") || "";
  const academicSession = (url.searchParams.get("academicSession") || "").trim();
  const term = url.searchParams.get("term") || "";
  if (!classId) return "Choose a class.";
  if (!subjectId) return "Choose a subject.";
  if (!academicSession) return "Enter the academic session, e.g. 2025/2026.";
  if (!(TERMS as readonly string[]).includes(term)) return "Choose a term.";
  return { classId, subjectId, academicSession, term };
}

export async function loadSheet(q: SheetQuery): Promise<SheetRow[]> {
  const students = await prisma.student.findMany({
    where: { classId: q.classId, status: "ACTIVE" },
    select: { id: true, studentId: true, firstName: true, lastName: true, middleName: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
  const ids = students.map((s) => s.id);
  if (ids.length === 0) return [];

  const grades = await prisma.grade.findMany({
    where: { studentId: { in: ids }, subjectId: q.subjectId, classId: q.classId, academicSession: q.academicSession, term: q.term },
  });
  const gradeBy = new Map(grades.map((g) => [g.studentId, g]));

  // Best online exam result for this class/subject/session/term.
  const results = await prisma.examResult.findMany({
    where: {
      studentId: { in: ids },
      exam: { classId: q.classId, subjectId: q.subjectId, academicSession: q.academicSession, term: q.term },
    },
    select: { studentId: true, percentage: true },
  });
  const bestPct = new Map<string, number>();
  for (const r of results) {
    bestPct.set(r.studentId, Math.max(bestPct.get(r.studentId) ?? -1, r.percentage));
  }

  return students.map((s) => {
    const g = gradeBy.get(s.id);
    const pct = bestPct.get(s.id);
    const hasScores = g && (g.caScore !== null || g.examScore !== null);
    // Legacy grades only have one score out of 100; show it as the total.
    const total = g ? (hasScores ? totalFor(g.caScore, g.examScore) : round1(g.score)) : null;
    return {
      studentId: s.id,
      admissionNo: s.studentId,
      name: [s.lastName, s.firstName, s.middleName].filter(Boolean).join(" "),
      caScore: g?.caScore ?? null,
      examScore: g?.examScore ?? null,
      onlineExamScore: pct === undefined ? null : examScoreFromPercentage(pct),
      total,
      grade: g ? g.grade : null,
      remark: g ? g.remarks ?? gradeFor(total ?? 0).remark : null,
      saved: !!g,
      publishedAt: g?.publishedAt ? g.publishedAt.toISOString() : null,
    };
  });
}

function checkScore(v: unknown, max: number, label: string): number | null | string {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return `${label} must be a number.`;
  if (n < 0 || n > max) return `${label} must be between 0 and ${max}.`;
  return round1(n);
}

/** Saves rows one by one (safe with Supabase's transaction pooler). Returns the number saved or an error. */
export async function saveSheet(q: SheetQuery, rows: SaveRowInput[], teacherId: string | null): Promise<number | string> {
  const classStudents = await prisma.student.findMany({ where: { classId: q.classId }, select: { id: true } });
  const allowed = new Set(classStudents.map((s) => s.id));

  // Validate everything first so a bad row doesn't leave a half-saved sheet.
  const clean: { studentId: string; ca: number | null; exam: number | null; remarks: string | null }[] = [];
  for (const r of rows) {
    if (!allowed.has(r.studentId)) return "One of the students is not in this class.";
    const ca = checkScore(r.caScore, CA_MAX, "CA score");
    if (typeof ca === "string") return ca;
    const exam = checkScore(r.examScore, EXAM_MAX, "Exam score");
    if (typeof exam === "string") return exam;
    const remarks = typeof r.remarks === "string" && r.remarks.trim() ? r.remarks.trim().slice(0, 200) : null;
    clean.push({ studentId: r.studentId, ca, exam, remarks });
  }

  let saved = 0;
  for (const r of clean) {
    if (r.ca === null && r.exam === null) continue; // nothing entered for this student
    const total = totalFor(r.ca, r.exam);
    const { grade, remark } = gradeFor(total);
    const data = {
      caScore: r.ca,
      examScore: r.exam,
      score: total,
      grade,
      remarks: r.remarks ?? remark,
      ...(teacherId ? { teacherId } : {}),
    };
    const existing = await prisma.grade.findFirst({
      where: { studentId: r.studentId, subjectId: q.subjectId, classId: q.classId, academicSession: q.academicSession, term: q.term },
      select: { id: true },
    });
    if (existing) {
      await prisma.grade.update({ where: { id: existing.id }, data });
    } else {
      await prisma.grade.create({
        data: { ...data, studentId: r.studentId, subjectId: q.subjectId, classId: q.classId, academicSession: q.academicSession, term: q.term },
      });
    }
    saved++;
  }
  return saved;
}

/** Publishes or hides results for a class and term, optionally one subject only. */
export async function setPublished(
  scope: { classId: string; academicSession: string; term: string; subjectId?: string | null },
  publish: boolean
): Promise<number> {
  const where = {
    classId: scope.classId,
    academicSession: scope.academicSession,
    term: scope.term,
    ...(scope.subjectId ? { subjectId: scope.subjectId } : {}),
    ...(publish ? { publishedAt: null } : { publishedAt: { not: null } }),
  };
  const r = await prisma.grade.updateMany({ where, data: { publishedAt: publish ? new Date() : null } });
  return r.count;
}

/** Per-subject status for a class and term: how many results are entered and published. */
export async function termStatus(classId: string, academicSession: string, term: string) {
  const [subjects, grades, studentCount] = await Promise.all([
    prisma.classSubject.findMany({ where: { classId }, select: { subject: { select: { id: true, name: true } } } }),
    prisma.grade.findMany({ where: { classId, academicSession, term }, select: { subjectId: true, publishedAt: true } }),
    prisma.student.count({ where: { classId, status: "ACTIVE" } }),
  ]);
  return {
    studentCount,
    subjects: subjects
      .map((cs) => {
        const mine = grades.filter((g) => g.subjectId === cs.subject.id);
        return {
          subjectId: cs.subject.id,
          subjectName: cs.subject.name,
          entered: mine.length,
          published: mine.filter((g) => g.publishedAt).length,
        };
      })
      .sort((a, b) => a.subjectName.localeCompare(b.subjectName)),
  };
}
