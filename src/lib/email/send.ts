import { createHash } from "node:crypto";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { emailConfig } from "./config";

const resend = emailConfig.apiKey ? new Resend(emailConfig.apiKey) : null;

export type EmailType =
  | "ACCOUNT_CREATED"
  | "PASSWORD_RESET"
  | "PASSWORD_CHANGED"
  | "ACCOUNT_STATUS"
  | "SECURITY_ALERT"
  | "ADMISSION_ENQUIRY_RECEIVED"
  | "ADMISSION_STATUS_CHANGED"
  | "ANNOUNCEMENT"
  | "ASSIGNMENT_PUBLISHED"
  | "ASSIGNMENT_SUBMITTED"
  | "ASSIGNMENT_GRADED"
  | "ASSIGNMENT_REMINDER"
  | "ASSIGNMENT_OVERDUE"
  | "LEARNING_MATERIAL"
  | "ACADEMIC_UPDATE"
  | "GRADE_PUBLISHED"
  | "SYSTEM_ALERT";

export interface SendEmailInput {
  type: EmailType;
  to: string;
  subject: string;
  html: string;
  refId?: string;
  userId?: string;
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
        userId: input.userId ?? null,
        body: input.html,
        dedupHash,
      },
    });

    if (!resend || !emailConfig.apiKey) {
      await prisma.emailLog.update({
        where: { id: log.id },
        data: {
          status: "FAILED",
          error: "RESEND_API_KEY is not configured.",
          attempts: { increment: 1 },
        },
      });
      await notifyAdminsOfFailure(input, log.id);
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
        data: {
          status: "FAILED",
          error: String(result.error.message).slice(0, 500),
          attempts: { increment: 1 },
        },
      });
      await notifyAdminsOfFailure(input, log.id);
      return { ok: false, logId: log.id };
    }

    const remoteId = result.data?.id ?? null;
    await prisma.emailLog.update({
      where: { id: log.id },
      data: { status: "SENT", remoteId, sentAt: new Date() },
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
          attempts: { increment: 1 },
        },
      });
    } catch {
      // Swallow secondary logging failures.
    }
    return { ok: false };
  }
}

/**
 * Alerts admins about a first-time delivery failure. Bounded: we never alert
 * about failures of SYSTEM_ALERT emails themselves, which prevents cascades.
 */
async function notifyAdminsOfFailure(
  input: SendEmailInput,
  logId: string
): Promise<void> {
  if (input.type === "SYSTEM_ALERT") return;
  try {
    void notifyAdmins(
      "SYSTEM_ALERT",
      "Email delivery failed",
      `A ${input.type} email to ${input.to}${
        input.refId ? ` (reference ${input.refId})` : ""
      } failed to send. Check the admin Email Logs for details.`,
      `failed:${logId}`
    );
  } catch {
    // Ignore alert-wiring failures.
  }
}

/**
 * Re-attempts a previously failed email using its stored subject/body.
 * Updates the same EmailLog row (increments attempts) instead of creating a
 * new one, preserving the audit trail. Never throws.
 */
export async function retryEmailLog(logId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const log = await prisma.emailLog.findUnique({ where: { id: logId } });
    if (!log) return { ok: false, error: "Email log not found." };

    const to = String(log.to || "").trim().toLowerCase();
    if (!EMAIL_RE.test(to)) {
      return { ok: false, error: "Invalid recipient address." };
    }
    if (!resend || !emailConfig.apiKey) {
      await prisma.emailLog.update({
        where: { id: log.id },
        data: { status: "FAILED", error: "RESEND_API_KEY is not configured." },
      });
      return { ok: false, error: "RESEND_API_KEY is not configured." };
    }

    await prisma.emailLog.update({
      where: { id: log.id },
      data: { status: "SENDING", error: null, attempts: { increment: 1 } },
    });

    const result = await resend.emails.send({
      from: emailConfig.from,
      to,
      subject: log.subject,
      html: log.body ?? "",
    });

    if (result.error) {
      await prisma.emailLog.update({
        where: { id: log.id },
        data: {
          status: "FAILED",
          error: String(result.error.message).slice(0, 500),
        },
      });
      return { ok: false, error: result.error.message };
    }

    const remoteId = result.data?.id ?? null;
    await prisma.emailLog.update({
      where: { id: log.id },
      data: { status: "SENT", remoteId, sentAt: new Date() },
    });
    return { ok: true };
  } catch (error: any) {
    return { ok: false, error: error?.message ? String(error.message) : "Unknown error" };
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
    const now = new Date();
    const result = await prisma.emailLog.updateMany({
      where: { remoteId },
      data: {
        status,
        ...(status === "SENT" ? { sentAt: now } : {}),
        ...(status === "DELIVERED" || status === "BOUNCED" || status === "COMPLAINED"
          ? { deliveredAt: now }
          : {}),
        ...(error ? { error: String(error).slice(0, 500) } : {}),
      },
    });
    return result.count > 0;
  } catch {
    return false;
  }
}