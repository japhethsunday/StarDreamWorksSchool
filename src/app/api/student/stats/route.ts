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

    if ((session.user as any).role !== "STUDENT") {
      return NextResponse.json(
        { success: false, error: "Forbidden. Student access required." },
        { status: 403 }
      );
    }

    const student = await prisma.student.findUnique({
      where: { userId: (session.user as any).id },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            level: true,
            section: true,
            academicSession: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: "Student profile not found." },
        { status: 404 }
      );
    }

    const [assignmentCount, materialCount, announcementCount, gradeCount, pendingSubmissionCount, overdueAssignmentCount] =
      await Promise.all([
        prisma.assignment.count({
          where: student.classId
            ? { classId: student.classId }
            : { id: undefined },
        }),
        prisma.learningMaterial.count({
          where: student.classId
            ? { classId: student.classId }
            : { id: undefined },
        }),
        prisma.announcement.count({
          where: {
            isPublished: true,
            OR: [
              { targetType: "SCHOOL" },
              ...(student.classId ? [{ targetType: "CLASS", classId: student.classId }] : []),
            ],
          },
        }),
        prisma.grade.count({ where: { studentId: student.id } }),
        prisma.submission.count({
          where: {
            studentId: student.id,
            status: { in: ["PENDING", "SUBMITTED"] },
          },
        }),
        prisma.assignment.count({
          where: {
            classId: student.classId || undefined,
            dueDate: { lt: new Date() },
          },
        }),
      ]);

    const [recentGrades, recentAssignments, recentAnnouncements, upcomingAssignments] =
      await Promise.all([
        prisma.grade.findMany({
          where: { studentId: student.id },
          orderBy: { createdAt: "desc" },
          take: 5,
          include: {
            subject: { select: { name: true, code: true } },
          },
        }),
        prisma.assignment.findMany({
          where: student.classId ? { classId: student.classId } : undefined,
          orderBy: { dueDate: "asc" },
          take: 5,
          include: {
            subject: { select: { name: true } },
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        }),
        prisma.announcement.findMany({
          where: {
            isPublished: true,
            OR: [
              { targetType: "SCHOOL" },
              ...(student.classId ? [{ targetType: "CLASS", classId: student.classId }] : []),
            ],
          },
          orderBy: { createdAt: "desc" },
          take: 5,
          include: {
            author: { select: { name: true } },
            class: { select: { name: true } },
          },
        }),
        prisma.assignment.findMany({
          where: {
            classId: student.classId || undefined,
            dueDate: { gte: new Date() },
          },
          orderBy: { dueDate: "asc" },
          take: 5,
          include: {
            subject: { select: { name: true } },
          },
        }),
      ]);

    const averageScore = await prisma.grade.aggregate({
      where: { studentId: student.id },
      _avg: { score: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        student,
        assignmentCount,
        materialCount,
        announcementCount,
        gradeCount,
        pendingSubmissionCount,
        overdueAssignmentCount,
        averageScore: averageScore._avg.score,
        recentGrades,
        recentAssignments,
        recentAnnouncements,
        upcomingAssignments,
      },
    });
  } catch (error) {
    console.error("Error fetching student stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch dashboard statistics. Please try again." },
      { status: 500 }
    );
  }
}
