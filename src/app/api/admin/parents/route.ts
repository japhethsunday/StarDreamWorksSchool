import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { logActivity, clientIp } from "@/lib/activity";
import { createParentSchema } from "@/lib/validations";
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
    const permCheck = await permissionResponse("MANAGE_PARENTS");
    if (permCheck) return permCheck;

    const parents = await prisma.parent.findMany({
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
        studentLinks: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                studentId: true,
                class: {
                  select: { id: true, name: true, level: true },
                },
              },
            },
          },
        },
        _count: {
          select: {
            studentLinks: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: parents });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch parents. Please try again." },
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
    const permCheck = await permissionResponse("MANAGE_PARENTS");
    if (permCheck) return permCheck;

    const body = await req.json();
    const validated = createParentSchema.safeParse(body);

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
      email,
      password,
      phone,
      address,
      occupation,
      studentIds,
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

    const hashedPassword = await bcrypt.hash(password, 10);

    const parent = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase().trim(),
          password: hashedPassword,
          name: `${firstName} ${lastName}`,
          role: "PARENT",
          phone,
        },
      });

      const createdParent = await tx.parent.create({
        data: {
          userId: user.id,
          firstName,
          lastName,
          phone,
          address,
          occupation,
        },
      });

      if (studentIds && studentIds.length > 0) {
        await tx.parentStudent.createMany({
          data: studentIds.map((studentId: string) => ({
            parentId: createdParent.id,
            studentId,
          })),
        });
      }

      return createdParent;
    });

    const fullParent = await prisma.parent.findUnique({
      where: { id: parent.id },
      include: {
        user: {
          select: {
            email: true,
            phone: true,
            isActive: true,
            createdAt: true,
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

    await logActivity(
      (session.user as any).id,
      "PARENT_CREATE",
      `Created parent ${firstName} ${lastName}`,
      clientIp(req)
    );

    return NextResponse.json({ success: true, data: fullParent }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to create parent. Please try again." },
      { status: 500 }
    );
  }
}
