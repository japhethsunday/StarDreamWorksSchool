import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { permissionResponse } from "@/lib/permissions";

const PAGE_SIZE = 100;

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const forbidden = await permissionResponse("MANAGE_EMAILS");
  if (forbidden) return forbidden;

  try {
    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page") || "1") || 1);

    const campaign = await prisma.emailCampaign.findUnique({
      where: { id: params.id },
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
        body: true,
        sentByEmail: true,
        sentAt: true,
        completedAt: true,
        createdAt: true,
      },
    });
    if (!campaign) {
      return NextResponse.json({ success: false, error: "Campaign not found." }, { status: 404 });
    }

    const [total, logs] = await Promise.all([
      prisma.emailLog.count({ where: { campaignId: campaign.id } }),
      prisma.emailLog.findMany({
        where: { campaignId: campaign.id },
        orderBy: { createdAt: "asc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          to: true,
          subject: true,
          status: true,
          error: true,
          remoteId: true,
          attempts: true,
          sentAt: true,
          deliveredAt: true,
          createdAt: true,
        },
      }),
    ]);

    return NextResponse.json({ success: true, data: campaign, logs, total, page });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to load campaign." }, { status: 500 });
  }
}