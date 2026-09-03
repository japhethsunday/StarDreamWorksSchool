import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      where: { isPublished: true },
      orderBy: { startDate: "asc" },
    });
    return NextResponse.json({ success: true, data: events });
  } catch (error) {
    console.error("Error fetching public events:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load events." },
      { status: 500 }
    );
  }
}
