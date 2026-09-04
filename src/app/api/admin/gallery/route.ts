import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { logActivity, clientIp } from "@/lib/activity";
import { permissionResponse } from "@/lib/permissions";

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
    const permCheck = await permissionResponse("MANAGE_GALLERY");
    if (permCheck) return permCheck;

    const galleryItems = await prisma.galleryItem.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: galleryItems });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch gallery items. Please try again." },
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
    const permCheck = await permissionResponse("MANAGE_GALLERY");
    if (permCheck) return permCheck;

    const body = await req.json();
    const { title, description, imageUrl, category, isPublished } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, error: "Title is required." },
        { status: 400 }
      );
    }

    if (!imageUrl || !imageUrl.trim()) {
      return NextResponse.json(
        { success: false, error: "Image URL is required." },
        { status: 400 }
      );
    }

    const galleryItem = await prisma.galleryItem.create({
      data: {
        title,
        description,
        imageUrl,
        category,
        isPublished: typeof isPublished === "boolean" ? isPublished : false,
      },
    });

    await logActivity(
      (session.user as any).id,
      "GALLERY_UPLOAD",
      `Added gallery image "${galleryItem.title}"`,
      clientIp(req)
    );

    return NextResponse.json({ success: true, data: galleryItem }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to add gallery item. Please try again." },
      { status: 500 }
    );
  }
}
