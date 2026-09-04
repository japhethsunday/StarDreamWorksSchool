"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FolderOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertCircle,
  FileText,
  Link2,
  Video,
  Image as ImageIcon,
  File,
  FileType,
  Save,
  Loader2,
} from "lucide-react";
import { isSafeUrl } from "@/lib/utils";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";
import EmptyState from "@/components/dashboard/EmptyState";
import Modal from "@/components/dashboard/Modal";
import DataTable from "@/components/dashboard/DataTable";
import ConfirmDialog from "@/components/dashboard/ConfirmDialog";

interface Material {
  id: string;
  title: string;
  description?: string;
  type: string;
  fileUrl?: string;
  subject?: { id: string; name: string } | null;
  class?: { id: string; name: string } | null;
  teacher?: { id: string; firstName: string; lastName: string } | null;
  teacherId?: string;
  subjectId?: string;
  classId?: string;
  uploadedAt: string;
  createdAt: string;
}

const typeMeta: Record<string, { icon: React.ReactNode; color: string }> = {
  PDF: { icon: <FileText className="w-4 h-4" />, color: "bg-red-100 text-red-600" },
  DOCUMENT: { icon: <FileType className="w-4 h-4" />, color: "bg-blue-100 text-blue-600" },
  IMAGE: { icon: <ImageIcon className="w-4 h-4" />, color: "bg-green-100 text-green-600" },
  VIDEO: { icon: <Video className="w-4 h-4" />, color: "bg-purple-100 text-purple-600" },
  LINK: { icon: <Link2 className="w-4 h-4" />, color: "bg-amber-100 text-amber-600" },
};

