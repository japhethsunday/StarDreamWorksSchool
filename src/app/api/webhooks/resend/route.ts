import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { emailConfig } from "@/lib/email/config";
import { updateEmailStatusByRemoteId } from "@/lib/email/send";

const EVENT_STATUS_MAP: Record<string, string> = {
  "email.sent": "SENT",
  "email.delivered": "DELIVERED",
  "email.delivery_delayed": "SENDING",
  "email.complained": "COMPLAINED",
  "email.bounced": "BOUNCED",
  "email.rejected": "REJECTED",
};

function verifySignature(payloadRaw: string, signature: string | null): boolean {
  if (!emailConfig.webhookSecret) return true;
  if (!signature) return false;
  const parts = new Map<string, string>();
  for (const pair of signature.split(",")) {
    const [key, ...rest] = pair.split("=");
    if (key) parts.set(key.trim(), rest.join("="));
  }
  const timestamp = parts.get("t");
  const expected = parts.get("v1");
  if (!timestamp || !expected) return false;
  const signedContent = `${timestamp}.${payloadRaw}`;
  const computed = createHmac("sha256", emailConfig.webhookSecret)
    .update(signedContent)
    .digest("hex");
  const a = Buffer.from(computed, "hex");
  const b = Buffer.from(expected.toLowerCase(), "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const payloadRaw = await request.text();
  const signature = request.headers.get("resend-signature");

  if (!verifySignature(payloadRaw, signature)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(payloadRaw);
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const type = payload?.type as string;
  const eventType = EVENT_STATUS_MAP[type];
  const data = payload?.data ?? payload;
  const remoteId = data?.email_id ?? data?.id ?? payload?.id;

  if (eventType && remoteId) {
    const error = type === "email.bounced" ? data?.bounce?.message ?? "Email bounced." : undefined;
    await updateEmailStatusByRemoteId(String(remoteId), eventType, error);
  }

  return new NextResponse(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}