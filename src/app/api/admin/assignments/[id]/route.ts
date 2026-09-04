import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { logActivity, clientIp } from "@/lib/activity";
import { permissionResponse } from "@/lib/permissions";
import { z } from "zod";

const updateAssignmentSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  instructions: z.string().max(5000).optional(),
  subjectId: z.string().min(1).optional(),
  classId: z.string().min(1).optional(),
  teacherId: z.string().min(1).optional(),
  dueDate: z.string().min(1).optional(),
  maxScore: z.number().int().min(1).max(1000).optional(),
});

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
    const permCheck = await permissionResponse("MANAGE_ASSIGNMENTS");
    if (permCheck) return permCheck;

    const existing = await prisma.assignment.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Assignment not found." },
        { status: 404 }
      );
    }

    const body = await req.json();
    const parsed = updateAssignmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid input." },
        { status: 400 }
      );
    }

    const d = parsed.data;
    const data: Record<string, unknown> = {};
    if (d.title !== undefined) data.title = d.title.trim();
    if (d.description !== undefined) data.description = d.description.trim();
    if (d.instructions !== undefined) data.instructions = d.instructions.trim();
    if (d.subjectId !== undefined) data.subjectId = d.subjectId;
    if (d.classId !== undefined) data.classId = d.classId;
    if (d.teacherId !== undefined) data.teacherId = d.teacherId;
    if (d.dueDate !== undefined) data.dueDate = new Date(d.dueDate);
    if (d.maxScore !== undefined) data.maxScore = d.maxScore;

    // Validate foreign keys exist if being changed
    if (data.subjectId) {
      const sub = await prisma.subject.findUnique({ where: { id: data.subjectId as string } });
      if (!sub) return NextResponse.json({ success: false, error: "Subject not found." }, { status: 400 });
    }
    if (data.classId) {
      const cls = await prisma.class.findUnique({ where: { id: data.classId as string } });
      if (!cls) return NextResponse.json({ success: false, error: "Class not found." }, { status: 400 });
    }
    if (data.teacherId) {
      const tch = await prisma.teacher.findUnique({ where: { id: data.teacherId as string } });
      if (!tch) return NextResponse.json({ success: false, error: "Teacher not found." }, { status: 400 });
    }

    const updated = await prisma.assignment.update({
      where: { id: params.id },
      data,
      include: {
        subject: { select: { id: true, name: true } },
        class: { select: { id: true, name: true } },
        teacher: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await logActivity(
      (session.user as any).id,
      "ASSIGNMENT_UPDATE",
      `Updated assignment "${updated.title}"`,
      clientIp(req)
    );

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        title: updated.title,
        description: updated.description,
        instructions: updated.instructions,
        subjectId: updated.subjectId,
        subjectName: updated.subject?.name ?? "",
        classId: updated.classId,
        className: updated.class?.name ?? "",
        teacherId: updated.teacherId,
        teacherName: `${updated.teacher.firstName} ${updated.teacher.lastName}`.trim(),
        dueDate: updated.dueDate,
        maxScore: updated.maxScore,
        createdAt: updated.createdAt,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to update assignment." },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }
    const permCheck = await permissionResponse("MANAGE_ASSIGNMENTS");
    if (permCheck) return permCheck;

    const existing = await prisma.assignment.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Assignment not found." },
        { status: 404 }
      );
    }

    await prisma.assignment.delete({
      where: { id: params.id },
    });

    await logActivity(
      (session.user as any).id,
      "ASSIGNMENT_DELETE",
      `Deleted assignment "${existing.title}"`,
      clientIp(_req)
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to delete assignment." },
      { status: 500 }
    );
  }
}
