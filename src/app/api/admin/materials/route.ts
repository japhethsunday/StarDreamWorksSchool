import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { logActivity, clientIp } from "@/lib/activity";
import { permissionResponse } from "@/lib/permissions";

const VALID_TYPES = ["PDF", "DOCUMENT", "IMAGE", "VIDEO", "LINK"];

function isAdmin(session: any) {
  return !!session?.user && (session.user as any).role === "ADMIN";
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please login." },
        { status: 401 }
      );
    }

    if (!isAdmin(session)) {
      return NextResponse.json(
        { success: false, error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }
    const permCheck = await permissionResponse("MANAGE_MATERIALS");
    if (permCheck) return permCheck;

    const materials = await prisma.learningMaterial.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        class: { select: { id: true, name: true, level: true } },
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

    if (!isAdmin(session)) {
      return NextResponse.json(
        { success: false, error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }
    const permCheck = await permissionResponse("MANAGE_MATERIALS");
    if (permCheck) return permCheck;

    const body = await req.json();
    const { title, description, type, fileUrl, subjectId, classId, teacherId } = body;

    if (!title || !String(title).trim()) {
      return NextResponse.json(
        { success: false, error: "Title is required." },
        { status: 400 }
      );
    }

    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { success: false, error: "A valid material type is required (PDF, DOCUMENT, IMAGE, VIDEO, LINK)." },
        { status: 400 }
      );
    }

    if (!teacherId) {
      return NextResponse.json(
        { success: false, error: "An owning teacher is required." },
        { status: 400 }
      );
    }

    const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
    if (!teacher) {
      return NextResponse.json(
        { success: false, error: "Selected teacher does not exist." },
        { status: 400 }
      );
    }

    if (classId) {
      const classExists = await prisma.class.findUnique({ where: { id: classId } });
      if (!classExists) {
        return NextResponse.json(
          { success: false, error: "Selected class does not exist." },
          { status: 400 }
        );
      }
    }

    if (subjectId) {
      const subjectExists = await prisma.subject.findUnique({ where: { id: subjectId } });
      if (!subjectExists) {
        return NextResponse.json(
          { success: false, error: "Selected subject does not exist." },
          { status: 400 }
        );
      }
    }

    const material = await prisma.learningMaterial.create({
      data: {
        title: String(title).trim(),
        description: description || null,
        type,
        fileUrl: fileUrl || null,
        subjectId: subjectId || null,
        classId: classId || null,
        teacherId,
      },
      include: {
        subject: { select: { id: true, name: true } },
        class: { select: { id: true, name: true } },
        teacher: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await logActivity(
      (session.user as any).id,
      "MATERIAL_CREATE",
      `Created learning material "${material.title}"`,
      clientIp(req)
    );

    return NextResponse.json({ success: true, data: material }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to create material. Please try again." },
      { status: 500 }
    );
  }
}
