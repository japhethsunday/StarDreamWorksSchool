import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { logActivity, clientIp } from "@/lib/activity";
import { permissionResponse } from "@/lib/permissions";

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
    const permCheck = await permissionResponse("MANAGE_GALLERY");
    if (permCheck) return permCheck;

    const galleryItem = await prisma.galleryItem.findUnique({
      where: { id: params.id },
    });

    if (!galleryItem) {
      return NextResponse.json(
        { success: false, error: "Gallery item not found." },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { title, description, imageUrl, category, isPublished } = body;

    if (title !== undefined && !String(title).trim()) {
      return NextResponse.json(
        { success: false, error: "Title cannot be empty." },
        { status: 400 }
      );
    }

    if (imageUrl !== undefined && !String(imageUrl).trim()) {
      return NextResponse.json(
        { success: false, error: "Image URL cannot be empty." },
        { status: 400 }
      );
    }

    const updated = await prisma.galleryItem.update({
      where: { id: galleryItem.id },
      data: {
        title: title !== undefined ? String(title).trim() : undefined,
        description: description !== undefined ? description : undefined,
        imageUrl: imageUrl !== undefined ? String(imageUrl).trim() : undefined,
        category: category !== undefined ? category : undefined,
        isPublished:
          typeof isPublished === "boolean" ? isPublished : undefined,
      },
    });

    await logActivity(
      (session.user as any).id,
      updated.isPublished ? "GALLERY_PUBLISH" : "GALLERY_UPDATE",
      `${updated.isPublished ? "Published" : "Updated"} gallery image "${updated.title}"`,
      clientIp(req)
    );

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to update gallery item. Please try again." },
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
    const permCheck = await permissionResponse("MANAGE_GALLERY");
    if (permCheck) return permCheck;

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

    await logActivity(
      (session.user as any).id,
      "GALLERY_DELETE",
      `Deleted gallery image "${galleryItem.title}"`,
      clientIp(req)
    );

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
