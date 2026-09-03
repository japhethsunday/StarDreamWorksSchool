"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Megaphone,
  Plus,
  AlertCircle,
  Trash2,
  Save,
  Building2,
  Users,
} from "lucide-react";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";
import EmptyState from "@/components/dashboard/EmptyState";
import Modal from "@/components/dashboard/Modal";
import DataTable from "@/components/dashboard/DataTable";
import ConfirmDialog from "@/components/dashboard/ConfirmDialog";

interface Announcement {
  id: string;
  title: string;
  content: string;
  targetType: string;
  priority: string;
  isPublished: boolean;
  createdAt: string;
  class?: { id: string; name: string } | null;
  className?: string;
}

interface ClassOption {
  id: string;
  name: string;
  level: string;
}

function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    URGENT: "bg-red-100 text-red-700",
    IMPORTANT: "bg-amber-100 text-amber-700",
    NORMAL: "bg-gray-100 text-gray-700",
  };
  return (
    <span
      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${map[priority] || map.NORMAL}`}
    >
      {priority}
    </span>
  );
}

export default function TeacherAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [form, setForm] = useState({
    title: "",
    content: "",
    targetType: "CLASS",
    classId: "",
    priority: "NORMAL",
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/teacher/announcements");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load announcements.");
      }
      const json = await res.json();
      setAnnouncements(json.data || json || []);
    } catch (err: any) {
      setError(err.message || "Failed to load announcements.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const openCreate = async () => {
    setFormError("");
    setForm({ title: "", content: "", targetType: "CLASS", classId: "", priority: "NORMAL" });
    setCreateOpen(true);
    try {
      const res = await fetch("/api/teacher/classes");
      if (res.ok) {
        const json = await res.json();
        setClasses(json.data || json || []);
      }
    } catch {
      // ignore
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!form.title.trim() || !form.content.trim()) {
      setFormError("Title and content are required.");
      return;
    }
    if (form.targetType === "CLASS" && !form.classId) {
      setFormError("Please select a target class.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/teacher/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          targetType: form.targetType === "CLASS" ? "CLASS" : "SCHOOL",
          classId: form.targetType === "CLASS" ? form.classId : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create announcement.");
      setCreateOpen(false);
      fetchAnnouncements();
    } catch (err: any) {
      setFormError(err.message || "Failed to create announcement.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (a: Announcement) => {
    setDeleteTarget(a);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/teacher/announcements/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to delete announcement.");
      setDeleteOpen(false);
      setDeleteTarget(null);
      fetchAnnouncements();
    } catch (err: any) {
      alert(err.message || "Failed to delete announcement.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading announcements..." fullScreen />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-gray-600 font-medium">{error}</p>
        <button
          onClick={fetchAnnouncements}
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
            Class Announcements
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Communicate important updates to your classes.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-school-gold to-secondary text-white text-sm font-semibold rounded-xl shadow-glow-gold hover:shadow-lg hover:scale-[1.02] transition-all"
        >
          <Plus className="w-4 h-4" />
          New Announcement
        </button>
      </div>

      {announcements.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft-sm">
          <EmptyState
            icon={<Megaphone className="w-9 h-9 text-gray-400" />}
            title="No announcements yet"
            description="Post announcements to keep your students and parents informed."
            action={{ label: "New Announcement", onClick: openCreate }}
          />
        </div>
      ) : (
        <DataTable
          columns={[
            {
              key: "title",
              label: "Announcement",
              render: (v, row) => (
                <div>
                  <p className="font-medium text-gray-800">{v}</p>
                  <p className="text-xs text-gray-400 line-clamp-1">{row.content}</p>
                </div>
              ),
            },
            {
              key: "targetType",
              label: "Target",
              render: (v, row) => (
                <span className="inline-flex items-center gap-1.5 text-gray-600">
                  {v === "SCHOOL" ? (
                    <>
                      <Building2 className="w-3.5 h-3.5 text-school-blue" />
                      School-wide
                    </>
                  ) : (
                    <>
                      <Users className="w-3.5 h-3.5 text-school-green" />
                      {row.class?.name || row.className || "Class"}
                    </>
                  )}
                </span>
              ),
            },
            { key: "priority", label: "Priority", render: (v) => <PriorityBadge priority={v} /> },
            {
              key: "isPublished",
              label: "Status",
              render: (v) => (
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    v ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {v ? "Published" : "Draft"}
                </span>
              ),
            },
            {
              key: "createdAt",
              label: "Posted",
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
              label: "",
              render: (_, row) => (
                <button
                  onClick={() => confirmDelete(row)}
                  className="inline-flex items-center gap-1 p-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              ),
            },
          ]}
          data={announcements}
          emptyMessage="No announcements yet"
        />
      )}

      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New Announcement"
        size="md"
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
              placeholder="Announcement title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Content <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue transition-all"
              placeholder="Write your announcement here"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Target</label>
              <select
                value={form.targetType}
                onChange={(e) =>
                  setForm({ ...form, targetType: e.target.value, classId: "" })
                }
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue transition-all"
              >
                <option value="CLASS">Specific Class</option>
                <option value="SCHOOL">School-wide</option>
              </select>
            </div>
            {form.targetType === "CLASS" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Target Class
                </label>
                <select
                  required
                  value={form.classId}
                  onChange={(e) => setForm({ ...form, classId: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue transition-all"
                >
                  <option value="">Select class</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue transition-all"
            >
              <option value="NORMAL">Normal</option>
              <option value="IMPORTANT">Important</option>
              <option value="URGENT">Urgent</option>
            </select>
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
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-school-gold to-secondary rounded-xl hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {submitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Posting...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Publish
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
        title="Delete Announcement"
        message={`Are you sure you want to delete "${deleteTarget?.title}"?`}
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
}
