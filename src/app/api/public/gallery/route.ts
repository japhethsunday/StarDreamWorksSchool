import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const gallery = await prisma.galleryItem.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, data: gallery });
  } catch (error) {
    console.error("Error fetching public gallery:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load gallery." },
      { status: 500 }
    );
  }
}
