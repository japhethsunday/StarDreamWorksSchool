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

    const [children, grades, assignments] = await Promise.all([
      prisma.student.findMany({
        where: { id: { in: childIds } },
        include: {
          user: { select: { email: true, phone: true } },
          class: { select: { id: true, name: true, level: true, section: true } },
          _count: { select: { grades: true, submissions: true } },
        },
      }),
      prisma.grade.count({
        where: { studentId: { in: childIds } },
      }),
      prisma.assignment.count({
        where: classIds.length > 0 ? { classId: { in: classIds } } : undefined,
      }),
    ]);

    const averageScores = await prisma.grade.groupBy({
      by: ["studentId"],
      where: { studentId: { in: childIds } },
      _avg: { score: true },
    });
    const avgMap: Record<string, number | null> = {};
    for (const a of averageScores) avgMap[a.studentId] = a._avg.score;

    const childrenData = children.map((c) => {
      const avg = avgMap[c.id];
      return {
        id: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
        studentId: c.studentId,
        className: c.class?.name ?? null,
        class: c.class,
        email: c.user?.email ?? null,
        average: avg != null ? Number(avg.toFixed(1)) : "—",
        pendingAssignments: c._count.submissions ?? 0,
      };
    });

    const announcements = await prisma.announcement.findMany({
      where: {
        isPublished: true,
        OR: [
          { targetType: "SCHOOL" },
          ...(classIds.length > 0
            ? [{ targetType: "CLASS", classId: { in: classIds } }]
            : []),
        ],
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: 5,
      include: {
        class: { select: { id: true, name: true } },
      },
    });

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

    return NextResponse.json({
      success: true,
      data: {
        children: childrenData,
        childrenData: childrenData,
        childCount: children.length,
        childrenCount: children.length,
        totalAssignments: assignments,
        activeAssignments: assignments,
        totalGrades: grades,
        recentGrades,
        announcements: announcements.map((a) => ({
          id: a.id,
          title: a.title,
          content: a.content,
          priority: a.priority,
          targetType: a.targetType,
          createdAt: a.createdAt,
        })),
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch dashboard statistics. Please try again." },
      { status: 500 }
    );
  }
}
