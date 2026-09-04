import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { logActivity, clientIp } from "@/lib/activity";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please login." },
        { status: 401 }
      );
    }

    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    const assignments = await prisma.assignment.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        subject: { select: { id: true, name: true } },
        class: { select: { id: true, name: true } },
        teacher: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { submissions: true } },
      },
    });

    const data = assignments.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      instructions: a.instructions,
      subjectId: a.subjectId,
      subjectName: a.subject?.name ?? "",
      classId: a.classId,
      className: a.class?.name ?? "",
      teacherId: a.teacherId,
      teacherName: a.teacher
        ? `${a.teacher.firstName} ${a.teacher.lastName}`.trim()
        : "",
      dueDate: a.dueDate,
      maxScore: a.maxScore,
      createdAt: a.createdAt,
      submissionCount: a._count.submissions,
    }));

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch assignments. Please try again." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please login." },
        { status: 401 }
      );
    }

    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title,
      description,
      instructions,
      subjectId,
      classId,
      teacherId,
      dueDate,
      maxScore,
    } = body;

    if (!title || !title.trim() || !subjectId || !classId || !teacherId || !dueDate) {
      return NextResponse.json(
        { success: false, error: "title, subjectId, classId, teacherId and dueDate are required." },
        { status: 400 }
      );
    }

    const assignment = await prisma.assignment.create({
      data: {
        title,
        description,
        instructions,
        subjectId,
        classId,
        teacherId,
        dueDate: new Date(dueDate),
        maxScore: Math.max(1, Number(maxScore) || 100),
      },
      include: {
        subject: { select: { id: true, name: true } },
        class: { select: { id: true, name: true } },
        teacher: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    const data = {
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      instructions: assignment.instructions,
      subjectId: assignment.subjectId,
      subjectName: assignment.subject?.name ?? "",
      classId: assignment.classId,
      className: assignment.class?.name ?? "",
      teacherId: assignment.teacherId,
      teacherName: `${assignment.teacher.firstName} ${assignment.teacher.lastName}`.trim(),
      dueDate: assignment.dueDate,
      maxScore: assignment.maxScore,
      createdAt: assignment.createdAt,
    };

    await logActivity(
      (session.user as any).id,
      "ASSIGNMENT_CREATE",
      `Created assignment "${assignment.title}"`,
      clientIp(req)
    );

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to create assignment. Please try again." },
      { status: 500 }
    );
  }
}
