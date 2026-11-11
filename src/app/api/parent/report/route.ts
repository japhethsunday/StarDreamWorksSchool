import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { gradeFor, positions, round1 } from "@/lib/results";

const TERM_ORDER: Record<string, number> = { FIRST: 1, SECOND: 2, THIRD: 3 };

// Published report cards for every child linked to the parent, grouped by session and term.
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized. Please login." }, { status: 401 });
    if ((session.user as any).role !== "PARENT") return NextResponse.json({ success: false, error: "Forbidden. Parent access required." }, { status: 403 });

    const parent = await prisma.parent.findUnique({
      where: { userId: (session.user as any).id },
      include: {
        studentLinks: {
          include: {
            student: { select: { id: true, studentId: true, firstName: true, lastName: true, middleName: true, class: { select: { name: true } } } },
          },
        },
      },
    });
    if (!parent) return NextResponse.json({ success: false, error: "Parent profile not found." }, { status: 404 });

    const children = parent.studentLinks.map((l) => l.student);
    const childIds = children.map((c) => c.id);
    if (childIds.length === 0) return NextResponse.json({ success: true, data: { children: [] } });

    const grades = await prisma.grade.findMany({
      where: { studentId: { in: childIds }, publishedAt: { not: null } },
      include: { subject: { select: { name: true } }, class: { select: { id: true, name: true } } },
    });

    // Class averages per (class, session, term) so we can rank each child.
    const groups = new Map<string, { classId: string; academicSession: string; term: string }>();
    for (const g of grades) groups.set(`${g.classId}|${g.academicSession}|${g.term}`, { classId: g.classId, academicSession: g.academicSession, term: g.term });

    const rankings = new Map<string, { position: number; outOf: number }>(); // key: group|studentId
    for (const [key, grp] of Array.from(groups.entries())) {
      const avgs = await prisma.grade.groupBy({
        by: ["studentId"],
        where: { ...grp, publishedAt: { not: null } },
        _avg: { score: true },
      });
      const rows = avgs.map((a) => ({ studentId: a.studentId, avg: a._avg.score ?? 0 }));
      const pos = positions(rows, (r) => r.avg);
      for (const r of rows) rankings.set(`${key}|${r.studentId}`, { position: pos.get(r)!, outOf: rows.length });
    }

    const data = children.map((c) => {
      const mine = grades.filter((g) => g.studentId === c.id);
      const terms = new Map<string, typeof mine>();
      for (const g of mine) {
        const k = `${g.classId}|${g.academicSession}|${g.term}`;
        terms.set(k, [...(terms.get(k) ?? []), g]);
      }
      const reports = Array.from(terms.entries())
        .map(([key, list]) => {
          const subjects = list
            .map((g) => ({
              subject: g.subject.name,
              caScore: g.caScore,
              examScore: g.examScore,
              total: round1(g.score),
              grade: g.grade,
              remark: g.remarks || gradeFor(g.score).remark,
            }))
            .sort((a, b) => a.subject.localeCompare(b.subject));
          const average = round1(subjects.reduce((s, x) => s + x.total, 0) / subjects.length);
          const rank = rankings.get(`${key}|${c.id}`);
          return {
            academicSession: list[0].academicSession,
            term: list[0].term,
            className: list[0].class.name,
            subjects,
            totalScore: round1(subjects.reduce((s, x) => s + x.total, 0)),
            average,
            overallGrade: gradeFor(average).grade,
            position: rank?.position ?? null,
            outOf: rank?.outOf ?? null,
          };
        })
        .sort((a, b) =>
          a.academicSession === b.academicSession
            ? (TERM_ORDER[b.term] ?? 0) - (TERM_ORDER[a.term] ?? 0)
            : b.academicSession.localeCompare(a.academicSession)
        );
      return {
        id: c.id,
        admissionNo: c.studentId,
        name: [c.firstName, c.middleName, c.lastName].filter(Boolean).join(" "),
        className: c.class?.name ?? null,
        reports,
      };
    });

    return NextResponse.json({ success: true, data: { children: data } });
  } catch (e) {
    console.error("PARENT_REPORT_ERR", (e as Error)?.message);
    return NextResponse.json({ success: false, error: "Failed to load results. Please try again." }, { status: 500 });
  }
}
