"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Megaphone,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Calendar,
} from "lucide-react";
import DataTable from "@/components/dashboard/DataTable";
import Modal from "@/components/dashboard/Modal";
import ConfirmDialog from "@/components/dashboard/ConfirmDialog";
import EmptyState from "@/components/dashboard/EmptyState";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";

interface Announcement {
  id: string;
  title: string;
  content: string;
  target: string;
  targetType?: string;
  priority: string;
  isPublished: boolean;
  createdAt: string;
}

interface FormData {
  title: string;
  content: string;
  target: string;
  priority: string;
  isPublished: boolean;
}

const emptyForm: FormData = { title: "", content: "", target: "SCHOOL", priority: "NORMAL", isPublished: false };
const targets = ["SCHOOL", "CLASS"];
const priorities = ["NORMAL", "IMPORTANT", "URGENT"];

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
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
      const res = await fetch("/api/admin/announcements");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setAnnouncements(data.data || data.announcements || []);
    } catch {
      setError("Failed to load announcements.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = announcements.filter(
    (a) =>
      a.title?.toLowerCase().includes(search.toLowerCase()) ||
      a.target?.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setForm(emptyForm); setEditingId(null); setModalOpen(true); };
  const openEdit = (ann: Announcement) => {
    setForm({
      title: ann.title || "",
      content: ann.content || "",
      target: ann.targetType || ann.target || "SCHOOL",
      priority: ann.priority || "NORMAL",
      isPublished: ann.isPublished,
    });
    setEditingId(ann.id);
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = editingId ? `/api/admin/announcements/${editingId}` : "/api/admin/announcements";
      const method = editingId ? "PUT" : "POST";
      const body = {
        title: form.title,
        content: form.content,
        targetType: form.target,
        priority: form.priority,
        isPublished: form.isPublished,
      };
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.message || "Failed"); }
      setModalOpen(false);
      fetchData();
    } catch (e: any) { alert(e.message || "Error"); } finally { setSaving(false); }
  };

  const togglePublish = async (ann: Announcement) => {
    try {
      await fetch(`/api/admin/announcements/${ann.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !ann.isPublished }),
      });
      fetchData();
    } catch { /* silent */ }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/announcements/${confirmDelete}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setConfirmDelete(null);
      fetchData();
    } catch { alert("Failed to delete"); } finally { setDeleting(false); }
  };

  const priorityColor: Record<string, string> = {
    NORMAL: "bg-blue-100 text-blue-700",
    IMPORTANT: "bg-yellow-100 text-yellow-700",
    URGENT: "bg-red-100 text-red-700",
  };

  const columns = [
    {
      key: "title",
      label: "Title",
      render: (val: string) => <span className="font-medium text-gray-800">{val}</span>,
    },
    {
      key: "target",
      label: "Target",
      render: (_: any, row: Announcement) => (
        <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-full">
          {row.targetType || row.target || "SCHOOL"}
        </span>
      ),
    },
    {
      key: "priority",
      label: "Priority",
      render: (val: string) => (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${priorityColor[val] || "bg-gray-100 text-gray-600"}`}>
          {val}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Date",
      render: (val: string) => (
        <span className="text-gray-500 flex items-center gap-1 text-xs">
          <Calendar className="w-3 h-3" /> {new Date(val).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "isPublished",
      label: "Status",
      render: (val: boolean, row: Announcement) => (
        <button onClick={() => togglePublish(row)} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${val ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
          {val ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          {val ? "Published" : "Draft"}
        </button>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      className: "text-right",
      render: (_: any, row: Announcement) => (
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

  if (loading) return <LoadingSpinner text="Loading announcements..." fullScreen />;

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
          <h2 className="font-[family-name:var(--font-poppins)] text-2xl font-bold text-school-dark">Announcements</h2>
          <p className="text-sm text-gray-500 mt-1">{announcements.length} total</p>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-school-blue to-primary text-white text-sm font-semibold rounded-xl shadow-glow-blue hover:shadow-lg transition-all">
          <Plus className="w-4 h-4" /> New Announcement
        </button>
      </div>

      <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 w-full sm:w-80">
        <Search className="w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Search announcements..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent text-sm outline-none w-full" />
      </div>

      {filtered.length === 0 && !search ? (
        <EmptyState icon={<Megaphone className="w-10 h-10 text-gray-400" />} title="No announcements" description="Create announcements to notify students, teachers, and parents." action={{ label: "New Announcement", onClick: openAdd }} />
      ) : (
        <DataTable columns={columns} data={filtered} emptyMessage="No announcements match your search." />
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit Announcement" : "New Announcement"}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue" placeholder="Announcement title" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Content</label>
            <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={5} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue resize-none" placeholder="Write your announcement..." />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Target</label>
              <select value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue">
                {targets.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue">
                {priorities.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Publish</label>
              <label className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer">
                <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-school-blue focus:ring-school-blue/20" />
                <span className="text-sm text-gray-700">{form.isPublished ? "Published" : "Draft"}</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.title} className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-school-blue to-primary rounded-xl shadow-glow-blue hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingId ? "Update" : "Publish"}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={handleDelete} title="Delete Announcement" message="Are you sure you want to delete this announcement?" loading={deleting} />
    </div>
  );
}
