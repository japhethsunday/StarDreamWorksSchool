import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { logActivity, clientIp } from "@/lib/activity";
import { permissionResponse } from "@/lib/permissions";
import { sendEmail } from "@/lib/email/send";
import { passwordResetTemplate } from "@/lib/email/templates";
import { sendAccountStatusEmail } from "@/lib/email/notifications";

export async function GET(
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
    const permCheck = await permissionResponse("MANAGE_STUDENTS");
    if (permCheck) return permCheck;

    const student = await prisma.student.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            email: true,
            phone: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            level: true,
            section: true,
            academicSession: true,
          },
        },
        parentLinks: {
          include: {
            parent: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                address: true,
                occupation: true,
                user: { select: { email: true } },
              },
            },
          },
        },
        submissions: {
          include: {
            assignment: {
              select: {
                id: true,
                title: true,
                subject: { select: { name: true } },
                dueDate: true,
              },
            },
          },
          orderBy: { submittedAt: "desc" },
        },
        grades: {
          include: {
            subject: { select: { id: true, name: true, code: true } },
            class: { select: { id: true, name: true } },
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: [{ academicSession: "desc" }, { term: "asc" }],
        },
        _count: {
          select: {
            submissions: true,
            grades: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: "Student not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: student });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch student. Please try again." },
      { status: 500 }
    );
  }
}

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
    const permCheck = await permissionResponse("MANAGE_STUDENTS");
    if (permCheck) return permCheck;

    const student = await prisma.student.findUnique({
      where: { id: params.id },
      include: { user: true },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: "Student not found." },
        { status: 404 }
      );
    }

    const wasActive = student.user.isActive;
    const body = await req.json();
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
      status,
      parentIds,
      isActive,
    } = body;
    const nextActive = typeof isActive === "boolean" ? isActive : wasActive;

    if (email) {
      const existing = await prisma.user.findFirst({
        where: {
          email: email.toLowerCase().trim(),
          NOT: { id: student.userId },
        },
      });

      if (existing) {
        return NextResponse.json(
          { success: false, error: "A user with this email already exists." },
          { status: 409 }
        );
      }
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

    const updatedStudent = await prisma.$transaction(async (tx) => {
      const userData: any = {};
      if (email) {
        userData.email = email.toLowerCase().trim();
        userData.name = `${firstName || student.firstName} ${lastName || student.lastName}`;
      }
      if (password) {
        userData.password = await bcrypt.hash(password, 10);
      }
      if (typeof isActive === "boolean") {
        userData.isActive = isActive;
      }
      if (parentContact) userData.phone = parentContact;

      if (Object.keys(userData).length > 0) {
        await tx.user.update({
          where: { id: student.userId },
          data: userData,
        });
      }

      if (Array.isArray(parentIds)) {
        await tx.parentStudent.deleteMany({ where: { studentId: student.id } });
        if (parentIds.length > 0) {
          await tx.parentStudent.createMany({
            data: parentIds.map((parentId: string) => ({
              parentId,
              studentId: student.id,
            })),
          });
        }
      }

      return await tx.student.update({
        where: { id: student.id },
        data: {
          firstName: firstName || student.firstName,
          lastName: lastName || student.lastName,
          middleName:
            middleName !== undefined ? middleName : student.middleName,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : student.dateOfBirth,
          gender: gender || student.gender,
          classId: classId !== undefined ? classId : student.classId,
          parentContact:
            parentContact !== undefined ? parentContact : student.parentContact,
          address: address !== undefined ? address : student.address,
          academicSession:
            academicSession !== undefined
              ? academicSession
              : student.academicSession,
          status: status || student.status,
        },
        include: {
          user: {
            select: {
              email: true,
              isActive: true,
            },
          },
          class: {
            select: { id: true, name: true, level: true },
          },
          parentLinks: {
            include: {
              parent: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  user: { select: { email: true } },
                },
              },
            },
          },
        },
      });
    });

    await logActivity(
      (session.user as any).id,
      "STUDENT_UPDATE",
      `Updated student ${updatedStudent.firstName} ${updatedStudent.lastName}`,
      clientIp(req)
    );

    if (password) {
      const { subject, html } = passwordResetTemplate({
        name: `${updatedStudent.firstName} ${updatedStudent.lastName}`,
        email: updatedStudent.user.email,
        password,
        actor: "by the school administration",
      });
      await sendEmail({
        type: "PASSWORD_RESET",
        to: updatedStudent.user.email,
        subject,
        html,
        refId: updatedStudent.id,
        userId: updatedStudent.userId,
      });
    }

    if (wasActive !== nextActive) {
      await sendAccountStatusEmail({
        userId: updatedStudent.userId,
        name: `${updatedStudent.firstName} ${updatedStudent.lastName}`,
        email: updatedStudent.user.email,
        activated: nextActive,
      });
    }

    return NextResponse.json({ success: true, data: updatedStudent });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to update student. Please try again." },
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
    const permCheck = await permissionResponse("MANAGE_STUDENTS");
    if (permCheck) return permCheck;

    const student = await prisma.student.findUnique({
      where: { id: params.id },
      include: { user: true },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: "Student not found." },
        { status: 404 }
      );
    }

    await prisma.$transaction([
      prisma.parentStudent.deleteMany({ where: { studentId: student.id } }),
      prisma.student.delete({ where: { id: student.id } }),
      prisma.user.delete({ where: { id: student.userId } }),
    ]);

    await logActivity(
      (session.user as any).id,
      "STUDENT_DELETE",
      `Deleted student ${student.firstName} ${student.lastName}`,
      clientIp(req)
    );

    return NextResponse.json({
      success: true,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to delete student. Please try again." },
      { status: 500 }
    );
  }
}
