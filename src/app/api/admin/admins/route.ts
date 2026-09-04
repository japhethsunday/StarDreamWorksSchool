import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { logActivity, clientIp } from "@/lib/activity";
import { requireSuperAdmin, SUPER_ADMIN_EMAIL } from "@/lib/super-admin";
import { ALL_PERMISSION_KEYS } from "@/lib/permissions";

const PASSWORD_MIN = 8;

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

type AdminRow = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  image: string | null;
  isActive: boolean;
  isSuperAdmin: boolean;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
};

export async function GET(req: Request) {
  const guard = await requireSuperAdmin();
  if (!guard.ok) return guard.response;

  try {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: adminSelect,
      orderBy: [{ isSuperAdmin: "desc" }, { createdAt: "asc" }],
    });
    return NextResponse.json({ success: true, data: admins });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to load admins." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const guard = await requireSuperAdmin();
  if (!guard.ok) return guard.response;

  try {
    const body = await req.json().catch(() => ({}));
    const { name, email, password, phone, permissions } = body || {};

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    let grantedPermissions: string[] = [];
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
      grantedPermissions = permissions as string[];
    }

    const emailNorm = String(email).toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address." },
        { status: 400 }
      );
    }
    if (String(password).length < PASSWORD_MIN) {
      return NextResponse.json(
        { success: false, error: `Password must be at least ${PASSWORD_MIN} characters.` },
        { status: 400 }
      );
    }
    if (emailNorm === SUPER_ADMIN_EMAIL) {
      return NextResponse.json(
        { success: false, error: "The super admin account already exists." },
        { status: 409 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email: emailNorm } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "A user with this email already exists." },
        { status: 409 }
      );
    }

    const admin = await prisma.user.create({
      data: {
        email: emailNorm,
        name: String(name).trim(),
        password: await bcrypt.hash(String(password), 10),
        phone: phone ? String(phone).trim() : null,
        role: "ADMIN",
        permissions: grantedPermissions,
      },
      select: adminSelect,
    });

    await logActivity(
      guard.userId,
      "ADMIN_CREATE",
      `Created admin account for ${admin.email}`,
      clientIp(req)
    );

    return NextResponse.json({ success: true, data: admin }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to create admin. Please try again." },
      { status: 500 }
    );
  }
}

export type { AdminRow };