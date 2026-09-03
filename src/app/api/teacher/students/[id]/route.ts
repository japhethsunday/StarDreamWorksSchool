import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
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

    if ((session.user as any).role !== "TEACHER") {
      return NextResponse.json(
        { success: false, error: "Forbidden. Teacher access required." },
        { status: 403 }
      );
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: (session.user as any).id },
    });

    if (!teacher) {
      return NextResponse.json(
        { success: false, error: "Teacher profile not found." },
        { status: 404 }
      );
    }

    const student = await prisma.student.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { email: true, phone: true } },
        class: {
          select: { id: true, name: true, level: true, section: true },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: "Student not found." },
        { status: 404 }
      );
    }

    if (!student.class?.id) {
      return NextResponse.json(
        { success: false, error: "Student has no class assigned." },
        { status: 404 }
      );
    }

    const teachesClass = await prisma.teacherClass.findUnique({
      where: {
        teacherId_classId: {
          teacherId: teacher.id,
          classId: student.class.id,
        },
      },
    });

    if (!teachesClass) {
      return NextResponse.json(
        { success: false, error: "You do not teach this student's class." },
        { status: 403 }
      );
    }

    const [grades, submissions] = await Promise.all([
      prisma.grade.findMany({
        where: { studentId: student.id },
        orderBy: { createdAt: "desc" },
        include: { subject: { select: { name: true } } },
      }),
      prisma.submission.findMany({
        where: { studentId: student.id },
        orderBy: { submittedAt: "desc" },
        include: {
          assignment: {
            select: {
              title: true,
              subject: { select: { name: true } },
            },
          },
        },
      }),
    ]);

    const data = {
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      middleName: student.middleName,
      studentId: student.studentId,
      gender: student.gender,
      status: student.status,
      className: student.class.name,
      class: student.class,
      email: student.user?.email ?? null,
      grades: grades.map((g) => ({
        id: g.id,
        subject: g.subject,
        term: g.term,
        academicSession: g.academicSession,
        score: g.score,
        grade: g.grade,
        remarks: g.remarks,
      })),
      submissions,
    };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching teacher student profile:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load student profile. Please try again." },
      { status: 500 }
    );
  }
}
