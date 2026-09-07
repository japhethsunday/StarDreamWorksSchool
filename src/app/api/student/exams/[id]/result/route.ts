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

// Returns the released result for an exam — students may only ever see their
// own result, and only when the exam has showResults + the result is released.
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authorizedStudent();
    if (auth.error || !auth.session || !auth.student) return auth.error!;
    const { student } = auth;

    const exam = await prisma.exam.findUnique({
      where: { id: params.id },
      include: { subject: true, class: true },
    });
    if (!exam) return NextResponse.json({ success: false, error: "Examination not found." }, { status: 404 });
    if (exam.classId !== student.classId) {
      return NextResponse.json({ success: false, error: "Examination not assigned to your class." }, { status: 403 });
    }

    const result = await prisma.examResult.findFirst({
      where: { examId: params.id, studentId: student.id },
      include: { attempt: { include: { answers: true } } },
    });

    // A result row is only shown to the student once the exam has showResults
    // enabled at the time the teacher finished grading.
    if (!result || !result.releasedAt) {
      return NextResponse.json({ success: false, error: "Result not yet released." }, { status: 404 });
    }

    const answerReview = exam.allowAnswerReview;
    let details: any[] = [
      { label: "Examination", value: exam.title },
      { label: "Subject", value: exam.subject.name },
      { label: "Score", value: `${result.score} / ${result.totalMarks}` },
      { label: "Percentage", value: `${Math.round(result.percentage)}%` },
      { label: "Grade", value: result.grade ?? "—" },
      { label: "Status", value: result.passed ? "Passed" : "Did not pass" },
    ];
    if (result.teacherFeedback) {
      details.push({ label: "Feedback", value: result.teacherFeedback });
    }

    let questionReview: any[] = [];
    if (answerReview) {
      const questions = await prisma.examQuestion.findMany({
        where: { examId: params.id },
        orderBy: { position: "asc" },
        include: { options: true },
      });
      const qMap = new Map(questions.map((q) => [q.id, q]));
      questionReview = result.attempt.answers.map((a) => {
        const q = qMap.get(a.questionId);
        return {
          question: q?.question ?? null,
          type: a.questionType,
          selectedKey: a.selectedKey,
          textValue: a.textValue,
          correctAnswer:
            a.questionType === "TRUE_FALSE"
              ? q?.correctAnswer === "true" ? "true" : "false"
              : a.questionType === "MULTIPLE_CHOICE"
              ? (q?.correctAnswer ?? q?.options.find((o) => o.isCorrect)?.key)
              : null,
          options: q?.options.map((o) => ({ key: o.key, text: o.text })) ?? [],
          isCorrect: a.isCorrect,
          awardedMarks: a.awardedMarks,
          questionMarks: a.questionMarks,
          feedback: a.feedback,
        };
      });
    }

    return NextResponse.json({ success: true, data: { exam: { title: exam.title, subjectName: exam.subject.name, className: exam.class.name, showResults: exam.showResults, allowAnswerReview: answerReview }, result, details, questionReview } });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to load result." }, { status: 500 });
  }
}