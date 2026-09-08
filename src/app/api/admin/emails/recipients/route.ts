import { NextResponse } from "next/server";
import { permissionResponse } from "@/lib/permissions";
import { recipientCounts, resolveRecipients, RECIPIENT_CATEGORIES, type RecipientCategory } from "@/lib/email/campaigns";

export async function GET(req: Request) {
  const forbidden = await permissionResponse("MANAGE_EMAILS");
  if (forbidden) return forbidden;

  try {
    const url = new URL(req.url);
    const catsParam = (url.searchParams.get("categories") || "").trim().toUpperCase();
    const categories: RecipientCategory[] = catsParam
      ? catsParam.split(",").filter((c) => (RECIPIENT_CATEGORIES as readonly string[]).includes(c)) as RecipientCategory[]
      : [];

    const counts = await recipientCounts();
    let recipients: { id: string; name: string; email: string; userId: string | null }[] = [];
    if (categories.length > 0) {
      recipients = await resolveRecipients(categories);
    }

    return NextResponse.json({
      success: true,
      categories: RECIPIENT_CATEGORIES,
      counts,
      recipients,
      total: recipients.length,
    });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to load recipients." }, { status: 500 });
  }
}