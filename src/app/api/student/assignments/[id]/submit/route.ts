import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

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

    if ((session.user as any).role !== "STUDENT") {
      return NextResponse.json(
        { success: false, error: "Forbidden. Student access required." },
        { status: 403 }
      );
    }

    const student = await prisma.student.findUnique({
      where: { userId: (session.user as any).id },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: "Student profile not found." },
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

    if (assignment.classId !== student.classId) {
      return NextResponse.json(
        { success: false, error: "This assignment is not for your class." },
        { status: 403 }
      );
    }

    const existingSubmission = await prisma.submission.findFirst({
      where: {
        assignmentId: assignment.id,
        studentId: student.id,
      },
    });

    const body = await req.json();
    const { content, files } = body;

    if (!content && !files) {
      return NextResponse.json(
        { success: false, error: "Provide content or files for the submission." },
        { status: 400 }
      );
    }

    const now = new Date();
    const isLate = now > assignment.dueDate;
    const status = isLate ? "LATE" : "SUBMITTED";

    let submission;
    if (existingSubmission) {
      submission = await prisma.submission.update({
        where: { id: existingSubmission.id },
        data: {
          content: content !== undefined ? content : existingSubmission.content,
          files: files !== undefined ? files : existingSubmission.files,
          submittedAt: now,
          status: existingSubmission.status === "GRADED" ? existingSubmission.status : status,
        },
        include: {
          assignment: {
            select: { id: true, title: true },
          },
        },
      });
    } else {
      submission = await prisma.submission.create({
        data: {
          assignmentId: assignment.id,
          studentId: student.id,
          content,
          files,
          submittedAt: now,
          status,
        },
        include: {
          assignment: {
            select: { id: true, title: true },
          },
        },
      });
    }

    return NextResponse.json({ success: true, data: submission });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to submit assignment. Please try again." },
      { status: 500 }
    );
  }
}
