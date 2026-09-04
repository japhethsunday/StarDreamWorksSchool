import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized." },
        { status: 401 }
      );
    }

    const { id } = context.params;
    const body = await request.json();

    const data: any = {};
    if (typeof body.name === "string") data.name = body.name;
    if (typeof body.slug === "string") data.slug = body.slug;
    if (typeof body.sortOrder === "number") data.sortOrder = body.sortOrder;
    if (typeof body.ageRange === "string" || body.ageRange === null) data.ageRange = body.ageRange ?? null;
    if (typeof body.tagline === "string" || body.tagline === null) data.tagline = body.tagline ?? null;
    if (typeof body.description === "string" || body.description === null) data.description = body.description ?? null;
    if (typeof body.highlights === "string" || body.highlights === null) data.highlights = body.highlights ?? null;
    if (typeof body.isActive === "boolean") data.isActive = body.isActive;

    const level = await prisma.educationalLevel.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, data: level });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to update educational level." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized." },
        { status: 401 }
      );
    }

    const { id } = context.params;
    await prisma.educationalLevel.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to delete educational level." },
      { status: 500 }
    );
  }
}
