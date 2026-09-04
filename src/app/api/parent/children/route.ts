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
    });

    if (!parent) {
      return NextResponse.json(
        { success: false, error: "Parent profile not found." },
        { status: 404 }
      );
    }

    const links = await prisma.parentStudent.findMany({
      where: { parentId: parent.id },
      include: {
        student: {
          include: {
            user: { select: { email: true, phone: true } },
            class: {
              select: {
                id: true,
                name: true,
                level: true,
                section: true,
                teacher: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    user: { select: { email: true } },
                  },
                },
              },
            },
            _count: {
              select: { grades: true, submissions: true },
            },
          },
        },
      },
      orderBy: {
        student: { lastName: "asc" },
      },
    });

    const studentIds = links.map((l) => l.student.id);

    const averageRows = await prisma.grade.groupBy({
      by: ["studentId"],
      where: { studentId: { in: studentIds } },
      _avg: { score: true },
    });
    const avgMap: Record<string, number | null> = {};
    for (const r of averageRows) avgMap[r.studentId] = r._avg.score;

    const data = links.map(({ student }) => {
      const avg = avgMap[student.id];
      return {
        ...student,
        className: student.class?.name ?? null,
        average: avg != null ? Number(avg.toFixed(1)) : "—",
        pendingAssignments: student._count.submissions ?? 0,
      };
    });

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch children. Please try again." },
      { status: 500 }
    );
  }
}
