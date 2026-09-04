import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { logActivity, clientIp } from "@/lib/activity";
import { createEventSchema } from "@/lib/validations";
import { permissionResponse } from "@/lib/permissions";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please login." },
        { status: 401 }
      );
    }

    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }
    const permCheck = await permissionResponse("MANAGE_EVENTS");
    if (permCheck) return permCheck;

    const events = await prisma.event.findMany({
      orderBy: { startDate: "desc" },
    });

    return NextResponse.json({ success: true, data: events });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch events. Please try again." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please login." },
        { status: 401 }
      );
    }

    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }
    const permCheck = await permissionResponse("MANAGE_EVENTS");
    if (permCheck) return permCheck;

    const body = await req.json();
    const validated = createEventSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: validated.error.errors.map((e) => e.message).join(", "),
        },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      startDate,
      endDate,
      location,
      image,
      isPublished,
    } = validated.data;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { success: false, error: "Invalid date format." },
        { status: 400 }
      );
    }

    if (end < start) {
      return NextResponse.json(
        { success: false, error: "End date cannot be before start date." },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        startDate: start,
        endDate: end,
        location,
        image,
        isPublished,
      },
    });

    await logActivity(
      (session.user as any).id,
      isPublished ? "EVENT_PUBLISH" : "EVENT_CREATE",
      `${isPublished ? "Published" : "Created"} event "${event.title}"`,
      clientIp(req)
    );

    return NextResponse.json({ success: true, data: event }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to create event. Please try again." },
      { status: 500 }
    );
  }
}
