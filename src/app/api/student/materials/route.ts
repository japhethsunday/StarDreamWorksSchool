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
      select: { id: true, classId: true },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: "Student profile not found." },
        { status: 404 }
      );
    }

    if (!student.classId) {
      return NextResponse.json({
        success: true,
        data: [],
        message: "No class assigned.",
      });
    }

    const url = new URL(req.url);
    const subjectId = url.searchParams.get("subjectId");

    const materials = await prisma.learningMaterial.findMany({
      where: {
        classId: student.classId,
        ...(subjectId ? { subjectId } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            user: { select: { email: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: materials });
  } catch (error) {
    console.error("Error fetching materials:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch materials. Please try again." },
      { status: 500 }
    );
  }
}
