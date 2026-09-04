import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { createSubjectSchema } from "@/lib/validations";

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

    const subjects = await prisma.subject.findMany({
      orderBy: [{ level: "asc" }, { name: "asc" }],
      include: {
        teacherSubjects: {
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
            teacherSubjects: true,
            classSubjects: true,
            assignments: true,
            grades: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: subjects });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch subjects. Please try again." },
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
    const validated = createSubjectSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: validated.error.errors.map((e) => e.message).join(", "),
        },
        { status: 400 }
      );
    }

    const { name, code, description, level } = validated.data;

    const existing = await prisma.subject.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "A subject with this code already exists." },
        { status: 409 }
      );
    }

    const subject = await prisma.subject.create({
      data: {
        name,
        code: code.toUpperCase(),
        description,
        level,
      },
      include: {
        _count: {
          select: {
            teacherSubjects: true,
            classSubjects: true,
            assignments: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: subject }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to create subject. Please try again." },
      { status: 500 }
    );
  }
}
