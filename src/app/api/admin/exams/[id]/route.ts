import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { permissionResponse } from "@/lib/permissions";
import { examQuestionSchema, type CreateExamQuestionInput } from "@/lib/validations";
import { totalMarksFromQuestions } from "@/lib/exams";
import { logActivity, clientIp } from "@/lib/activity";
import { sendExamPublishedEmails } from "@/lib/email/notifications";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized. Please login." }, { status: 401 });
    if ((session.user as any).role !== "ADMIN") return NextResponse.json({ success: false, error: "Forbidden. Admin access required." }, { status: 403 });
    const perm = await permissionResponse("MANAGE_EXAMS");
    if (perm) return perm;

    const exam = await prisma.exam.findUnique({
      where: { id: params.id },
      include: { class: true, subject: true, teacher: true },
    });
    if (!exam) return NextResponse.json({ success: false, error: "Examination not found." }, { status: 404 });

    const questions = await prisma.examQuestion.findMany({
      where: { examId: params.id },
      orderBy: { position: "asc" },
      include: { options: true },
    });

    const attempts = await prisma.examAttempt.findMany({
      where: { examId: params.id },
      include: { student: { select: { id: true, firstName: true, lastName: true, studentId: true, user: { select: { name: true, email: true } } } } },
      orderBy: { startedAt: "asc" },
    });

    const assignments = await prisma.examAssignment.findMany({
      where: { examId: params.id },
      select: { studentId: true },
    });

    const results = await prisma.examResult.findMany({
      where: { examId: params.id },
      include: { student: { select: { id: true, firstName: true, lastName: true, studentId: true, user: { select: { name: true, email: true } } } } },
      orderBy: { percentage: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: {
        exam: {
          id: exam.id,
          title: exam.title,
          description: exam.description,
          instructions: exam.instructions,
          classId: exam.classId,
          className: exam.class.name,
          subjectId: exam.subjectId,
          subjectName: exam.subject.name,
          teacherName: exam.teacher ? `${exam.teacher.firstName} ${exam.teacher.lastName}` : null,
          academicSession: exam.academicSession,
          term: exam.term,
          startAt: exam.startAt,
          endAt: exam.endAt,
          durationMinutes: exam.durationMinutes,
          totalMarks: exam.totalMarks,
          passMark: exam.passMark,
          maxAttempts: exam.maxAttempts,
          status: exam.status,
          restrictToAssigned: exam.restrictToAssigned,
          showResults: exam.showResults,
          allowAnswerReview: exam.allowAnswerReview,
          shuffleQuestions: exam.shuffleQuestions,
          publishedAt: exam.publishedAt,
        },
        questions: questions.map((q) => ({
          id: q.id,
          type: q.type,
          question: q.question,
          marks: q.marks,
          guidance: q.guidance,
          correctAnswer: q.type === "TRUE_FALSE" ? (q.correctAnswer === "true" ? "true" : "false") : q.correctAnswer,
          options: q.options.map((o) => ({ key: o.key, text: o.text, isCorrect: o.isCorrect })),
        })),
        attempts: attempts.map((a) => ({
          id: a.id,
          attemptNumber: a.attemptNumber,
          startedAt: a.startedAt,
          submittedAt: a.submittedAt,
          status: a.status,
          autoScore: a.autoScore,
          manualScore: a.manualScore,
          totalScore: a.totalScore,
          percentage: a.percentage,
          passed: a.passed,
          studentName: `${a.student.firstName} ${a.student.lastName}`,
          studentId: a.student.studentId,
        })),
        results: results.map((r) => ({
          id: r.id,
          studentName: `${r.student.firstName} ${r.student.lastName}`,
          studentId: r.student.studentId,
          score: r.score,
          percentage: r.percentage,
          grade: r.grade,
          passed: r.passed,
          releasedAt: r.releasedAt,
        })),
        assignedStudentIds: assignments.map((a) => a.studentId),
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to load examination." }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized. Please login." }, { status: 401 });
    if ((session.user as any).role !== "ADMIN") return NextResponse.json({ success: false, error: "Forbidden. Admin access required." }, { status: 403 });
    const perm = await permissionResponse("MANAGE_EXAMS");
    if (perm) return perm;

    const exam = await prisma.exam.findUnique({ where: { id: params.id } });
    if (!exam) return NextResponse.json({ success: false, error: "Examination not found." }, { status: 404 });

    const body = await req.json();

    // Question-set save (same behavior as teacher).
    if (Array.isArray(body.questions)) {
      const attempts = await prisma.examAttempt.count({ where: { examId: params.id } });
      if (attempts > 0) {
        return NextResponse.json({ success: false, error: "Questions cannot be edited after students have started." }, { status: 400 });
      }
      const rawQuestions: CreateExamQuestionInput[] = body.questions;
      if (rawQuestions.length === 0) return NextResponse.json({ success: false, error: "At least one question is required." }, { status: 400 });
      const parsed: CreateExamQuestionInput[] = [];
      for (const q of rawQuestions) {
        const p = examQuestionSchema.safeParse(q);
        if (!p.success) return NextResponse.json({ success: false, error: p.error.issues[0]?.message || "Invalid question." }, { status: 400 });
        parsed.push(p.data);
      }
      for (const q of parsed) {
        if (q.type === "MULTIPLE_CHOICE") {
          if (!q.options || q.options.length < 2) return NextResponse.json({ success: false, error: "Multiple choice questions need at least two options." }, { status: 400 });
          if (!q.correctAnswer && !q.options.some((o) => o.isCorrect)) return NextResponse.json({ success: false, error: `Question "${q.question}" needs a correct answer.` }, { status: 400 });
        }
        if (q.type === "TRUE_FALSE" && q.correctAnswer !== "true" && q.correctAnswer !== "false") {
          return NextResponse.json({ success: false, error: `True/False question "${q.question}" needs a correct answer.` }, { status: 400 });
        }
      }
      const existing = await prisma.examQuestion.findMany({ where: { examId: params.id }, select: { id: true } });
      const existingIds = new Set(existing.map((e) => e.id));
      const total = await prisma.$transaction(async (tx) => {
        let position = 0;
        for (const q of parsed) {
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
            position,
          };
          if (q.id && existingIds.has(q.id)) {
            const qid = q.id;
            // eslint-disable-next-line no-await-in-loop
            await tx.examQuestion.update({ where: { id: qid }, data: payload });
            // eslint-disable-next-line no-await-in-loop
            await tx.examQuestionOption.deleteMany({ where: { questionId: qid } });
            if (q.type === "MULTIPLE_CHOICE" && q.options) {
              // eslint-disable-next-line no-await-in-loop
              await tx.examQuestionOption.createMany({ data: q.options.map((o) => ({ questionId: qid, key: o.key, text: o.text, isCorrect: o.isCorrect })) });
            }
            existingIds.delete(qid);
          } else {
            // eslint-disable-next-line no-await-in-loop
            await tx.examQuestion.create({
              data: {
                examId: params.id,
                ...payload,
                ...(q.type === "MULTIPLE_CHOICE" && q.options
                  ? { options: { create: q.options.map((o) => ({ key: o.key, text: o.text, isCorrect: o.isCorrect })) } }
                  : {}),
              },
            });
          }
          position += 1;
        }
        if (existingIds.size) await tx.examQuestion.deleteMany({ where: { id: { in: [...existingIds] } } });
        const questions = await tx.examQuestion.findMany({ where: { examId: params.id }, select: { marks: true } });
        const t = totalMarksFromQuestions(questions);
        await tx.exam.update({ where: { id: params.id }, data: { totalMarks: t } });
        return t;
      });
      await logActivity((session.user as any).id, "UPDATE_EXAM_QUESTIONS", `Updated questions for "${exam.title}"`, clientIp(req));
      return NextResponse.json({ success: true, data: { totalMarks: total } });
    }

    // Meta update (schedule fields, status, visibility, assignment list).
    const meta = body;
    const patch: any = {};
    if (meta.title !== undefined) patch.title = meta.title;
    if (meta.description !== undefined) patch.description = meta.description;
    if (meta.instructions !== undefined) patch.instructions = meta.instructions;
    if (meta.classId !== undefined) patch.classId = meta.classId;
    if (meta.subjectId !== undefined) patch.subjectId = meta.subjectId;
    if (meta.teacherId !== undefined) patch.teacherId = meta.teacherId || null;
    if (meta.academicSession !== undefined) patch.academicSession = meta.academicSession;
    if (meta.term !== undefined) patch.term = meta.term;
    if (meta.startAt !== undefined) patch.startAt = new Date(meta.startAt);
    if (meta.endAt !== undefined) patch.endAt = new Date(meta.endAt);
    if (meta.durationMinutes !== undefined) patch.durationMinutes = Number(meta.durationMinutes);
    if (meta.passMark !== undefined) patch.passMark = Number(meta.passMark);
    if (meta.maxAttempts !== undefined) patch.maxAttempts = Number(meta.maxAttempts);
    if (meta.restrictToAssigned !== undefined) patch.restrictToAssigned = Boolean(meta.restrictToAssigned);
    if (meta.showResults !== undefined) patch.showResults = Boolean(meta.showResults);
    if (meta.allowAnswerReview !== undefined) patch.allowAnswerReview = Boolean(meta.allowAnswerReview);
    if (meta.shuffleQuestions !== undefined) patch.shuffleQuestions = Boolean(meta.shuffleQuestions);
    if (meta.status !== undefined) {
      const allowed = ["DRAFT", "SCHEDULED", "ACTIVE", "COMPLETED", "ARCHIVED"];
      if (!allowed.includes(meta.status)) return NextResponse.json({ success: false, error: "Invalid status." }, { status: 400 });
      patch.status = meta.status;
      if (meta.status === "SCHEDULED" && !exam.publishedAt) patch.publishedAt = new Date();
      if (meta.status === "DRAFT") patch.publishedAt = null;
    }

    const updated = await prisma.exam.update({ where: { id: params.id }, data: patch });

    if (Array.isArray(meta.assignedStudentIds)) {
      await prisma.examAssignment.deleteMany({ where: { examId: params.id } });
      if (meta.assignedStudentIds.length) {
        await prisma.examAssignment.createMany({
          data: meta.assignedStudentIds.map((studentId: string) => ({ examId: params.id, studentId })),
          skipDuplicates: true,
        });
      }
    }

    await logActivity((session.user as any).id, "UPDATE_EXAM", `Updated examination "${updated.title}"`, clientIp(req));
    return NextResponse.json({ success: true, data: { id: params.id } });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to update examination." }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized. Please login." }, { status: 401 });
    if ((session.user as any).role !== "ADMIN") return NextResponse.json({ success: false, error: "Forbidden. Admin access required." }, { status: 403 });
    const perm = await permissionResponse("MANAGE_EXAMS");
    if (perm) return perm;

    const exam = await prisma.exam.findUnique({ where: { id: params.id } });
    if (!exam) return NextResponse.json({ success: false, error: "Examination not found." }, { status: 404 });

    const { action } = await req.json();
    const validActions = ["publish", "unpublish", "archive", "activate", "showResults"];
    if (!validActions.includes(action)) {
      return NextResponse.json({ success: false, error: "Unknown action." }, { status: 400 });
    }

    // Result visibility: release (or hide) all graded results for the exam.
    if (action === "showResults") {
      const { showResults, allowAnswerReview } = await req.json();
      const updated = await prisma.exam.update({
        where: { id: params.id },
        data: { showResults: Boolean(showResults), allowAnswerReview: Boolean(allowAnswerReview) },
      });
      if (showResults) {
        const results = await prisma.examResult.findMany({
          where: { examId: params.id, releasedAt: null },
          select: { id: true },
        });
        if (results.length) {
          await prisma.examResult.updateMany({
            where: { id: { in: results.map((r) => r.id) } },
            data: { releasedAt: new Date() },
          });
        }
      } else {
        await prisma.examResult.updateMany({ where: { examId: params.id }, data: { releasedAt: null } });
      }
      await logActivity((session.user as any).id, "UPDATE_EXAM", `Updated result visibility for "${updated.title}"`, clientIp(req));
      return NextResponse.json({ success: true, data: { id: params.id } });
    }

    const statusFor = (a: string) =>
      a === "publish" ? "SCHEDULED" : a === "unpublish" ? "DRAFT" : a === "archive" ? "ARCHIVED" : "ACTIVE";
    const updated = await prisma.exam.update({ where: { id: params.id }, data: { status: statusFor(action) } });

    if (action === "publish") {
      await prisma.exam.update({ where: { id: params.id }, data: { publishedAt: new Date() } });
      await sendExamPublishedEmails({
        id: params.id,
        title: updated.title,
        subjectName: (await prisma.subject.findUnique({ where: { id: updated.subjectId }, select: { name: true } }))?.name ?? "",
        className: (await prisma.class.findUnique({ where: { id: updated.classId }, select: { name: true } }))?.name ?? "",
        startAt: updated.startAt.toISOString(),
        endAt: updated.endAt.toISOString(),
        durationMinutes: updated.durationMinutes,
      });
    }
    if (action === "unpublish") await prisma.exam.update({ where: { id: params.id }, data: { publishedAt: null } });

    await logActivity((session.user as any).id, `${action.toUpperCase()}_EXAM`, `Set examination "${exam.title}" to ${action}`, clientIp(req));
    return NextResponse.json({ success: true, data: { id: params.id, status: updated.status } });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to update examination." }, { status: 500 });
  }
}