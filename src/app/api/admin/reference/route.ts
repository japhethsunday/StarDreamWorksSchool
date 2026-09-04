import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized." },
        { status: 401 }
      );
    }

    const [classes, subjects, teacherRows, students, parents] = await Promise.all([
      prisma.class.findMany({
        orderBy: [{ level: "asc" }, { name: "asc" }],
        select: { id: true, name: true, level: true, section: true },
      }),
      prisma.subject.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      prisma.teacher.findMany({
        orderBy: { lastName: "asc" },
        select: { id: true, firstName: true, lastName: true },
      }),
      prisma.student.findMany({
        orderBy: { lastName: "asc" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          studentId: true,
          user: { select: { isActive: true } },
        },
      }),
      prisma.parent.findMany({
        orderBy: { lastName: "asc" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          occupation: true,
        },
      }),
    ]);

    const teachers = teacherRows.map((t) => ({
      id: t.id,
      firstName: t.firstName,
      lastName: t.lastName,
      name: `${t.firstName} ${t.lastName}`.trim(),
    }));

    return NextResponse.json({
      success: true,
      data: { classes, subjects, teachers, students, parents },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to load reference data." },
      { status: 500 }
    );
  }
}