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

    const url = new URL(req.url);
    const term = url.searchParams.get("term");
    const subjectId = url.searchParams.get("subjectId");
    const academicSession =
      url.searchParams.get("academicSession") ||
      new Date().getFullYear().toString();

    const grades = await prisma.grade.findMany({
      where: {
        studentId: student.id,
        academicSession,
        ...(term ? { term } : {}),
        ...(subjectId ? { subjectId } : {}),
      },
      orderBy: [{ term: "asc" }, { subject: { name: "asc" } }],
      include: {
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

    const summary = await prisma.grade.aggregate({
      where: {
        studentId: student.id,
        academicSession,
        ...(term ? { term } : {}),
      },
      _avg: { score: true },
      _count: true,
    });

    let highest = await prisma.grade.groupBy({
      by: ["subjectId"],
      where: { studentId: student.id, academicSession },
      _max: { score: true },
    });

    const subjectMap: Record<string, string> = {};
    if (highest.length > 0) {
      const subjects = await prisma.subject.findMany({
        where: { id: { in: highest.map((h) => h.subjectId) } },
        select: { id: true, name: true },
      });
      subjects.forEach((s) => {
        subjectMap[s.id] = s.name;
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        grades,
        summary: {
          averageScore: summary._avg.score,
          totalGrades: summary._count,
          subjects: highest.map((h) => ({
            subjectId: h.subjectId,
            subjectName: subjectMap[h.subjectId],
            bestScore: h._max.score,
          })),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching student grades:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch grades. Please try again." },
      { status: 500 }
    );
  }
}
