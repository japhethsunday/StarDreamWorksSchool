import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function GET(
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

    const assignment = await prisma.assignment.findUnique({
      where: { id: params.id },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        class: {
          select: {
            id: true,
            name: true,
            level: true,
            students: {
              select: {
                id: true,
                studentId: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        submissions: {
          include: {
            student: {
              select: {
                id: true,
                studentId: true,
                firstName: true,
                lastName: true,
                profilePhoto: true,
                user: { select: { email: true } },
              },
            },
          },
          orderBy: { submittedAt: "desc" },
        },
        _count: {
          select: { submissions: true },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: "Assignment not found." },
        { status: 404 }
      );
    }

    if (assignment.teacherId !== teacher.id) {
      return NextResponse.json(
        { success: false, error: "You do not have access to this assignment." },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: assignment });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch assignment. Please try again." },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const assignment = await prisma.assignment.findUnique({
      where: { id: params.id },
    });

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: "Assignment not found." },
        { status: 404 }
      );
    }

    if (assignment.teacherId !== teacher.id) {
      return NextResponse.json(
        { success: false, error: "You do not have access to this assignment." },
        { status: 403 }
      );
    }

    await prisma.assignment.delete({ where: { id: assignment.id } });

    return NextResponse.json({
      success: true,
      data: { message: "Assignment deleted successfully." },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to delete assignment. Please try again." },
      { status: 500 }
    );
  }
}
