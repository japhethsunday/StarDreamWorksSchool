import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { permissionResponse } from "@/lib/permissions";
import { runEmailCampaign, RECIPIENT_CATEGORIES, type RecipientCategory } from "@/lib/email/campaigns";
import { logActivity, clientIp } from "@/lib/activity";

const PAGE_SIZE = 25;

export async function GET(req: Request) {
  const forbidden = await permissionResponse("MANAGE_EMAILS");
  if (forbidden) return forbidden;

  try {
    const url = new URL(req.url);
    const status = url.searchParams.get("status")?.trim().toUpperCase() || undefined;
    const q = url.searchParams.get("q")?.trim() || undefined;
    const page = Math.max(1, Number(url.searchParams.get("page") || "1") || 1);

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (q) where.subject = { contains: q, mode: "insensitive" as const };

    const [total, rows] = await Promise.all([
      prisma.emailCampaign.count({ where }),
      prisma.emailCampaign.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          subject: true,
          sender: true,
          categories: true,
          recipientCount: true,
          status: true,
          sentCount: true,
          deliveredCount: true,
          failedCount: true,
          error: true,
          sentByEmail: true,
          sentAt: true,
          completedAt: true,
          createdAt: true,
        },
      }),
    ]);

    return NextResponse.json({ success: true, data: rows, total, page, pageSize: PAGE_SIZE });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to load email campaigns." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const forbidden = await permissionResponse("MANAGE_EMAILS");
  if (forbidden) return forbidden;

  try {
    const session = await getServerSession(authOptions);
    const sender = await prisma.user.findUnique({
      where: { id: (session!.user as any).id },
      select: { id: true, email: true },
    });
    if (!sender) {
      return NextResponse.json({ success: false, error: "Account not found." }, { status: 404 });
    }

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 });

    const subject = String(body.subject ?? "").trim();
    const html = String(body.html ?? "").trim();
    const requestId = String(body.requestId ?? "").trim();

    if (!subject) return NextResponse.json({ success: false, error: "Email subject is required." }, { status: 400 });
    if (!html || html === "<p></p>") {
      return NextResponse.json({ success: false, error: "Email content is required." }, { status: 400 });
    }
    if (!requestId || requestId.length > 120) {
      return NextResponse.json({ success: false, error: "A valid request identifier is required." }, { status: 400 });
    }

    const categories: RecipientCategory[] = Array.isArray(body.categories)
      ? body.categories.filter((c: string) => (RECIPIENT_CATEGORIES as readonly string[]).includes(c))
      : [];
    if (categories.length === 0) {
      return NextResponse.json({ success: false, error: "Select at least one recipient category." }, { status: 400 });
    }

    const userIds: string[] | null = Array.isArray(body.userIds) && body.userIds.length > 0 ? body.userIds : null;

    // Idempotency: same requestId → return existing campaign without re-sending.
    const existing = await prisma.emailCampaign.findUnique({ where: { requestId } });
    if (existing) {
      return NextResponse.json({ success: true, data: { id: existing.id, duplicate: true } });
    }

    const result = await runEmailCampaign({
      subject,
      html,
      categories,
      userIds,
      requestId,
      sentById: sender.id,
      sentByEmail: sender.email,
    });

    await logActivity(sender.id, "SEND_BULK_EMAIL", `Sent email "${subject}" to ${result.ok ? "an audience" : "no recipients"} (campaign ${result.campaignId})`, clientIp(req));

    return NextResponse.json({
      success: result.ok,
      data: { id: result.campaignId, status: result.status, sent: result.sent, failed: result.failed },
      error: result.ok ? undefined : result.error,
    }, { status: result.ok ? 201 : 200 });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to send email. Please try again." }, { status: 500 });
  }
}