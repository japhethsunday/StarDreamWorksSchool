import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function GET() {
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

    const [classCount, subjectCount, assignmentCount, pendingSubmissionCount, studentCount, materialCount] =
      await Promise.all([
        prisma.teacherClass.count({
          where: { teacherId: teacher.id },
        }),
        prisma.teacherSubject.count({
          where: { teacherId: teacher.id },
        }),
        prisma.assignment.count({
          where: { teacherId: teacher.id },
        }),
        prisma.submission.count({
          where: {
            assignment: { teacherId: teacher.id },
            status: { in: ["PENDING", "SUBMITTED"] },
          },
        }),
        prisma.student.count({
          where: {
            class: {
              teacherClasses: {
                some: { teacherId: teacher.id },
              },
            },
          },
        }),
        prisma.learningMaterial.count({
          where: { teacherId: teacher.id },
        }),
      ]);

    const [recentAssignments, recentSubmissions, myClasses] = await Promise.all([
      prisma.assignment.findMany({
        where: { teacherId: teacher.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          subject: { select: { name: true } },
          class: { select: { name: true } },
          _count: { select: { submissions: true } },
        },
      }),
      prisma.submission.findMany({
        where: {
          assignment: { teacherId: teacher.id },
          status: { in: ["PENDING", "SUBMITTED"] },
        },
        orderBy: { submittedAt: "desc" },
        take: 5,
        include: {
          student: {
            select: {
              firstName: true,
              lastName: true,
              class: { select: { name: true } },
            },
          },
          assignment: { select: { title: true } },
        },
      }),
      prisma.teacherClass.findMany({
        where: { teacherId: teacher.id },
        include: {
          class: {
            select: {
              id: true,
              name: true,
              level: true,
              section: true,
              _count: { select: { students: true } },
            },
          },
        },
      }),
    ]);

    const ungradedCount = await prisma.submission.count({
      where: {
        assignment: { teacherId: teacher.id },
        status: "SUBMITTED",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        teacherId: teacher.id,
        classCount,
        subjectCount,
        assignmentCount,
        studentCount,
        pendingSubmissionCount,
        materialCount,
        ungradedCount,
        recentAssignments,
        recentSubmissions,
        myClasses,
      },
    });
  } catch (error) {
    console.error("Error fetching teacher stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch dashboard statistics. Please try again." },
      { status: 500 }
    );
  }
}
