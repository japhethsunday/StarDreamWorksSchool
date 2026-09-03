"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  AlertCircle,
  Users,
  Save,
  Search,
} from "lucide-react";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";
import EmptyState from "@/components/dashboard/EmptyState";

interface SubjectOption {
  id: string;
  name: string;
  code: string;
}

interface GradeRow {
  id: string;
  studentId: string;
  studentName?: string;
  firstName?: string;
  lastName?: string;
  className?: string;
  class?: { id: string; name: string } | null;
  subject?: { name: string } | string;
  classId?: string;
  gradeId?: string;
  score?: number;
  remarks?: string;
}

export default function TeacherGrades() {
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [rows, setRows] = useState<GradeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [scores, setScores] = useState<Record<string, string>>({});
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saveMsg, setSaveMsg] = useState("");

  const fetchSubjects = useCallback(async () => {
    try {
      const res = await fetch("/api/teacher/subjects");
      if (res.ok) {
        const json = await res.json();
        setSubjects(json.data || json || []);
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchGrades = useCallback(async (subjectId: string) => {
    if (!subjectId) {
      setRows([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/teacher/grades?subjectId=${encodeURIComponent(subjectId)}`
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load grades.");
      }
      const json = await res.json();
      const raw = json.data || json || [];
      const data: GradeRow[] = raw.map((g: any) => ({
        id: g.id,
        studentId: g.student?.studentId || g.studentId || "",
        firstName: g.student?.firstName || g.firstName,
        lastName: g.student?.lastName || g.lastName,
        className: g.class?.name || g.student?.class?.name || g.className,
        classId: g.class?.id || g.classId,
        subject: g.subject || g.subjectId,
        gradeId: g.id,
        score: g.score,
        remarks: g.remarks,
      }));
      setRows(data);
      const s: Record<string, string> = {};
      const r: Record<string, string> = {};
      data.forEach((row: GradeRow) => {
        if (row.score != null) s[row.id] = String(row.score);
        if (row.remarks) r[row.id] = row.remarks;
      });
      setScores(s);
      setRemarks(r);
    } catch (err: any) {
      setError(err.message || "Failed to load grades.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  useEffect(() => {
    if (selectedSubject) {
      fetchGrades(selectedSubject);
    }
  }, [selectedSubject, fetchGrades]);

  const saveGrade = async (row: GradeRow) => {
    setSaveMsg("");
    setSaving((prev) => ({ ...prev, [row.id]: true }));
    try {
      const subjectName =
        typeof row.subject === "string" ? row.subject : row.subject?.name;
      const payload: any = {
        studentId: row.studentId,
        subjectId: selectedSubject,
        classId: row.classId,
        score: scores[row.id] != null ? Number(scores[row.id]) : undefined,
        remarks: remarks[row.id] || "",
      };
      if (row.gradeId) {
        payload.gradeId = row.gradeId;
      }
      if (subjectName) payload.subjectName = subjectName;
      if (row.className || row.class) payload.className =
        row.className || (row.class as any)?.name;

      const res = await fetch("/api/teacher/grades", {
        method: row.gradeId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save grade.");
      setSaveMsg("Grade saved successfully.");
      await fetchGrades(selectedSubject);
    } catch (err: any) {
      alert(err.message || "Failed to save grade.");
    } finally {
      setSaving((prev) => ({ ...prev, [row.id]: false }));
    }
  };

  const filtered = rows.filter((row) => {
    const name = row.studentName || `${row.firstName || ""} ${row.lastName || ""}`;
    return !search || name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-[family-name:var(--font-poppins)] text-2xl font-bold text-school-dark">
          Grade Management
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Enter and update grades for students across your classes.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue transition-all sm:max-w-xs"
        >
          <option value="">Select a subject to grade</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.code})
            </option>
          ))}
        </select>
        {selectedSubject && (
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search students..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue transition-all"
            />
          </div>
        )}
      </div>

      {saveMsg && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-3">
          <span className="text-sm text-green-700">{saveMsg}</span>
        </div>
      )}

      {!selectedSubject ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft-sm">
          <EmptyState
            icon={<FileText className="w-9 h-9 text-gray-400" />}
            title="Select a subject"
            description="Choose a subject above to view and manage grades for your students."
          />
        </div>
      ) : loading ? (
        <LoadingSpinner text="Loading grades..." />
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-10 gap-3 bg-white rounded-2xl border border-gray-100 shadow-soft-sm">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <p className="text-sm text-gray-600">{error}</p>
          <button
            onClick={() => fetchGrades(selectedSubject)}
            className="px-4 py-2 bg-school-blue text-white text-sm font-medium rounded-xl hover:bg-primary transition-colors"
          >
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft-sm">
          <EmptyState
            icon={<Users className="w-9 h-9 text-gray-400" />}
            title={rows.length === 0 ? "No students to grade" : "No matching students"}
            description={
              rows.length === 0
                ? "Students from your assigned classes don't have grades yet for this subject."
                : "Try adjusting your search."
            }
          />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Student</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Class</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Score</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Remarks</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((row) => {
                  const name =
                    row.studentName || `${row.firstName || ""} ${row.lastName || ""}`;
                  const score = scores[row.id];
                  const numScore = score != null ? Number(score) : NaN;
                  const gradeLetter =
                    !isNaN(numScore) && numScore >= 0
                      ? numScore >= 80
                        ? "A"
                        : numScore >= 70
                        ? "B"
                        : numScore >= 60
                        ? "C"
                        : numScore >= 50
                        ? "D"
                        : numScore >= 40
                        ? "E"
                        : "F"
                      : null;
                  return (
                    <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-school-blue to-primary rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0">
                            {name.charAt(0) || "?"}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{name}</p>
                            <p className="text-xs text-gray-400 font-mono">{row.studentId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {row.className || row.class?.name || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={score ?? ""}
                            onChange={(e) =>
                              setScores({ ...scores, [row.id]: e.target.value })
                            }
                            className="w-20 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue transition-all"
                            placeholder="Score"
                          />
                          {gradeLetter && (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-school-blue/10 text-school-blue font-bold text-xs">
                              {gradeLetter}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={remarks[row.id] ?? ""}
                          onChange={(e) =>
                            setRemarks({ ...remarks, [row.id]: e.target.value })
                          }
                          className="w-full min-w-[160px] px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue transition-all"
                          placeholder="Remarks"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => saveGrade(row)}
                          disabled={saving[row.id]}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-school-green rounded-lg hover:bg-school-green/90 disabled:opacity-60 transition-colors"
                        >
                          {saving[row.id] ? (
                            <>
                              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              Saving
                            </>
                          ) : (
                            <>
                              <Save className="w-3.5 h-3.5" />
                              Save
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
