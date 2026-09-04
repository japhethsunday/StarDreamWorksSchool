import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "./auth-options";
import { prisma } from "./prisma";
import { PERMISSION_CATALOG, permissionLabel } from "./permission-catalog";

export { PERMISSION_CATALOG, permissionLabel };
export { ALL_PERMISSION_KEYS } from "./permission-catalog";
export type { PermissionKey } from "./permission-catalog";

export const PERMISSIONS = PERMISSION_CATALOG;

export function hasPermission(
  user: { isSuperAdmin?: boolean | null; permissions?: string[] | null },
  permission: string
): boolean {
  if (user.isSuperAdmin) return true;
  if (!user.permissions || user.permissions.length === 0) return true;
  return user.permissions.includes(permission);
}

const UNAUTHORIZED = NextResponse.json(
  { success: false, error: "Unauthorized. Please login." },
  { status: 401 }
);

export async function permissionResponse(
  permission: string
): Promise<NextResponse | null> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) return UNAUTHORIZED;

    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    const admin = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: { isActive: true, isSuperAdmin: true, permissions: true },
    });

    if (!admin?.isActive) {
      return NextResponse.json(
        { success: false, error: "Forbidden. Account disabled." },
        { status: 403 }
      );
    }

    if (hasPermission(admin, permission)) return null;

    return NextResponse.json(
      {
        success: false,
        error: `Forbidden. You need the '${permissionLabel(permission)}' permission to perform this action.`,
      },
      { status: 403 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Forbidden. Could not verify permissions." },
      { status: 403 }
    );
  }
}

export function hasPermissionInSession(
  sessionUser: any,
  permission: string
): boolean {
  if (!sessionUser) return false;
  if (sessionUser.role !== "ADMIN") return false;
  return hasPermission(sessionUser, permission);
}