import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

// Active students in a class, for the admin to assign students to an exam.
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

    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    const classExists = await prisma.class.findUnique({ where: { id: params.id } });
    if (!classExists) {
      return NextResponse.json(
        { success: false, error: "Class not found." },
        { status: 404 }
      );
    }

    const students = await prisma.student.findMany({
      where: {
        classId: params.id,
        status: "ACTIVE",
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        studentId: true,
        gender: true,
        status: true,
        user: { select: { email: true } },
      },
    });

    const data = students.map((s) => ({
      ...s,
      email: s.user?.email ?? null,
      user: undefined,
    }));

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to load students. Please try again." },
      { status: 500 }
    );
  }
}