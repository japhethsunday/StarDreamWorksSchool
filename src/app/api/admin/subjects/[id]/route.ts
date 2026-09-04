import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { logActivity, clientIp } from "@/lib/activity";
import { permissionResponse } from "@/lib/permissions";

export async function GET(
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

    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }
    const permCheck = await permissionResponse("MANAGE_SUBJECTS");
    if (permCheck) return permCheck;

    const subject = await prisma.subject.findUnique({
      where: { id: params.id },
      include: {
        teacherSubjects: {
          include: {
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                user: { select: { email: true } },
              },
            },
          },
        },
        classSubjects: {
          include: {
            class: {
              select: { id: true, name: true, level: true },
            },
          },
        },
        assignments: {
          include: {
            class: { select: { id: true, name: true } },
            teacher: {
              select: { id: true, firstName: true, lastName: true },
            },
            _count: { select: { submissions: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            teacherSubjects: true,
            classSubjects: true,
            assignments: true,
            grades: true,
            materials: true,
          },
        },
      },
    });

    if (!subject) {
      return NextResponse.json(
        { success: false, error: "Subject not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: subject });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch subject. Please try again." },
      { status: 500 }
    );
  }
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

    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }
    const permCheck = await permissionResponse("MANAGE_SUBJECTS");
    if (permCheck) return permCheck;

    const subject = await prisma.subject.findUnique({
      where: { id: params.id },
    });

    if (!subject) {
      return NextResponse.json(
        { success: false, error: "Subject not found." },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { name, code, description, level } = body;

    if (code) {
      const existing = await prisma.subject.findFirst({
        where: {
          code: code.toUpperCase(),
          NOT: { id: subject.id },
        },
      });

      if (existing) {
        return NextResponse.json(
          { success: false, error: "A subject with this code already exists." },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.subject.update({
      where: { id: subject.id },
      data: {
        name: name || subject.name,
        code: code ? code.toUpperCase() : subject.code,
        description: description !== undefined ? description : subject.description,
        level: level || subject.level,
      },
      include: {
        _count: {
          select: {
            teacherSubjects: true,
            classSubjects: true,
            assignments: true,
          },
        },
      },
    });

    await logActivity(
      (session.user as any).id,
      "SUBJECT_UPDATE",
      `Updated subject ${updated.name} (${updated.code})`,
      clientIp(req)
    );

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to update subject. Please try again." },
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

    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }
    const permCheck = await permissionResponse("MANAGE_SUBJECTS");
    if (permCheck) return permCheck;

    const subject = await prisma.subject.findUnique({
      where: { id: params.id },
    });

    if (!subject) {
      return NextResponse.json(
        { success: false, error: "Subject not found." },
        { status: 404 }
      );
    }

    await prisma.$transaction([
      prisma.teacherSubject.deleteMany({ where: { subjectId: subject.id } }),
      prisma.classSubject.deleteMany({ where: { subjectId: subject.id } }),
      prisma.subject.delete({ where: { id: subject.id } }),
    ]);

    await logActivity(
      (session.user as any).id,
      "SUBJECT_DELETE",
      `Deleted subject ${subject.name} (${subject.code})`,
      clientIp(req)
    );

    return NextResponse.json({
      success: true,
      data: { message: "Subject deleted successfully." },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to delete subject. Please try again." },
      { status: 500 }
    );
  }
}
