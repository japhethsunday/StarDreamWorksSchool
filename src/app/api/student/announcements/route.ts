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

    if ((session.user as any).role !== "STUDENT") {
      return NextResponse.json(
        { success: false, error: "Forbidden. Student access required." },
        { status: 403 }
      );
    }

    const student = await prisma.student.findUnique({
      where: { userId: (session.user as any).id },
      select: { id: true, classId: true, academicSession: true },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: "Student profile not found." },
        { status: 404 }
      );
    }

    const announcements = await prisma.announcement.findMany({
      where: {
        isPublished: true,
        OR: [
          { targetType: "SCHOOL" },
          ...(student.classId
            ? [{ targetType: "CLASS", classId: student.classId }]
            : []),
        ],
      },
      orderBy: [
        { priority: "desc" },
        { createdAt: "desc" },
      ],
      include: {
        author: { select: { id: true, name: true, email: true } },
        class: { select: { id: true, name: true, level: true } },
      },
    });

    return NextResponse.json({ success: true, data: announcements });
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch announcements. Please try again." },
      { status: 500 }
    );
  }
}