function TypeBadge({ type }: { type: string }) {
  const meta = typeMeta[type] || {
    icon: <File className="w-4 h-4" />,
    color: "bg-gray-100 text-gray-600",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${meta.color}`}
    >
      {meta.icon}
      {type}
    </span>
  );
}

const emptyForm = {
  title: "",
  description: "",
  type: "PDF",
  subjectId: "",
  classId: "",
  teacherId: "",
  fileUrl: "",
};

export default function AdminMaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [teachers, setTeachers] = useState<{ id: string; firstName: string; lastName: string }[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [mRes, refRes] = await Promise.allSettled([
        fetch("/api/admin/materials"),
        fetch("/api/admin/reference"),
      ]);
      if (mRes.status === "fulfilled" && mRes.value.ok) {
        const d = await mRes.value.json();
        setMaterials(d.data || []);
      } else if (mRes.status === "fulfilled") {
        throw new Error("Failed to load materials");
      }
      if (refRes.status === "fulfilled" && refRes.value.ok) {
        const ref = await refRes.value.json();
        const d = ref.data || {};
        setTeachers(d.teachers || []);
        setClasses(d.classes || []);
        setSubjects(d.subjects || []);
      }
    } catch {
      setError("Failed to load materials.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = materials.filter(
    (m) =>
      m.title?.toLowerCase().includes(search.toLowerCase()) ||
      m.teacher?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      m.teacher?.lastName?.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (m: Material) => {
    setForm({
      title: m.title || "",
      description: m.description || "",
      type: m.type || "PDF",
      subjectId: m.subject?.id || (m as any).subjectId || "",
      classId: m.class?.id || (m as any).classId || "",
      teacherId: m.teacher?.id || (m as any).teacherId || "",
      fileUrl: m.fileUrl || "",
    });
    setEditingId(m.id);
    setFormError("");
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!form.title.trim()) {
      setFormError("Title is required.");
      return;
    }
    if (!form.teacherId) {
      setFormError("Please select the owning teacher.");
      return;
    }
    setSaving(true);
    try {
      const url = editingId ? `/api/admin/materials/${editingId}` : "/api/admin/materials";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          subjectId: form.subjectId || undefined,
          classId: form.classId || undefined,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to save material.");
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      setFormError(err.message || "Failed to save material.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/materials/${confirmDelete}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setConfirmDelete(null);
      fetchData();
    } catch {
      alert("Failed to delete material");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading materials..." fullScreen />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-gray-600">{error}</p>
        <button onClick={fetchData} className="px-4 py-2 bg-school-blue text-white text-sm rounded-xl">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-[family-name:var(--font-poppins)] text-2xl font-bold text-school-dark">
            Learning Materials
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage documents, images and resources shared with students.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-school-blue to-primary text-white text-sm font-semibold rounded-xl shadow-glow-blue hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Material
        </button>
      </div>

      <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 w-full sm:w-80">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search materials..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-sm outline-none w-full"
        />
      </div>

      {filtered.length === 0 && !search ? (
        <EmptyState
          icon={<FolderOpen className="w-10 h-10 text-gray-400" />}
          title="No materials yet"
          description="Add learning materials, documents and resources for students."
          action={{ label: "Add Material", onClick: openAdd }}
        />
      ) : (
        <DataTable
          columns={[
            {
              key: "title",
              label: "Material",
              render: (v: string, row: Material) => (
                <div>
                  <p className="font-medium text-gray-800">{v}</p>
                  {row.description && (
                    <p className="text-xs text-gray-400 line-clamp-1">{row.description}</p>
                  )}
                </div>
              ),
            },
            {
              key: "type",
              label: "Type",
              render: (v: string) => <TypeBadge type={v} />,
            },
            {
              key: "teacher",
              label: "Teacher",
              render: (_: unknown, row: Material) => (
                <span className="text-gray-600">
                  {row.teacher ? `${row.teacher.firstName} ${row.teacher.lastName}` : "—"}
                </span>
              ),
            },
            {
              key: "class",
              label: "Class",
              render: (_: unknown, row: Material) => (
                <span className="text-gray-600">{row.class?.name || "—"}</span>
              ),
            },
            {
              key: "actions",
              label: "Actions",
              className: "text-right",
              render: (_: unknown, row: Material) => (
                <div className="flex items-center justify-end gap-2">
                  {row.fileUrl && isSafeUrl(row.fileUrl) && (
                    <a
                      href={row.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-school-green bg-school-green/10 rounded-lg hover:bg-school-green/20 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Open
                    </a>
                  )}
                  <button
                    onClick={() => openEdit(row)}
                    className="p-2 text-gray-400 hover:text-school-blue hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(row.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ),
            },
          ]}
          data={filtered}
          emptyMessage="No materials match your search."
        />
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Material" : "Add Material"}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-sm text-red-700">{formError}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue"
              placeholder="e.g. Chapter 1 Notes"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue resize-none"
              placeholder="Short description of the material"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Owning Teacher <span className="text-red-500">*</span>
              </label>
              <select
                value={form.teacherId}
                onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue"
              >
                <option value="">Select teacher</option>
                {teachers.map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.name || `${t.firstName || ""} ${t.lastName || ""}`.trim()}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue"
              >
                <option value="PDF">PDF</option>
                <option value="DOCUMENT">Document</option>
                <option value="IMAGE">Image</option>
                <option value="VIDEO">Video</option>
                <option value="LINK">Link</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Class</label>
              <select
                value={form.classId}
                onChange={(e) => setForm({ ...form, classId: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue"
              >
                <option value="">All classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
              <select
                value={form.subjectId}
                onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue"
              >
                <option value="">All subjects</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">File URL</label>
            <input
              type="url"
              value={form.fileUrl}
              onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue"
              placeholder="https://... link to the document or file"
            />
            <p className="text-xs text-gray-400 mt-1">
              Paste the public link to the document, image, video or resource.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-school-blue to-primary rounded-xl shadow-glow-blue hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingId ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete Material"
        message="Are you sure you want to delete this material? Students will no longer be able to access it."
        loading={deleting}
      />
    </div>
  );
}
