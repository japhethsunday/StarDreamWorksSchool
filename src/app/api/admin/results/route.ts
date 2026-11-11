import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { permissionResponse } from "@/lib/permissions";
import { loadSheet, parseSheetQuery, saveSheet } from "@/lib/results-sheet";
import { logActivity, clientIp } from "@/lib/activity";

// GET: results sheet for one class + subject + session + term.
export async function GET(req: Request) {
  try {
    const perm = await permissionResponse("MANAGE_EXAMS");
    if (perm) return perm;
    const q = parseSheetQuery(new URL(req.url));
    if (typeof q === "string") return NextResponse.json({ success: false, error: q }, { status: 400 });
    return NextResponse.json({ success: true, data: { rows: await loadSheet(q) } });
  } catch (e) {
    console.error("ADMIN_RESULTS_GET_ERR", (e as Error)?.message);
    return NextResponse.json({ success: false, error: "Failed to load results." }, { status: 500 });
  }
}

// POST: save CA and exam scores for the sheet.
export async function POST(req: Request) {
  try {
    const perm = await permissionResponse("MANAGE_EXAMS");
    if (perm) return perm;
    const session = await getServerSession(authOptions);
    const q = parseSheetQuery(new URL(req.url));
    if (typeof q === "string") return NextResponse.json({ success: false, error: q }, { status: 400 });
    const body = await req.json().catch(() => ({}));
    if (!Array.isArray(body.rows)) return NextResponse.json({ success: false, error: "No results to save." }, { status: 400 });

    const saved = await saveSheet(q, body.rows, null);
    if (typeof saved === "string") return NextResponse.json({ success: false, error: saved }, { status: 400 });

    await logActivity((session?.user as any)?.id, "RESULTS_SAVE", `Saved ${saved} result(s) for ${q.academicSession} ${q.term} term`, clientIp(req));
    return NextResponse.json({ success: true, data: { saved, rows: await loadSheet(q) } });
  } catch (e) {
    console.error("ADMIN_RESULTS_SAVE_ERR", (e as Error)?.message);
    return NextResponse.json({ success: false, error: "Failed to save results." }, { status: 500 });
  }
}
