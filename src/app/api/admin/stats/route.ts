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

    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    const [totalStudents, totalTeachers, totalClasses, totalSubjects, totalParents, totalUsers] =
      await Promise.all([
        prisma.student.count(),
        prisma.teacher.count(),
        prisma.class.count(),
        prisma.subject.count(),
        prisma.parent.count(),
        prisma.user.count(),
      ]);

    const [activeStudents, activeTeachers, recentStudents, recentTeachers, recentAnnouncements] =
      await Promise.all([
        prisma.student.count({ where: { status: "ACTIVE" } }),
        prisma.teacher.count(),
        prisma.student.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          include: {
            user: { select: { email: true } },
            class: { select: { name: true } },
          },
        }),
        prisma.teacher.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          include: {
            user: { select: { email: true } },
          },
        }),
        prisma.announcement.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { author: { select: { name: true } } },
        }),
      ]);

    return NextResponse.json({
      success: true,
      data: {
        totalStudents,
        totalTeachers,
        totalClasses,
        totalSubjects,
        totalParents,
        totalUsers,
        activeStudents,
        activeTeachers,
        recentStudents,
        recentTeachers,
        recentAnnouncements,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch dashboard statistics. Please try again." },
      { status: 500 }
    );
  }
}
