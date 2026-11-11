import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { loadSheet, parseSheetQuery, saveSheet, type SheetQuery } from "@/lib/results-sheet";
import { logActivity, clientIp } from "@/lib/activity";

async function authorize(q: SheetQuery | null) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: NextResponse.json({ success: false, error: "Unauthorized. Please login." }, { status: 401 }) };
  if ((session.user as any).role !== "TEACHER") return { error: NextResponse.json({ success: false, error: "Forbidden. Teacher access required." }, { status: 403 }) };
  const teacher = await prisma.teacher.findUnique({ where: { userId: (session.user as any).id } });
  if (!teacher) return { error: NextResponse.json({ success: false, error: "Teacher profile not found." }, { status: 404 }) };
  if (q) {
    const [cls, subj] = await Promise.all([
      prisma.teacherClass.findUnique({ where: { teacherId_classId: { teacherId: teacher.id, classId: q.classId } } }),
      prisma.teacherSubject.findUnique({ where: { teacherId_subjectId: { teacherId: teacher.id, subjectId: q.subjectId } } }),
    ]);
    if (!cls) return { error: NextResponse.json({ success: false, error: "You do not teach this class." }, { status: 403 }) };
    if (!subj) return { error: NextResponse.json({ success: false, error: "You do not teach this subject." }, { status: 403 }) };
  }
  return { session, teacher };
}

export async function GET(req: Request) {
  try {
    const q = parseSheetQuery(new URL(req.url));
    if (typeof q === "string") return NextResponse.json({ success: false, error: q }, { status: 400 });
    const auth = await authorize(q);
    if (auth.error) return auth.error;
    return NextResponse.json({ success: true, data: { rows: await loadSheet(q) } });
  } catch (e) {
    console.error("TEACHER_RESULTS_GET_ERR", (e as Error)?.message);
    return NextResponse.json({ success: false, error: "Failed to load results." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const q = parseSheetQuery(new URL(req.url));
    if (typeof q === "string") return NextResponse.json({ success: false, error: q }, { status: 400 });
    const auth = await authorize(q);
    if (auth.error) return auth.error;
    const body = await req.json().catch(() => ({}));
    if (!Array.isArray(body.rows)) return NextResponse.json({ success: false, error: "No results to save." }, { status: 400 });

    const saved = await saveSheet(q, body.rows, auth.teacher!.id);
    if (typeof saved === "string") return NextResponse.json({ success: false, error: saved }, { status: 400 });

    await logActivity((auth.session!.user as any).id, "RESULTS_SAVE", `Saved ${saved} result(s) for ${q.academicSession} ${q.term} term`, clientIp(req));
    return NextResponse.json({ success: true, data: { saved, rows: await loadSheet(q) } });
  } catch (e) {
    console.error("TEACHER_RESULTS_SAVE_ERR", (e as Error)?.message);
    return NextResponse.json({ success: false, error: "Failed to save results." }, { status: 500 });
  }
}
