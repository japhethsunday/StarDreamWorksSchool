import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: { id: string; subId: string } }
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

    const submission = await prisma.submission.findUnique({
      where: { id: params.subId },
    });

    if (!submission || submission.assignmentId !== assignment.id) {
      return NextResponse.json(
        { success: false, error: "Submission not found for this assignment." },
        { status: 404 }
      );
    }

    const body = await req.json();
    const grade = body.grade !== undefined ? Number(body.grade) : undefined;
    const feedback = body.feedback;
    const status = body.status;

    if (grade !== undefined && (isNaN(grade) || grade < 0 || grade > assignment.maxScore)) {
      return NextResponse.json(
        {
          success: false,
          error: `Grade must be between 0 and ${assignment.maxScore}.`,
        },
        { status: 400 }
      );
    }

    const updated = await prisma.submission.update({
      where: { id: submission.id },
      data: {
        grade: grade !== undefined ? grade : submission.grade,
        feedback: feedback !== undefined ? feedback : submission.feedback,
        gradedBy: teacher.id,
        gradedAt: new Date(),
        status: status || "GRADED",
      },
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            firstName: true,
            lastName: true,
            user: { select: { email: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error grading submission:", error);
    return NextResponse.json(
      { success: false, error: "Failed to grade submission. Please try again." },
      { status: 500 }
    );
  }
}
