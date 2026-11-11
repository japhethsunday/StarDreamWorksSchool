import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { permissionResponse } from "@/lib/permissions";
import { setPublished, termStatus, TERMS } from "@/lib/results-sheet";
import { logActivity, clientIp } from "@/lib/activity";

function scopeFrom(src: { classId?: unknown; academicSession?: unknown; term?: unknown; subjectId?: unknown }) {
  const classId = typeof src.classId === "string" ? src.classId : "";
  const academicSession = typeof src.academicSession === "string" ? src.academicSession.trim() : "";
  const term = typeof src.term === "string" ? src.term : "";
  const subjectId = typeof src.subjectId === "string" && src.subjectId ? src.subjectId : null;
  if (!classId || !academicSession || !(TERMS as readonly string[]).includes(term)) return null;
  return { classId, academicSession, term, subjectId };
}

// GET: per-subject progress for a class and term.
export async function GET(req: Request) {
  try {
    const perm = await permissionResponse("MANAGE_EXAMS");
    if (perm) return perm;
    const url = new URL(req.url);
    const scope = scopeFrom(Object.fromEntries(url.searchParams));
    if (!scope) return NextResponse.json({ success: false, error: "Choose a class, session and term." }, { status: 400 });
    return NextResponse.json({ success: true, data: await termStatus(scope.classId, scope.academicSession, scope.term) });
  } catch (e) {
    console.error("ADMIN_RESULTS_STATUS_ERR", (e as Error)?.message);
    return NextResponse.json({ success: false, error: "Failed to load result status." }, { status: 500 });
  }
}

// POST { classId, academicSession, term, subjectId?, publish: boolean }
export async function POST(req: Request) {
  try {
    const perm = await permissionResponse("MANAGE_EXAMS");
    if (perm) return perm;
    const session = await getServerSession(authOptions);
    const body = await req.json().catch(() => ({}));
    const scope = scopeFrom(body);
    if (!scope) return NextResponse.json({ success: false, error: "Choose a class, session and term." }, { status: 400 });
    const publish = body.publish !== false;

    const count = await setPublished(scope, publish);
    await logActivity(
      (session?.user as any)?.id,
      publish ? "RESULTS_PUBLISH" : "RESULTS_UNPUBLISH",
      `${publish ? "Published" : "Hid"} ${count} result(s) for ${scope.academicSession} ${scope.term} term`,
      clientIp(req)
    );
    return NextResponse.json({ success: true, data: { count } });
  } catch (e) {
    console.error("ADMIN_RESULTS_PUBLISH_ERR", (e as Error)?.message);
    return NextResponse.json({ success: false, error: "Failed to update result visibility." }, { status: 500 });
  }
}
