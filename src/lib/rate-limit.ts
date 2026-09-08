import { prisma } from "./prisma";

export interface RateLimitResult {
  ok: boolean;
  retryAfterMs: number;
}

let lastCleanup = 0;
let lastWarnLogged = 0;

/**
 * Fixed-window rate limiter backed by the shared relational database.
 *
 * Suitable for serverless deployments (e.g. Vercel + Neon/Postgres) because
 * the counter lives in the database rather than in per-instance process
 * memory, so every instance sees the same state.
 *
 * Concurrency: the counter is incremented with a single atomic `updateMany`
 * guarded by an unexpired window. A concurrent `createMany` with
 * `skipDuplicates` (ON CONFLICT DO NOTHING) guarantees the row exists exactly
 * once, so parallel requests cannot clobber each other's count. The only
 * residual race is at the exact window-rollover instant, which may at worst
 * be marginally permissive (never blocks legitimate traffic).
 *
 * Failure mode: if the persistence layer is unavailable the limiter fails
 * OPEN (ok: true) rather than taking down critical flows such as
 * authentication, and the error is swallowed after a throttled warning.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = Date.now();
  const expiresAt = new Date(now + windowMs);

  void cleanExpired(now);

  try {
    // Create the row once (idempotent under races — existing rows untouched).
    const created = await prisma.rateLimit.createMany({
      data: [{ key, count: 1, expiresAt }],
      skipDuplicates: true,
    });

    // The row we just created counts as this request.
    if (created.count === 1) {
      return { ok: true, retryAfterMs: 0 };
    }

    // Atomically increment the counter only while the window is still active.
    const res = await prisma.rateLimit.updateMany({
      where: { key, expiresAt: { gt: new Date(now) } },
      data: { count: { increment: 1 } },
    });

    if (res.count === 1) {
      const row = await prisma.rateLimit.findUnique({ where: { key } });
      if (row) {
        const retryAfterMs = Math.max(0, row.expiresAt.getTime() - now);
        return { ok: row.count <= limit, retryAfterMs };
      }
    }

    // Window has expired — roll over with a fresh counter. `upsert` keeps this
    // idempotent under races between instances.
    await prisma.rateLimit.upsert({
      where: { key },
      update: { count: 1, expiresAt },
      create: { key, count: 1, expiresAt },
    });

    return { ok: true, retryAfterMs: 0 };
  } catch {
    if (Date.now() - lastWarnLogged > 60_000) {
      lastWarnLogged = Date.now();
      console.warn("rate-limit: persistence unavailable; failing open");
    }
    return { ok: true, retryAfterMs: 0 };
  }
}

/** Removes expired rows so the table cannot grow unboundedly. */
async function cleanExpired(now: number): Promise<void> {
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;
  try {
    await prisma.rateLimit.deleteMany({ where: { expiresAt: { lte: new Date(now) } } });
  } catch {
    // Best-effort cleanup; never surface to callers.
  }
}