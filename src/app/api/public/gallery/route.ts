import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Gallery content changes whenever an admin publishes photos, so this
// must never be statically cached at build time.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const gallery = await prisma.galleryItem.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, data: gallery });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to load gallery." },
      { status: 500 }
    );
  }
}

// rebuild 2026-09-04 08:14:30
