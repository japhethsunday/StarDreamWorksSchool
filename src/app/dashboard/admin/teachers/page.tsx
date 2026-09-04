"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Plus,
  Search,
  Edit2,
  Trash2,
  Mail,
  Phone,
  Eye,
  Loader2,
  AlertCircle,
} from "lucide-react";
import DataTable from "@/components/dashboard/DataTable";
import Modal from "@/components/dashboard/Modal";
import ConfirmDialog from "@/components/dashboard/ConfirmDialog";
import EmptyState from "@/components/dashboard/EmptyState";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";

interface Teacher {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  teacherId?: string;
  phone?: string;
  qualification: string;
  specialization: string;
  isActive?: boolean;
  user?: { email: string; phone?: string; isActive?: boolean; createdAt?: string };
  subjects?: { subject?: { id?: string; name?: string } }[];
  createdAt?: string;
}

interface FormData {
  name: string;
  email: string;
  password: string;
  phone: string;
  qualification: string;
  specialization: string;
  classIds: string[];
  subjectIds: string[];
  isActive: boolean;
}

const emptyForm: FormData = {
  name: "",
  email: "",
  password: "",
  phone: "",
  qualification: "",
  specialization: "",
  classIds: [],
  subjectIds: [],
  isActive: true,
};

export default function TeachersPage() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTeachers = useCallback(async () => {
    try {
      setLoading(true);
      const [tRes, refRes] = await Promise.allSettled([
        fetch("/api/admin/teachers"),
        fetch("/api/admin/reference"),
      ]);
      if (tRes.status === "fulfilled" && tRes.value.ok) {
        const data = await tRes.value.json();
        setTeachers(data.data || data.teachers || []);
      } else if (tRes.status === "fulfilled") {
        throw new Error("Failed to load teachers");
      }
      if (refRes.status === "fulfilled" && refRes.value.ok) {
        const ref = await refRes.value.json();
        const d = ref.data || {};
        setClasses(d.classes || []);
        setSubjects(d.subjects || []);
      }
    } catch {
      setError("Failed to load teachers. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const filtered = teachers.filter(
    (t) => {
      const fullName = t.name || `${t.firstName || ""} ${t.lastName || ""}`.trim();
      const email = t.email || t.user?.email || "";
      const matchesSearch =
        fullName.toLowerCase().includes(search.toLowerCase()) ||
        email.toLowerCase().includes(search.toLowerCase()) ||
        (t.specialization || "").toLowerCase().includes(search.toLowerCase()) ||
        (t.qualification || "").toLowerCase().includes(search.toLowerCase());
      const matchesSubject = filterSubject
        ? (t.subjects || []).some((s) => s.subject?.id === filterSubject)
        : true;
      const active = t.isActive ?? t.user?.isActive ?? true;
      const matchesStatus =
        filterStatus === "" ? true : filterStatus === "active" ? active : !active;
      return matchesSearch && matchesSubject && matchesStatus;
    }
  );

  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setModalOpen(true);
  };

  const toggleId = (ids: string[], id: string) =>
    ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];

  const openEdit = (teacher: Teacher & { user?: any; classes?: any[]; subjects?: any[] }) => {
    setForm({
      name: teacher.name || `${teacher.firstName || ""} ${teacher.lastName || ""}`.trim(),
      email: teacher.email || teacher.user?.email || "",
      password: "",
      phone: teacher.phone || teacher.user?.phone || "",
      qualification: teacher.qualification || "",
      specialization: teacher.specialization || "",
      classIds: (teacher.classes || []).map((c: any) => c.class?.id || c.id).filter(Boolean),
      subjectIds: (teacher.subjects || []).map((s: any) => s.subject?.id || s.id).filter(Boolean),
      isActive: teacher.user?.isActive ?? true,
    });
    setEditingId(teacher.id);
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = editingId
        ? `/api/admin/teachers/${editingId}`
        : "/api/admin/teachers";
      const method = editingId ? "PUT" : "POST";
      const nameParts = form.name.trim().split(/\s+/);
      const body = {
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" ") || nameParts[0] || "",
        email: form.email,
        ...(editingId ? { ...(form.password ? { password: form.password } : {}), isActive: form.isActive } : { password: form.password }),
        phone: form.phone || undefined,
        qualification: form.qualification || undefined,
        specialization: form.specialization || undefined,
        classIds: form.classIds,
        subjectIds: form.subjectIds,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save teacher");
      }

      setModalOpen(false);
      fetchTeachers();
    } catch (e: any) {
      alert(e.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/teachers/${confirmDelete}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete teacher");
      setConfirmDelete(null);
      fetchTeachers();
    } catch {
      alert("Failed to delete teacher");
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: "name",
      label: "Name",
      render: (_: any, row: Teacher & { user?: any }) => {
        const fullName = row.name || `${row.firstName || ""} ${row.lastName || ""}`.trim();
        const email = row.email || row.user?.email || "";
        return (
          <button
            onClick={() => router.push(`/dashboard/admin/teachers/${row.id}`)}
            className="flex items-center gap-3 text-left group hover:opacity-90 transition-opacity"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-school-blue to-primary rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0">
              {fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-gray-800 group-hover:text-school-blue transition-colors">
                {fullName}
              </p>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Mail className="w-3 h-3" /> {email}
              </p>
            </div>
          </button>
        );
      },
    },
    {
      key: "specialization",
      label: "Specialization",
      render: (val: string) => (
        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
          {val || "N/A"}
        </span>
      ),
    },
    {
      key: "qualification",
      label: "Qualification",
      render: (val: string) => <span className="text-gray-600">{val || "N/A"}</span>,
    },
    {
      key: "userPhone",
      label: "Phone",
      render: (_: any, row: Teacher & { user?: any }) => (
        <span className="text-gray-600 flex items-center gap-1">
          <Phone className="w-3 h-3 text-gray-400" /> {row.phone || row.user?.phone || "N/A"}
        </span>
      ),
    },
    {
      key: "isActive",
      label: "Status",
      render: (val: boolean, row: Teacher & { user?: any }) => {
        const active = val ?? row.user?.isActive ?? true;
        return (
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
          >
            {active ? "Active" : "Inactive"}
          </span>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      className: "text-right",
      render: (_: any, row: Teacher) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => router.push(`/dashboard/admin/teachers/${row.id}`)}
            className="p-2 text-gray-400 hover:text-school-blue hover:bg-blue-50 rounded-lg transition-colors"
            title="View Profile"
          >
            <Eye className="w-4 h-4" />
          </button>
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
  ];

  if (loading) return <LoadingSpinner text="Loading teachers..." fullScreen />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-gray-600">{error}</p>
        <button onClick={fetchTeachers} className="px-4 py-2 bg-school-blue text-white text-sm rounded-xl">
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
            Manage Teachers
          </h2>
          <p className="text-sm text-gray-500 mt-1">{teachers.length} teachers total</p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-school-blue to-primary text-white text-sm font-semibold rounded-xl shadow-glow-blue hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Teacher
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, specialization..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm outline-none w-full"
          />
        </div>
        <select
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
          className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20"
        >
          <option value="">All Subjects</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {filtered.length === 0 && !search && !filterSubject && !filterStatus ? (
        <EmptyState
          icon={<GraduationCap className="w-10 h-10 text-gray-400" />}
          title="No teachers yet"
          description="Add your first teacher to get started."
          action={{ label: "Add Teacher", onClick: openAdd }}
        />
      ) : (
        <DataTable columns={columns} data={filtered} emptyMessage="No teachers match your search." />
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Teacher" : "Add Teacher"}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue"
                placeholder="john@school.com"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Password {editingId && <span className="text-gray-400 font-normal">(leave blank to keep)</span>}
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue"
              placeholder={editingId ? "••••••••" : "Enter password"}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue"
                placeholder="+234 ..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Qualification</label>
              <input
                type="text"
                value={form.qualification}
                onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue"
                placeholder="B.Ed, M.Ed"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Specialization</label>
            <input
              type="text"
              value={form.specialization}
              onChange={(e) => setForm({ ...form, specialization: e.target.value })}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue"
              placeholder="Mathematics, English..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Assigned Classes</label>
            {classes.length === 0 ? (
              <p className="text-xs text-gray-400">No classes available.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {classes.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setForm({ ...form, classIds: toggleId(form.classIds, c.id) })}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${form.classIds.includes(c.id) ? "bg-school-blue text-white border-school-blue" : "bg-gray-50 text-gray-600 border-gray-200 hover:border-school-blue/40"}`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Assigned Subjects</label>
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
          {editingId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Account Status</label>
              <select
                value={form.isActive ? "active" : "inactive"}
                onChange={(e) => setForm({ ...form, isActive: e.target.value === "active" })}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue"
              >
                <option value="active">Active — can log in</option>
                <option value="inactive">Inactive — login disabled</option>
              </select>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.name || !form.email}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-school-blue to-primary rounded-xl shadow-glow-blue hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingId ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete Teacher"
        message="Are you sure you want to delete this teacher? This action cannot be undone."
        loading={deleting}
      />
    </div>
  );
}
