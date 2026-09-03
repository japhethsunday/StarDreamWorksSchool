import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { createNewsSchema } from "@/lib/validations";

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

    const news = await prisma.news.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: news });
  } catch (error) {
    console.error("Error listing news:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch news. Please try again." },
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

    const body = await req.json();
    const validated = createNewsSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: validated.error.errors.map((e) => e.message).join(", "),
        },
        { status: 400 }
      );
    }

    const { title, content, excerpt, image, isPublished } = validated.data;

    const article = await prisma.news.create({
      data: {
        title,
        content,
        excerpt,
        image,
        authorId: (session.user as any).id,
        isPublished,
        publishedAt: isPublished ? new Date() : null,
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ success: true, data: article }, { status: 201 });
  } catch (error) {
    console.error("Error creating news:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create news. Please try again." },
      { status: 500 }
    );
  }
}
