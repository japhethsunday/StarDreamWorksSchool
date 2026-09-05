import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { retryEmailLog } from "@/lib/email/send";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized. Please login." }, { status: 401 });
    }
    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden. Admin access required." }, { status: 403 });
    }

    const log = await prisma.emailLog.findUnique({ where: { id: params.id } });
    if (!log) {
      return NextResponse.json({ success: false, error: "Email log not found." }, { status: 404 });
    }
    if (log.status !== "FAILED" && log.status !== "SENDING") {
      return NextResponse.json({
        success: false,
        error: `Only failed emails can be retried (current status: ${log.status}).`,
      }, { status: 400 });
    }

    const result = await retryEmailLog(log.id);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error || "Retry failed." }, { status: 502 });
    }

    const updated = await prisma.emailLog.findUnique({ where: { id: log.id } });
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to retry email. Please try again." }, { status: 500 });
  }
}