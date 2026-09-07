import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { effectiveStatus, gradeAuto } from "@/lib/exams";
import { sendExamSubmittedEmail } from "@/lib/email/notifications";

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

// Fetch the exam + questions for the authorized student, applying server-side
// authorization (class + assignment allow-list) and only exposing the data the
// student is allowed to see (never isCorrect during the exam).
async function getStudentExam(examId: string, student: { id: string; classId: string | null }) {
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: { subject: true, class: true },
  });
  if (!exam) return { error: NextResponse.json({ success: false, error: "Examination not found." }, { status: 404 }) };
  if (exam.classId !== student.classId) {
    return { error: NextResponse.json({ success: false, error: "Examination not assigned to your class." }, { status: 403 }) };
  }
  const eff = effectiveStatus(exam.status, exam.startAt, exam.endAt);
  if (eff !== "ACTIVE") {
    return { error: NextResponse.json({ success: false, error: "Examination is not open." }, { status: 403 }) };
  }
  if (exam.restrictToAssigned) {
    const assigned = await prisma.examAssignment.findUnique({
      where: { examId_studentId: { examId, studentId: student.id } },
    });
    if (!assigned) {
      return { error: NextResponse.json({ success: false, error: "Examination not assigned to you." }, { status: 403 }) };
    }
  }
  return { exam, eff };
}

// Safely count existing attempts for a student on an exam.
async function attemptCount(examId: string, studentId: string) {
  return prisma.examAttempt.count({ where: { examId, studentId } });
}

