"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  ShieldCheck,
  UserPlus,
  Search,
  Edit2,
  Trash2,
  KeyRound,
  Ban,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Lock,
} from "lucide-react";
import DataTable from "@/components/dashboard/DataTable";
import Modal from "@/components/dashboard/Modal";
import ConfirmDialog from "@/components/dashboard/ConfirmDialog";
import EmptyState from "@/components/dashboard/EmptyState";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  image: string | null;
  isActive: boolean;
  isSuperAdmin: boolean;
  createdAt: string;
}

interface CreateForm {
  name: string;
  email: string;
  password: string;
  phone: string;
}

const emptyForm: CreateForm = { name: "", email: "", password: "", phone: "" };

export default function AdminManagementPage() {
  const { data: session } = useSession();
  const isSuperAdminSession = (session?.user as any)?.isSuperAdmin === true;

  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<CreateForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [editTarget, setEditTarget] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState({ name: "", phone: "" });

  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);
  const [resetPass, setResetPass] = useState("");

  const [confirmAction, setConfirmAction] = useState<{ kind: "delete" | "toggle"; admin: AdminUser } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/admins");
      if (res.status === 403 || res.status === 401) {
        setAccessDenied(true);
        return;
      }
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setAdmins(data.data || []);
    } catch {
      setError("Failed to load admins.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isSuperAdminSession) fetchData();
    else setAccessDenied(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperAdminSession]);

  const filtered = admins.filter(
    (a) =>
      a.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, phone: form.phone || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to create admin");
      setCreateOpen(false);
      setForm(emptyForm);
      fetchData();
    } catch (e: any) {
      alert(e.message || "Failed to create admin");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/admins/${editTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to update admin");
      setEditTarget(null);
      fetchData();
    } catch (e: any) {
      alert(e.message || "Failed to update admin");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
    if (!confirmAction || confirmAction.kind !== "toggle") return;
    const admin = confirmAction.admin;
    setBusyId(admin.id);
    try {
      const res = await fetch(`/api/admin/admins/${admin.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !admin.isActive }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to update status");
      setConfirmAction(null);
      fetchData();
    } catch (e: any) {
      alert(e.message || "Failed to update status");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmAction || confirmAction.kind !== "delete") return;
    setBusyId(confirmAction.admin.id);
    try {
      const res = await fetch(`/api/admin/admins/${confirmAction.admin.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to remove admin");
      setConfirmAction(null);
      fetchData();
    } catch (e: any) {
      alert(e.message || "Failed to remove admin");
    } finally {
      setBusyId(null);
    }
  };

  const handleResetAccess = async () => {
    if (!resetTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/admins/${resetTarget.id}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: resetPass }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to reset access");
      setResetTarget(null);
      setResetPass("");
      alert(`Access reset for ${resetTarget.email}. They can now sign in with the new password.`);
    } catch (e: any) {
      alert(e.message || "Failed to reset access");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading admin management..." fullScreen />;

  if (accessDenied && !isSuperAdminSession) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
          <Lock className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-600 font-medium">You do not have access to Admin Management.</p>
        <p className="text-sm text-gray-400">This feature is restricted to the platform Super Admin.</p>
      </div>
    );
  }

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

  const columns = [
    {
      key: "name",
      label: "Admin",
      render: (_: unknown, row: AdminUser) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-school-blue to-primary flex items-center justify-center text-white text-sm font-bold shrink-0">
            {row.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-800 text-sm">{row.name}</p>
              {row.isSuperAdmin && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 uppercase tracking-wide">
                  <ShieldCheck className="w-3 h-3" /> Super Admin
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "isActive",
      label: "Status",
      render: (val: boolean) => (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${val ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
          {val ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      render: (v: string) => (
        <span className="text-gray-500 text-xs">
          {new Date(v).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      className: "text-right",
      render: (_: unknown, row: AdminUser) => {
        if (row.isSuperAdmin) {
          return (
            <span className="text-xs text-gray-400 italic">Protected</span>
          );
        }
        return (
          <div className="flex items-center justify-end gap-1.5">
            <button
              onClick={() => { setEditTarget(row); setEditForm({ name: row.name || "", phone: row.phone || "" }); }}
              className="p-2 text-gray-400 hover:text-school-blue hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setResetTarget(row)}
              className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
              title="Reset access"
            >
              <KeyRound className="w-4 h-4" />
            </button>
            <button
              onClick={() => setConfirmAction({ kind: "toggle", admin: row })}
              disabled={busyId === row.id}
              className={`p-2 rounded-lg transition-colors ${row.isActive ? "text-gray-400 hover:text-red-600 hover:bg-red-50" : "text-gray-400 hover:text-green-600 hover:bg-green-50"}`}
              title={row.isActive ? "Deactivate" : "Activate"}
            >
              {row.isActive ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setConfirmAction({ kind: "delete", admin: row })}
              disabled={busyId === row.id}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Remove"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="font-[family-name:var(--font-poppins)] text-2xl font-bold text-school-dark">Admin Management</h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-700 uppercase tracking-wide">
              <ShieldCheck className="w-3.5 h-3.5" /> Super Admin
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Create and manage administrator accounts. Restricted to the designated Super Admin.
          </p>
        </div>
        <button
          onClick={() => { setForm(emptyForm); setCreateOpen(true); }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-school-blue to-primary text-white text-sm font-semibold rounded-xl shadow-glow-blue hover:shadow-lg transition-all"
        >
          <UserPlus className="w-4 h-4" /> Add Admin
        </button>
      </div>

      <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 w-full sm:w-80">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search admins..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-sm outline-none w-full"
        />
      </div>

      {filtered.length === 0 && !search ? (
        <EmptyState
          icon={<ShieldCheck className="w-10 h-10 text-gray-400" />}
          title="No admin accounts yet"
          description="Create administrator accounts that can use the Admin Portal."
        />
      ) : (
        <DataTable columns={columns} data={filtered} emptyMessage="No admins match your search." />
      )}

      {/* Create Admin */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Add Admin Account" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue" placeholder="e.g. Jane Doe" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue" placeholder="admin@school.edu" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Temporary Password</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue" placeholder="Min 8 characters" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone (optional)</label>
            <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue" placeholder="e.g. 08012345678" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button onClick={() => setCreateOpen(false)} className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
            <button onClick={handleCreate} disabled={saving || !form.name || !form.email || form.password.length < 8} className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-school-blue to-primary rounded-xl shadow-glow-blue hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Admin
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Admin */}
      <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Admin" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
            <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
            <input type="text" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue" />
          </div>
          {editTarget && (
            <p className="text-xs text-gray-400">
              Email: <span className="font-medium">{editTarget.email}</span> (cannot be changed)
            </p>
          )}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button onClick={() => setEditTarget(null)} className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
            <button onClick={handleEdit} disabled={saving || !editForm.name} className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-school-blue to-primary rounded-xl shadow-glow-blue hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </div>
      </Modal>

      {/* Reset access */}
      <Modal isOpen={!!resetTarget} onClose={() => setResetTarget(null)} title="Reset Admin Access" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Set a new password for <span className="font-semibold text-gray-800">{resetTarget?.email}</span>. Their current password will no longer work.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
            <input type="password" value={resetPass} onChange={(e) => setResetPass(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue" placeholder="Min 8 characters" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button onClick={() => setResetTarget(null)} className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
            <button onClick={handleResetAccess} disabled={saving || resetPass.length < 8} className="px-5 py-2.5 text-sm font-semibold text-white bg-amber-600 rounded-xl hover:bg-amber-700 transition-all disabled:opacity-50 flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Reset Access
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirm toggle / delete */}
      <ConfirmDialog
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={confirmAction?.kind === "toggle" ? handleToggleActive : handleDelete}
        title={confirmAction?.kind === "toggle"
          ? (confirmAction?.admin.isActive ? "Deactivate Admin" : "Activate Admin")
          : "Remove Admin"}
        message={confirmAction?.kind === "toggle"
          ? (confirmAction?.admin.isActive
            ? `${confirmAction.admin.name} will no longer be able to sign in until reactivated.`
            : `${confirmAction.admin.name} will be able to sign in again.`)
          : `Are you sure you want to permanently remove ${confirmAction?.admin.name}? This cannot be undone.`}
        loading={busyId === confirmAction?.admin.id || (confirmAction?.kind === "toggle" && busyId === confirmAction.admin.id)}
      />
    </div>
  );
}