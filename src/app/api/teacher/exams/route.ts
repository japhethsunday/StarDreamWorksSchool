import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { createExamSchema } from "@/lib/validations";
import { refreshExamStatuses } from "@/lib/exams";
import { logActivity, clientIp } from "@/lib/activity";
import { sendExamPublishedEmails, sendExamResultEmail } from "@/lib/email/notifications";

async function authorizedTeacher() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { error: NextResponse.json({ success: false, error: "Unauthorized. Please login." }, { status: 401 }) };
  }
  if ((session.user as any).role !== "TEACHER") {
    return { error: NextResponse.json({ success: false, error: "Forbidden. Teacher access required." }, { status: 403 }) };
  }
  const teacher = await prisma.teacher.findUnique({
    where: { userId: (session.user as any).id },
  });
  if (!teacher) {
    return { error: NextResponse.json({ success: false, error: "Teacher profile not found." }, { status: 404 }) };
  }
  return { session, teacher };
}

export async function GET(req: Request) {
  try {
    const auth = await authorizedTeacher();
    if (auth.error || !auth.session || !auth.teacher) return auth.error!;
    const { teacher } = auth;

    await refreshExamStatuses();

    const url = new URL(req.url);
    const classId = url.searchParams.get("classId");
    const subjectId = url.searchParams.get("subjectId");
    const status = url.searchParams.get("status");

    const teacherClassIds = (
      await prisma.teacherClass.findMany({ where: { teacherId: teacher.id }, select: { classId: true } })
    ).map((c) => c.classId);
    const teacherSubjectIds = (
      await prisma.teacherSubject.findMany({ where: { teacherId: teacher.id }, select: { subjectId: true } })
    ).map((s) => s.subjectId);

    const exams = await prisma.exam.findMany({
      where: {
        teacherId: teacher.id,
        ...(classId ? { classId } : {}),
        ...(subjectId ? { subjectId } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        class: { select: { id: true, name: true, level: true } },
        subject: { select: { id: true, name: true } },
        _count: { select: { questions: true, attempts: true, assignments: true } },
      },
    });

    const data = exams.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      instructions: e.instructions,
      classId: e.classId,
      className: e.class.name,
      classLevel: e.class.level,
      subjectId: e.subjectId,
      subjectName: e.subject.name,
      academicSession: e.academicSession,
      term: e.term,
      startAt: e.startAt,
      endAt: e.endAt,
      durationMinutes: e.durationMinutes,
      totalMarks: e.totalMarks,
      passMark: e.passMark,
      maxAttempts: e.maxAttempts,
      status: e.status,
      restrictToAssigned: e.restrictToAssigned,
      showResults: e.showResults,
      allowAnswerReview: e.allowAnswerReview,
      shuffleQuestions: e.shuffleQuestions,
      publishedAt: e.publishedAt,
      questionsCount: e._count.questions,
      attemptsCount: e._count.attempts,
      assignmentsCount: e._count.assignments,
    }));

    return NextResponse.json({ success: true, data, teacherClassIds, teacherSubjectIds });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch examinations." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await authorizedTeacher();
    if (auth.error || !auth.session || !auth.teacher) return auth.error!;
    const { session, teacher } = auth;

    const body = await req.json();
    const parsed = createExamSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message || "Invalid input." }, { status: 400 });
    }
    const d = parsed.data;

    const classExists = await prisma.teacherClass.findUnique({
      where: { teacherId_classId: { teacherId: teacher.id, classId: d.classId } },
    });
    if (!classExists) {
      return NextResponse.json({ success: false, error: "You do not teach this class." }, { status: 403 });
    }
    const subjectExists = await prisma.teacherSubject.findUnique({
      where: { teacherId_subjectId: { teacherId: teacher.id, subjectId: d.subjectId } },
    });
    if (!subjectExists) {
      return NextResponse.json({ success: false, error: "You do not teach this subject." }, { status: 403 });
    }

    if (d.assignedStudentIds && d.assignedStudentIds.length) {
      const students = await prisma.student.count({
        where: { id: { in: d.assignedStudentIds }, classId: d.classId },
      });
      if (students !== d.assignedStudentIds.length) {
        return NextResponse.json({ success: false, error: "One or more assigned students do not belong to this class." }, { status: 400 });
      }
    }

    const status = d.status === "SCHEDULED" ? "SCHEDULED" : d.status;

    const exam = await prisma.exam.create({
      data: {
        title: d.title,
        description: d.description,
        instructions: d.instructions,
        classId: d.classId,
        subjectId: d.subjectId,
        teacherId: teacher.id,
        academicSession: d.academicSession,
        term: d.term,
        startAt: new Date(d.startAt),
        endAt: new Date(d.endAt),
        durationMinutes: d.durationMinutes,
        totalMarks: 0,
        passMark: d.passMark,
        maxAttempts: d.maxAttempts,
        status,
        restrictToAssigned: d.restrictToAssigned,
        showResults: d.showResults,
        allowAnswerReview: d.allowAnswerReview,
        shuffleQuestions: d.shuffleQuestions,
        createdById: (session.user as any).id,
        ...(status === "SCHEDULED" ? { publishedAt: new Date() } : {}),
      },
      include: { class: true, subject: true },
    });

    if (d.assignedStudentIds && d.assignedStudentIds.length) {
      await prisma.examAssignment.createMany({
        data: d.assignedStudentIds.map((studentId) => ({ examId: exam.id, studentId })),
        skipDuplicates: true,
      });
    }

    if (status === "SCHEDULED") {
      await sendExamPublishedEmails({
        id: exam.id,
        title: exam.title,
        subjectName: exam.subject.name,
        className: exam.class.name,
        startAt: exam.startAt.toISOString(),
        endAt: exam.endAt.toISOString(),
        durationMinutes: exam.durationMinutes,
      });
    }

    await logActivity((session.user as any).id, "CREATE_EXAM", `Created examination "${exam.title}"`, clientIp(req));

    return NextResponse.json({ success: true, data: { id: exam.id } }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to create examination." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await authorizedTeacher();
    if (auth.error || !auth.session || !auth.teacher) return auth.error!;
    const { session, teacher } = auth;

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "Exam id required." }, { status: 400 });

    const exam = await prisma.exam.findUnique({ where: { id } });
    if (!exam) return NextResponse.json({ success: false, error: "Examination not found." }, { status: 404 });
    if (exam.teacherId !== teacher.id) {
      return NextResponse.json({ success: false, error: "Forbidden. Not your examination." }, { status: 403 });
    }

    const patchBody: any = await req.json();
    const { action } = patchBody;

    if (action === "publish") {
      if (exam.status === "ARCHIVED") {
        return NextResponse.json({ success: false, error: "Archived examinations cannot be published." }, { status: 400 });
      }
      if (exam.publishedAt && exam.status !== "DRAFT") {
        return NextResponse.json({ success: false, error: "Examination already published." }, { status: 400 });
      }
      const updated = await prisma.exam.update({
        where: { id },
        data: { status: "SCHEDULED", publishedAt: new Date() },
        include: { class: true, subject: true },
      });
      await sendExamPublishedEmails({
        id: updated.id,
        title: updated.title,
        subjectName: updated.subject.name,
        className: updated.class.name,
        startAt: updated.startAt.toISOString(),
        endAt: updated.endAt.toISOString(),
        durationMinutes: updated.durationMinutes,
      });
      await logActivity((session.user as any).id, "PUBLISH_EXAM", `Published examination "${updated.title}"`, clientIp(req));
      return NextResponse.json({ success: true, data: { id } });
    }

    if (action === "unpublish") {
      if (exam.status === "ARCHIVED") {
        return NextResponse.json({ success: false, error: "Archived examinations cannot be unpublished." }, { status: 400 });
      }
      // Only allow revert to draft while scheduled (not once students have taken it)
      const attempts = await prisma.examAttempt.count({ where: { examId: id } });
      if (attempts > 0) {
        return NextResponse.json({ success: false, error: "Cannot unpublish after students have started." }, { status: 400 });
      }
      const updated = await prisma.exam.update({ where: { id }, data: { status: "DRAFT", publishedAt: null } });
      await logActivity((session.user as any).id, "UNPUBLISH_EXAM", `Unpublished examination "${updated.title}"`, clientIp(req));
      return NextResponse.json({ success: true, data: { id } });
    }

    if (action === "archive") {
      const updated = await prisma.exam.update({ where: { id }, data: { status: "ARCHIVED" } });
      await logActivity((session.user as any).id, "ARCHIVE_EXAM", `Archived examination "${updated.title}"`, clientIp(req));
      return NextResponse.json({ success: true, data: { id } });
    }

    if (action === "showResults") {
      const { showResults, allowAnswerReview } = patchBody;
      const updated = await prisma.exam.update({
        where: { id },
        data: { showResults: Boolean(showResults), allowAnswerReview: Boolean(allowAnswerReview) },
      });

      if (showResults) {
        // Release any results not yet visible to students and notify the student.
        const results = await prisma.examResult.findMany({
          where: { examId: id, releasedAt: null },
          select: {
            id: true,
            studentId: true,
            score: true,
            totalMarks: true,
            percentage: true,
            grade: true,
            passed: true,
          },
        });
        if (results.length) {
          await prisma.examResult.updateMany({
            where: { id: { in: results.map((r) => r.id) } },
            data: { releasedAt: new Date() },
          });
        }
        const subjectName =
          (await prisma.subject.findUnique({ where: { id: updated.subjectId }, select: { name: true } }))?.name ?? "";
        for (const r of results) {
          // eslint-disable-next-line no-await-in-loop
          await sendExamResultEmail({
            examId: id,
            title: updated.title,
            subjectName,
            studentId: r.studentId,
            score: r.score,
            totalMarks: r.totalMarks,
            percentage: r.percentage,
            grade: r.grade ?? "",
            passed: r.passed,
          }).catch(() => {});
        }
      } else {
        await prisma.examResult.updateMany({ where: { examId: id }, data: { releasedAt: null } });
      }

      await logActivity((session.user as any).id, "UPDATE_EXAM", `Updated result visibility for "${updated.title}"`, clientIp(req)).catch(() => {});
      return NextResponse.json({ success: true, data: { id } });
    }

    return NextResponse.json({ success: false, error: "Unknown action." }, { status: 400 });
  } catch (e) {
    console.error("EXAM_UPDATE_ERR", (e as Error)?.message);
    return NextResponse.json({ success: false, error: "Failed to update examination." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await authorizedTeacher();
    if (auth.error || !auth.session || !auth.teacher) return auth.error!;
    const { session, teacher } = auth;

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "Exam id required." }, { status: 400 });

    const exam = await prisma.exam.findUnique({ where: { id } });
    if (!exam) return NextResponse.json({ success: false, error: "Examination not found." }, { status: 404 });
    if (exam.teacherId !== teacher.id) {
      return NextResponse.json({ success: false, error: "Forbidden. Not your examination." }, { status: 403 });
    }
    const attempts = await prisma.examAttempt.count({ where: { examId: id } });
    if (attempts > 0) {
      return NextResponse.json({ success: false, error: "Cannot delete an examination that students have taken." }, { status: 400 });
    }

    await prisma.exam.delete({ where: { id } });
    await logActivity((session.user as any).id, "DELETE_EXAM", `Deleted examination "${exam.title}"`, clientIp(req));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to delete examination." }, { status: 500 });
  }
}