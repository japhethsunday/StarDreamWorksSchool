import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { logActivity, clientIp } from "@/lib/activity";
import { permissionResponse } from "@/lib/permissions";
import { sendEmail } from "@/lib/email/send";
import { passwordResetTemplate } from "@/lib/email/templates";

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
    const permCheck = await permissionResponse("MANAGE_PARENTS");
    if (permCheck) return permCheck;

    const parent = await prisma.parent.findUnique({
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
        studentLinks: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                studentId: true,
                gender: true,
                dateOfBirth: true,
                class: {
                  select: { id: true, name: true, level: true },
                },
                _count: {
                  select: { grades: true, submissions: true },
                },
              },
            },
          },
        },
        _count: {
          select: { studentLinks: true },
        },
      },
    });

    if (!parent) {
      return NextResponse.json(
        { success: false, error: "Parent not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: parent });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch parent. Please try again." },
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
    const permCheck = await permissionResponse("MANAGE_PARENTS");
    if (permCheck) return permCheck;

    const parent = await prisma.parent.findUnique({
      where: { id: params.id },
      include: { user: true },
    });

    if (!parent) {
      return NextResponse.json(
        { success: false, error: "Parent not found." },
        { status: 404 }
      );
    }

    const body = await req.json();
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      address,
      occupation,
      studentIds,
      isActive,
    } = body;

    if (email) {
      const existing = await prisma.user.findFirst({
        where: {
          email: email.toLowerCase().trim(),
          NOT: { id: parent.userId },
        },
      });

      if (existing) {
        return NextResponse.json(
          { success: false, error: "A user with this email already exists." },
          { status: 409 }
        );
      }
    }

    if (studentIds && studentIds.length > 0) {
      const count = await prisma.student.count({
        where: { id: { in: studentIds } },
      });
      if (count !== studentIds.length) {
        return NextResponse.json(
          { success: false, error: "One or more selected students do not exist." },
          { status: 400 }
        );
      }
    }

    const updatedParent = await prisma.$transaction(async (tx) => {
      const userData: any = {};
      if (email) {
        userData.email = email.toLowerCase().trim();
        userData.name = `${firstName || parent.firstName} ${lastName || parent.lastName}`;
      }
      if (password) {
        userData.password = await bcrypt.hash(password, 10);
      }
      if (typeof isActive === "boolean") {
        userData.isActive = isActive;
      }
      if (phone) userData.phone = phone;

      if (Object.keys(userData).length > 0) {
        await tx.user.update({
          where: { id: parent.userId },
          data: userData,
        });
      }

      if (Array.isArray(studentIds)) {
        await tx.parentStudent.deleteMany({ where: { parentId: parent.id } });
        if (studentIds.length > 0) {
          await tx.parentStudent.createMany({
            data: studentIds.map((studentId: string) => ({
              parentId: parent.id,
              studentId,
            })),
          });
        }
      }

      return await tx.parent.update({
        where: { id: parent.id },
        data: {
          firstName: firstName || parent.firstName,
          lastName: lastName || parent.lastName,
          phone: phone !== undefined ? phone : parent.phone,
          address: address !== undefined ? address : parent.address,
          occupation:
            occupation !== undefined ? occupation : parent.occupation,
        },
        include: {
          user: {
            select: {
              email: true,
              phone: true,
              isActive: true,
            },
          },
          studentLinks: {
            include: {
              student: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  studentId: true,
                },
              },
            },
          },
        },
      });
    });

    await logActivity(
      (session.user as any).id,
      "PARENT_UPDATE",
      `Updated parent ${updatedParent.firstName} ${updatedParent.lastName}`,
      clientIp(req)
    );

    if (password) {
      const { subject, html } = passwordResetTemplate({
        name: `${updatedParent.firstName} ${updatedParent.lastName}`,
        email: updatedParent.user.email,
        password,
        actor: "by the school administration",
      });
      await sendEmail({
        type: "PASSWORD_RESET",
        to: updatedParent.user.email,
        subject,
        html,
        refId: updatedParent.id,
      });
    }

    return NextResponse.json({ success: true, data: updatedParent });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to update parent. Please try again." },
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
    const permCheck = await permissionResponse("MANAGE_PARENTS");
    if (permCheck) return permCheck;

    const parent = await prisma.parent.findUnique({
      where: { id: params.id },
      include: { user: true },
    });

    if (!parent) {
      return NextResponse.json(
        { success: false, error: "Parent not found." },
        { status: 404 }
      );
    }

    await prisma.$transaction([
      prisma.parentStudent.deleteMany({ where: { parentId: parent.id } }),
      prisma.parent.delete({ where: { id: parent.id } }),
      prisma.user.delete({ where: { id: parent.userId } }),
    ]);

    await logActivity(
      (session.user as any).id,
      "PARENT_DELETE",
      `Deleted parent ${parent.firstName} ${parent.lastName}`,
      clientIp(req)
    );

    return NextResponse.json({
      success: true,
      data: { message: "Parent deleted successfully." },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to delete parent. Please try again." },
      { status: 500 }
    );
  }
}
