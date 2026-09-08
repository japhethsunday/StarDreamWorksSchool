import { createHash } from "node:crypto";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { emailConfig } from "./config";
import { bulkMessageTemplate } from "./templates";

export const RECIPIENT_CATEGORIES = ["STUDENTS", "PARENTS", "TEACHERS", "ADMINS"] as const;

export type RecipientCategory = (typeof RECIPIENT_CATEGORIES)[number];

export interface RecipientRow {
  id: string;
  name: string;
  email: string;
  userId: string | null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const resend = emailConfig.apiKey ? new Resend(emailConfig.apiKey) : null;

const ROLE_FOR_CATEGORY: Record<RecipientCategory, string> = {
  STUDENTS: "STUDENT",
  PARENTS: "PARENT",
  TEACHERS: "TEACHER",
  ADMINS: "ADMIN",
};

interface DocsRow {
  id: string;
  name: string;
  email: string;
}

/**
 * Resolves the recipients for a set of categories. Only ACTIVE accounts with a
 * valid email are eligible. When `userIds` is provided it acts as an explicit
 * allow-list and replaces the whole-category resolution.
 */
export async function resolveRecipients(
  categories: RecipientCategory[],
  userIds?: string[] | null
): Promise<RecipientRow[]> {
  const requested = Array.isArray(userIds) && userIds.length > 0 ? userIds : null;
  const emails = new Set<string>();
  const rows: RecipientRow[] = [];

  const push = (r: RecipientRow) => {
    const email = String(r.email ?? "").trim().toLowerCase();
    if (!EMAIL_RE.test(email) || emails.has(email)) return;
    emails.add(email);
    rows.push(r);
  };

  if (requested) {
    const users = await prisma.user.findMany({
      where: { id: { in: requested }, isActive: true },
      select: { id: true, name: true, email: true },
    });
    for (const u of users) {
      push({ id: u.id, name: u.name, email: u.email, userId: u.id });
    }
    return rows;
  }

  for (const cat of categories) {
    const role = ROLE_FOR_CATEGORY[cat];
    if (!role) continue;
    const users: DocsRow[] = await prisma.user.findMany({
      where: { role, isActive: true },
      select: { id: true, name: true, email: true },
    });
    for (const u of users) {
      push({ id: u.id, name: u.name, email: u.email, userId: u.id });
    }
  }

  return rows;
}

export interface CategoryCount {
  category: RecipientCategory;
  count: number;
}

/** Per-category eligible recipient counts (active accounts with valid email). */
export async function recipientCounts(): Promise<CategoryCount[]> {
  const out: CategoryCount[] = [];
  for (const cat of RECIPIENT_CATEGORIES) {
    const role = ROLE_FOR_CATEGORY[cat];
    const users: DocsRow[] = await prisma.user.findMany({
      where: { role, isActive: true },
      select: { id: true, name: true, email: true },
    });
    const count = users.filter((u) => EMAIL_RE.test(String(u.email ?? ""))).length;
    out.push({ category: cat, count });
  }
  return out;
}

const hashFor = (requestId: string, email: string): string =>
  createHash("sha256")
    .update(`campaign:${requestId}:${String(email).trim().toLowerCase()}`)
    .digest("hex");

/**
 * Sends a bulk email to a dynamic audience. Creates the EmailCampaign record,
 * resolves recipients, and dispatches one branded, individually-addressed
 * message per recipient (no BCC cross-talk) through Resend. Per-recipient rows
 * are written to email_logs with the campaignId set so they appear in Email
 * Logs. Never throws — status is reported via the campaign row.
 */
export async function runEmailCampaign(input: {
  subject: string;
  html: string;
  categories: RecipientCategory[];
  userIds?: string[] | null;
  requestId: string;
  sentById: string;
  sentByEmail: string;
}) {
  const campaign = await prisma.emailCampaign.create({
    data: {
      subject: input.subject.slice(0, 200),
      sender: emailConfig.from,
      categories: input.categories,
      status: "QUEUED",
      recipientCount: 0,
      requestId: input.requestId,
      body: input.html,
      sentById: input.sentById,
      sentByEmail: input.sentByEmail,
    },
  });

  if (!resend || !emailConfig.apiKey) {
    await prisma.emailCampaign.update({
      where: { id: campaign.id },
      data: { status: "FAILED", error: "RESEND_API_KEY is not configured.", completedAt: new Date() },
    });
    return { ok: false, campaignId: campaign.id, error: "RESEND_API_KEY is not configured." };
  }

  const recipients = await resolveRecipients(input.categories, input.userIds);
  if (recipients.length === 0) {
    await prisma.emailCampaign.update({
      where: { id: campaign.id },
      data: {
        status: "FAILED",
        error: "No eligible recipients matched the selected categories.",
        completedAt: new Date(),
      },
    });
    return { ok: false, campaignId: campaign.id, error: "No eligible recipients." };
  }

  await prisma.emailCampaign.update({
    where: { id: campaign.id },
    data: { status: "SENDING", recipientCount: recipients.length },
  });

  const { subject, html } = bulkMessageTemplate(input.subject, input.html);

  // Pre-register one SENDING row per recipient so Email Logs reflects the
  // full audience even while the batch dispatches.
  for (const r of recipients) {
    await prisma.emailLog.create({
      data: {
        type: "BULK_EMAIL",
        to: r.email,
        from: emailConfig.from,
        subject: subject.slice(0, 200),
        status: "SENDING",
        refId: campaign.id,
        userId: r.userId,
        body: html,
        dedupHash: hashFor(campaign.id, r.email),
        campaignId: campaign.id,
      },
    });
  }

  const logs = await prisma.emailLog.findMany({
    where: { campaignId: campaign.id },
    select: { id: true, to: true },
    orderBy: { createdAt: "asc" },
  });

  // Resend accepts up to 100 messages per batch request.
  const BATCH_SIZE = 100;
  let sent = 0;
  let failed = 0;
  let firstError: string | null = null;

  for (let i = 0; i < logs.length; i += BATCH_SIZE) {
    const chunk = logs.slice(i, i + BATCH_SIZE);
    const messages = chunk.map((log) => ({
      from: emailConfig.from,
      to: log.to,
      subject,
      html,
    }));

    try {
      const result = await resend.batch.send(messages);
      if (result.error) {
        const msg = String(result.error.message).slice(0, 500);
        failed += chunk.length;
        if (!firstError) firstError = msg;
        for (const log of chunk) {
          await prisma.emailLog.update({
            where: { id: log.id },
            data: { status: "FAILED", error: msg, attempts: { increment: 1 } },
          });
        }
        continue;
      }
      const items = (result.data as unknown as { data?: { id?: string; error?: { message?: string } }[] })?.data ?? [];
      for (let j = 0; j < chunk.length; j++) {
        const log = chunk[j];
        const item = items[j];
        if (item?.id) {
          sent += 1;
          await prisma.emailLog.update({
            where: { id: log.id },
            data: { status: "SENT", remoteId: item.id, sentAt: new Date() },
          });
        } else {
          failed += 1;
          const msg = String(item?.error?.message ?? "Batch item failed.").slice(0, 500);
          if (!firstError) firstError = msg;
          await prisma.emailLog.update({
            where: { id: log.id },
            data: { status: "FAILED", error: msg, attempts: { increment: 1 } },
          });
        }
      }
    } catch (e: any) {
      const msg = String(e?.message ?? "Unknown batch send error").slice(0, 500);
      failed += chunk.length;
      if (!firstError) firstError = msg;
      for (const log of chunk) {
        try {
          await prisma.emailLog.update({
            where: { id: log.id },
            data: { status: "FAILED", error: msg, attempts: { increment: 1 } },
          });
        } catch {
          // Swallow per-row logging failures when marking the batch failed.
        }
      }
    }
  }

  const status = failed === 0 ? "SENT" : sent === 0 ? "FAILED" : "PARTIALLY_FAILED";
  await prisma.emailCampaign.update({
    where: { id: campaign.id },
    data: {
      status,
      sentCount: sent,
      failedCount: failed,
      error: firstError,
      sentAt: new Date(),
      completedAt: new Date(),
    },
  });

  return { ok: failed === 0, campaignId: campaign.id, status, sent, failed };
}