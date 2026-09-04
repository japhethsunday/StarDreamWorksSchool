import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

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

    if ((session.user as any).role !== "TEACHER") {
      return NextResponse.json(
        { success: false, error: "Forbidden. Teacher access required." },
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

    if (announcement.authorId !== (session.user as any).id) {
      return NextResponse.json(
        { success: false, error: "You cannot delete this announcement." },
        { status: 403 }
      );
    }

    await prisma.announcement.delete({ where: { id: announcement.id } });

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
