import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { logActivity, clientIp } from "@/lib/activity";
import { createTeacherSchema } from "@/lib/validations";
import { generateTeacherId } from "@/lib/utils";
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
    const permCheck = await permissionResponse("MANAGE_TEACHERS");
    if (permCheck) return permCheck;

    const teachers = await prisma.teacher.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            email: true,
            phone: true,
            isActive: true,
            createdAt: true,
          },
        },
        classes: {
          include: {
            class: { select: { id: true, name: true, level: true } },
          },
        },
        subjects: {
          include: { subject: { select: { id: true, name: true, code: true } } },
        },
        _count: {
          select: {
            assignments: true,
            materials: true,
            gradesGiven: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: teachers });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch teachers. Please try again." },
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
    const permCheck = await permissionResponse("MANAGE_TEACHERS");
    if (permCheck) return permCheck;

    const body = await req.json();
    const validated = createTeacherSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: validated.error.errors.map((e) => e.message).join(", "),
        },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, password, phone, qualification, specialization } =
      validated.data;
    const classIds: string[] = Array.isArray(body.classIds) ? body.classIds : [];
    const subjectIds: string[] = Array.isArray(body.subjectIds) ? body.subjectIds : [];

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "A user with this email already exists." },
        { status: 409 }
      );
    }

    const teacherId = generateTeacherId();
    const hashedPassword = await bcrypt.hash(password, 10);

    const teacher = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase().trim(),
          password: hashedPassword,
          name: `${firstName} ${lastName}`,
          role: "TEACHER",
          phone,
        },
      });

      return await tx.teacher.create({
        data: {
          userId: user.id,
          teacherId,
          firstName,
          lastName,
          phone,
          qualification,
          specialization,
          classes:
            classIds.length > 0
              ? { create: classIds.map((classId: string) => ({ classId })) }
              : undefined,
          subjects:
            subjectIds.length > 0
              ? { create: subjectIds.map((subjectId: string) => ({ subjectId })) }
              : undefined,
        },
        include: {
          user: {
            select: {
              email: true,
              phone: true,
              isActive: true,
              createdAt: true,
            },
          },
        },
      });
    });

    await logActivity(
      (session.user as any).id,
      "TEACHER_CREATE",
      `Created teacher ${teacher.firstName} ${teacher.lastName} (${teacher.teacherId})`,
      clientIp(req)
    );

    return NextResponse.json({ success: true, data: teacher }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to create teacher. Please try again." },
      { status: 500 }
    );
  }
}
