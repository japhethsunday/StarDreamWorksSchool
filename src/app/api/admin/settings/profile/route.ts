import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request) {
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

    const userId = (session.user as any).id;
    const body = await req.json();
    const { name, email } = body;

    const data: any = {};
    if (name !== undefined && name.trim()) data.name = name.trim();

    if (email !== undefined && email.trim()) {
      const normalized = email.trim().toLowerCase();
      const existing = await prisma.user.findUnique({
        where: { email: normalized },
      });
      if (existing && existing.id !== userId) {
        return NextResponse.json(
          { success: false, error: "Email is already in use by another account." },
          { status: 400 }
        );
      }
      data.email = normalized;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, name: true, email: true, role: true },
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("Error updating admin profile:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update profile. Please try again." },
      { status: 500 }
    );
  }
}
