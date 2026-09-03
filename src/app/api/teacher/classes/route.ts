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

    const classes = await prisma.teacherClass.findMany({
      where: { teacherId: teacher.id },
      include: {
        class: {
          include: {
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                user: { select: { email: true } },
              },
            },
            classSubjects: {
              include: {
                subject: { select: { id: true, name: true, code: true } },
              },
            },
            _count: {
              select: {
                students: true,
                assignments: true,
                announcements: true,
                materials: true,
              },
            },
          },
        },
      },
      orderBy: {
        class: { name: "asc" },
      },
    });

    const data = classes.map(({ class: cls }) => cls);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching teacher classes:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch classes. Please try again." },
      { status: 500 }
    );
  }
}
