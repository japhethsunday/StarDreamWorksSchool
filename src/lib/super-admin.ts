import { getServerSession } from "next-auth";
import { authOptions } from "./auth-options";
import { prisma } from "./prisma";
import { NextResponse } from "next/server";

/**
 * The platform's highest-level administrative account. The hard-coded email
 * is part of the authorization rule: Admin Management is reserved for this
 * exact account, and no other account can gain these permissions through the
 * application — there is no endpoint that can set isSuperAdmin.
 *
 * The rule is enforced with BOTH checks:
 *  1. The signed-in session must belong to this exact email.
 *  2. The database row for that email must have isSuperAdmin = true.
 *
 * Even a JWT crafted with this email is useless without the database flag,
 * and the database flag can never be enabled through the API.
 */
export const SUPER_ADMIN_EMAIL = "japhethsunday5@gmail.com";

type SuperAdminResult =
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse };

/**
 * Verifies the signed-in user is THE designated super admin.
 * Must be called at the very start of every Admin Management handler.
 */
export async function requireSuperAdmin(): Promise<SuperAdminResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "Unauthorized. Please login." },
        { status: 401 }
      ),
    };
  }

  const sessionUser = session.user as any;
  if (sessionUser.role !== "ADMIN" || sessionUser.email !== SUPER_ADMIN_EMAIL) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "Forbidden. Super admin access required." },
        { status: 403 }
      ),
    };
  }

  const user = await prisma.user.findUnique({
    where: { email: SUPER_ADMIN_EMAIL },
    select: { id: true, isActive: true, isSuperAdmin: true },
  });

  if (!user || !user.isActive || !user.isSuperAdmin) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "Forbidden. Super admin access required." },
        { status: 403 }
      ),
    };
  }

  return { ok: true, userId: sessionUser.id };
}

export function isSuperAdminEmail(email: string | undefined | null): boolean {
  return typeof email === "string" && email.toLowerCase().trim() === SUPER_ADMIN_EMAIL;
}