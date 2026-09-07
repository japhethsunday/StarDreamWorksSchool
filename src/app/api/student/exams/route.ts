import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { refreshExamStatuses, effectiveStatus } from "@/lib/exams";

async function authorizedStudent() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { error: NextResponse.json({ success: false, error: "Unauthorized. Please login." }, { status: 401 }) };
  }
  if ((session.user as any).role !== "STUDENT") {
    return { error: NextResponse.json({ success: false, error: "Forbidden. Student access required." }, { status: 403 }) };
  }
  const student = await prisma.student.findUnique({ where: { userId: (session.user as any).id } });
  if (!student) return { error: NextResponse.json({ success: false, error: "Student profile not found." }, { status: 404 }) };
  return { session, student };
}

// Which exams a student may write: exams for their class, optionally restricted
// via ExamAssignment to an allow-list. Also show archived ones? No — students
// only see DRAFT(->SCHEDULED), SCHEDULED, ACTIVE, COMPLETED (never DRAFT/ARCHIVED).
export async function GET(req: Request) {
  try {
    const auth = await authorizedStudent();
    if (auth.error || !auth.session || !auth.student) return auth.error!;
    const { student } = auth;

    await refreshExamStatuses();

    if (!student.classId) {
      return NextResponse.json({ success: true, data: [] });
    }

    const assignments = await prisma.examAssignment.findMany({
      where: { studentId: student.id },
      select: { examId: true },
    });
    const assignedExamIds = assignments.map((a) => a.examId);

    const exams = await prisma.exam.findMany({
      where: {
        classId: student.classId,
        status: { in: ["SCHEDULED", "ACTIVE", "COMPLETED"] },
      },
      orderBy: { startAt: "asc" },
      include: {
        subject: { select: { name: true } },
        class: { select: { name: true } },
        attempts: {
          where: { studentId: student.id },
          select: {
            id: true,
            attemptNumber: true,
            submittedAt: true,
            status: true,
            totalScore: true,
            percentage: true,
            passed: true,
          },
        },
        results: {
          where: { studentId: student.id },
          select: { id: true, releasedAt: true, score: true, percentage: true, grade: true, passed: true },
        },
        _count: { select: { questions: true } },
      },
    });

    const now = Date.now();
    const data = exams
      .filter((e) => !e.restrictToAssigned || assignedExamIds.includes(e.id))
      .map((e) => {
        const eff = effectiveStatus(e.status, e.startAt, e.endAt);
        const attempt = e.attempts[0] ?? null;
        const live = e.attempts.some((a) => a.status === "IN_PROGRESS");
        const joined = e.attempts.length;
        return {
          id: e.id,
          title: e.title,
          description: e.description,
          instructions: e.instructions,
          subjectName: e.subject.name,
          className: e.class.name,
          startAt: e.startAt,
          endAt: e.endAt,
          durationMinutes: e.durationMinutes,
          totalMarks: e.totalMarks,
          passMark: e.passMark,
          maxAttempts: e.maxAttempts,
          status: e.status,
          effectiveStatus: eff,
          questionsCount: e._count.questions,
          canStart: eff === "ACTIVE" && now >= new Date(e.startAt).getTime() && !live && joined < e.maxAttempts,
          resumable: eff === "ACTIVE" && now >= new Date(e.startAt).getTime() && live,
          hasStarted: joined > 0,
          attemptsUsed: joined,
          attempt: attempt
            ? {
                id: attempt.id,
                attemptNumber: attempt.attemptNumber,
                status: attempt.status,
                totalScore: attempt.totalScore,
                percentage: attempt.percentage,
                passed: attempt.passed,
              }
            : null,
          result: e.results[0] ?? null,
          showResults: e.showResults,
          allowAnswerReview: e.allowAnswerReview,
        };
      });

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to load examinations." }, { status: 500 });
  }
}