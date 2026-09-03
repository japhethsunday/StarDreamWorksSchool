import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

const validateLevel = (body: any): string | null => {
  if (!body?.name || typeof body.name !== "string") return "Level name is required.";
  return null;
};

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user && (session.user as any).role === "ADMIN";

    const levels = await prisma.educationalLevel.findMany({
      where: isAdmin ? {} : { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ success: true, data: levels });
  } catch (error) {
    console.error("Error fetching educational levels:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load educational levels." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const err = validateLevel(body);
    if (err) {
      return NextResponse.json({ success: false, error: err }, { status: 400 });
    }

    const slug = body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const level = await prisma.educationalLevel.create({
      data: {
        name: body.name,
        slug,
        sortOrder: body.sortOrder ?? 0,
        ageRange: body.ageRange ?? null,
        tagline: body.tagline ?? null,
        description: body.description ?? null,
        highlights: body.highlights ?? null,
        isActive: body.isActive ?? true,
      },
    });

    return NextResponse.json({ success: true, data: level });
  } catch (error) {
    console.error("Error creating educational level:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create educational level." },
      { status: 500 }
    );
  }
}
