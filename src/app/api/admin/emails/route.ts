import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/send";
import { sendTestTemplate } from "@/lib/email/templates";

const PAGE_SIZE_DEFAULT = 25;
const PAGE_SIZE_MAX = 100;

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized. Please login." }, { status: 401 });
    }
    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden. Admin access required." }, { status: 403 });
    }

    const url = new URL(req.url);
    const status = url.searchParams.get("status") || undefined;
    const type = url.searchParams.get("type") || undefined;
    const q = url.searchParams.get("q")?.trim() || undefined;
    const from = url.searchParams.get("from") || undefined;
    const page = Math.max(1, Number(url.searchParams.get("page") || "1") || 1);
    const pageSize = Math.min(
      PAGE_SIZE_MAX,
      Math.max(1, Number(url.searchParams.get("pageSize") || String(PAGE_SIZE_DEFAULT)) || PAGE_SIZE_DEFAULT)
    );

    const where: Record<string, unknown> = {};
    if (status) where.status = status.toUpperCase();
    if (type) where.type = type.toUpperCase();
    if (from) {
      const start = new Date(`${from}T00:00:00Z`);
      const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
      where.createdAt = { gte: start, lt: end };
    }
    if (q) {
      where.OR = [
        { to: { contains: q, mode: "insensitive" as const } },
        { subject: { contains: q, mode: "insensitive" as const } },
        { refId: { contains: q, mode: "insensitive" as const } },
        { remoteId: { contains: q, mode: "insensitive" as const } },
      ];
    }

    const [total, rows, counts] = await Promise.all([
      prisma.emailLog.count({ where }),
      prisma.emailLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          type: true,
          to: true,
          subject: true,
          status: true,
          error: true,
          remoteId: true,
          refId: true,
          attempts: true,
          sentAt: true,
          deliveredAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.emailLog.groupBy({ by: ["status"], _count: { _all: true } }),
    ]);

    const countMap: Record<string, number> = {};
    for (const c of counts) countMap[c.status] = c._count._all;

    return NextResponse.json({
      success: true,
      data: rows,
      counts: {
        total,
        ...countMap,
        failed: countMap["FAILED"] ?? 0,
      },
      page,
      pageSize,
    });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to load email logs. Please try again." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized. Please login." }, { status: 401 });
    }
    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden. Admin access required." }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: { id: true, email: true, name: true },
    });
    if (!user) {
      return NextResponse.json({ success: false, error: "Account not found." }, { status: 404 });
    }

    const { subject, html } = sendTestTemplate();
    const result = await sendEmail({
      type: "SYSTEM_ALERT",
      to: user.email,
      subject,
      html,
      refId: `email-test:${user.email}:${Date.now()}`,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      data: { logId: result.logId, remoteId: result.remoteId, skipped: result.skipped },
      message: result.ok ? "Test email queued." : "Test email could not be sent. See email logs.",
    });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to send test email. Please try again." }, { status: 500 });
  }
}