// Resolve the student's current live attempt (IN_PROGRESS), if any.
async function currentAttempt(examId: string, studentId: string) {
  return prisma.examAttempt.findFirst({
    where: { examId, studentId, status: { in: ["IN_PROGRESS", "TIMED_OUT"] } },
    orderBy: { startedAt: "desc" },
  });
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authorizedStudent();
    if (auth.error || !auth.session || !auth.student) return auth.error!;
    const { student } = auth;

    const owned = await getStudentExam(params.id, student);
    if (owned.error || !owned.exam) return owned.error!;
    const exam = owned.exam;

    const attempt = await currentAttempt(params.id, student.id);

    const questions = await prisma.examQuestion.findMany({
      where: { examId: params.id },
      orderBy: { position: "asc" },
      include: { options: true },
    });

    // Never leak correct answers to the student (during or after the exam,
    // unless the result view is explicitly enabled and returned elsewhere).
    const questionData = questions.map((q) => ({
      id: q.id,
      type: q.type,
      question: q.question,
      marks: q.marks,
      guidance: q.guidance,
      position: q.position,
      options: q.options.map((o) => ({ key: o.key, text: o.text })),
    }));

    let saved: Record<string, { selectedKey?: string | null; textValue?: string | null }> = {};
    if (attempt) {
      const answers = await prisma.examAnswer.findMany({
        where: { attemptId: attempt.id },
        select: { questionId: true, selectedKey: true, textValue: true },
      });
      saved = Object.fromEntries(answers.map((a) => [a.questionId, { selectedKey: a.selectedKey, textValue: a.textValue }]));
    }

    return NextResponse.json({
      success: true,
      data: {
        exam: {
          id: exam.id,
          title: exam.title,
          subjectName: exam.subject.name,
          className: exam.class.name,
          instructions: exam.instructions,
          durationMinutes: exam.durationMinutes,
          totalMarks: exam.totalMarks,
          questionsCount: questions.length,
          shuffleQuestions: exam.shuffleQuestions,
        },
        questions: questionData,
        attempt: attempt
          ? {
              id: attempt.id,
              attemptNumber: attempt.attemptNumber,
              startedAt: attempt.startedAt,
              expiresAt: attempt.expiresAt,
              status: attempt.status,
              lastSavedAt: attempt.lastSavedAt,
            }
          : null,
        savedAnswers: saved,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to load examination." }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authorizedStudent();
    if (auth.error || !auth.session || !auth.student) return auth.error!;
    const { student } = auth;

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "start";

    const owned = await getStudentExam(params.id, student);
    if (owned.error || !owned.exam) return owned.error!;
    const exam = owned.exam;

    // ---- START ----
    if (action === "start") {
      const count = await attemptCount(params.id, student.id);
      if (count >= exam.maxAttempts) {
        return NextResponse.json({ success: false, error: "You have no attempts remaining for this examination." }, { status: 400 });
      }
      const live = await currentAttempt(params.id, student.id);
      if (live && live.status === "IN_PROGRESS") {
        return NextResponse.json({ success: true, data: { attemptId: live.id, message: "attempt_exists" } });
      }

      const startedAt = new Date();
      const expiresAt = new Date(startedAt.getTime() + exam.durationMinutes * 60 * 1000);

      const attempt = await prisma.examAttempt.create({
        data: {
          examId: params.id,
          studentId: student.id,
          attemptNumber: count + 1,
          startedAt,
          expiresAt,
          status: "IN_PROGRESS",
        },
      });

      return NextResponse.json({ success: true, data: { attemptId: attempt.id, expiresAt, durationMinutes: exam.durationMinutes, attemptNumber: attempt.attemptNumber } }, { status: 201 });
    }

    // ---- SUBMIT ----
    if (action === "submit") {
      const attempt = await currentAttempt(params.id, student.id);
      if (!attempt) {
        // Check if there's already a completed attempt (SUBMITTED/TIMED_OUT/ABANDONED)
        const completed = await prisma.examAttempt.findFirst({
          where: { examId: params.id, studentId: student.id, status: { in: ["SUBMITTED", "TIMED_OUT", "ABANDONED"] } },
          orderBy: { startedAt: "desc" },
        });
        if (completed) {
          return NextResponse.json({ success: false, error: "Examination already submitted." }, { status: 400 });
        }
        return NextResponse.json({ success: false, error: "No active examination found." }, { status: 404 });
      }
      if (attempt.status === "SUBMITTED") {
        return NextResponse.json({ success: false, error: "Examination already submitted." }, { status: 400 });
      }

      const body = await req.json();
      const submitted: Record<string, { selectedKey?: string; textValue?: string }> = body.answers ?? {};

      // Server-side time validation: allow submit if within the exam window AND
      // within the attempt's expiry (with a small server-clock tolerance).
      const now = Date.now();
      const withinWindow = now <= new Date(exam.endAt).getTime();
      const withinTry = now <= new Date(attempt.expiresAt).getTime() + 30 * 1000;
      if (!withinWindow || !withinTry) {
        // Time up: mark timed out, then fall through to grade what was saved.
        await prisma.examAttempt.update({ where: { id: attempt.id }, data: { status: "TIMED_OUT", submittedAt: new Date() } });
      }

      // Merge the submitted payload with anything already auto-saved so no
      // answers are lost if the client omitted questions on submit.
      const previouslySaved = await prisma.examAnswer.findMany({
        where: { attemptId: attempt.id },
        select: { questionId: true, selectedKey: true, textValue: true },
      });
      const answers: Record<string, { selectedKey?: string; textValue?: string }> = { ...submitted };
      for (const prev of previouslySaved) {
        if (!answers[prev.questionId]) {
          answers[prev.questionId] = { selectedKey: prev.selectedKey ?? undefined, textValue: prev.textValue ?? undefined };
        }
      }

      // Load the latest question set for grading.
      const questions = await prisma.examQuestion.findMany({
        where: { examId: params.id },
        orderBy: { position: "asc" },
        include: { options: true },
      });

      const graded = gradeAuto(questions as any, answers);

      // Build answer writes (upsert on attemptId+questionId).
      const writes = graded.answers.map((a) => ({
        where: { attemptId_questionId: { attemptId: attempt.id, questionId: a.questionId } },
        create: {
          attemptId: attempt.id,
          questionId: a.questionId,
          questionType: a.questionType,
          questionMarks: a.questionMarks,
          selectedKey: a.selectedKey ?? null,
          textValue: a.textValue ?? null,
          isCorrect: a.isCorrect ?? null,
          awardedMarks: a.awardedMarks ?? 0,
        },
        update: {
          questionType: a.questionType,
          questionMarks: a.questionMarks,
          selectedKey: a.selectedKey ?? null,
          textValue: a.textValue ?? null,
          isCorrect: a.isCorrect ?? null,
          awardedMarks: a.awardedMarks ?? 0,
        },
      }));

      await prisma.$transaction(writes.map((w) => prisma.examAnswer.upsert(w)));

      // Use the autoScore computed by gradeAuto directly. Re-reading from DB
      // after a $transaction can return stale data when Supabase pgbouncer
      // uses transaction-mode pooling (different backend connection for the read).
      const finalStatus = withinWindow && withinTry ? "SUBMITTED" : "TIMED_OUT";
      await prisma.examAttempt.update({
        where: { id: attempt.id },
        data: { autoScore: graded.autoScore, submittedAt: new Date(), status: finalStatus },
      });

      await sendExamSubmittedEmail({
        examId: params.id,
        attemptId: attempt.id,
        title: exam.title,
        subjectName: exam.subject.name,
        studentId: student.id,
        autoScore: graded.autoScore,
        totalMarks: exam.totalMarks,
      });

      return NextResponse.json({ success: true, data: { attemptId: attempt.id, status: finalStatus, autoScore: graded.autoScore, totalMarks: exam.totalMarks } });
    }

    return NextResponse.json({ success: false, error: "Unknown action." }, { status: 400 });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to process examination." }, { status: 500 });
  }
}