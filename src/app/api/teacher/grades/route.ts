import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { calculateGrade } from "@/lib/utils";

export async function GET(req: Request) {
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

    const url = new URL(req.url);
    const classId = url.searchParams.get("classId");
    const subjectId = url.searchParams.get("subjectId");
    const term = url.searchParams.get("term");
    const academicSession =
      url.searchParams.get("academicSession") ||
      new Date().getFullYear().toString();

    const grades = await prisma.grade.findMany({
      where: {
        teacherId: teacher.id,
        ...(classId ? { classId } : {}),
        ...(subjectId ? { subjectId } : {}),
        ...(term ? { term } : {}),
        academicSession,
      },
      orderBy: [{ student: { lastName: "asc" } }],
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            firstName: true,
            lastName: true,
            class: { select: { id: true, name: true } },
          },
        },
        subject: { select: { id: true, name: true, code: true } },
        class: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, data: grades });
  } catch (error) {
    console.error("Error fetching grades:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch grades. Please try again." },
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

    const body = await req.json();
    const { studentId, subjectId, classId, academicSession, term, score, remarks } = body;

    if (!studentId || !subjectId || !classId) {
      return NextResponse.json(
        { success: false, error: "studentId, subjectId and classId are required." },
        { status: 400 }
      );
    }

    if (score === undefined || score === null) {
      return NextResponse.json(
        { success: false, error: "Score is required." },
        { status: 400 }
      );
    }

    const numericScore = Number(score);
    if (isNaN(numericScore) || numericScore < 0 || numericScore > 100) {
      return NextResponse.json(
        { success: false, error: "Score must be between 0 and 100." },
        { status: 400 }
      );
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student || student.classId !== classId) {
      return NextResponse.json(
        { success: false, error: "Student not found in the selected class." },
        { status: 400 }
      );
    }

    const classExists = await prisma.teacherClass.findUnique({
      where: {
        teacherId_classId: { teacherId: teacher.id, classId },
      },
    });

    if (!classExists) {
      return NextResponse.json(
        { success: false, error: "You do not teach this class." },
        { status: 403 }
      );
    }

    const subjectExists = await prisma.teacherSubject.findUnique({
      where: {
        teacherId_subjectId: { teacherId: teacher.id, subjectId },
      },
    });

    if (!subjectExists) {
      return NextResponse.json(
        { success: false, error: "You do not teach this subject." },
        { status: 403 }
      );
    }

    const sessionTerm = term || "FIRST";
    const validTerms = ["FIRST", "SECOND", "THIRD"];
    if (!validTerms.includes(sessionTerm)) {
      return NextResponse.json(
        { success: false, error: "Invalid term." },
        { status: 400 }
      );
    }

    const finalSession =
      academicSession || new Date().getFullYear().toString();
    const letterGrade = calculateGrade(numericScore);

    const existing = await prisma.grade.findFirst({
      where: {
        studentId,
        subjectId,
        classId,
        academicSession: finalSession,
        term: sessionTerm,
      },
    });

    let grade;
    if (existing) {
      grade = await prisma.grade.update({
        where: { id: existing.id },
        data: {
          score: numericScore,
          grade: letterGrade,
          remarks,
          teacherId: teacher.id,
        },
      });
    } else {
      grade = await prisma.grade.create({
        data: {
          studentId,
          subjectId,
          classId,
          academicSession: finalSession,
          term: sessionTerm,
          score: numericScore,
          grade: letterGrade,
          remarks,
          teacherId: teacher.id,
        },
      });
    }

    const fullGrade = await prisma.grade.findUnique({
      where: { id: grade.id },
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            firstName: true,
            lastName: true,
          },
        },
        subject: { select: { id: true, name: true, code: true } },
        class: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(
      { success: true, data: fullGrade },
      { status: existing ? 200 : 201 }
    );
  } catch (error) {
    console.error("Error saving grade:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save grade. Please try again." },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  return POST(req);
}
