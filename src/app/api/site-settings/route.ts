import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user && (session.user as any).role === "ADMIN";

    const settings = await prisma.siteSetting.findMany({
      orderBy: { key: "asc" },
    });

    const map: Record<string, string> = {};
    for (const s of settings) {
      if (isAdmin || s.isPublic) map[s.key] = s.value ?? "";
    }

    return NextResponse.json({ success: true, data: map });
  } catch (error) {
    console.error("Error fetching site settings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load site settings." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized." },
        { status: 401 }
      );
    }

    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, error: "Invalid payload." },
        { status: 400 }
      );
    }

    const allowedKeys = [
      "school.name",
      "school.tagline",
      "school.location",
      "school.phone",
      "school.email",
      "admissions.status",
      "admissions.message",
      "homepage.introTitle",
      "homepage.introBody",
    ] as const;

    const updates: Promise<any>[] = [];
    for (const [key, value] of Object.entries(body)) {
      if (typeof value !== "string" || !allowedKeys.includes(key as any)) continue;
      updates.push(
        prisma.siteSetting.upsert({
          where: { key },
          update: { value, isPublic: true },
          create: { key, value, isPublic: true },
        })
      );
    }

    if (updates.length > 0) await Promise.all(updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating site settings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update site settings." },
      { status: 500 }
    );
  }
}
