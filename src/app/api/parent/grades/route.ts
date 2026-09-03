import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
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
                firstName: true,
                lastName: true,
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

    if (childIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: { grades: [], summary: {} },
      });
    }

    const url = new URL(req.url);
    const childId = url.searchParams.get("childId");
    const term = url.searchParams.get("term");
    const academicSession =
      url.searchParams.get("academicSession") ||
      new Date().getFullYear().toString();

    const grades = await prisma.grade.findMany({
      where: {
        studentId: { in: childIds },
        academicSession,
        ...(childId ? { studentId: childId } : {}),
        ...(term ? { term } : {}),
      },
      orderBy: [{ student: { lastName: "asc" } }, { term: "asc" }],
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentId: true,
          },
        },
        subject: { select: { id: true, name: true, code: true } },
        class: { select: { id: true, name: true } },
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const summary = await prisma.grade.groupBy({
      by: ["studentId"],
      where: {
        studentId: { in: childIds },
        academicSession,
        ...(term ? { term } : {}),
      },
      _avg: { score: true },
      _count: true,
      _max: { score: true },
    });

    const studentMap: Record<string, string> = {};
    parent.studentLinks.forEach((l) => {
      studentMap[l.student.id] = `${l.student.firstName} ${l.student.lastName}`;
    });

    return NextResponse.json({
      success: true,
      data: {
        grades,
        summary: summary.map((s) => ({
          studentId: s.studentId,
          studentName: studentMap[s.studentId],
          averageScore: s._avg.score,
          totalGrades: s._count,
          bestScore: s._max.score,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching parent grades:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch grades. Please try again." },
      { status: 500 }
    );
  }
}
