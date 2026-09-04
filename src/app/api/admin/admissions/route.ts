import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { logActivity, clientIp } from "@/lib/activity";
import { permissionResponse } from "@/lib/permissions";

const VALID_STATUS = ["NEW", "CONTACTED", "APPROVED", "REJECTED"];

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized." },
        { status: 401 }
      );
    }
    const permCheck = await permissionResponse("MANAGE_ADMISSIONS");
    if (permCheck) return permCheck;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where = status && VALID_STATUS.includes(status.toUpperCase())
      ? { status: status.toUpperCase() }
      : {};

    const enquiries = await prisma.admissionEnquiry.findMany({
      where,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });

    const counts = await prisma.admissionEnquiry.groupBy({
      by: ["status"],
      _count: { _all: true },
    });

    return NextResponse.json({ success: true, data: enquiries, counts });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to load admission enquiries." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized." },
        { status: 401 }
      );
    }
    const permCheck = await permissionResponse("MANAGE_ADMISSIONS");
    if (permCheck) return permCheck;

    const { id, status } = await request.json();
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { success: false, error: "Enquiry id is required." },
        { status: 400 }
      );
    }
    if (!status || !VALID_STATUS.includes(status.toUpperCase())) {
      return NextResponse.json(
        { success: false, error: "Invalid status." },
        { status: 400 }
      );
    }

    const enquiry = await prisma.admissionEnquiry.update({
      where: { id },
      data: { status: status.toUpperCase() },
    });

    await logActivity(
      (session.user as any).id,
      "ADMISSION_STATUS",
      `Set admission enquiry for ${enquiry.childFirstName} to ${enquiry.status}`,
      clientIp(request)
    );

    return NextResponse.json({ success: true, data: enquiry });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to update enquiry." },
      { status: 500 }
    );
  }
}
