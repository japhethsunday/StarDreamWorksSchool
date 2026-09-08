import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { examQuestionSchema, type CreateExamQuestionInput } from "@/lib/validations";
import { totalMarksFromQuestions } from "@/lib/exams";
import { logActivity, clientIp } from "@/lib/activity";

async function authorizedTeacher() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { error: NextResponse.json({ success: false, error: "Unauthorized. Please login." }, { status: 401 }) };
  }
  if ((session.user as any).role !== "TEACHER") {
    return { error: NextResponse.json({ success: false, error: "Forbidden. Teacher access required." }, { status: 403 }) };
  }
  const teacher = await prisma.teacher.findUnique({ where: { userId: (session.user as any).id } });
  if (!teacher) return { error: NextResponse.json({ success: false, error: "Teacher profile not found." }, { status: 404 }) };
  return { session, teacher };
}

// Ensures the exam belongs to the teacher before any read/write.
async function findOwnedExam(id: string, teacherId: string) {
  const exam = await prisma.exam.findUnique({
    where: { id },
    include: { class: true, subject: true },
  });
  if (!exam) return { error: NextResponse.json({ success: false, error: "Examination not found." }, { status: 404 }) };
  if (exam.teacherId !== teacherId) {
    return { error: NextResponse.json({ success: false, error: "Forbidden. Not your examination." }, { status: 403 }) };
  }
  return { exam };
}

// Flattens question + options for the API (hides isCorrect unless requested).
function flattenQuestions(questions: any[], exposeAnswers: boolean) {
  return questions.map((q) => ({
    id: q.id,
    type: q.type,
    question: q.question,
    marks: q.marks,
    guidance: q.guidance,
    position: q.position,
    correctAnswer: exposeAnswers ? (q.type === "TRUE_FALSE" ? (q.correctAnswer === "true" ? "true" : "false") : q.correctAnswer) : undefined,
    options: q.options.map((o: any) => ({
      key: o.key,
      text: o.text,
      isCorrect: exposeAnswers ? o.isCorrect : false,
    })),
  }));
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authorizedTeacher();
    if (auth.error || !auth.session || !auth.teacher) return auth.error!;
    const { teacher } = auth;

    const owned = await findOwnedExam(params.id, teacher.id);
    if (owned.error || !owned.exam) return owned.error!;

    const url = new URL(req.url);
    const includeAnswers = url.searchParams.get("answers") === "1";

    const questions = await prisma.examQuestion.findMany({
      where: { examId: params.id },
      orderBy: { position: "asc" },
      include: { options: true },
    });

    const attempts = includeAnswers
      ? await prisma.examAttempt.findMany({
          where: { examId: params.id },
          include: {
            answers: true,
            student: {
              select: { id: true, firstName: true, lastName: true, studentId: true, user: { select: { name: true, email: true } } },
            },
            result: true,
          },
          orderBy: { startedAt: "asc" },
        })
      : await prisma.examAttempt.findMany({
          where: { examId: params.id },
          select: {
            id: true,
            attemptNumber: true,
            startedAt: true,
            submittedAt: true,
            status: true,
            totalScore: true,
            percentage: true,
            passed: true,
            autoScore: true,
            manualScore: true,
            student: { select: { id: true, firstName: true, lastName: true, studentId: true } },
          },
          orderBy: { startedAt: "asc" },
        });

    const assignments = await prisma.examAssignment.findMany({
      where: { examId: params.id },
      select: { studentId: true },
    });

    const data = {
      exam: {
        id: owned.exam.id,
        title: owned.exam.title,
        description: owned.exam.description,
        instructions: owned.exam.instructions,
        classId: owned.exam.classId,
        className: owned.exam.class.name,
        classLevel: owned.exam.class.level,
        subjectId: owned.exam.subjectId,
        subjectName: owned.exam.subject.name,
        academicSession: owned.exam.academicSession,
        term: owned.exam.term,
        startAt: owned.exam.startAt,
        endAt: owned.exam.endAt,
        durationMinutes: owned.exam.durationMinutes,
        totalMarks: owned.exam.totalMarks,
        passMark: owned.exam.passMark,
        maxAttempts: owned.exam.maxAttempts,
        status: owned.exam.status,
        restrictToAssigned: owned.exam.restrictToAssigned,
        showResults: owned.exam.showResults,
        allowAnswerReview: owned.exam.allowAnswerReview,
        shuffleQuestions: owned.exam.shuffleQuestions,
        publishedAt: owned.exam.publishedAt,
      },
      questions: flattenQuestions(questions, false).sort((a, b) => a.position - b.position),
      attempts,
      assignedStudentIds: assignments.map((a) => a.studentId),
      autoGradable: questions.filter((q) => ["MULTIPLE_CHOICE", "TRUE_FALSE"].includes(q.type)).length,
      written: questions.filter((q) => ["SHORT_ANSWER", "LONG_ANSWER"].includes(q.type)).length,
    };
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to load examination." }, { status: 500 });
  }
}

