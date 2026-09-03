import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { createAnnouncementSchema } from "@/lib/validations";

export async function GET() {
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

    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
        class: {
          select: { id: true, name: true, level: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: announcements });
  } catch (error) {
    console.error("Error listing announcements:", error);
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

    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validated = createAnnouncementSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: validated.error.errors.map((e) => e.message).join(", "),
        },
        { status: 400 }
      );
    }

    const { title, content, targetType, classId, priority, isPublished } =
      validated.data;

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

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        authorId: (session.user as any).id,
        targetType,
        classId: targetType === "CLASS" ? classId : null,
        priority,
        isPublished,
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
        class: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, data: announcement }, { status: 201 });
  } catch (error) {
    console.error("Error creating announcement:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create announcement. Please try again." },
      { status: 500 }
    );
  }
}
