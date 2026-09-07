import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { logActivity, clientIp } from "@/lib/activity";
import { sendExamResultEmail } from "@/lib/email/notifications";

async function authorizedTeacher() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: NextResponse.json({ success: false, error: "Unauthorized. Please login." }, { status: 401 }) };
  if ((session.user as any).role !== "TEACHER") {
    return { error: NextResponse.json({ success: false, error: "Forbidden. Teacher access required." }, { status: 403 }) };
  }
  const teacher = await prisma.teacher.findUnique({ where: { userId: (session.user as any).id } });
  if (!teacher) return { error: NextResponse.json({ success: false, error: "Teacher profile not found." }, { status: 404 }) };
  return { session, teacher };
}

export async function GET(
  req: Request,
  { params }: { params: { id: string; attemptId: string } }
) {
  try {
    const auth = await authorizedTeacher();
    if (auth.error || !auth.session || !auth.teacher) return auth.error!;
    const { teacher } = auth;

    const exam = await prisma.exam.findFirst({
      where: { id: params.id, teacherId: teacher.id },
      include: { subject: { select: { name: true } }, class: { select: { name: true } } },
    });
    if (!exam) {
      return NextResponse.json({ success: false, error: "Examination not found or not yours." }, { status: 404 });
    }

    const attempt = await prisma.examAttempt.findUnique({
      where: { id: params.attemptId },
      include: {
        answers: true,
        student: {
          select: { id: true, firstName: true, lastName: true, studentId: true, user: { select: { name: true, email: true } } },
        },
        result: true,
      },
    });
    if (!attempt || attempt.examId !== params.id) {
      return NextResponse.json({ success: false, error: "Attempt not found." }, { status: 404 });
    }

    const questions = await prisma.examQuestion.findMany({
      where: { examId: params.id },
      orderBy: { position: "asc" },
      include: { options: true },
    });

    const questionById = new Map(questions.map((q) => [q.id, q]));
    const answerRows = attempt.answers.map((a) => {
      const q = questionById.get(a.questionId);
      return {
        questionId: a.questionId,
        type: a.questionType,
        marks: a.questionMarks,
        question: q?.question ?? null,
        options: q?.options ?? [],
        correctAnswer:
          a.questionType === "TRUE_FALSE"
            ? q?.correctAnswer === "true" ? "true" : "false"
            : a.questionType === "MULTIPLE_CHOICE"
            ? (q?.correctAnswer ?? q?.options.find((o) => o.isCorrect)?.key)
            : null,
        selectedKey: a.selectedKey,
        textValue: a.textValue,
        isCorrect: a.isCorrect,
        awardedMarks: a.awardedMarks,
        feedback: a.feedback,
        gradedBy: a.gradedBy,
        gradedAt: a.gradedAt,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        attempt: {
          id: attempt.id,
          attemptNumber: attempt.attemptNumber,
          startedAt: attempt.startedAt,
          submittedAt: attempt.submittedAt,
          expiresAt: attempt.expiresAt,
          status: attempt.status,
          autoScore: attempt.autoScore,
          manualScore: attempt.manualScore,
          totalScore: attempt.totalScore,
          percentage: attempt.percentage,
          passed: attempt.passed,
          student: attempt.student,
          result: attempt.result,
        },
        exam: {
          id: exam.id,
          title: exam.title,
          subjectName: exam.subject.name,
          className: exam.class.name,
          totalMarks: exam.totalMarks,
          passMark: exam.passMark,
        },
        answers: answerRows,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to load submission." }, { status: 500 });
  }
}

// Teacher grades the written answers of a submitted attempt. Updates per-answer
// awardedMarks + feedback, then recomputes the attempt's final score and result.
export async function PUT(
  req: Request,
  { params }: { params: { id: string; attemptId: string } }
) {
  try {
    const auth = await authorizedTeacher();
    if (auth.error || !auth.session || !auth.teacher) return auth.error!;
    const { session, teacher } = auth;

    const exam = await prisma.exam.findFirst({
      where: { id: params.id, teacherId: teacher.id },
      include: { class: true, subject: true },
    });
    if (!exam) return NextResponse.json({ success: false, error: "Examination not found or not yours." }, { status: 404 });

    const attempt = await prisma.examAttempt.findUnique({
      where: { id: params.attemptId },
      include: { answers: true },
    });
    if (!attempt || attempt.examId !== params.id) {
      return NextResponse.json({ success: false, error: "Attempt not found." }, { status: 404 });
    }
    if (attempt.status !== "SUBMITTED") {
      return NextResponse.json({ success: false, error: "Only submitted attempts can be graded." }, { status: 400 });
    }

    const body = await req.json();
    const gradedAnswers: Record<string, { awardedMarks: number; feedback?: string }> = body.answers ?? {};
    const teacherFeedback: string | null = body.feedback ?? null;

    const questionRows = await prisma.examQuestion.findMany({
      where: { examId: params.id },
      select: { id: true, marks: true, type: true },
    });
    const markMap = new Map(questionRows.map((q) => [q.id, q.marks]));

    let manualTotal = 0;
    const writes: Array<any> = [];

    for (const answer of attempt.answers) {
      const isWritten = !["MULTIPLE_CHOICE", "TRUE_FALSE"].includes(answer.questionType);
      let awarded = answer.awardedMarks ?? 0;
      let feedback = answer.feedback ?? null;
      if (isWritten) {
        const g = gradedAnswers[answer.questionId];
        if (g) {
          const max = markMap.get(answer.questionId) ?? answer.questionMarks;
          awarded = Math.max(0, Math.min(Number(g.awardedMarks) || 0, max));
          feedback = typeof g.feedback === "string" ? g.feedback : feedback;
          writes.push({
            where: { id: answer.id },
            data: { awardedMarks: awarded, feedback, gradedBy: (session.user as any).id, gradedAt: new Date() },
          });
        }
      }
      manualTotal += isWritten ? awarded : 0;
    }

    if (writes.length) {
      await prisma.$transaction(writes.map((w) => prisma.examAnswer.update(w)));
    }

    const totalScore = (attempt.autoScore ?? 0) + manualTotal;
    const percentage = exam.totalMarks > 0 ? Math.round((totalScore / exam.totalMarks) * 100) : 0;
    const passed = totalScore >= exam.passMark;

    const updatedAttempt = await prisma.examAttempt.update({
      where: { id: attempt.id },
      data: {
        manualScore: manualTotal,
        totalScore,
        percentage,
        passed,
        gradedAt: new Date(),
        gradedBy: (session.user as any).id,
      },
    });

    const existingResult = await prisma.examResult.findUnique({ where: { attemptId: attempt.id } });

    const result = await prisma.examResult.upsert({
      where: { attemptId: attempt.id },
      create: {
        examId: exam.id,
        attemptId: attempt.id,
        studentId: attempt.studentId,
        score: totalScore,
        totalMarks: exam.totalMarks,
        percentage,
        grade: percentage >= 70 ? "A" : percentage >= 60 ? "B" : percentage >= 50 ? "C" : percentage >= 40 ? "D" : "F",
        passed,
        teacherFeedback,
        ...(exam.showResults ? { releasedAt: new Date() } : {}),
      },
      update: {
        score: totalScore,
        totalMarks: exam.totalMarks,
        percentage,
        grade: percentage >= 70 ? "A" : percentage >= 60 ? "B" : percentage >= 50 ? "C" : percentage >= 40 ? "D" : "F",
        passed,
        teacherFeedback,
        releasedAt: existingResult?.releasedAt ?? (exam.showResults ? new Date() : undefined),
      },
    });

    await logActivity((session.user as any).id, "GRADE_EXAM", `Graded ${exam.title} for ${attempt.studentId}`, clientIp(req));

    // Notify the student/parents if results are visible.
    if (exam.showResults) {
      await sendExamResultEmail({
        examId: exam.id,
        title: exam.title,
        subjectName: exam.subject.name,
        studentId: attempt.studentId,
        score: totalScore,
        totalMarks: exam.totalMarks,
        percentage,
        grade: result.grade,
        passed,
      });
    }

    return NextResponse.json({ success: true, data: { attempt: updatedAttempt, result } });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to grade examination." }, { status: 500 });
  }
}