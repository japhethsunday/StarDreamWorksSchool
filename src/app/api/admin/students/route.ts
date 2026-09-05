import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { logActivity, clientIp } from "@/lib/activity";
import { createStudentSchema } from "@/lib/validations";
import { generateStudentId } from "@/lib/utils";
import { permissionResponse } from "@/lib/permissions";
import { sendEmail } from "@/lib/email/send";
import { accountCreatedTemplate } from "@/lib/email/templates";

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
    const permCheck = await permissionResponse("MANAGE_STUDENTS");
    if (permCheck) return permCheck;

    const students = await prisma.student.findMany({
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
        class: {
          select: { id: true, name: true, level: true, section: true },
        },
        parentLinks: {
          include: {
            parent: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                user: { select: { email: true } },
              },
            },
          },
        },
        _count: {
          select: {
            submissions: true,
            grades: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: students });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch students. Please try again." },
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
    const permCheck = await permissionResponse("MANAGE_STUDENTS");
    if (permCheck) return permCheck;

    const body = await req.json();
    const validated = createStudentSchema.safeParse(body);

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
      firstName,
      lastName,
      middleName,
      email,
      password,
      dateOfBirth,
      gender,
      classId,
      parentContact,
      address,
      academicSession,
    } = validated.data;

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "A user with this email already exists." },
        { status: 409 }
      );
    }

    if (classId) {
      const classExists = await prisma.class.findUnique({
        where: { id: classId },
      });
      if (!classExists) {
        return NextResponse.json(
          { success: false, error: "Selected class does not exist." },
          { status: 400 }
        );
      }
    }

    const studentId = generateStudentId();
    const hashedPassword = await bcrypt.hash(password, 10);

    const student = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase().trim(),
          password: hashedPassword,
          name: `${firstName} ${lastName}`,
          role: "STUDENT",
          phone: parentContact,
        },
      });

      return await tx.student.create({
        data: {
          userId: user.id,
          studentId,
          firstName,
          lastName,
          middleName,
          dateOfBirth: new Date(dateOfBirth),
          gender,
          classId: classId || null,
          parentContact,
          address,
          academicSession:
            academicSession || new Date().getFullYear().toString(),
        },
        include: {
          user: {
            select: {
              email: true,
              isActive: true,
              createdAt: true,
            },
          },
          class: {
            select: { id: true, name: true, level: true },
          },
        },
      });
    });

    await logActivity(
      (session.user as any).id,
      "STUDENT_CREATE",
      `Created student ${student.firstName} ${student.lastName} (${student.studentId})`,
      clientIp(req)
    );

    // Notify the student (portal login credentials are never shown again).
    const { subject, html } = accountCreatedTemplate({
      name: `${student.firstName} ${student.lastName}`,
      role: "Student",
      email: validated.data.email,
      password: validated.data.password,
      studentId: student.studentId,
    });
    await sendEmail({
      type: "ACCOUNT_CREATED",
      to: validated.data.email,
      subject,
      html,
      refId: student.id,
    });

    return NextResponse.json({ success: true, data: student }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to create student. Please try again." },
      { status: 500 }
    );
  }
}
