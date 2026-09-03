import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    const existing = await prisma.assignment.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Assignment not found." },
        { status: 404 }
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

    const data: any = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (instructions !== undefined) data.instructions = instructions;
    if (subjectId !== undefined) data.subjectId = subjectId;
    if (classId !== undefined) data.classId = classId;
    if (teacherId !== undefined) data.teacherId = teacherId;
    if (dueDate !== undefined) data.dueDate = new Date(dueDate);
    if (maxScore !== undefined) data.maxScore = Math.max(1, Number(maxScore) || 100);

    const updated = await prisma.assignment.update({
      where: { id: params.id },
      data,
      include: {
        subject: { select: { id: true, name: true } },
        class: { select: { id: true, name: true } },
        teacher: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        title: updated.title,
        description: updated.description,
        instructions: updated.instructions,
        subjectId: updated.subjectId,
        subjectName: updated.subject?.name ?? "",
        classId: updated.classId,
        className: updated.class?.name ?? "",
        teacherId: updated.teacherId,
        teacherName: `${updated.teacher.firstName} ${updated.teacher.lastName}`.trim(),
        dueDate: updated.dueDate,
        maxScore: updated.maxScore,
        createdAt: updated.createdAt,
      },
    });
  } catch (error) {
    console.error("Error updating assignment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update assignment. Please try again." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
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

    const existing = await prisma.assignment.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Assignment not found." },
        { status: 404 }
      );
    }

    await prisma.assignment.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting assignment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete assignment. Please try again." },
      { status: 500 }
    );
  }
}
