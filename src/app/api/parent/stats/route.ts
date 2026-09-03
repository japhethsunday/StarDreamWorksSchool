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

    if ((session.user as any).role !== "PARENT") {
      return NextResponse.json(
        { success: false, error: "Forbidden. Parent access required." },
        { status: 403 }
      );
    }

    const parent = await prisma.parent.findUnique({
      where: { userId: (session.user as any).id },
      include: {
        studentLinks: {
          include: {
            student: {
              select: {
                id: true,
                classId: true,
              },
            },
          },
        },
      },
    });

    if (!parent) {
      return NextResponse.json(
        { success: false, error: "Parent profile not found." },
        { status: 404 }
      );
    }

    const childIds = parent.studentLinks.map((l) => l.student.id);
    const classIds = Array.from(
      new Set(
        parent.studentLinks.map((l) => l.student.classId).filter(Boolean)
      )
    ) as string[];

    const [children, grades, announcements, assignments] = await Promise.all([
      prisma.student.findMany({
        where: { id: { in: childIds } },
        include: {
          user: { select: { email: true } },
          class: { select: { id: true, name: true, level: true } },
          _count: { select: { grades: true, submissions: true } },
        },
      }),
      prisma.grade.count({
        where: { studentId: { in: childIds } },
      }),
      prisma.announcement.count({
        where: {
          isPublished: true,
          OR: [
            { targetType: "SCHOOL" },
            ...(classIds.length > 0
              ? [{ targetType: "CLASS", classId: { in: classIds } }]
              : []),
          ],
        },
      }),
      prisma.assignment.count({
        where: classIds.length > 0 ? { classId: { in: classIds } } : undefined,
      }),
    ]);

    const recentGrades = await prisma.grade.findMany({
      where: { studentId: { in: childIds } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true },
        },
        subject: { select: { name: true } },
      },
    });

    const averageScores = await prisma.grade.groupBy({
      by: ["studentId"],
      where: { studentId: { in: childIds } },
      _avg: { score: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        childCount: children.length,
        children,
        totalGrades: grades,
        totalAnnouncements: announcements,
        totalAssignments: assignments,
        recentGrades,
        averageScores,
      },
    });
  } catch (error) {
    console.error("Error fetching parent stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch dashboard statistics. Please try again." },
      { status: 500 }
    );
  }
}
