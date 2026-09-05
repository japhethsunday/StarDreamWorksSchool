import { createHash } from "node:crypto";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { emailConfig } from "./config";

const resend = emailConfig.apiKey ? new Resend(emailConfig.apiKey) : null;

export type EmailType =
  | "ACCOUNT_CREATED"
  | "PASSWORD_RESET"
  | "ADMISSION_ENQUIRY_RECEIVED"
  | "ADMISSION_STATUS_CHANGED"
  | "ANNOUNCEMENT"
  | "ASSIGNMENT_PUBLISHED"
  | "GRADE_PUBLISHED"
  | "SYSTEM_ALERT";

export interface SendEmailInput {
  type: EmailType;
  to: string;
  subject: string;
  html: string;
  refId?: string;
}

export interface SendEmailResult {
  ok: boolean;
  skipped?: boolean;
  logId?: string;
  remoteId?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const hashFor = (type: string, to: string, refId?: string): string =>
  createHash("sha256")
    .update(`${type}:${String(to).trim().toLowerCase()}:${refId ?? ""}`)
    .digest("hex");

/**
 * Sends a transactional email through Resend, persisting an audit row in the
 * EmailLog table. Duplicate sends for the same (type, recipient, reference)
 * are silently skipped thanks to the unique dedupHash. Never throws — callers
 * can rely on the returned status.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const to = String(input.to ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(to)) {
    return { ok: false };
  }

  const dedupHash = hashFor(input.type, to, input.refId);

  try {
    const log = await prisma.emailLog.create({
      data: {
        type: input.type,
        to,
        from: emailConfig.from,
        subject: input.subject.slice(0, 200),
        status: "SENDING",
        refId: input.refId ?? null,
        dedupHash,
      },
    });

    if (!resend || !emailConfig.apiKey) {
      await prisma.emailLog.update({
        where: { id: log.id },
        data: { status: "FAILED", error: "RESEND_API_KEY is not configured." },
      });
      return { ok: false, logId: log.id };
    }

    const result = await resend.emails.send({
      from: emailConfig.from,
      to,
      subject: input.subject,
      html: input.html,
    });

    if (result.error) {
      await prisma.emailLog.update({
        where: { id: log.id },
        data: { status: "FAILED", error: result.error.message },
      });
      return { ok: false, logId: log.id };
    }

    const remoteId = result.data?.id ?? null;
    await prisma.emailLog.update({
      where: { id: log.id },
      data: { status: "SENT", remoteId },
    });

    return { ok: true, logId: log.id, remoteId: remoteId ?? undefined };
  } catch (error: any) {
    // P2002 = unique constraint on dedupHash → already sent, skip silently.
    if (error?.code === "P2002") {
      return { ok: false, skipped: true };
    }
    try {
      await prisma.emailLog.updateMany({
        where: { dedupHash },
        data: {
          status: "FAILED",
          error: error?.message ? String(error.message).slice(0, 500) : "Unknown send error",
        },
      });
    } catch {
      // Swallow secondary logging failures.
    }
    return { ok: false };
  }
}

/**
 * Notifies all active ADMIN users (system alerts). Used for important events
 * admin staff should be aware of, e.g. new admission enquiries.
 */
export async function notifyAdmins(
  type: EmailType,
  subject: string,
  html: string,
  refId?: string
): Promise<void> {
  try {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN", isActive: true },
      select: { email: true },
    });
    for (const admin of admins) {
      await sendEmail({ type, to: admin.email, subject, html, refId });
    }
  } catch {
    // Never break the primary flow because a notification failed.
  }
}

/**
 * Applies a Resend webhook event to the matching EmailLog row using the
 * remote message id. Returns true when a row was updated.
 */
export async function updateEmailStatusByRemoteId(
  remoteId: string,
  status: string,
  error?: string
): Promise<boolean> {
  if (!remoteId) return false;
  try {
    const result = await prisma.emailLog.updateMany({
      where: { remoteId },
      data: {
        status,
        ...(error ? { error: String(error).slice(0, 500) } : {}),
      },
    });
    return result.count > 0;
  } catch {
    return false;
  }
}