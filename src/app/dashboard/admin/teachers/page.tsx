"use client";

import { useState, useEffect, useCallback } from "react";
import {
  GraduationCap,
  Plus,
  Search,
  Edit2,
  Trash2,
  Mail,
  Phone,
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
  createdAt?: string;
}

interface FormData {
  name: string;
  email: string;
  password: string;
  phone: string;
  qualification: string;
  specialization: string;
}

const emptyForm: FormData = {
  name: "",
  email: "",
  password: "",
  phone: "",
  qualification: "",
  specialization: "",
};

export default function TeachersPage() {
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

  const fetchTeachers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/teachers");
      if (!res.ok) throw new Error("Failed to load teachers");
      const data = await res.json();
      setTeachers(data.data || data.teachers || []);
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
      return (
        fullName.toLowerCase().includes(search.toLowerCase()) ||
        email.toLowerCase().includes(search.toLowerCase()) ||
        (t.specialization || "").toLowerCase().includes(search.toLowerCase())
      );
    }
  );

  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (teacher: Teacher & { user?: any }) => {
    setForm({
      name: teacher.name || `${teacher.firstName || ""} ${teacher.lastName || ""}`.trim(),
      email: teacher.email || teacher.user?.email || "",
      password: "",
      phone: teacher.phone || teacher.user?.phone || "",
      qualification: teacher.qualification || "",
      specialization: teacher.specialization || "",
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
        ...(editingId ? {} : { password: form.password }),
        phone: form.phone || undefined,
        qualification: form.qualification || undefined,
        specialization: form.specialization || undefined,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to save teacher");
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
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-school-blue to-primary rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0">
              {fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-gray-800">{fullName}</p>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Mail className="w-3 h-3" /> {email}
              </p>
            </div>
          </div>
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

      <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 w-full sm:w-80">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search teachers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-sm outline-none w-full"
        />
      </div>

      {filtered.length === 0 && !search ? (
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
