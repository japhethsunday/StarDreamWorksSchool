"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Eye, EyeOff, Info, Save, Wand2 } from "lucide-react";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";
import { CA_MAX, EXAM_MAX, GRADE_SCALE, gradeFor, totalFor } from "@/lib/results";

interface Option {
  id: string;
  name: string;
}

interface SheetRow {
  studentId: string;
  admissionNo: string;
  name: string;
  caScore: number | null;
  examScore: number | null;
  onlineExamScore: number | null;
  total: number | null;
  grade: string | null;
  remark: string | null;
  saved: boolean;
  publishedAt: string | null;
}

interface SubjectStatus {
  subjectId: string;
  subjectName: string;
  entered: number;
  published: number;
}

interface Props {
  /** "admin" can publish; "teacher" can only enter and save. */
  mode: "admin" | "teacher";
}

const TERM_OPTIONS = [
  { value: "FIRST", label: "First Term" },
  { value: "SECOND", label: "Second Term" },
  { value: "THIRD", label: "Third Term" },
];

function currentSession() {
  const now = new Date();
  // Nigerian school year starts in September.
  const start = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  return `${start}/${start + 1}`;
}

const inputCls =
  "w-full rounded-lg border border-brand-line px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-red/40";

export default function ResultsSheet({ mode }: Props) {
  const api = mode === "admin" ? "/api/admin/results" : "/api/teacher/results";

  const [classes, setClasses] = useState<Option[]>([]);
  const [subjects, setSubjects] = useState<Option[]>([]);
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [academicSession, setAcademicSession] = useState(currentSession());
  const [term, setTerm] = useState("FIRST");

  const [rows, setRows] = useState<SheetRow[]>([]);
  const [edits, setEdits] = useState<Record<string, { ca: string; exam: string }>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [status, setStatus] = useState<{ studentCount: number; subjects: SubjectStatus[] } | null>(null);
  const [publishing, setPublishing] = useState(false);

  // Load class and subject choices.
  useEffect(() => {
    (async () => {
      try {
        const [cRes, sRes] = await Promise.all([
          fetch(mode === "admin" ? "/api/admin/classes" : "/api/teacher/classes"),
          fetch(mode === "admin" ? "/api/admin/subjects" : "/api/teacher/subjects"),
        ]);
        const cj = await cRes.json().catch(() => ({}));
        const sj = await sRes.json().catch(() => ({}));
        const cl: Option[] = (Array.isArray(cj.data) ? cj.data : []).map((c: any) => ({ id: c.id, name: c.name }));
        const sl: Option[] = (Array.isArray(sj.data) ? sj.data : []).map((s: any) => ({ id: s.id, name: s.name }));
        setClasses(cl.sort((a, b) => a.name.localeCompare(b.name)));
        setSubjects(sl.sort((a, b) => a.name.localeCompare(b.name)));
      } catch {
        setError("Could not load classes and subjects.");
      }
    })();
  }, [mode]);

  const qs = useMemo(
    () => new URLSearchParams({ classId, subjectId, academicSession: academicSession.trim(), term }).toString(),
    [classId, subjectId, academicSession, term]
  );

  const applyRows = (list: SheetRow[]) => {
    setRows(list);
    const e: Record<string, { ca: string; exam: string }> = {};
    for (const r of list) {
      e[r.studentId] = {
        ca: r.caScore === null ? "" : String(r.caScore),
        exam: r.examScore === null ? "" : String(r.examScore),
      };
    }
    setEdits(e);
  };

  const loadSheet = useCallback(async () => {
    if (!classId || !subjectId || !academicSession.trim()) {
      setRows([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${api}?${qs}`);
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Failed to load results.");
      applyRows(j.data.rows || []);
    } catch (e: any) {
      setError(e.message || "Failed to load results.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [api, qs, classId, subjectId, academicSession]);

  const loadStatus = useCallback(async () => {
    if (mode !== "admin" || !classId || !academicSession.trim()) {
      setStatus(null);
      return;
    }
    try {
      const p = new URLSearchParams({ classId, academicSession: academicSession.trim(), term });
      const res = await fetch(`/api/admin/results/publish?${p}`);
      const j = await res.json().catch(() => ({}));
      if (res.ok) setStatus(j.data);
    } catch {
      // status panel is optional
    }
  }, [mode, classId, academicSession, term]);

  useEffect(() => {
    loadSheet();
  }, [loadSheet]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const setEdit = (id: string, field: "ca" | "exam", value: string) =>
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));

  const num = (v: string) => (v.trim() === "" ? null : Number(v));

  const rowErrors = (id: string): string | null => {
    const e = edits[id];
    if (!e) return null;
    const ca = num(e.ca);
    const ex = num(e.exam);
    if (ca !== null && (Number.isNaN(ca) || ca < 0 || ca > CA_MAX)) return `CA must be 0–${CA_MAX}`;
    if (ex !== null && (Number.isNaN(ex) || ex < 0 || ex > EXAM_MAX)) return `Exam must be 0–${EXAM_MAX}`;
    return null;
  };

  const anyErrors = rows.some((r) => rowErrors(r.studentId));
  const dirty = rows.some((r) => {
    const e = edits[r.studentId];
    return e && (num(e.ca) !== r.caScore || num(e.exam) !== r.examScore);
  });
  const onlineAvailable = rows.filter((r) => r.onlineExamScore !== null).length;

  const fillFromOnline = () => {
    setEdits((prev) => {
      const next = { ...prev };
      for (const r of rows) {
        if (r.onlineExamScore !== null && (next[r.studentId]?.exam ?? "") === "") {
          next[r.studentId] = { ...next[r.studentId], exam: String(r.onlineExamScore) };
        }
      }
      return next;
    });
    setNotice("Exam scores filled in from the online exam. Review them, then click Save.");
  };

  const save = async () => {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const payload = rows.map((r) => ({
        studentId: r.studentId,
        caScore: num(edits[r.studentId]?.ca ?? ""),
        examScore: num(edits[r.studentId]?.exam ?? ""),
      }));
      const res = await fetch(`${api}?${qs}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: payload }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Failed to save results.");
      applyRows(j.data.rows || []);
      setNotice(
        mode === "admin"
          ? `Saved ${j.data.saved} result(s). They stay hidden from parents until you publish them.`
          : `Saved ${j.data.saved} result(s). The school admin will publish them to parents.`
      );
      loadStatus();
    } catch (e: any) {
      setError(e.message || "Failed to save results.");
    } finally {
      setSaving(false);
    }
  };

  const publish = async (makeVisible: boolean, onlySubject: boolean) => {
    const className = classes.find((c) => c.id === classId)?.name ?? "this class";
    const termLabel = TERM_OPTIONS.find((t) => t.value === term)?.label ?? term;
    const what = onlySubject ? subjects.find((s) => s.id === subjectId)?.name ?? "this subject" : "all subjects";
    const msg = makeVisible
      ? `Publish ${what} results for ${className}, ${termLabel} ${academicSession}? Parents and students will be able to see them.`
      : `Hide ${what} results for ${className}, ${termLabel} ${academicSession} from parents and students?`;
    if (!window.confirm(msg)) return;
    setPublishing(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/admin/results/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId,
          academicSession: academicSession.trim(),
          term,
          subjectId: onlySubject ? subjectId : null,
          publish: makeVisible,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Failed to update results.");
      setNotice(makeVisible ? `Published ${j.data.count} result(s).` : `Hid ${j.data.count} result(s).`);
      await Promise.all([loadSheet(), loadStatus()]);
    } catch (e: any) {
      setError(e.message || "Failed to update results.");
    } finally {
      setPublishing(false);
    }
  };

  const unpublishedHere = rows.filter((r) => r.saved && !r.publishedAt).length;
  const publishedHere = rows.filter((r) => r.publishedAt).length;
  const termUnpublished = status ? status.subjects.reduce((n, s) => n + (s.entered - s.published), 0) : 0;
  const termPublished = status ? status.subjects.reduce((n, s) => n + s.published, 0) : 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-2xl font-bold text-brand-navy-deep">Results</h1>
        <p className="text-sm text-gray-500 mt-1">
          Enter each student&apos;s CA (out of {CA_MAX}) and exam (out of {EXAM_MAX}). The total, grade and remark are
          worked out for you.{" "}
          {mode === "admin"
            ? "Results stay hidden from parents until you publish them."
            : "The school admin publishes results to parents."}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-brand-line p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="block text-[12px] font-medium text-gray-500 mb-1">Class</label>
          <select value={classId} onChange={(e) => setClassId(e.target.value)} className={inputCls}>
            <option value="">Select class</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[12px] font-medium text-gray-500 mb-1">Subject</label>
          <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className={inputCls}>
            <option value="">Select subject</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[12px] font-medium text-gray-500 mb-1">Academic session</label>
          <input value={academicSession} onChange={(e) => setAcademicSession(e.target.value)} placeholder="2025/2026" className={inputCls} />
        </div>
        <div>
          <label className="block text-[12px] font-medium text-gray-500 mb-1">Term</label>
          <select value={term} onChange={(e) => setTerm(e.target.value)} className={inputCls}>
            {TERM_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">{error}</p>}
      {notice && (
        <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 inline-flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {notice}
        </p>
      )}

      {/* Admin: publish panel for the whole class and term */}
      {mode === "admin" && classId && status && (
        <div className="bg-white rounded-xl border border-brand-line overflow-hidden">
          <div className="px-5 py-3 border-b border-brand-line flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-brand-navy">Publish to parents</p>
              <p className="text-[13px] text-gray-500">
                {termPublished} published · {termUnpublished} waiting · {status.studentCount} student(s) in class
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => publish(true, false)}
                disabled={publishing || termUnpublished === 0}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand-red text-white text-[13px] font-bold hover:bg-brand-red/90 disabled:opacity-50"
              >
                <Eye className="w-4 h-4" /> Publish all subjects
              </button>
              <button
                onClick={() => publish(false, false)}
                disabled={publishing || termPublished === 0}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-brand-line text-[13px] font-medium text-gray-600 hover:bg-brand-paper disabled:opacity-50"
              >
                <EyeOff className="w-4 h-4" /> Hide all
              </button>
            </div>
          </div>
          {status.subjects.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead className="bg-brand-paper text-gray-500">
                  <tr>
                    <th className="text-left font-medium px-5 py-2">Subject</th>
                    <th className="text-left font-medium px-3 py-2">Entered</th>
                    <th className="text-left font-medium px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {status.subjects.map((s) => (
                    <tr key={s.subjectId} className="border-t border-brand-line">
                      <td className="px-5 py-2">
                        <button onClick={() => setSubjectId(s.subjectId)} className="font-medium text-brand-navy hover:underline">
                          {s.subjectName}
                        </button>
                      </td>
                      <td className="px-3 py-2 text-gray-600">{s.entered} / {status.studentCount}</td>
                      <td className="px-3 py-2">
                        {s.entered === 0 ? (
                          <span className="text-gray-400">Not started</span>
                        ) : s.published === s.entered ? (
                          <span className="text-green-700 font-bold">Published</span>
                        ) : s.published > 0 ? (
                          <span className="text-amber-700 font-bold">Partly published</span>
                        ) : (
                          <span className="text-amber-700 font-bold">Draft</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="px-5 py-3 text-[13px] text-gray-500">No subjects are linked to this class yet.</p>
          )}
        </div>
      )}

      {/* Sheet */}
      {!classId || !subjectId ? (
        <div className="bg-white rounded-xl border border-brand-line p-8 text-center text-sm text-gray-500">
          Choose a class and subject to start entering results.
        </div>
      ) : loading ? (
        <LoadingSpinner text="Loading results..." />
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-xl border border-brand-line p-8 text-center text-sm text-gray-500">
          No active students in this class.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-brand-line overflow-hidden">
          <div className="px-5 py-3 border-b border-brand-line flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <p className="text-[13px] text-gray-500">
              {rows.length} student(s) · {publishedHere} published · {unpublishedHere} draft
            </p>
            <div className="flex flex-wrap gap-2">
              {onlineAvailable > 0 && (
                <button
                  onClick={fillFromOnline}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-brand-line text-[13px] font-medium text-brand-navy hover:bg-brand-paper"
                  title="Fill empty exam boxes with the score from the online exam"
                >
                  <Wand2 className="w-4 h-4" /> Use online exam scores ({onlineAvailable})
                </button>
              )}
              {mode === "admin" && (
                <>
                  <button
                    onClick={() => publish(true, true)}
                    disabled={publishing || dirty || unpublishedHere === 0}
                    title={dirty ? "Save your changes first" : undefined}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-brand-line text-[13px] font-medium text-brand-navy hover:bg-brand-paper disabled:opacity-50"
                  >
                    <Eye className="w-4 h-4" /> Publish this subject
                  </button>
                  {publishedHere > 0 && (
                    <button
                      onClick={() => publish(false, true)}
                      disabled={publishing}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-brand-line text-[13px] font-medium text-gray-600 hover:bg-brand-paper disabled:opacity-50"
                    >
                      <EyeOff className="w-4 h-4" /> Hide this subject
                    </button>
                  )}
                </>
              )}
              <button
                onClick={save}
                disabled={saving || anyErrors || !dirty}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-navy-deep text-white text-[13px] font-bold hover:bg-brand-navy disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[13px] min-w-[720px]">
              <thead className="bg-brand-paper text-gray-500">
                <tr>
                  <th className="text-left font-medium px-5 py-2.5 w-10">#</th>
                  <th className="text-left font-medium px-3 py-2.5">Student</th>
                  <th className="text-left font-medium px-3 py-2.5 w-28">CA / {CA_MAX}</th>
                  <th className="text-left font-medium px-3 py-2.5 w-28">Exam / {EXAM_MAX}</th>
                  <th className="text-left font-medium px-3 py-2.5 w-20">Total</th>
                  <th className="text-left font-medium px-3 py-2.5 w-16">Grade</th>
                  <th className="text-left font-medium px-3 py-2.5">Remark</th>
                  <th className="text-left font-medium px-3 py-2.5 w-24">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const e = edits[r.studentId] ?? { ca: "", exam: "" };
                  const ca = num(e.ca);
                  const ex = num(e.exam);
                  const err = rowErrors(r.studentId);
                  const hasAny = ca !== null || ex !== null;
                  const total = hasAny && !err ? totalFor(ca, ex) : null;
                  const g = total !== null ? gradeFor(total) : null;
                  return (
                    <tr key={r.studentId} className="border-t border-brand-line align-top">
                      <td className="px-5 py-2.5 text-gray-400">{i + 1}</td>
                      <td className="px-3 py-2.5">
                        <p className="font-medium text-brand-navy-deep">{r.name}</p>
                        <p className="text-[11px] text-gray-400">{r.admissionNo}</p>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          inputMode="decimal"
                          value={e.ca}
                          onChange={(ev) => setEdit(r.studentId, "ca", ev.target.value)}
                          className={`${inputCls} py-1.5`}
                          placeholder="0"
                          aria-label={`CA score for ${r.name}`}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          inputMode="decimal"
                          value={e.exam}
                          onChange={(ev) => setEdit(r.studentId, "exam", ev.target.value)}
                          className={`${inputCls} py-1.5`}
                          placeholder="0"
                          aria-label={`Exam score for ${r.name}`}
                        />
                        {r.onlineExamScore !== null && (
                          <p className="text-[11px] text-gray-400 mt-1">Online: {r.onlineExamScore}</p>
                        )}
                      </td>
                      <td className="px-3 py-2.5 font-bold text-brand-navy-deep">{total ?? "—"}</td>
                      <td className="px-3 py-2.5 font-bold text-brand-navy-deep">{g?.grade ?? "—"}</td>
                      <td className="px-3 py-2.5 text-gray-600">
                        {err ? <span className="text-red-600">{err}</span> : g?.remark ?? "—"}
                      </td>
                      <td className="px-3 py-2.5">
                        {r.publishedAt ? (
                          <span className="text-green-700 font-bold text-[12px]">Published</span>
                        ) : r.saved ? (
                          <span className="text-amber-700 font-bold text-[12px]">Draft</span>
                        ) : (
                          <span className="text-gray-400 text-[12px]">Not saved</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grading key */}
      <div className="bg-white rounded-xl border border-brand-line px-5 py-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px] text-gray-500">
        <span className="inline-flex items-center gap-1 font-bold text-brand-navy"><Info className="w-4 h-4" /> Grading key</span>
        {GRADE_SCALE.map((b, i) => (
          <span key={b.grade}>
            <span className="font-bold text-brand-navy-deep">{b.grade}</span> {b.min}
            {i === 0 ? "–100" : `–${GRADE_SCALE[i - 1].min - 1}`} {b.remark}
          </span>
        ))}
      </div>
    </div>
  );
}
