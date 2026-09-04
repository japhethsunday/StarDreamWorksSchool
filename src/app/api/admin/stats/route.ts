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

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [
      totalStudents,
      totalTeachers,
      totalClasses,
      totalSubjects,
      totalParents,
      totalAdmins,
      totalUsers,
      activeStudents,
      activeTeachers,
      newStudentsThisMonth,
      newTeachersThisMonth,
      pendingAssignments,
    ] = await Promise.all([
      prisma.student.count(),
      prisma.teacher.count(),
      prisma.class.count(),
      prisma.subject.count(),
      prisma.parent.count(),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.user.count(),
      prisma.student.count({ where: { status: "ACTIVE" } }),
      prisma.teacher.count({ where: { user: { isActive: true } } }),
      prisma.student.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.teacher.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.assignment.count({ where: { dueDate: { gte: new Date() } } }),
    ]);

    const [
      recentStudents,
      recentTeachers,
      recentAnnouncements,
      recentAdmissions,
      recentActivity,
    ] = await Promise.all([
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
      prisma.student.findMany({
        orderBy: { admissionDate: "desc" },
        take: 5,
        include: {
          user: { select: { email: true } },
          class: { select: { name: true } },
        },
      }),
      prisma.activityLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      }),
    ]);

    const studentsByClass = await prisma.student.groupBy({
      by: ["classId"],
      _count: { _all: true },
      where: { classId: { not: null } },
    });

    const classIds = studentsByClass
      .map((s) => s.classId)
      .filter((id): id is string => id !== null);

    const classes = classIds.length
      ? await prisma.class.findMany({
          where: { id: { in: classIds } },
          select: { id: true, name: true },
        })
      : [];

    const studentsPerClass = studentsByClass
      .map((s) => ({
        name: classes.find((c) => c.id === s.classId)?.name || "Unassigned",
        students: s._count._all,
      }))
      .sort((a, b) => b.students - a.students);

    return NextResponse.json({
      success: true,
      data: {
        totalStudents,
        totalTeachers,
        totalClasses,
        totalSubjects,
        totalParents,
        totalAdmins,
        totalUsers,
        activeStudents,
        activeTeachers,
        newStudentsThisMonth,
        newTeachersThisMonth,
        pendingAssignments,
        recentStudents,
        recentTeachers,
        recentAnnouncements,
        recentAdmissions,
        recentActivity,
        studentsPerClass,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch dashboard statistics. Please try again." },
      { status: 500 }
    );
  }
}