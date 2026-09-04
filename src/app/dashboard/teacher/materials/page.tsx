"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FolderOpen,
  Plus,
  AlertCircle,
  Trash2,
  FileText,
  Link2,
  Video,
  Image as ImageIcon,
  File,
  FileType,
  Save,
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
  uploadedAt: string;
  subjectName?: string;
  className?: string;
}

interface ClassOption {
  id: string;
  name: string;
  level: string;
}

interface SubjectOption {
  id: string;
  name: string;
  code: string;
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

export default function TeacherMaterials() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "PDF",
    subjectId: "",
    classId: "",
    fileUrl: "",
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Material | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/teacher/materials");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load materials.");
      }
      const json = await res.json();
      setMaterials(json.data || json || []);
    } catch (err: any) {
      setError(err.message || "Failed to load materials.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const openCreate = async () => {
    setFormError("");
    setForm({ title: "", description: "", type: "PDF", subjectId: "", classId: "", fileUrl: "" });
    setCreateOpen(true);
    try {
      const [classesRes, subjectsRes] = await Promise.all([
        fetch("/api/teacher/classes"),
        fetch("/api/teacher/subjects"),
      ]);
      if (classesRes.ok) {
        const cj = await classesRes.json();
        setClasses(cj.data || cj || []);
      }
      if (subjectsRes.ok) {
        const sj = await subjectsRes.json();
        setSubjects(sj.data || sj || []);
      }
    } catch {
      // ignore
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!form.title.trim()) {
      setFormError("Title is required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/teacher/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to upload material.");
      setCreateOpen(false);
      fetchMaterials();
    } catch (err: any) {
      setFormError(err.message || "Failed to upload material.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (m: Material) => {
    setDeleteTarget(m);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/teacher/materials/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to delete material.");
      setDeleteOpen(false);
      setDeleteTarget(null);
      fetchMaterials();
    } catch (err: any) {
      alert(err.message || "Failed to delete material.");
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
        <p className="text-gray-600 font-medium">{error}</p>
        <button
          onClick={fetchMaterials}
          className="px-4 py-2 bg-school-blue text-white text-sm font-medium rounded-xl hover:bg-primary transition-colors"
        >
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
            Upload and manage learning materials for your classes.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-school-green to-accent text-white text-sm font-semibold rounded-xl shadow-glow-green hover:shadow-lg hover:scale-[1.02] transition-all"
        >
          <Plus className="w-4 h-4" />
          Upload Material
        </button>
      </div>

      {materials.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft-sm">
          <EmptyState
            icon={<FolderOpen className="w-9 h-9 text-gray-400" />}
            title="No materials yet"
            description="Upload learning materials to share with your students."
            action={{ label: "Upload Material", onClick: openCreate }}
          />
        </div>
      ) : (
        <DataTable
          columns={[
            {
              key: "title",
              label: "Material",
              render: (v, row) => (
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
              render: (v) => <TypeBadge type={v} />,
            },
            {
              key: "subject",
              label: "Subject",
              render: (_, row) => (
                <span className="text-gray-600">{row.subject?.name || row.subjectName || "—"}</span>
              ),
            },
            {
              key: "class",
              label: "Class",
              render: (_, row) => (
                <span className="text-gray-600">{row.class?.name || row.className || "—"}</span>
              ),
            },
            {
              key: "uploadedAt",
              label: "Uploaded",
              render: (v) => (
                <span className="text-gray-500 text-xs">
                  {new Date(v).toLocaleDateString("en-NG", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              ),
            },
            {
              key: "actions",
              label: "Actions",
              render: (_, row) => (
                <div className="flex items-center gap-2">
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
                    onClick={() => confirmDelete(row)}
                    className="inline-flex items-center gap-1 p-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ),
            },
          ]}
          data={materials}
          emptyMessage="No materials yet"
        />
      )}

      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Upload Material"
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-5">
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
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue transition-all"
              placeholder="e.g. Chapter 1 Notes"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue transition-all"
              placeholder="Short description of the material"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue transition-all"
              >
                <option value="PDF">PDF</option>
                <option value="DOCUMENT">Document</option>
                <option value="IMAGE">Image</option>
                <option value="VIDEO">Video</option>
                <option value="LINK">Link</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Class</label>
              <select
                value={form.classId}
                onChange={(e) => setForm({ ...form, classId: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue transition-all"
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
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue transition-all"
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
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue transition-all"
              placeholder="https://... or upload link"
            />
            <p className="text-xs text-gray-400 mt-1">
              Provide a link to the material or uploaded file.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-school-green to-accent rounded-xl hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {submitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Uploading...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Upload
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Material"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? Students will no longer be able to access it.`}
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
}
