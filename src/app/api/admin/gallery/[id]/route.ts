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

    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    const galleryItem = await prisma.galleryItem.findUnique({
      where: { id: params.id },
    });

    if (!galleryItem) {
      return NextResponse.json(
        { success: false, error: "Gallery item not found." },
        { status: 404 }
      );
    }

    await prisma.galleryItem.delete({ where: { id: galleryItem.id } });

    return NextResponse.json({
      success: true,
      data: { message: "Gallery item deleted successfully." },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to delete gallery item. Please try again." },
      { status: 500 }
    );
  }
}
