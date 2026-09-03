import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
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

    const teachesClass = await prisma.teacherClass.findUnique({
      where: {
        teacherId_classId: {
          teacherId: teacher.id,
          classId: params.id,
        },
      },
    });

    if (!teachesClass) {
      return NextResponse.json(
        { success: false, error: "You do not teach this class." },
        { status: 403 }
      );
    }

    const students = await prisma.student.findMany({
      where: {
        classId: params.id,
        status: "ACTIVE",
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        studentId: true,
        gender: true,
        status: true,
        user: { select: { email: true } },
      },
    });

    const data = students.map((s) => ({
      ...s,
      email: s.user?.email ?? null,
      user: undefined,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching class students:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load students. Please try again." },
      { status: 500 }
    );
  }
}
