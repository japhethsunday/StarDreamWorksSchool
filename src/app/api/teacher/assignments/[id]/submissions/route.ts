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

    const submissions = await prisma.submission.findMany({
      where: { assignmentId: assignment.id },
      orderBy: { submittedAt: "desc" },
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            firstName: true,
            lastName: true,
            profilePhoto: true,
            class: { select: { name: true } },
            user: { select: { email: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: submissions });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch submissions. Please try again." },
      { status: 500 }
    );
  }
}

export async function POST(
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
      include: { class: true },
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

    const body = await req.json();
    const { submissionId, grade, feedback, status } = body;

    if (!submissionId) {
      return NextResponse.json(
        { success: false, error: "submissionId is required." },
        { status: 400 }
      );
    }

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
    });

    if (!submission || submission.assignmentId !== assignment.id) {
      return NextResponse.json(
        { success: false, error: "Submission not found for this assignment." },
        { status: 404 }
      );
    }

    if (grade !== undefined) {
      const numericGrade = Number(grade);
      if (isNaN(numericGrade) || numericGrade < 0 || numericGrade > assignment.maxScore) {
        return NextResponse.json(
          {
            success: false,
            error: `Grade must be between 0 and ${assignment.maxScore}.`,
          },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.submission.update({
      where: { id: submission.id },
      data: {
        grade: grade !== undefined ? Number(grade) : submission.grade,
        feedback:
          feedback !== undefined ? feedback : submission.feedback,
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
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to grade submission. Please try again." },
      { status: 500 }
    );
  }
}
