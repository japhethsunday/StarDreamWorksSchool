"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  UserCheck,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Mail,
  Phone,
  Loader2,
  AlertCircle,
  Link2,
} from "lucide-react";
import DataTable from "@/components/dashboard/DataTable";
import Modal from "@/components/dashboard/Modal";
import ConfirmDialog from "@/components/dashboard/ConfirmDialog";
import EmptyState from "@/components/dashboard/EmptyState";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";

interface Parent {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  user?: { email?: string; phone?: string; isActive?: boolean };
  children?: { id: string; firstName: string; lastName: string }[];
  studentLinks?: { student?: { id: string; firstName: string; lastName: string } }[];
  isActive?: boolean;
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
}

interface FormData {
  name: string;
  email: string;
  password: string;
  phone: string;
  childrenIds: string[];
  isActive: boolean;
}

const emptyForm: FormData = {
  name: "",
  email: "",
  password: "",
  phone: "",
  childrenIds: [],
  isActive: true,
};

export default function ParentsPage() {
  const router = useRouter();
  const [parents, setParents] = useState<Parent[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [parentsRes, refRes] = await Promise.allSettled([
        fetch("/api/admin/parents"),
        fetch("/api/admin/reference"),
      ]);
      if (parentsRes.status === "fulfilled" && parentsRes.value.ok) {
        const data = await parentsRes.value.json();
        setParents(data.data || data.parents || []);
      }
      if (refRes.status === "fulfilled" && refRes.value.ok) {
        const ref = await refRes.value.json();
        const d = ref.data || {};
        setStudents(d.students || []);
      }
    } catch {
      setError("Failed to load parents.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = parents.filter(
    (p) => {
      const fullName = p.name || `${p.firstName || ""} ${p.lastName || ""}`.trim();
      const email = p.email || p.user?.email || "";
      const childNames = (p.children || (p.studentLinks || []).map((l) => l.student).filter(Boolean) || [])
        .map((c: any) => `${c.firstName || ""} ${c.lastName || ""}`.toLowerCase())
        .join(" ");
      const matchesSearch =
        fullName.toLowerCase().includes(search.toLowerCase()) ||
        email.toLowerCase().includes(search.toLowerCase()) ||
        (p.phone || "").toLowerCase().includes(search.toLowerCase()) ||
        childNames.includes(search.toLowerCase());
      const active = p.isActive ?? p.user?.isActive ?? true;
      const matchesStatus =
        filterStatus === "" ? true : filterStatus === "active" ? active : !active;
      return matchesSearch && matchesStatus;
    }
  );

  const openAdd = () => { setForm(emptyForm); setEditingId(null); setModalOpen(true); };

  const openEdit = (parent: Parent) => {
    const children = parent.children || (parent.studentLinks || []).map((l) => l.student).filter(Boolean) || [];
    setForm({
      name: parent.name || `${parent.firstName || ""} ${parent.lastName || ""}`.trim(),
      email: parent.email || parent.user?.email || "",
      password: "",
      phone: parent.phone || parent.user?.phone || "",
      childrenIds: children.map((c: any) => c.id).filter(Boolean),
      isActive: parent.user?.isActive ?? true,
    });
    setEditingId(parent.id);
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = editingId ? `/api/admin/parents/${editingId}` : "/api/admin/parents";
      const method = editingId ? "PUT" : "POST";
      const nameParts = form.name.trim().split(/\s+/);
      const body = {
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" ") || nameParts[0] || "",
        email: form.email,
        ...(editingId ? {} : { password: form.password }),
        phone: form.phone || undefined,
        studentIds: form.childrenIds,
        ...(editingId ? { isActive: form.isActive } : {}),
      };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || "Failed to save parent");
      }
      setModalOpen(false);
      fetchData();
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
      const res = await fetch(`/api/admin/parents/${confirmDelete}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setConfirmDelete(null);
      fetchData();
    } catch {
      alert("Failed to delete parent");
    } finally {
      setDeleting(false);
    }
  };

  const toggleChild = (childId: string) => {
    setForm((prev) => ({
      ...prev,
      childrenIds: prev.childrenIds.includes(childId)
        ? prev.childrenIds.filter((id) => id !== childId)
        : [...prev.childrenIds, childId],
    }));
  };

  const columns = [
    {
      key: "name",
      label: "Parent",
      render: (_: any, row: Parent & { user?: any }) => {
        const fullName = row.name || `${row.firstName || ""} ${row.lastName || ""}`.trim();
        const email = row.email || row.user?.email || "";
        return (
          <button
            onClick={() => router.push(`/dashboard/admin/parents/${row.id}`)}
            className="flex items-center gap-3 text-left group hover:opacity-90 transition-opacity"
          >
            <div className="w-9 h-9 bg-brand-navy rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0">
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
      key: "phone",
      label: "Phone",
      render: (val: string, row: Parent & { user?: any }) => (
        <span className="text-gray-600 flex items-center gap-1">
          <Phone className="w-3 h-3 text-gray-400" /> {val || row.user?.phone || "N/A"}
        </span>
      ),
    },
    {
      key: "children",
      label: "Children",
      render: (_: any, row: Parent) => {
        const children = row.children || (row.studentLinks || []).map((l) => l.student).filter(Boolean) || [];
        return (
          <div className="flex flex-wrap gap-1">
            {children.length > 0 ? (
              children.map((child: any) => (
                <span key={child.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded-full">
                  <Link2 className="w-3 h-3" />
                  {child.firstName} {child.lastName}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-400">No children linked</span>
            )}
          </div>
        );
      },
    },
    {
      key: "isActive",
      label: "Status",
      render: (val: boolean, row: Parent & { user?: any }) => {
        const active = val ?? row.user?.isActive ?? true;
        return (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {active ? "Active" : "Inactive"}
          </span>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      className: "text-right",
      render: (_: any, row: Parent) => (
        <div className="flex items-center justify-end gap-2">
          <button onClick={() => router.push(`/dashboard/admin/parents/${row.id}`)} className="p-2 text-gray-400 hover:text-school-blue hover:bg-blue-50 rounded-lg transition-colors" title="View Profile">
            <Eye className="w-4 h-4" />
          </button>
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

  if (loading) return <LoadingSpinner text="Loading parents..." fullScreen />;

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
          <h2 className="font-[family-name:var(--font-poppins)] text-2xl font-bold text-school-dark">Manage Parents</h2>
          <p className="text-sm text-gray-500 mt-1">{parents.length} parents total</p>
        </div>
        <button onClick={openAdd} className="sd-btn sd-btn-apply px-5 py-2.5 text-sm">
          <Plus className="w-4 h-4" /> Add Parent
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search by name, email, child..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent text-sm outline-none w-full" />
        </div>
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

      {filtered.length === 0 && !search && !filterStatus ? (
        <EmptyState icon={<UserCheck className="w-10 h-10 text-gray-400" />} title="No parents yet" description="Add parent accounts and link them to students." action={{ label: "Add Parent", onClick: openAdd }} />
      ) : (
        <DataTable columns={columns} data={filtered} emptyMessage="No parents match your search." />
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit Parent" : "Add Parent"}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
              <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Password {editingId && <span className="text-gray-400 font-normal">(leave blank to keep)</span>}
            </label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue" />
          </div>
          {students.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Link Children</label>
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl p-3 space-y-2 bg-gray-50">
                {students.map((s) => (
                  <label key={s.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white cursor-pointer transition-colors">
                    <input type="checkbox" checked={form.childrenIds.includes(s.id)} onChange={() => toggleChild(s.id)} className="w-4 h-4 rounded border-gray-300 text-school-blue focus:ring-school-blue/20" />
                    <span className="text-sm text-gray-700">{s.firstName} {s.lastName}</span>
                    <span className="text-xs text-gray-400 ml-auto">{s.studentId}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          {editingId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Account Status</label>
              <select value={form.isActive ? "active" : "inactive"} onChange={(e) => setForm({ ...form, isActive: e.target.value === "active" })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue">
                <option value="active">Active — can log in</option>
                <option value="inactive">Inactive — login disabled</option>
              </select>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.name || !form.email} className="sd-btn sd-btn-apply px-5 py-2.5 text-sm disabled:opacity-50">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingId ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={handleDelete} title="Delete Parent" message="Are you sure you want to delete this parent account?" loading={deleting} />
    </div>
  );
}
