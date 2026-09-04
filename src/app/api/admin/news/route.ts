import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { logActivity, clientIp } from "@/lib/activity";
import { createNewsSchema } from "@/lib/validations";
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
    const permCheck = await permissionResponse("MANAGE_NEWS");
    if (permCheck) return permCheck;

    const news = await prisma.news.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: news });
  } catch {
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
    const permCheck = await permissionResponse("MANAGE_NEWS");
    if (permCheck) return permCheck;

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

    await logActivity(
      (session.user as any).id,
      isPublished ? "NEWS_PUBLISH" : "NEWS_CREATE",
      `${isPublished ? "Published" : "Created"} news "${article.title}"`,
      clientIp(req)
    );

    return NextResponse.json({ success: true, data: article }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to create news. Please try again." },
      { status: 500 }
    );
  }
}
