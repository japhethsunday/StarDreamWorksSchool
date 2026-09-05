import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

const DEFAULT_PREFS = {
  assignment: true,
  grade: true,
  feedback: true,
  announcements: true,
  materials: true,
  academicUpdates: true,
};

async function getUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return (session.user as any).id as string;
}

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized. Please login." }, { status: 401 });
    }

    const prefs = await prisma.notificationPreference.findUnique({
      where: { userId },
    });
    if (!prefs) {
      const created = await prisma.notificationPreference.create({
        data: { userId, ...DEFAULT_PREFS },
      });
      return NextResponse.json({ success: true, data: created });
    }
    return NextResponse.json({ success: true, data: prefs });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to load notification preferences." }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized. Please login." }, { status: 401 });
    }

    const body = await req.json();
    const keyMap: Array<keyof typeof DEFAULT_PREFS> = [
      "assignment",
      "grade",
      "feedback",
      "announcements",
      "materials",
      "academicUpdates",
    ];

    const data: Partial<typeof DEFAULT_PREFS> = {};
    for (const key of keyMap) {
      if (typeof body[key] === "boolean") data[key] = body[key];
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ success: false, error: "No valid preference values provided." }, { status: 400 });
    }

    const updated = await prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId, ...DEFAULT_PREFS, ...data },
      update: data,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to update notification preferences." }, { status: 500 });
  }
}