import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity, clientIp } from "@/lib/activity";
import { requireSuperAdmin, SUPER_ADMIN_EMAIL } from "@/lib/super-admin";
import { ALL_PERMISSION_KEYS } from "@/lib/permissions";

type Params = { params: { id: string } };

const adminSelect = {
  id: true,
  email: true,
  name: true,
  phone: true,
  image: true,
  isActive: true,
  isSuperAdmin: true,
  permissions: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function PUT(req: Request, { params }: Params) {
  const guard = await requireSuperAdmin();
  if (!guard.ok) return guard.response;

  try {
    const target = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, email: true, name: true, phone: true, role: true, isActive: true, isSuperAdmin: true, permissions: true },
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
    const { name, phone, isActive, permissions } = body || {};

    const hasActive = typeof isActive === "boolean";

    let permissionAction: string | null = null;
    if (permissions !== undefined) {
      if (!Array.isArray(permissions)) {
        return NextResponse.json(
          { success: false, error: "Permissions must be an array." },
          { status: 400 }
        );
      }
      const invalid = permissions.filter((p) => !ALL_PERMISSION_KEYS.includes(p));
      if (invalid.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Unknown permission(s): ${invalid.join(", ")}.`,
          },
          { status: 400 }
        );
      }
      permissionAction = "ADMIN_PERMISSIONS_UPDATE";
    }

    const admin = await prisma.user.update({
      where: { id: target.id },
      data: {
        name: name !== undefined ? String(name).trim() : target.name,
        phone: phone !== undefined ? (phone ? String(phone).trim() : null) : target.phone,
        isActive: hasActive ? isActive : target.isActive,
        permissions:
          permissions !== undefined
            ? (permissions as string[])
            : target.permissions,
      },
      select: adminSelect,
    });

    const action = permissionAction || (hasActive ? (isActive ? "ADMIN_ACTIVATE" : "ADMIN_DEACTIVATE") : "ADMIN_UPDATE");

    await logActivity(
      guard.userId,
      action,
      permissionAction
        ? `Updated permissions for admin ${admin.email} (${permissions.length} granted)`
        : hasActive
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