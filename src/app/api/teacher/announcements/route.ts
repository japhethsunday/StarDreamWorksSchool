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

    const assignedClassIds = (
      await prisma.teacherClass.findMany({
        where: { teacherId: teacher.id },
        select: { classId: true },
      })
    ).map((c) => c.classId);

    const announcements = await prisma.announcement.findMany({
      where: {
        OR: [
          { authorId: (session.user as any).id },
          {
            targetType: "CLASS",
            classId: {
              in: classId ? [classId] : assignedClassIds,
            },
          },
          {
            targetType: "SCHOOL",
            isPublished: true,
          },
        ],
      },
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, name: true, email: true } },
        class: { select: { id: true, name: true, level: true } },
      },
    });

    return NextResponse.json({ success: true, data: announcements });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch announcements. Please try again." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
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

    const body = await req.json();
    const { title, content, classId, priority, isPublished, targetType } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, error: "Title is required." },
        { status: 400 }
      );
    }

    if (!content || !content.trim()) {
      return NextResponse.json(
        { success: false, error: "Content is required." },
        { status: 400 }
      );
    }

    // Teachers can only create CLASS-scoped announcements, not SCHOOL-wide
    const target = "CLASS";

    if (target === "CLASS" && !classId) {
      return NextResponse.json(
        { success: false, error: "classId is required for class announcements." },
        { status: 400 }
      );
    }

    if (target === "CLASS") {
      const classExists = await prisma.teacherClass.findUnique({
        where: {
          teacherId_classId: { teacherId: teacher.id, classId },
        },
      });

      if (!classExists) {
        return NextResponse.json(
          { success: false, error: "You do not teach this class." },
          { status: 403 }
        );
      }
    }

    const validPriorities = ["NORMAL", "IMPORTANT", "URGENT"];
    if (priority && !validPriorities.includes(priority)) {
      return NextResponse.json(
        { success: false, error: "Invalid priority." },
        { status: 400 }
      );
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        authorId: (session.user as any).id,
        targetType: target,
        classId: target === "CLASS" ? classId : null,
        priority: priority || "NORMAL",
        isPublished: typeof isPublished === "boolean" ? isPublished : true,
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
        class: { select: { id: true, name: true, level: true } },
      },
    });

    return NextResponse.json({ success: true, data: announcement }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to create announcement. Please try again." },
      { status: 500 }
    );
  }
}
