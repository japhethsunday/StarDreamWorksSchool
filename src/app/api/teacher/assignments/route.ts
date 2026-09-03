import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { createAssignmentSchema } from "@/lib/validations";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please login." },
        { status: 401 }
      );
    }

    if ((session.user as any).role !== "TEACHER") {
      return NextResponse.json(
        { success: false, error: "Forbidden. Teacher access required." },
        { status: 403 }
      );
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: (session.user as any).id },
    });

    if (!teacher) {
      return NextResponse.json(
        { success: false, error: "Teacher profile not found." },
        { status: 404 }
      );
    }

    const url = new URL(req.url);
    const classId = url.searchParams.get("classId");
    const subjectId = url.searchParams.get("subjectId");

    const assignments = await prisma.assignment.findMany({
      where: {
        teacherId: teacher.id,
        ...(classId ? { classId } : {}),
        ...(subjectId ? { subjectId } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        class: { select: { id: true, name: true, level: true } },
        _count: {
          select: { submissions: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: assignments });
  } catch (error) {
    console.error("Error fetching assignments:", error);
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

    if ((session.user as any).role !== "TEACHER") {
      return NextResponse.json(
        { success: false, error: "Forbidden. Teacher access required." },
        { status: 403 }
      );
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: (session.user as any).id },
    });

    if (!teacher) {
      return NextResponse.json(
        { success: false, error: "Teacher profile not found." },
        { status: 404 }
      );
    }

    const body = await req.json();
    const validated = createAssignmentSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: validated.error.errors.map((e) => e.message).join(", "),
        },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      instructions,
      subjectId,
      classId,
      dueDate,
      maxScore,
      attachments,
    } = validated.data;

    const classExists = await prisma.teacherClass.findUnique({
      where: {
        teacherId_classId: {
          teacherId: teacher.id,
          classId,
        },
      },
    });

    if (!classExists) {
      return NextResponse.json(
        { success: false, error: "You do not teach this class." },
        { status: 403 }
      );
    }

    const subjectExists = await prisma.teacherSubject.findUnique({
      where: {
        teacherId_subjectId: {
          teacherId: teacher.id,
          subjectId,
        },
      },
    });

    if (!subjectExists) {
      return NextResponse.json(
        { success: false, error: "You do not teach this subject." },
        { status: 403 }
      );
    }

    const due = new Date(dueDate);
    if (isNaN(due.getTime())) {
      return NextResponse.json(
        { success: false, error: "Invalid due date format." },
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
        teacherId: teacher.id,
        dueDate: due,
        maxScore,
        attachments,
      },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        class: { select: { id: true, name: true, level: true } },
        _count: { select: { submissions: true } },
      },
    });

    return NextResponse.json({ success: true, data: assignment }, { status: 201 });
  } catch (error) {
    console.error("Error creating assignment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create assignment. Please try again." },
      { status: 500 }
    );
  }
}
