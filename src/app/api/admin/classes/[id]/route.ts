import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
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

    const classRecord = await prisma.class.findUnique({
      where: { id: params.id },
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
                subjects: {
                  include: {
                    subject: { select: { id: true, name: true, code: true } },
                  },
                },
              },
            },
          },
        },
        classSubjects: {
          include: {
            subject: {
              select: { id: true, name: true, code: true, level: true },
            },
          },
        },
        students: {
          orderBy: { lastName: "asc" },
          include: {
            user: { select: { email: true } },
            _count: { select: { grades: true } },
          },
        },
        _count: {
          select: {
            students: true,
            classSubjects: true,
            assignments: true,
            announcements: true,
            materials: true,
            grades: true,
          },
        },
      },
    });

    if (!classRecord) {
      return NextResponse.json(
        { success: false, error: "Class not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: classRecord });
  } catch (error) {
    console.error("Error fetching class:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch class. Please try again." },
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

    const classRecord = await prisma.class.findUnique({
      where: { id: params.id },
    });

    if (!classRecord) {
      return NextResponse.json(
        { success: false, error: "Class not found." },
        { status: 404 }
      );
    }

    const body = await req.json();
    const {
      name,
      section,
      level,
      classTeacherId,
      academicSession,
      capacity,
      description,
      isActive,
      teacherIds,
      subjectIds,
    } = body;

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

    const updated = await prisma.$transaction(async (tx) => {
      if (Array.isArray(teacherIds)) {
        await tx.teacherClass.deleteMany({ where: { classId: classRecord.id } });
        if (teacherIds.length > 0) {
          await tx.teacherClass.createMany({
            data: teacherIds.map((teacherId: string) => ({
              teacherId,
              classId: classRecord.id,
            })),
          });
        }
      }

      if (Array.isArray(subjectIds)) {
        await tx.classSubject.deleteMany({ where: { classId: classRecord.id } });
        if (subjectIds.length > 0) {
          await tx.classSubject.createMany({
            data: subjectIds.map((subjectId: string) => ({
              subjectId,
              classId: classRecord.id,
            })),
          });
        }
      }

      return await tx.class.update({
        where: { id: classRecord.id },
        data: {
          name: name || classRecord.name,
          section: section !== undefined ? section : classRecord.section,
          level: level || classRecord.level,
          classTeacherId:
            classTeacherId !== undefined
              ? classTeacherId
              : classRecord.classTeacherId,
          academicSession:
            academicSession !== undefined
              ? academicSession
              : classRecord.academicSession,
          capacity: capacity !== undefined ? capacity : classRecord.capacity,
          description:
            description !== undefined ? description : classRecord.description,
          isActive:
            typeof isActive === "boolean" ? isActive : classRecord.isActive,
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
          teacherClasses: {
            include: {
              teacher: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          classSubjects: {
            include: {
              subject: { select: { id: true, name: true, code: true } },
            },
          },
          _count: {
            select: { students: true },
          },
        },
      });
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating class:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update class. Please try again." },
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

    const classRecord = await prisma.class.findUnique({
      where: { id: params.id },
      include: {
        _count: { select: { students: true, assignments: true, grades: true } },
      },
    });

    if (!classRecord) {
      return NextResponse.json(
        { success: false, error: "Class not found." },
        { status: 404 }
      );
    }

    if (classRecord._count.students > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot delete class with enrolled students. Reassign students first.",
        },
        { status: 409 }
      );
    }

    await prisma.$transaction([
      prisma.teacherClass.deleteMany({ where: { classId: classRecord.id } }),
      prisma.classSubject.deleteMany({ where: { classId: classRecord.id } }),
      prisma.class.delete({ where: { id: classRecord.id } }),
    ]);

    return NextResponse.json({
      success: true,
      data: { message: "Class deleted successfully." },
    });
  } catch (error) {
    console.error("Error deleting class:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete class. Please try again." },
      { status: 500 }
    );
  }
}
