import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { logActivity, clientIp } from "@/lib/activity";

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

    const article = await prisma.news.findUnique({
      where: { id: params.id },
    });

    if (!article) {
      return NextResponse.json(
        { success: false, error: "News article not found." },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { title, content, excerpt, image, isPublished } = body;

    const updated = await prisma.news.update({
      where: { id: article.id },
      data: {
        title: title || article.title,
        content: content || article.content,
        excerpt: excerpt !== undefined ? excerpt : article.excerpt,
        image: image !== undefined ? image : article.image,
        isPublished:
          typeof isPublished === "boolean"
            ? isPublished
            : article.isPublished,
        publishedAt:
          typeof isPublished === "boolean" && isPublished && !article.publishedAt
            ? new Date()
            : article.publishedAt,
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
    });

    await logActivity(
      (session.user as any).id,
      updated.isPublished ? "NEWS_PUBLISH" : "NEWS_UPDATE",
      `${updated.isPublished ? "Published" : "Updated"} news "${updated.title}"`,
      clientIp(req)
    );

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to update news. Please try again." },
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

    const article = await prisma.news.findUnique({
      where: { id: params.id },
    });

    if (!article) {
      return NextResponse.json(
        { success: false, error: "News article not found." },
        { status: 404 }
      );
    }

    await prisma.news.delete({ where: { id: article.id } });

    await logActivity(
      (session.user as any).id,
      "NEWS_DELETE",
      `Deleted news "${article.title}"`,
      clientIp(req)
    );

    return NextResponse.json({
      success: true,
      data: { message: "News article deleted successfully." },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to delete news. Please try again." },
      { status: 500 }
    );
  }
}
