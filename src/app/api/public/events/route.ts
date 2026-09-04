import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Events are published from the dashboard at any time — never cache statically.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      where: { isPublished: true },
      orderBy: { startDate: "asc" },
    });
    return NextResponse.json({ success: true, data: events });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to load events." },
      { status: 500 }
    );
  }
}
