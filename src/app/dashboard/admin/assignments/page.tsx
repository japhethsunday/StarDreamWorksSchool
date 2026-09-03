"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ClipboardList,
  Plus,
  Search,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  Calendar,
  BookOpen,
} from "lucide-react";
import DataTable from "@/components/dashboard/DataTable";
import Modal from "@/components/dashboard/Modal";
import ConfirmDialog from "@/components/dashboard/ConfirmDialog";
import EmptyState from "@/components/dashboard/EmptyState";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";

interface Assignment {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  subjectName?: string;
  classId: string;
  className?: string;
  teacherId: string;
  teacherName?: string;
  dueDate: string;
  maxScore: number;
  createdAt: string;
}

interface Subject { id: string; name: string; }
interface ClassItem { id: string; name: string; }
interface Teacher { id: string; name: string; }

interface FormData {
  title: string;
  description: string;
  instructions: string;
  subjectId: string;
  classId: string;
  teacherId: string;
  dueDate: string;
  maxScore: number;
}

const emptyForm: FormData = { title: "", description: "", instructions: "", subjectId: "", classId: "", teacherId: "", dueDate: "", maxScore: 100 };

export default function AdminAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
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
      const [aRes, sRes, cRes, tRes] = await Promise.allSettled([
        fetch("/api/admin/assignments"),
        fetch("/api/admin/subjects"),
        fetch("/api/admin/classes"),
        fetch("/api/admin/teachers"),
      ]);
      if (aRes.status === "fulfilled" && aRes.value.ok) {
        const d = await aRes.value.json();
        setAssignments(d.data || []);
      }
      if (sRes.status === "fulfilled" && sRes.value.ok) {
        const d = await sRes.value.json();
        setSubjects(d.data || []);
      }
      if (cRes.status === "fulfilled" && cRes.value.ok) {
        const d = await cRes.value.json();
        setClasses(d.data || []);
      }
      if (tRes.status === "fulfilled" && tRes.value.ok) {
        const d = await tRes.value.json();
        setTeachers(d.data || []);
      }
    } catch {
      setError("Failed to load assignments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = assignments.filter(
    (a) => a.title?.toLowerCase().includes(search.toLowerCase()) || a.subjectName?.toLowerCase().includes(search.toLowerCase()) || a.className?.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setForm(emptyForm); setEditingId(null); setModalOpen(true); };
  const openEdit = (a: Assignment) => {
    setForm({
      title: a.title || "", description: a.description || "", instructions: "", subjectId: a.subjectId || "", classId: a.classId || "", teacherId: a.teacherId || "",
      dueDate: a.dueDate ? new Date(a.dueDate).toISOString().slice(0, 10) : "", maxScore: a.maxScore || 100,
    });
    setEditingId(a.id);
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = editingId ? `/api/admin/assignments/${editingId}` : "/api/admin/assignments";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.message || "Failed"); }
      setModalOpen(false);
      fetchData();
    } catch (e: any) { alert(e.message || "Error"); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/assignments/${confirmDelete}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setConfirmDelete(null);
      fetchData();
    } catch { alert("Failed to delete"); } finally { setDeleting(false); }
  };

  const columns = [
    {
      key: "title",
      label: "Assignment",
      render: (_: any, row: Assignment) => (
        <div>
          <p className="font-medium text-gray-800">{row.title}</p>
          <p className="text-xs text-gray-400 line-clamp-1">{row.description || "No description"}</p>
        </div>
      ),
    },
    {
      key: "subjectName",
      label: "Subject",
      render: (val: string) => (
        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">{val || "N/A"}</span>
      ),
    },
    {
      key: "className",
      label: "Class",
      render: (val: string) => (
        <span className="flex items-center gap-1 text-sm text-gray-600"><BookOpen className="w-3 h-3 text-gray-400" /> {val || "N/A"}</span>
      ),
    },
    {
      key: "dueDate",
      label: "Due Date",
      render: (val: string) => (
        <span className="text-gray-500 flex items-center gap-1 text-xs">
          <Calendar className="w-3 h-3" /> {val ? new Date(val).toLocaleDateString() : "N/A"}
        </span>
      ),
    },
    {
      key: "maxScore",
      label: "Max Score",
      render: (val: number) => <span className="text-sm font-medium text-gray-700">{val}</span>,
    },
    {
      key: "actions",
      label: "Actions",
      className: "text-right",
      render: (_: any, row: Assignment) => (
        <div className="flex items-center justify-end gap-2">
          <button onClick={() => openEdit(row)} className="p-2 text-gray-400 hover:text-school-blue hover:bg-blue-50 rounded-lg transition-colors">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => setConfirmDelete(row.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  if (loading) return <LoadingSpinner text="Loading assignments..." fullScreen />;

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
          <h2 className="font-[family-name:var(--font-poppins)] text-2xl font-bold text-school-dark">Assignments</h2>
          <p className="text-sm text-gray-500 mt-1">{assignments.length} total</p>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-school-blue to-primary text-white text-sm font-semibold rounded-xl shadow-glow-blue hover:shadow-lg transition-all">
          <Plus className="w-4 h-4" /> New Assignment
        </button>
      </div>

      <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 w-full sm:w-80">
        <Search className="w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Search assignments..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent text-sm outline-none w-full" />
      </div>

      {filtered.length === 0 && !search ? (
        <EmptyState icon={<ClipboardList className="w-10 h-10 text-gray-400" />} title="No assignments" description="Create assignments for your classes." action={{ label: "New Assignment", onClick: openAdd }} />
      ) : (
        <DataTable columns={columns} data={filtered} emptyMessage="No assignments found." />
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit Assignment" : "New Assignment"}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue" placeholder="Assignment title" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue resize-none" placeholder="Assignment description" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
              <select value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue">
                <option value="">Select Subject</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Class</label>
              <select value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue">
                <option value="">Select Class</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Assigned Teacher</label>
            <select value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue">
              <option value="">Select Teacher</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Due Date</label>
              <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Max Score</label>
              <input type="number" value={form.maxScore} onChange={(e) => setForm({ ...form, maxScore: parseInt(e.target.value) || 100 })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue" min={1} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.title} className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-school-blue to-primary rounded-xl shadow-glow-blue hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingId ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={handleDelete} title="Delete Assignment" message="Are you sure you want to delete this assignment?" loading={deleting} />
    </div>
  );
}
