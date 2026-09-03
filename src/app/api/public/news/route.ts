import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const news = await prisma.news.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: "desc" },
      include: {
        author: { select: { name: true } },
      },
    });
    return NextResponse.json({ success: true, data: news });
  } catch (error) {
    console.error("Error fetching public news:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load news." },
      { status: 500 }
    );
  }
}