// Save the full question set (create/update/delete in one shot) while the exam
// is still editable (draft or scheduled with no submissions yet).
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authorizedTeacher();
    if (auth.error || !auth.session || !auth.teacher) return auth.error!;
    const { session, teacher } = auth;

    const owned = await findOwnedExam(params.id, teacher.id);
    if (owned.error || !owned.exam) return owned.error!;

    const attempts = await prisma.examAttempt.count({ where: { examId: params.id } });
    if (attempts > 0) {
      return NextResponse.json({ success: false, error: "Questions cannot be edited after students have started." }, { status: 400 });
    }

    const body = await req.json();
    const rawQuestions: CreateExamQuestionInput[] = Array.isArray(body.questions) ? body.questions : [];
    if (rawQuestions.length === 0) {
      return NextResponse.json({ success: false, error: "At least one question is required." }, { status: 400 });
    }
    if (rawQuestions.length > 200) {
      return NextResponse.json({ success: false, error: "Examination has too many questions (max 200)." }, { status: 400 });
    }

    const parsedQuestions: CreateExamQuestionInput[] = [];
    for (const q of rawQuestions) {
      const p = examQuestionSchema.safeParse(q);
      if (!p.success) return NextResponse.json({ success: false, error: p.error.issues[0]?.message || "Invalid question." }, { status: 400 });
      parsedQuestions.push(p.data);
    }

    // Validate options for multiple choice
    for (const q of parsedQuestions) {
      if (q.type === "MULTIPLE_CHOICE") {
        if (!q.options || q.options.length < 2) {
          return NextResponse.json({ success: false, error: "Multiple choice questions need at least two options." }, { status: 400 });
        }
        if (!q.correctAnswer && !q.options.some((o) => o.isCorrect)) {
          return NextResponse.json({ success: false, error: `Question "${q.question}" needs a correct answer.` }, { status: 400 });
        }
      }
      if (q.type === "TRUE_FALSE") {
        if (q.correctAnswer !== "true" && q.correctAnswer !== "false") {
          return NextResponse.json({ success: false, error: `True/False question "${q.question}" needs a correct answer.` }, { status: 400 });
        }
      }
    }

    const existing = await prisma.examQuestion.findMany({ where: { examId: params.id }, select: { id: true } });
    const existingIds = new Set(existing.map((e) => e.id));

    // NOTE: interactive $transaction(async tx => ...) is NOT used here because
    // Supabase's pgbouncer (transaction-mode pooling) routes each statement to a
    // different backend connection, which makes interactive transactions fail
    // intermittently with "Transaction not found." Sequence the writes instead.
    let position = 0;
    for (const q of parsedQuestions) {
      const payload: any = {
        type: q.type,
        question: q.question,
        marks: q.marks,
        guidance: q.guidance ?? null,
        correctAnswer:
          q.type === "MULTIPLE_CHOICE"
            ? (q.correctAnswer ?? q.options?.find((o) => o.isCorrect)?.key ?? null)
            : q.type === "TRUE_FALSE"
            ? q.correctAnswer
            : null,
      };
      if (q.id && existingIds.has(q.id)) {
        const qid = q.id;
        await prisma.examQuestion.update({ where: { id: qid }, data: payload });
        await prisma.examQuestionOption.deleteMany({ where: { questionId: qid } });
        if (q.type === "MULTIPLE_CHOICE" && q.options) {
          await prisma.examQuestionOption.createMany({
            data: q.options.map((o) => ({ questionId: qid, key: o.key, text: o.text, isCorrect: o.isCorrect })),
          });
        }
        await prisma.examQuestion.update({ where: { id: qid }, data: { position } });
        existingIds.delete(qid);
      } else {
        const created = await prisma.examQuestion.create({
          data: {
            examId: params.id,
            ...payload,
            position,
            ...(q.type === "MULTIPLE_CHOICE" && q.options
              ? { options: { create: q.options.map((o) => ({ key: o.key, text: o.text, isCorrect: o.isCorrect })) } }
              : {}),
          },
        });
        void created;
      }
      position += 1;
    }
    // Delete questions removed by the teacher
    if (existingIds.size) {
      await prisma.examQuestion.deleteMany({ where: { id: { in: [...existingIds] } } });
    }
    const questions = await prisma.examQuestion.findMany({ where: { examId: params.id }, select: { marks: true } });
    const total = totalMarksFromQuestions(questions);
    await prisma.exam.update({ where: { id: params.id }, data: { totalMarks: total } });
    const result = { totalMarks: total };

    await logActivity((session.user as any).id, "UPDATE_EXAM_QUESTIONS", `Updated questions for "${owned.exam.title}" (${parsedQuestions.length})`, clientIp(req)).catch(() => {});

    return NextResponse.json({ success: true, data: { totalMarks: result.totalMarks } });
  } catch (e) {
    console.error("UPDATE_QUESTIONS_ERR", (e as Error)?.message, (e as Error)?.stack);
    return NextResponse.json({ success: false, error: "Failed to save questions." }, { status: 500 });
  }
}