import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { Webhook } from "standardwebhooks";
import { emailConfig } from "@/lib/email/config";
import { updateEmailStatusByRemoteId } from "@/lib/email/send";

const EVENT_STATUS_MAP: Record<string, string> = {
  "email.sent": "SENT",
  "email.delivered": "DELIVERED",
  "email.delivery_delayed": "SENDING",
  "email.complained": "COMPLAINED",
  "email.bounced": "BOUNCED",
  "email.failed": "FAILED",
};

/**
 * Legacy Resend signature format: header "Resend-Signature: t=<ts>,v1=<hex>"
 * signed over `<ts>.<payload>` with the raw secret as the HMAC key.
 */
function verifyLegacySignature(payloadRaw: string, signature: string): boolean {
  const parts = new Map<string, string>();
  for (const pair of signature.split(",")) {
    const [key, ...rest] = pair.split("=");
    if (key) parts.set(key.trim(), rest.join("="));
  }
  const timestamp = parts.get("t");
  const expected = parts.get("v1");
  if (!timestamp || !expected) return false;
  const signedContent = `${timestamp}.${payloadRaw}`;
  const computed = createHmac("sha256", emailConfig.webhookSecret ?? "")
    .update(signedContent)
    .digest("hex");
  const a = Buffer.from(computed, "hex");
  const b = Buffer.from(expected.toLowerCase(), "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const payloadRaw = await request.text();

  let payload: any;

  if (!emailConfig.webhookSecret) {
    // No secret configured — accept without verification (status-only updates).
    try {
      payload = JSON.parse(payloadRaw);
    } catch {
      return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
    }
  } else {
    // Primary: standard-webhooks (Svix) headers sent by Resend.
    const svixId = request.headers.get("svix-id");
    const svixTimestamp = request.headers.get("svix-timestamp");
    const svixSignature = request.headers.get("svix-signature");

    if (svixId && svixTimestamp && svixSignature) {
      try {
        const webhook = new Webhook(emailConfig.webhookSecret);
        payload = webhook.verify(payloadRaw, {
          "webhook-id": svixId,
          "webhook-timestamp": svixTimestamp,
          "webhook-signature": svixSignature,
        });
      } catch {
        return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
      }
    } else {
      // Fallback: legacy Resend-Signature header (only valid for legacy
      // non-standard-webhooks secrets — never for whsec_ keys).
      const legacySignature = request.headers.get("resend-signature");
      if (
        !legacySignature ||
        emailConfig.webhookSecret.startsWith("whsec_") ||
        !verifyLegacySignature(payloadRaw, legacySignature)
      ) {
        return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
      }
      try {
        payload = JSON.parse(payloadRaw);
      } catch {
        return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
      }
    }
  }

  const type = payload?.type as string;
  const eventType = EVENT_STATUS_MAP[type];
  const data = payload?.data ?? payload;
  const remoteId = data?.email_id ?? data?.id ?? payload?.id;

  if (eventType && remoteId) {
    const error =
      type === "email.bounced"
        ? data?.bounce?.message ?? "Email bounced."
        : type === "email.failed"
        ? data?.error?.message ?? "Email failed to send."
        : undefined;
    await updateEmailStatusByRemoteId(String(remoteId), eventType, error);
  }

  return new NextResponse(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}