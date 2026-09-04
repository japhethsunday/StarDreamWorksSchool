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

    const materials = await prisma.learningMaterial.findMany({
      where: {
        teacherId: teacher.id,
        ...(classId ? { classId } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        class: { select: { id: true, name: true, level: true } },
      },
    });

    return NextResponse.json({ success: true, data: materials });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch materials. Please try again." },
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
    const { title, description, type, fileUrl, subjectId, classId } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, error: "Title is required." },
        { status: 400 }
      );
    }

    if (!type) {
      return NextResponse.json(
        { success: false, error: "Material type is required." },
        { status: 400 }
      );
    }

    const validTypes = ["PDF", "DOCUMENT", "IMAGE", "VIDEO", "LINK"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: "Invalid material type." },
        { status: 400 }
      );
    }

    if (classId) {
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

    if (subjectId) {
      const subjectExists = await prisma.teacherSubject.findUnique({
        where: {
          teacherId_subjectId: { teacherId: teacher.id, subjectId },
        },
      });
      if (!subjectExists) {
        return NextResponse.json(
          { success: false, error: "You do not teach this subject." },
          { status: 403 }
        );
      }
    }

    const material = await prisma.learningMaterial.create({
      data: {
        title,
        description,
        type,
        fileUrl,
        subjectId,
        classId,
        teacherId: teacher.id,
      },
      include: {
        subject: { select: { id: true, name: true } },
        class: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, data: material }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to create material. Please try again." },
      { status: 500 }
    );
  }
}
