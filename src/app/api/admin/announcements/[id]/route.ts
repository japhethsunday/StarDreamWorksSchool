import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { logActivity, clientIp } from "@/lib/activity";

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

    const announcement = await prisma.announcement.findUnique({
      where: { id: params.id },
    });

    if (!announcement) {
      return NextResponse.json(
        { success: false, error: "Announcement not found." },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { title, content, targetType, classId, priority, isPublished } = body;

    if (targetType === "CLASS" && !classId) {
      return NextResponse.json(
        { success: false, error: "classId is required for class announcements." },
        { status: 400 }
      );
    }

    if (classId) {
      const classExists = await prisma.class.findUnique({
        where: { id: classId },
      });
      if (!classExists) {
        return NextResponse.json(
          { success: false, error: "Selected class does not exist." },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.announcement.update({
      where: { id: announcement.id },
      data: {
        title: title || announcement.title,
        content: content || announcement.content,
        targetType: targetType || announcement.targetType,
        classId:
          targetType === "CLASS"
            ? classId
            : targetType === "SCHOOL"
            ? null
            : announcement.classId,
        priority: priority || announcement.priority,
        isPublished:
          typeof isPublished === "boolean"
            ? isPublished
            : announcement.isPublished,
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
        class: { select: { id: true, name: true } },
      },
    });

    await logActivity(
      (session.user as any).id,
      updated.isPublished ? "ANNOUNCEMENT_PUBLISH" : "ANNOUNCEMENT_UPDATE",
      `${updated.isPublished ? "Published" : "Updated"} announcement "${updated.title}"`,
      clientIp(req)
    );

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to update announcement. Please try again." },
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

    const announcement = await prisma.announcement.findUnique({
      where: { id: params.id },
    });

    if (!announcement) {
      return NextResponse.json(
        { success: false, error: "Announcement not found." },
        { status: 404 }
      );
    }

    await prisma.announcement.delete({ where: { id: announcement.id } });

    await logActivity(
      (session.user as any).id,
      "ANNOUNCEMENT_DELETE",
      `Deleted announcement "${announcement.title}"`,
      clientIp(req)
    );

    return NextResponse.json({
      success: true,
      data: { message: "Announcement deleted successfully." },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to delete announcement. Please try again." },
      { status: 500 }
    );
  }
}
