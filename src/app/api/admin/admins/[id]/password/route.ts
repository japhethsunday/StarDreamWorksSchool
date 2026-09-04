import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { logActivity, clientIp } from "@/lib/activity";
import { requireSuperAdmin, SUPER_ADMIN_EMAIL } from "@/lib/super-admin";

const PASSWORD_MIN = 8;

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const guard = await requireSuperAdmin();
  if (!guard.ok) return guard.response;

  try {
    const target = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, email: true, role: true, isSuperAdmin: true },
    });

    if (!target || target.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Admin account not found." },
        { status: 404 }
      );
    }

    if (target.isSuperAdmin || target.email === SUPER_ADMIN_EMAIL) {
      return NextResponse.json(
        { success: false, error: "The super admin account cannot be managed here." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { password } = body || {};
    const newPassword = password ? String(password) : "";

    if (newPassword.length < PASSWORD_MIN) {
      return NextResponse.json(
        { success: false, error: `New password must be at least ${PASSWORD_MIN} characters.` },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: target.id },
      data: { password: await bcrypt.hash(newPassword, 10) },
      select: { id: true, email: true, isActive: true },
    });

    await logActivity(
      guard.userId,
      "ADMIN_PASSWORD_RESET",
      `Reset password for admin account ${updated.email}`,
      clientIp(req)
    );

    return NextResponse.json({
      success: true,
      data: { message: `Password reset for ${updated.email}.` },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to reset password. Please try again." },
      { status: 500 }
    );
  }
}