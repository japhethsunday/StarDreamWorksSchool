import { prisma } from "./prisma";

/**
 * Best-effort activity log writer for admin (and other role) mutations.
 * Never throws — logging must never break the underlying operation.
 */
export async function logActivity(
  userId: string | undefined | null,
  action: string,
  details?: string,
  ipAddress?: string
): Promise<void> {
  if (!userId) return;
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        details: details ? details.slice(0, 2000) : null,
        ipAddress: ipAddress ? ipAddress.slice(0, 64) : null,
      },
    });
  } catch {
    // Logging is observability only — swallow all errors.
  }
}

export function clientIp(req: Request): string | undefined {
  try {
    return (
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      undefined
    );
  } catch {
    return undefined;
  }
}
