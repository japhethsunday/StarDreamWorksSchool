import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

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

    const material = await prisma.learningMaterial.findUnique({
      where: { id: params.id },
    });

    if (!material) {
      return NextResponse.json(
        { success: false, error: "Material not found." },
        { status: 404 }
      );
    }

    if (material.teacherId !== teacher.id) {
      return NextResponse.json(
        { success: false, error: "You do not have access to this material." },
        { status: 403 }
      );
    }

    await prisma.learningMaterial.delete({ where: { id: material.id } });

    return NextResponse.json({
      success: true,
      data: { message: "Material deleted successfully." },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to delete material. Please try again." },
      { status: 500 }
    );
  }
}
