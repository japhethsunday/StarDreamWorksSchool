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

    const url = new URL(req.url);
    const classId = url.searchParams.get("classId");

    const students = await prisma.student.findMany({
      where: {
        status: "ACTIVE",
        class: {
          teacherClasses: {
            some: { teacherId: teacher.id },
          },
          ...(classId ? { id: classId } : {}),
        },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      include: {
        user: { select: { email: true, phone: true } },
        class: { select: { id: true, name: true, level: true } },
        parentLinks: {
          include: {
            parent: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                user: { select: { email: true } },
              },
            },
          },
        },
        _count: {
          select: { submissions: true, grades: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: students });
  } catch (error) {
    console.error("Error fetching teacher students:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch students. Please try again." },
      { status: 500 }
    );
  }
}
