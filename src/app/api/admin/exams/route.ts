import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { permissionResponse } from "@/lib/permissions";
import { createExamSchema } from "@/lib/validations";
import { refreshExamStatuses, effectiveStatus } from "@/lib/exams";
import { logActivity, clientIp } from "@/lib/activity";
import { sendExamPublishedEmails } from "@/lib/email/notifications";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized. Please login." }, { status: 401 });
    if ((session.user as any).role !== "ADMIN") return NextResponse.json({ success: false, error: "Forbidden. Admin access required." }, { status: 403 });
    const perm = await permissionResponse("MANAGE_EXAMS");
    if (perm) return perm;

    await refreshExamStatuses();

    const url = new URL(req.url);
    const classId = url.searchParams.get("classId");
    const subjectId = url.searchParams.get("subjectId");
    const teacherId = url.searchParams.get("teacherId");
    const status = url.searchParams.get("status");
    const term = url.searchParams.get("term");
    const academicSession = url.searchParams.get("academicSession");
    const q = url.searchParams.get("q");

    const exams = await prisma.exam.findMany({
      where: {
        ...(classId ? { classId } : {}),
        ...(subjectId ? { subjectId } : {}),
        ...(teacherId ? { teacherId } : {}),
        ...(status ? { status } : {}),
        ...(term ? { term } : {}),
        ...(academicSession ? { academicSession } : {}),
        ...(q ? { title: { contains: q, mode: "insensitive" } } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        class: { select: { id: true, name: true, level: true } },
        subject: { select: { id: true, name: true } },
        teacher: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { questions: true, attempts: true, assignments: true, results: true } },
      },
    });

    const data = exams.map((e) => ({
      id: e.id,
      title: e.title,
      classId: e.classId,
      className: e.class.name,
      classLevel: e.class.level,
      subjectId: e.subjectId,
      subjectName: e.subject.name,
      teacherName: e.teacher ? `${e.teacher.firstName} ${e.teacher.lastName}` : null,
      academicSession: e.academicSession,
      term: e.term,
      startAt: e.startAt,
      endAt: e.endAt,
      durationMinutes: e.durationMinutes,
      totalMarks: e.totalMarks,
      passMark: e.passMark,
      maxAttempts: e.maxAttempts,
      status: e.status,
      effectiveStatus: effectiveStatus(e.status, e.startAt, e.endAt),
      showResults: e.showResults,
      allowAnswerReview: e.allowAnswerReview,
      publishedAt: e.publishedAt,
      questionsCount: e._count.questions,
      attemptsCount: e._count.attempts,
      resultsCount: e._count.results,
      assignmentsCount: e._count.assignments,
    }));

    // Participation + performance stats for analytics.
    const totalAttempts = await prisma.examAttempt.count({
      where: { exam: { ...(classId ? { classId } : {}), ...(subjectId ? { subjectId } : {}) } },
    });
    const graded = await prisma.examAttempt.count({
      where: { totalScore: { not: null }, ...(classId ? { exam: { classId } } : {}), ...(subjectId ? { exam: { subjectId } } : {}) },
    });
    const avgAgg = await prisma.examResult.aggregate({
      _avg: { percentage: true },
      where: { ...(classId ? { exam: { classId } } : {}), ...(subjectId ? { exam: { subjectId } } : {}) },
    });
    const passAgg = await prisma.examResult.count({
      where: { passed: true, ...(classId ? { exam: { classId } } : {}), ...(subjectId ? { exam: { subjectId } } : {}) },
    });

    return NextResponse.json({
      success: true,
      data,
      stats: {
        totalExams: exams.length,
        activeExams: exams.filter((e) => effectiveStatus(e.status, e.startAt, e.endAt) === "ACTIVE").length,
        completedExams: exams.filter((e) => effectiveStatus(e.status, e.startAt, e.endAt) === "COMPLETED").length,
        totalAttempts,
        avgPercentage: avgAgg._avg.percentage ?? 0,
        passRate: graded > 0 ? Math.round((passAgg / graded) * 100) : 0,
        gradedCount: graded,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch examinations." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized. Please login." }, { status: 401 });
    if ((session.user as any).role !== "ADMIN") return NextResponse.json({ success: false, error: "Forbidden. Admin access required." }, { status: 403 });
    const perm = await permissionResponse("MANAGE_EXAMS");
    if (perm) return perm;

    const body = await req.json();
    const parsed = createExamSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message || "Invalid input." }, { status: 400 });
    const d = parsed.data;

    if (d.assignedStudentIds && d.assignedStudentIds.length) {
      const students = await prisma.student.count({ where: { id: { in: d.assignedStudentIds }, classId: d.classId } });
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
        teacherId: d.teacherId ?? null,
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

    return NextResponse.json({ success: true, data: { id: exam.id, className: exam.class.name, subjectName: exam.subject.name } }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to create examination." }, { status: 500 });
  }
}