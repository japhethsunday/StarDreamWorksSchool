"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Baby, FileText, Printer } from "lucide-react";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";
import EmptyState from "@/components/dashboard/EmptyState";
import { CA_MAX, EXAM_MAX, GRADE_SCALE, ordinal } from "@/lib/results";

interface SubjectResult {
  subject: string;
  caScore: number | null;
  examScore: number | null;
  total: number;
  grade: string;
  remark: string;
}

interface Report {
  academicSession: string;
  term: string;
  className: string;
  subjects: SubjectResult[];
  totalScore: number;
  average: number;
  overallGrade: string;
  position: number | null;
  outOf: number | null;
}

interface Child {
  id: string;
  admissionNo: string;
  name: string;
  className: string | null;
  reports: Report[];
}

const TERM_LABEL: Record<string, string> = { FIRST: "First Term", SECOND: "Second Term", THIRD: "Third Term" };

function ReportCard({ child }: { child: Child }) {
  const [index, setIndex] = useState(0);
  const report = child.reports[index];

  const print = () => {
    document.body.setAttribute("data-print-child", child.id);
    window.print();
    document.body.removeAttribute("data-print-child");
  };

  return (
    <div className="report-card bg-white rounded-xl border border-brand-line overflow-hidden" data-child={child.id}>
      <div className="bg-brand-navy-deep px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-brand-yellow">
            {report ? `${report.className} · ${TERM_LABEL[report.term] ?? report.term} · ${report.academicSession}` : child.className ?? ""}
          </p>
          <h3 className="font-heading text-lg font-bold text-white">{child.name}</h3>
          <p className="text-[12px] text-white/60">Admission no. {child.admissionNo}</p>
        </div>
        {child.reports.length > 0 && (
          <div className="flex items-center gap-2 no-print">
            {child.reports.length > 1 && (
              <select
                value={index}
                onChange={(e) => setIndex(Number(e.target.value))}
                className="rounded-lg border border-white/20 bg-white px-3 py-2 text-[13px] text-brand-navy-deep focus:outline-none"
                aria-label="Choose term"
              >
                {child.reports.map((r, i) => (
                  <option key={`${r.academicSession}-${r.term}`} value={i}>
                    {TERM_LABEL[r.term] ?? r.term} {r.academicSession}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={print}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white text-brand-navy-deep text-[13px] font-bold hover:bg-brand-paper"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>
        )}
      </div>

      {!report ? (
        <div className="py-10 text-center">
          <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No results have been published yet.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5 border-b border-brand-line">
            {[
              { label: "Subjects", value: report.subjects.length },
              { label: "Average", value: `${report.average}%` },
              { label: "Overall grade", value: report.overallGrade },
              { label: "Position", value: report.position ? `${ordinal(report.position)} of ${report.outOf}` : "—" },
            ].map((s) => (
              <div key={s.label} className="rounded-lg bg-brand-paper border border-brand-line px-3 py-2.5">
                <p className="text-[11px] text-gray-500 font-medium">{s.label}</p>
                <p className="text-lg font-bold text-brand-navy-deep">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[13px] min-w-[560px]">
              <thead className="bg-brand-paper text-gray-500">
                <tr>
                  <th className="text-left font-medium px-5 py-2.5">Subject</th>
                  <th className="text-left font-medium px-3 py-2.5">CA ({CA_MAX})</th>
                  <th className="text-left font-medium px-3 py-2.5">Exam ({EXAM_MAX})</th>
                  <th className="text-left font-medium px-3 py-2.5">Total (100)</th>
                  <th className="text-left font-medium px-3 py-2.5">Grade</th>
                  <th className="text-left font-medium px-3 py-2.5">Remark</th>
                </tr>
              </thead>
              <tbody>
                {report.subjects.map((s) => (
                  <tr key={s.subject} className="border-t border-brand-line">
                    <td className="px-5 py-2.5 font-medium text-brand-navy-deep">{s.subject}</td>
                    <td className="px-3 py-2.5 text-gray-700">{s.caScore ?? "—"}</td>
                    <td className="px-3 py-2.5 text-gray-700">{s.examScore ?? "—"}</td>
                    <td className="px-3 py-2.5 font-bold text-brand-navy-deep">{s.total}</td>
                    <td className="px-3 py-2.5 font-bold text-brand-navy-deep">{s.grade}</td>
                    <td className="px-3 py-2.5 text-gray-600">{s.remark}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-brand-line bg-brand-paper/60">
                  <td className="px-5 py-2.5 font-bold text-brand-navy-deep">Total</td>
                  <td />
                  <td />
                  <td className="px-3 py-2.5 font-bold text-brand-navy-deep">
                    {report.totalScore} / {report.subjects.length * 100}
                  </td>
                  <td className="px-3 py-2.5 font-bold text-brand-navy-deep">{report.overallGrade}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="px-5 py-3 border-t border-brand-line flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500">
            {GRADE_SCALE.map((b, i) => (
              <span key={b.grade}>
                <span className="font-bold text-brand-navy-deep">{b.grade}</span> {b.min}
                {i === 0 ? "–100" : `–${GRADE_SCALE[i - 1].min - 1}`} {b.remark}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function ParentGrades() {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/parent/report");
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Failed to load results.");
      setChildren(j.data?.children || []);
    } catch (e: any) {
      setError(e.message || "Failed to load results.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingSpinner text="Loading results..." fullScreen />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-gray-600 font-medium">{error}</p>
        <button onClick={load} className="px-4 py-2 bg-school-blue text-white text-sm font-medium rounded-xl hover:bg-primary transition-colors">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* When printing, show only the chosen child's report card. */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          body[data-print-child] .report-card[data-child] { display: none; }
          ${children.map((c) => `body[data-print-child="${c.id}"] .report-card[data-child="${c.id}"]`).join(", ") || ".none"} {
            display: block !important; visibility: visible !important;
            position: absolute; left: 0; top: 0; width: 100%; border: none;
          }
          ${children.map((c) => `body[data-print-child="${c.id}"] .report-card[data-child="${c.id}"] *`).join(", ") || ".none"} {
            visibility: visible !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div>
        <h2 className="font-heading text-2xl font-bold text-brand-navy-deep">Results</h2>
        <p className="text-sm text-gray-500 mt-1">Termly report cards for your children: CA, exam, total and grade in every subject.</p>
      </div>

      {children.length === 0 ? (
        <div className="bg-white rounded-xl border border-brand-line">
          <EmptyState
            icon={<Baby className="w-9 h-9 text-gray-400" />}
            title="No children linked"
            description="Ask the school to link your children to your account to view their results."
          />
        </div>
      ) : (
        children.map((c) => <ReportCard key={c.id} child={c} />)
      )}
    </div>
  );
}
