"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  Users,
  GraduationCap,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Modal from "@/components/dashboard/Modal";
import ConfirmDialog from "@/components/dashboard/ConfirmDialog";
import EmptyState from "@/components/dashboard/EmptyState";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";

interface ClassItem {
  id: string;
  name: string;
  section: string;
  level: string;
  teacherId?: string;
  classTeacherId?: string;
  teacherName?: string;
  teacher?: { id?: string; firstName?: string; lastName?: string } | null;
  studentCount?: number;
  _count?: { students?: number };
  capacity: number;
}

interface Teacher {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
}

interface Subject {
  id: string;
  name: string;
}

interface FormData {
  name: string;
  section: string;
  level: string;
  teacherId: string;
  teacherIds: string[];
  subjectIds: string[];
  capacity: number;
}

const emptyForm: FormData = { name: "", section: "", level: "PRIMARY", teacherId: "", teacherIds: [], subjectIds: [], capacity: 40 };

const levels = ["NURSERY", "PRIMARY", "JSS"];

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [classesRes, teachersRes, subjectsRes] = await Promise.allSettled([
        fetch("/api/admin/classes"),
        fetch("/api/admin/teachers"),
        fetch("/api/admin/subjects"),
      ]);
      if (classesRes.status === "fulfilled" && classesRes.value.ok) {
        const data = await classesRes.value.json();
        setClasses(data.data || data.classes || []);
      }
      if (teachersRes.status === "fulfilled" && teachersRes.value.ok) {
        const data = await teachersRes.value.json();
        setTeachers(data.data || data.teachers || []);
      }
      if (subjectsRes.status === "fulfilled" && subjectsRes.value.ok) {
        const data = await subjectsRes.value.json();
        setSubjects(data.data || data.subjects || []);
      }
    } catch {
      setError("Failed to load classes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = classes.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.level?.toLowerCase().includes(search.toLowerCase()) ||
      (c.teacherName || `${c.teacher?.firstName || ""} ${c.teacher?.lastName || ""}`.trim())
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  const toggleId = (ids: string[], id: string) =>
    ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];

  const openAdd = () => { setForm(emptyForm); setEditingId(null); setModalOpen(true); };
  const openEdit = (cls: ClassItem & { teacherClasses?: any[]; classSubjects?: any[] }) => {
    setForm({
      name: cls.name || "",
      section: cls.section || "",
      level: cls.level || "PRIMARY",
      teacherId: cls.teacherId || cls.classTeacherId || "",
      teacherIds: (cls.teacherClasses || []).map((t: any) => t.teacher?.id || t.teacherId).filter(Boolean),
      subjectIds: (cls.classSubjects || []).map((s: any) => s.subject?.id || s.subjectId).filter(Boolean),
      capacity: cls.capacity || 40,
    });
    setEditingId(cls.id);
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = editingId ? `/api/admin/classes/${editingId}` : "/api/admin/classes";
      const method = editingId ? "PUT" : "POST";
      const body = {
        name: form.name,
        section: form.section || undefined,
        level: form.level,
        classTeacherId: form.teacherId || undefined,
        capacity: form.capacity,
        ...(editingId ? { teacherIds: form.teacherIds, subjectIds: form.subjectIds } : {}),
      };
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || err.message || "Failed"); }
      setModalOpen(false);
      fetchData();
    } catch (e: any) { alert(e.message || "Error"); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/classes/${confirmDelete}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setConfirmDelete(null);
      fetchData();
    } catch { alert("Failed to delete class"); } finally { setDeleting(false); }
  };

  const levelColor: Record<string, string> = {
    NURSERY: "bg-pink-100 text-pink-700",
    PRIMARY: "bg-blue-100 text-blue-700",
    JSS: "bg-green-100 text-green-700",
  };

  if (loading) return <LoadingSpinner text="Loading classes..." fullScreen />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-gray-600">{error}</p>
        <button onClick={fetchData} className="px-4 py-2 bg-school-blue text-white text-sm rounded-xl">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-[family-name:var(--font-poppins)] text-2xl font-bold text-school-dark">Manage Classes</h2>
          <p className="text-sm text-gray-500 mt-1">{classes.length} classes total</p>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-school-blue to-primary text-white text-sm font-semibold rounded-xl shadow-glow-blue hover:shadow-lg transition-all">
          <Plus className="w-4 h-4" /> Create Class
        </button>
      </div>

      <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 w-full sm:w-80">
        <Search className="w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Search classes..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent text-sm outline-none w-full" />
      </div>

      {filtered.length === 0 && !search ? (
        <EmptyState icon={<BookOpen className="w-10 h-10 text-gray-400" />} title="No classes yet" description="Create your first class to start organizing students." action={{ label: "Create Class", onClick: openAdd }} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((cls) => {
            const pct = cls.capacity > 0 ? Math.round(((cls.studentCount ?? cls._count?.students ?? 0) / cls.capacity) * 100) : 0;
            const teacherName = cls.teacherName || `${cls.teacher?.firstName || ""} ${cls.teacher?.lastName || ""}`.trim();
            return (
              <div key={cls.id} className="bg-white rounded-2xl border border-gray-100 shadow-soft-sm p-5 hover:shadow-soft-md transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-[family-name:var(--font-poppins)] font-bold text-school-dark text-lg">{cls.name}</h3>
                    {cls.section && <p className="text-xs text-gray-400 mt-0.5">Section: {cls.section}</p>}
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${levelColor[cls.level] || "bg-gray-100 text-gray-600"}`}>
                    {cls.level}
                  </span>
                </div>
                {teacherName && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <GraduationCap className="w-4 h-4 text-gray-400" />
                    {teacherName}
                  </div>
                )}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {cls.studentCount ?? cls._count?.students ?? 0} / {cls.capacity}</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${pct > 90 ? "bg-red-500" : pct > 70 ? "bg-yellow-500" : "bg-school-green"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(cls)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => setConfirmDelete(cls.id)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit Class" : "Create Class"}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Class Name</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue" placeholder="e.g. Primary 3" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Section</label>
              <input type="text" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue" placeholder="e.g. A" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Level</label>
              <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue">
                {levels.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Capacity</label>
              <input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) || 40 })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue" min={1} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Class Teacher</label>
              <select value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue">
                <option value="">Select Teacher</option>
                {teachers.map((t) => {
                  const name = t.name || `${t.firstName || ""} ${t.lastName || ""}`.trim();
                  return <option key={t.id} value={t.id}>{name}</option>;
                })}
              </select>
          </div>
          {editingId && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Additional Teachers</label>
                {teachers.length === 0 ? (
                  <p className="text-xs text-gray-400">No teachers available.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {teachers.map((t) => {
                      const name = t.name || `${t.firstName || ""} ${t.lastName || ""}`.trim();
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setForm({ ...form, teacherIds: toggleId(form.teacherIds, t.id) })}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${form.teacherIds.includes(t.id) ? "bg-school-blue text-white border-school-blue" : "bg-gray-50 text-gray-600 border-gray-200 hover:border-school-blue/40"}`}
                        >
                          {name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Subjects Taught in This Class</label>
                {subjects.length === 0 ? (
                  <p className="text-xs text-gray-400">No subjects available.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {subjects.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setForm({ ...form, subjectIds: toggleId(form.subjectIds, s.id) })}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${form.subjectIds.includes(s.id) ? "bg-school-blue text-white border-school-blue" : "bg-gray-50 text-gray-600 border-gray-200 hover:border-school-blue/40"}`}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.name} className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-school-blue to-primary rounded-xl shadow-glow-blue hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingId ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={handleDelete} title="Delete Class" message="Are you sure you want to delete this class? Students will be unassigned." loading={deleting} />
    </div>
  );
}
