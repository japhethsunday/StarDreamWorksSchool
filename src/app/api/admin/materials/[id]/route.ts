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

export async function PUT(
  req: Request,
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

    if (!isAdmin(session)) {
      return NextResponse.json(
        { success: false, error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }
    const permCheck = await permissionResponse("MANAGE_MATERIALS");
    if (permCheck) return permCheck;

    const material = await prisma.learningMaterial.findUnique({
      where: { id: params.id },
    });

    if (!material) {
      return NextResponse.json(
        { success: false, error: "Material not found." },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { title, description, type, fileUrl, subjectId, classId, teacherId } = body;

    if (title !== undefined && !String(title).trim()) {
      return NextResponse.json(
        { success: false, error: "Title cannot be empty." },
        { status: 400 }
      );
    }

    if (type !== undefined && !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { success: false, error: "Invalid material type." },
        { status: 400 }
      );
    }

    if (teacherId) {
      const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
      if (!teacher) {
        return NextResponse.json(
          { success: false, error: "Selected teacher does not exist." },
          { status: 400 }
        );
      }
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

    const updated = await prisma.learningMaterial.update({
      where: { id: material.id },
      data: {
        title: title !== undefined ? String(title).trim() : undefined,
        description: description !== undefined ? description : undefined,
        type: type !== undefined ? type : undefined,
        fileUrl: fileUrl !== undefined ? fileUrl : undefined,
        subjectId: subjectId !== undefined ? subjectId || null : undefined,
        classId: classId !== undefined ? classId || null : undefined,
        teacherId: teacherId !== undefined ? teacherId : undefined,
      },
      include: {
        subject: { select: { id: true, name: true } },
        class: { select: { id: true, name: true } },
        teacher: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await logActivity(
      (session.user as any).id,
      "MATERIAL_UPDATE",
      `Updated learning material "${updated.title}"`,
      clientIp(req)
    );

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to update material. Please try again." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
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

    if (!isAdmin(session)) {
      return NextResponse.json(
        { success: false, error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }
    const permCheck = await permissionResponse("MANAGE_MATERIALS");
    if (permCheck) return permCheck;

    const material = await prisma.learningMaterial.findUnique({
      where: { id: params.id },
    });

    if (!material) {
      return NextResponse.json(
        { success: false, error: "Material not found." },
        { status: 404 }
      );
    }

    await prisma.learningMaterial.delete({ where: { id: material.id } });

    await logActivity(
      (session.user as any).id,
      "MATERIAL_DELETE",
      `Deleted learning material "${material.title}"`,
      clientIp(req)
    );

    return NextResponse.json({
      success: true,
      data: { message: "Material deleted successfully." },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to delete material. Please try again." },
      { status: 500 }
    );
  }
}
