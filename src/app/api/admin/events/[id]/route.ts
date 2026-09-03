import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    const event = await prisma.event.findUnique({
      where: { id: params.id },
    });

    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found." },
        { status: 404 }
      );
    }

    const body = await req.json();
    const {
      title,
      description,
      startDate,
      endDate,
      location,
      image,
      isPublished,
    } = body;

    let start = event.startDate;
    let end = event.endDate;

    if (startDate) {
      start = new Date(startDate);
      if (isNaN(start.getTime())) {
        return NextResponse.json(
          { success: false, error: "Invalid start date format." },
          { status: 400 }
        );
      }
    }

    if (endDate) {
      end = new Date(endDate);
      if (isNaN(end.getTime())) {
        return NextResponse.json(
          { success: false, error: "Invalid end date format." },
          { status: 400 }
        );
      }
    }

    if (end < start) {
      return NextResponse.json(
        { success: false, error: "End date cannot be before start date." },
        { status: 400 }
      );
    }

    const updated = await prisma.event.update({
      where: { id: event.id },
      data: {
        title: title || event.title,
        description:
          description !== undefined ? description : event.description,
        startDate: start,
        endDate: end,
        location: location !== undefined ? location : event.location,
        image: image !== undefined ? image : event.image,
        isPublished:
          typeof isPublished === "boolean"
            ? isPublished
            : event.isPublished,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update event. Please try again." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    const event = await prisma.event.findUnique({
      where: { id: params.id },
    });

    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found." },
        { status: 404 }
      );
    }

    await prisma.event.delete({ where: { id: event.id } });

    return NextResponse.json({
      success: true,
      data: { message: "Event deleted successfully." },
    });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete event. Please try again." },
      { status: 500 }
    );
  }
}
