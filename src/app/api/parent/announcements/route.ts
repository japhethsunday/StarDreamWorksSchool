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
      include: {
        studentLinks: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                classId: true,
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

    const classIds = Array.from(
      new Set(
        parent.studentLinks.map((l) => l.student.classId).filter(Boolean)
      )
    ) as string[];

    const announcements = await prisma.announcement.findMany({
      where: {
        isPublished: true,
        OR: [
          { targetType: "SCHOOL" },
          ...(classIds.length > 0
            ? [{ targetType: "CLASS", classId: { in: classIds } }]
            : []),
        ],
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      include: {
        author: { select: { id: true, name: true, email: true } },
        class: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
      },
    });

    const studentNameMap: Record<string, string> = {};
    parent.studentLinks.forEach((l) => {
      studentNameMap[l.student.id] = `${l.student.firstName} ${l.student.lastName}`;
    });

    return NextResponse.json({
      success: true,
      data: announcements.map((a) => ({
        ...a,
        relevantChildren: a.targetType === "CLASS" && a.classId
          ? parent.studentLinks
              .filter((l) => l.student.classId === a.classId)
              .map((l) => ({
                id: l.student.id,
                name: studentNameMap[l.student.id],
              }))
          : [],
      })),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch announcements. Please try again." },
      { status: 500 }
    );
  }
}
