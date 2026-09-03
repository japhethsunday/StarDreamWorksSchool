"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Layers,
  Plus,
  Loader2,
  AlertCircle,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  GripVertical,
} from "lucide-react";
import DataTable from "@/components/dashboard/DataTable";
import Modal from "@/components/dashboard/Modal";
import ConfirmDialog from "@/components/dashboard/ConfirmDialog";
import EmptyState from "@/components/dashboard/EmptyState";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";

interface Level {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  ageRange: string | null;
  tagline: string | null;
  description: string | null;
  highlights: string | null;
  isActive: boolean;
}

interface FormData {
  name: string;
  slug: string;
  sortOrder: number;
  ageRange: string;
  tagline: string;
  description: string;
  highlights: string;
  isActive: boolean;
}

const emptyForm: FormData = {
  name: "",
  slug: "",
  sortOrder: 0,
  ageRange: "",
  tagline: "",
  description: "",
  highlights: "",
  isActive: true,
};

export default function EducationalLevelsPage() {
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/educational-levels");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setLevels(data.data || []);
    } catch {
      setError("Failed to load educational levels.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => { setForm(emptyForm); setEditingId(null); setModalOpen(true); };

  const openEdit = (lvl: Level) => {
    setForm({
      name: lvl.name || "",
      slug: lvl.slug || "",
      sortOrder: lvl.sortOrder ?? 0,
      ageRange: lvl.ageRange || "",
      tagline: lvl.tagline || "",
      description: lvl.description || "",
      highlights: lvl.highlights || "",
      isActive: lvl.isActive,
    });
    setEditingId(lvl.id);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { alert("Level name is required."); return; }
    setSaving(true);
    try {
      const url = editingId ? `/api/educational-levels/${editingId}` : "/api/educational-levels";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          slug: form.slug || undefined,
          sortOrder: Number(form.sortOrder) || 0,
          ageRange: form.ageRange || null,
          tagline: form.tagline || null,
          description: form.description || null,
          highlights: form.highlights || null,
          isActive: form.isActive,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to save.");
      setModalOpen(false);
      fetchData();
    } catch (e: any) {
      alert(e.message || "Error");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (lvl: Level) => {
    try {
      await fetch(`/api/educational-levels/${lvl.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !lvl.isActive }),
      });
      fetchData();
    } catch { /* silent */ }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/educational-levels/${confirmDelete}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed");
      }
      setConfirmDelete(null);
      fetchData();
    } catch (e: any) {
      alert(e.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const inputCls =
    "w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue";

  const columns = [
    {
      key: "sortOrder",
      label: "",
      render: () => <GripVertical className="w-4 h-4 text-gray-300 mx-auto" />,
    },
    {
      key: "name",
      label: "Level",
      render: (val: string, row: Level) => (
        <div>
          <p className="font-medium text-gray-800">{val}</p>
          {row.tagline && <p className="text-xs text-gray-400">{row.tagline}</p>}
        </div>
      ),
    },
    {
      key: "ageRange",
      label: "Age range",
      render: (val: string | null) => (
        <span className="text-gray-500 text-xs">{val || "—"}</span>
      ),
    },
    {
      key: "sortOrder",
      label: "Order",
      render: (val: number) => <span className="text-gray-500 text-xs">{val}</span>,
    },
    {
      key: "isActive",
      label: "Status",
      render: (val: boolean, row: Level) => (
        <button onClick={() => toggleActive(row)} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${val ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
          {val ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          {val ? "Active" : "Hidden"}
        </button>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      className: "text-right",
      render: (_: any, row: Level) => (
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

  if (loading) return <LoadingSpinner text="Loading educational levels..." fullScreen />;

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
          <h2 className="font-[family-name:var(--font-poppins)] text-2xl font-bold text-school-dark">Educational Levels</h2>
          <p className="text-sm text-gray-500 mt-1">{levels.length} levels</p>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-school-blue to-primary text-white text-sm font-semibold rounded-xl shadow-glow-blue hover:shadow-lg transition-all">
          <Plus className="w-4 h-4" /> New Level
        </button>
      </div>

      {levels.length === 0 ? (
        <EmptyState
          icon={<Layers className="w-10 h-10 text-gray-400" />}
          title="No levels"
          description="Add educational levels (e.g. Kindergarten, Primary, Secondary) to display on the public website."
          action={{ label: "New Level", onClick: openAdd }}
        />
      ) : (
        <DataTable columns={columns} data={levels} emptyMessage="No levels to display." />
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit Level" : "New Level"} size="lg">
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Level name *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: !editingId ? e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") : form.slug })} className={inputCls} placeholder="e.g. Kindergarten" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Slug</label>
              <input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className={inputCls} placeholder="kindergarten" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Sort order</label>
              <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Age range</label>
              <input type="text" value={form.ageRange} onChange={(e) => setForm({ ...form, ageRange: e.target.value })} className={inputCls} placeholder="e.g. 3–5 years" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tagline</label>
            <input type="text" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} className={inputCls} placeholder="Short tagline" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${inputCls} resize-none`} placeholder="Description shown on the public website" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Highlights (separate each with a new line)</label>
            <textarea rows={4} value={form.highlights} onChange={(e) => setForm({ ...form, highlights: e.target.value })} className={`${inputCls} resize-none`} placeholder={"Strong academics\nCaring teachers\nSafe environment"} />
          </div>

          <label className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-school-blue focus:ring-school-blue/20" />
            <span className="text-sm text-gray-700">{form.isActive ? "Visible on the website" : "Hidden from the website"}</span>
          </label>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.name} className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-school-blue to-primary rounded-xl shadow-glow-blue hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingId ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={handleDelete} title="Delete Level" message="Are you sure you want to delete this educational level?" loading={deleting} />
    </div>
  );
}
