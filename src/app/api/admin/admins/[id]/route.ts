import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity, clientIp } from "@/lib/activity";
import { requireSuperAdmin, SUPER_ADMIN_EMAIL } from "@/lib/super-admin";

type Params = { params: { id: string } };

const adminSelect = {
  id: true,
  email: true,
  name: true,
  phone: true,
  image: true,
  isActive: true,
  isSuperAdmin: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function PUT(req: Request, { params }: Params) {
  const guard = await requireSuperAdmin();
  if (!guard.ok) return guard.response;

  try {
    const target = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, email: true, name: true, phone: true, role: true, isActive: true, isSuperAdmin: true },
    });

    if (!target || target.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Admin account not found." },
        { status: 404 }
      );
    }

    // The super admin account can never be edited, disabled, or removed here.
    // It manages itself through Settings, and it is the platform's own key.
    if (target.isSuperAdmin || target.email === SUPER_ADMIN_EMAIL) {
      return NextResponse.json(
        { success: false, error: "The super admin account cannot be managed here." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { name, phone, isActive } = body || {};

    const hasActive = typeof isActive === "boolean";

    const admin = await prisma.user.update({
      where: { id: target.id },
      data: {
        name: name !== undefined ? String(name).trim() : target.name,
        phone: phone !== undefined ? (phone ? String(phone).trim() : null) : target.phone,
        isActive: hasActive ? isActive : target.isActive,
      },
      select: adminSelect,
    });

    await logActivity(
      guard.userId,
      hasActive ? (isActive ? "ADMIN_ACTIVATE" : "ADMIN_DEACTIVATE") : "ADMIN_UPDATE",
      hasActive
        ? `${isActive ? "Activated" : "Deactivated"} admin account ${admin.email}`
        : `Updated admin account ${admin.email}`,
      clientIp(req)
    );

    return NextResponse.json({ success: true, data: admin });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to update admin. Please try again." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: Params) {
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

    if (target.id === guard.userId) {
      return NextResponse.json(
        { success: false, error: "You cannot remove your own account." },
        { status: 403 }
      );
    }

    if (target.isSuperAdmin || target.email === SUPER_ADMIN_EMAIL) {
      return NextResponse.json(
        { success: false, error: "The super admin account cannot be removed." },
        { status: 403 }
      );
    }

    await prisma.user.delete({ where: { id: target.id } });

    await logActivity(
      guard.userId,
      "ADMIN_DELETE",
      `Removed admin account ${target.email}`,
      clientIp(req)
    );

    return NextResponse.json({
      success: true,
      data: { message: "Admin account removed." },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to remove admin. Please try again." },
      { status: 500 }
    );
  }
}