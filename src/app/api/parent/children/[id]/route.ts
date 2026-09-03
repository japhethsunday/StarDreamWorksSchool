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

    if ((session.user as any).role !== "PARENT") {
      return NextResponse.json(
        { success: false, error: "Forbidden. Parent access required." },
        { status: 403 }
      );
    }

    const childId = params.id;

    const parent = await prisma.parent.findUnique({
      where: { userId: (session.user as any).id },
    });

    if (!parent) {
      return NextResponse.json(
        { success: false, error: "Parent profile not found." },
        { status: 404 }
      );
    }

    const link = await prisma.parentStudent.findUnique({
      where: {
        parentId_studentId: {
          parentId: parent.id,
          studentId: childId,
        },
      },
      include: {
        student: {
          include: {
            user: { select: { email: true, phone: true } },
            class: {
              select: {
                id: true,
                name: true,
                level: true,
                section: true,
              },
            },
          },
        },
      },
    });

    if (!link) {
      return NextResponse.json(
        { success: false, error: "Child not found or not linked to your account." },
        { status: 404 }
      );
    }

    const student = link.student;

    const [grades, assignments, avgRows] = await Promise.all([
      prisma.grade.findMany({
        where: { studentId: student.id },
        orderBy: { createdAt: "desc" },
        include: { subject: { select: { name: true } } },
      }),
      prisma.assignment.findMany({
        where: student.classId ? { classId: student.classId } : { id: "none" },
        orderBy: { dueDate: "desc" },
        include: {
          subject: { select: { name: true } },
          submissions: {
            where: { studentId: student.id },
          },
        },
      }),
      prisma.grade.aggregate({
        where: { studentId: student.id },
        _avg: { score: true },
      }),
    ]);

    const pendingAssignments = await prisma.submission.count({
      where: {
        studentId: student.id,
        status: { in: ["PENDING", "SUBMITTED", "LATE"] },
      },
    });

    const data = {
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      studentId: student.studentId,
      gender: student.gender,
      className: student.class?.name ?? null,
      class: student.class,
      status: student.status,
      email: student.user?.email ?? null,
      average: avgRows._avg.score != null ? Number(avgRows._avg.score.toFixed(1)) : "—",
      pendingAssignments,
      grades: grades.map((g) => ({
        id: g.id,
        subject: { name: g.subject.name },
        score: g.score,
        grade: g.grade,
        term: g.term,
      })),
      assignments: assignments.map((a) => {
        const sub = a.submissions[0];
        return {
          id: a.id,
          title: a.title,
          subject: { name: a.subject.name },
          dueDate: a.dueDate,
          status: sub ? sub.status : "PENDING",
          grade: sub?.grade ?? null,
          maxScore: a.maxScore,
        };
      }),
    };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching child profile:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load child profile. Please try again." },
      { status: 500 }
    );
  }
}
