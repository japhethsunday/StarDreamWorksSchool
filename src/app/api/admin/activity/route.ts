import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { permissionResponse } from "@/lib/permissions";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const denied = await permissionResponse("VIEW_ACTIVITY");
    if (denied) return denied;

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const role = searchParams.get("role");
    const action = searchParams.get("action");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const limitRaw = searchParams.get("limit");

    const limit = Math.min(
      Math.max(parseInt(limitRaw || "100", 10) || 100, 1),
      500
    );

    const where: Prisma.ActivityLogWhereInput = {};

    if (userId && userId.trim()) {
      where.userId = userId.trim();
    }

    if (role && role.trim()) {
      where.user = { role: role.trim().toUpperCase() };
    }

    if (action && action.trim()) {
      where.action = { contains: action.trim().toUpperCase() };
    }

    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const [total, logs] = await Promise.all([
      prisma.activityLog.count({ where }),
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      }),
    ]);

    return NextResponse.json({ success: true, data: logs, total });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to load activity. Please try again." },
      { status: 500 }
    );
  }
}