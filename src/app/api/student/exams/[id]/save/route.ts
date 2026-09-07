import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { effectiveStatus } from "@/lib/exams";

async function authorizedStudent() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: NextResponse.json({ success: false, error: "Unauthorized. Please login." }, { status: 401 }) };
  if ((session.user as any).role !== "STUDENT") {
    return { error: NextResponse.json({ success: false, error: "Forbidden. Student access required." }, { status: 403 }) };
  }
  const student = await prisma.student.findUnique({ where: { userId: (session.user as any).id } });
  if (!student) return { error: NextResponse.json({ success: false, error: "Student profile not found." }, { status: 404 }) };
  return { session, student };
}

// Auto-save: refresh the student's in-progress answers without submitting.
// The attempt must still be live (IN_PROGRESS and not expired) — otherwise the
// server ignores the save so expired attempts cannot be tampered with.
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authorizedStudent();
    if (auth.error || !auth.session || !auth.student) return auth.error!;
    const { student } = auth;

    const attempt = await prisma.examAttempt.findFirst({
      where: { examId: params.id, studentId: student.id, status: "IN_PROGRESS" },
      orderBy: { startedAt: "desc" },
    });
    if (!attempt) {
      return NextResponse.json({ success: false, error: "No active examination found." }, { status: 404 });
    }

    const exam = await prisma.exam.findUnique({ where: { id: params.id }, select: { status: true, startAt: true, endAt: true } });
    if (!exam || effectiveStatus(exam.status, exam.startAt, exam.endAt) !== "ACTIVE") {
      return NextResponse.json({ success: false, error: "Examination is no longer open." }, { status: 400 });
    }

    if (Date.now() > new Date(attempt.expiresAt).getTime() + 30 * 1000) {
      await prisma.examAttempt.update({ where: { id: attempt.id }, data: { status: "TIMED_OUT" } });
      return NextResponse.json({ success: false, error: "Time expired." }, { status: 400 });
    }

    const body = await req.json();
    const answers: Record<string, { selectedKey?: string; textValue?: string }> = body.answers ?? {};

    const questions = await prisma.examQuestion.findMany({
      where: { examId: params.id },
      select: { id: true, type: true, marks: true },
    });

    const writes = questions.map((q) => {
      const a = answers[q.id];
      return {
        where: { attemptId_questionId: { attemptId: attempt.id, questionId: q.id } },
        create: {
          attemptId: attempt.id,
          questionId: q.id,
          questionType: q.type,
          questionMarks: q.marks,
          selectedKey: a?.selectedKey ?? null,
          textValue: a?.textValue ?? null,
        },
        update: {
          questionType: q.type,
          questionMarks: q.marks,
          selectedKey: a?.selectedKey ?? null,
          textValue: a?.textValue ?? null,
        },
      };
    });

    if (writes.length) {
      await prisma.$transaction(writes.map((w) => prisma.examAnswer.upsert(w as any)));
    }

    await prisma.examAttempt.update({ where: { id: attempt.id }, data: { lastSavedAt: new Date() } });

    return NextResponse.json({ success: true, data: { savedAt: new Date().toISOString() } });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to save answers." }, { status: 500 });
  }
}