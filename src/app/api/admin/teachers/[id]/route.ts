import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

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

    const teacher = await prisma.teacher.findUnique({
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
        classes: {
          include: {
            class: {
              select: { id: true, name: true, level: true, section: true },
            },
          },
        },
        subjects: {
          include: {
            subject: { select: { id: true, name: true, code: true, level: true } },
          },
        },
        assignments: {
          include: {
            subject: { select: { id: true, name: true } },
            class: { select: { id: true, name: true } },
            _count: { select: { submissions: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        _count: {
          select: {
            classes: true,
            subjects: true,
            assignments: true,
            materials: true,
            gradesGiven: true,
          },
        },
      },
    });

    if (!teacher) {
      return NextResponse.json(
        { success: false, error: "Teacher not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: teacher });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch teacher. Please try again." },
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

    const teacher = await prisma.teacher.findUnique({
      where: { id: params.id },
      include: { user: true },
    });

    if (!teacher) {
      return NextResponse.json(
        { success: false, error: "Teacher not found." },
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
      qualification,
      specialization,
      classIds,
      subjectIds,
      isActive,
    } = body;

    if (email) {
      const existing = await prisma.user.findFirst({
        where: {
          email: email.toLowerCase().trim(),
          NOT: { id: teacher.userId },
        },
      });

      if (existing) {
        return NextResponse.json(
          { success: false, error: "A user with this email already exists." },
          { status: 409 }
        );
      }
    }

    const updatedTeacher = await prisma.$transaction(async (tx) => {
      const userData: any = {};
      if (email) {
        userData.email = email.toLowerCase().trim();
        userData.name = `${firstName || teacher.firstName} ${lastName || teacher.lastName}`;
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
          where: { id: teacher.userId },
          data: userData,
        });
      }

      if (Array.isArray(classIds)) {
        await tx.teacherClass.deleteMany({ where: { teacherId: teacher.id } });
        if (classIds.length > 0) {
          await tx.teacherClass.createMany({
            data: classIds.map((classId: string) => ({
              teacherId: teacher.id,
              classId,
            })),
          });
        }
      }

      if (Array.isArray(subjectIds)) {
        await tx.teacherSubject.deleteMany({ where: { teacherId: teacher.id } });
        if (subjectIds.length > 0) {
          await tx.teacherSubject.createMany({
            data: subjectIds.map((subjectId: string) => ({
              teacherId: teacher.id,
              subjectId,
            })),
          });
        }
      }

      return await tx.teacher.update({
        where: { id: teacher.id },
        data: {
          firstName: firstName || teacher.firstName,
          lastName: lastName || teacher.lastName,
          phone: phone !== undefined ? phone : teacher.phone,
          qualification:
            qualification !== undefined ? qualification : teacher.qualification,
          specialization:
            specialization !== undefined ? specialization : teacher.specialization,
        },
        include: {
          user: {
            select: {
              email: true,
              phone: true,
              isActive: true,
            },
          },
          classes: {
            include: { class: { select: { id: true, name: true } } },
          },
          subjects: {
            include: { subject: { select: { id: true, name: true } } },
          },
        },
      });
    });

    return NextResponse.json({ success: true, data: updatedTeacher });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to update teacher. Please try again." },
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

    const teacher = await prisma.teacher.findUnique({
      where: { id: params.id },
      include: { user: true },
    });

    if (!teacher) {
      return NextResponse.json(
        { success: false, error: "Teacher not found." },
        { status: 404 }
      );
    }

    await prisma.$transaction([
      prisma.teacherClass.deleteMany({ where: { teacherId: teacher.id } }),
      prisma.teacherSubject.deleteMany({ where: { teacherId: teacher.id } }),
      prisma.teacher.delete({ where: { id: teacher.id } }),
      prisma.user.delete({ where: { id: teacher.userId } }),
    ]);

    return NextResponse.json({
      success: true,
      data: { message: "Teacher deleted successfully." },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to delete teacher. Please try again." },
      { status: 500 }
    );
  }
}
