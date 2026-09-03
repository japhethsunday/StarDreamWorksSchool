import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { createClassSchema } from "@/lib/validations";

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

    const classes = await prisma.class.findMany({
      orderBy: [{ level: "asc" }, { name: "asc" }],
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            user: { select: { email: true } },
          },
        },
        teacherClasses: {
          include: {
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                user: { select: { email: true } },
              },
            },
          },
        },
        _count: {
          select: {
            students: true,
            classSubjects: true,
            assignments: true,
            announcements: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: classes });
  } catch (error) {
    console.error("Error listing classes:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch classes. Please try again." },
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

    const body = await req.json();
    const validated = createClassSchema.safeParse(body);

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
      name,
      section,
      level,
      classTeacherId,
      academicSession,
      capacity,
      description,
    } = validated.data;

    const existing = await prisma.class.findFirst({
      where: {
        name,
        section: section || null,
        level,
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "A class with this name, section and level already exists." },
        { status: 409 }
      );
    }

    if (classTeacherId) {
      const teacher = await prisma.teacher.findUnique({
        where: { id: classTeacherId },
      });
      if (!teacher) {
        return NextResponse.json(
          { success: false, error: "Selected class teacher does not exist." },
          { status: 400 }
        );
      }
    }

    const classRecord = await prisma.class.create({
      data: {
        name,
        section,
        level,
        classTeacherId,
        academicSession:
          academicSession || new Date().getFullYear().toString(),
        capacity,
        description,
      },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            user: { select: { email: true } },
          },
        },
        _count: {
          select: { students: true },
        },
      },
    });

    if (classTeacherId) {
      await prisma.teacherClass.create({
        data: {
          teacherId: classTeacherId,
          classId: classRecord.id,
        },
      }).catch(() => undefined);
    }

    return NextResponse.json({ success: true, data: classRecord }, { status: 201 });
  } catch (error) {
    console.error("Error creating class:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create class. Please try again." },
      { status: 500 }
    );
  }
}
