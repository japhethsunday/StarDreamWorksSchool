"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  UserRound,
  Users,
  Activity,
  Mail,
  Loader2,
  AlertCircle,
  Phone,
  Briefcase,
  MapPin,
  Cake,
} from "lucide-react";
import { format } from "date-fns";
import ProfileHeader from "@/components/dashboard/ProfileHeader";
import ProfileTabs from "@/components/dashboard/ProfileTabs";
import ActivityTimeline from "@/components/dashboard/ActivityTimeline";
import { useCanPermission } from "@/lib/use-permission";
import Modal from "@/components/dashboard/Modal";
import ConfirmDialog from "@/components/dashboard/ConfirmDialog";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";

interface ParentDetail {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  address?: string | null;
  occupation?: string | null;
  user: { email: string; phone?: string | null; isActive: boolean; createdAt: string };
  studentLinks: {
    student: {
      id: string;
      firstName: string;
      lastName: string;
      studentId: string;
      gender: string;
      dateOfBirth: string;
      class: { id: string; name: string; level?: string | null } | null;
      _count: { grades: number; submissions: number };
    };
  }[];
  _count: { studentLinks: number };
}

const tabs = [
  { key: "overview", label: "Overview", icon: <UserRound className="w-4 h-4" /> },
  { key: "children", label: "Children", icon: <Users className="w-4 h-4" /> },
  { key: "activity", label: "Activity", icon: <Activity className="w-4 h-4" /> },
];

export default function ParentProfilePage() {
  const params = useParams<{ id: string }>();
  const canViewActivity = useCanPermission("VIEW_ACTIVITY");
  const router = useRouter();
  const [parent, setParent] = useState<ParentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const [editOpen, setEditOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState<"toggle" | "delete" | null>(null);
  const [busy, setBusy] = useState(false);

  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    occupation: "",
  });
  const [pickedStudents, setPickedStudents] = useState<string[]>([]);
  const [password, setPassword] = useState("");

  const fetchParent = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/parents/${params.id}`);
      if (res.status === 404) {
        setError("Parent not found.");
        return;
      }
      if (!res.ok) throw new Error("Failed to load parent");
      const json = await res.json();
      setParent(json.data);
    } catch (e: any) {
      setError(e.message || "Failed to load parent");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchParent();
  }, [fetchParent]);

  const openEdit = async () => {
    if (!parent) return;
    setEditForm({
      firstName: parent.firstName,
      lastName: parent.lastName,
      email: parent.user.email,
      phone: parent.phone || parent.user.phone || "",
      address: parent.address || "",
      occupation: parent.occupation || "",
    });
    setPickedStudents(parent.studentLinks.map((s) => s.student.id));
    setEditOpen(true);
    const refRes = await fetch("/api/admin/reference");
    if (refRes.ok) {
      const ref = await refRes.json();
      const d = ref.data || {};
      setStudents(
        (d.students || []).map((x: any) => ({
          id: x.id,
          name: `${x.firstName || ""} ${x.lastName || ""}`.trim() || x.studentId,
        }))
      );
    }
  };

  const saveEdit = async () => {
    if (!parent) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/parents/${parent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editForm,
          phone: editForm.phone || undefined,
          address: editForm.address || undefined,
          occupation: editForm.occupation || undefined,
          studentIds: pickedStudents,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update parent");
      }
      setEditOpen(false);
      fetchParent();
    } catch (e: any) {
      alert(e.message || "Failed to update parent");
    } finally {
      setBusy(false);
    }
  };

  const savePassword = async () => {
    if (!parent) return;
    if (password.length < 8) {
      alert("Password must be at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/parents/${parent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to reset password");
      }
      setPassword("");
      setResetOpen(false);
      alert("Password reset successfully.");
    } catch (e: any) {
      alert(e.message || "Failed to reset password");
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async () => {
    if (!parent) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/parents/${parent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !parent.user.isActive }),
      });
      if (!res.ok) throw new Error("Failed to update parent status");
      setConfirmOpen(null);
      fetchParent();
    } catch (e: any) {
      alert(e.message || "Failed to update status");
    } finally {
      setBusy(false);
    }
  };

  const deleteParent = async () => {
    if (!parent) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/parents/${parent.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete parent");
      router.push("/dashboard/admin/parents");
    } catch (e: any) {
      alert(e.message || "Failed to delete parent");
      setBusy(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading parent profile..." fullScreen />;

  if (error || !parent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-brand-red" />
        </div>
        <p className="text-brand-body">{error || "Parent not found."}</p>
        <button
          onClick={() => router.push("/dashboard/admin/parents")}
          className="px-4 py-2 bg-brand-navy text-white text-sm rounded-xl"
        >
          Back to Parents
        </button>
      </div>
    );
  }

  const fullName = `${parent.firstName} ${parent.lastName}`;
  const initials = `${parent.firstName?.[0] || ""}${parent.lastName?.[0] || ""}`.toUpperCase();
  const active = parent.user.isActive;

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.push("/dashboard/admin/parents")}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-muted hover:text-brand-navy transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Parents
      </button>

      <ProfileHeader
        name={fullName}
        roleLabel="Parent"
        idLabel="Parent Profile"
        initials={initials}
        email={parent.user.email}
        phone={parent.phone || parent.user.phone || undefined}
        active={active}
        stats={[
          { label: "Linked Children", value: parent._count.studentLinks },
        ]}
        onEdit={openEdit}
        onResetPassword={() => setResetOpen(true)}
        onToggleActive={() => setConfirmOpen("toggle")}
        onDelete={() => setConfirmOpen("delete")}
        busy={busy}
      />

      <div className="bg-white rounded-xl border border-brand-line shadow-sm">
        <ProfileTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
        <div className="p-6">
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <section className="space-y-2">
                <h3 className="font-heading font-bold text-brand-ink flex items-center gap-2">
                  <UserRound className="w-4 h-4 text-brand-green" /> Personal Information
                </h3>
                <dl className="rounded-xl border border-brand-line divide-y divide-brand-line">
                  <InfoRow
                    label="Occupation"
                    value={
                      <span className="inline-flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4 text-brand-muted" />
                        {parent.occupation || "N/A"}
                      </span>
                    }
                  />
                  <InfoRow
                    label="Address"
                    value={
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-brand-muted" />
                        {parent.address || "N/A"}
                      </span>
                    }
                  />
                  <InfoRow
                    label="Phone"
                    value={
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="w-4 h-4 text-brand-muted" />
                        {parent.phone || parent.user.phone || "N/A"}
                      </span>
                    }
                  />
                </dl>
              </section>
              <section className="space-y-2">
                <h3 className="font-heading font-bold text-brand-ink flex items-center gap-2">
                  <Mail className="w-4 h-4 text-brand-green" /> Account
                </h3>
                <dl className="rounded-xl border border-brand-line divide-y divide-brand-line">
                  <InfoRow label="Email" value={parent.user.email} />
                  <InfoRow
                    label="Registered"
                    value={format(new Date(parent.user.createdAt), "PPP")}
                  />
                  <InfoRow
                    label="Account Status"
                    value={
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          active ? "bg-green-100 text-brand-green" : "bg-red-100 text-brand-red"
                        }`}
                      >
                        {active ? "Active" : "Inactive"}
                      </span>
                    }
                  />
                </dl>
              </section>
            </div>
          )}

          {activeTab === "children" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {parent.studentLinks.length === 0 ? (
                <p className="text-sm text-brand-muted py-8 text-center col-span-full">
                  No children linked to this parent yet.
                </p>
              ) : (
                parent.studentLinks.map(({ student }) => (
                  <button
                    key={student.id}
                    onClick={() => router.push(`/dashboard/admin/students/${student.id}`)}
                    className="text-left p-4 rounded-xl border border-brand-line bg-brand-paper hover:border-brand-navy/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-green to-brand-navy text-white flex items-center justify-center text-sm font-bold shrink-0">
                        {`${student.firstName?.[0] || ""}${student.lastName?.[0] || ""}`.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-brand-ink">
                          {student.firstName} {student.lastName}
                        </p>
                        <p className="text-xs text-brand-muted font-mono">{student.studentId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-3 flex-wrap text-xs text-brand-body">
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-school-blue font-medium">
                        {student.class?.name || "Unassigned"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Cake className="w-3.5 h-3.5 text-brand-muted" />
                        {format(new Date(student.dateOfBirth), "PPP")}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-brand-muted">
                      <span>{student.gender.toLowerCase()}</span>
                      <span>{student._count.grades} grades</span>
                      <span>{student._count.submissions} submissions</span>
                    </div>
                    <p className="text-xs text-school-blue mt-2 font-medium">
                      View Student Profile →
                    </p>
                  </button>
                ))
              )}
            </div>
          )}

          {activeTab === "activity" && (
            canViewActivity ? (
              <ActivityTimeline userId={parent.userId} limit={40} />
            ) : (
              <p className="text-sm text-brand-muted text-center py-8">
                You need the "View Activity Log" permission to view activity for this parent.
              </p>
            )
          )}
        </div>
      </div>

      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Parent Profile">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="First Name">
              <input
                type="text"
                value={editForm.firstName}
                onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="Last Name">
              <input
                type="text"
                value={editForm.lastName}
                onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                className={inputCls}
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Email">
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="Phone">
              <input
                type="text"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className={inputCls}
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Occupation">
              <input
                type="text"
                value={editForm.occupation}
                onChange={(e) => setEditForm({ ...editForm, occupation: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="Address">
              <input
                type="text"
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                className={inputCls}
              />
            </Field>
          </div>
          <Field label="Linked Children">
            <div className="max-h-48 overflow-y-auto border border-brand-line rounded-xl p-2 space-y-1 bg-brand-paper">
              {students.length === 0 && (
                <p className="text-sm text-brand-muted px-3 py-2">No students available.</p>
              )}
              {students.map((s) => (
                <label
                  key={s.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white cursor-pointer text-sm"
                >
                  <input
                    type="checkbox"
                    checked={pickedStudents.includes(s.id)}
                    onChange={() =>
                      setPickedStudents((prev) =>
                        prev.includes(s.id) ? prev.filter((x) => x !== s.id) : [...prev, s.id]
                      )
                    }
                    className="accent-brand-navy"
                  />
                  <span className="text-brand-body">{s.name}</span>
                </label>
              ))}
            </div>
          </Field>
          <div className="flex justify-end gap-3 pt-4 border-t border-brand-line">
            <button
              onClick={() => setEditOpen(false)}
              className="px-4 py-2.5 text-sm font-medium text-brand-body bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={saveEdit}
              disabled={busy || !editForm.firstName || !editForm.lastName || !editForm.email}
              className="sd-btn sd-btn-apply px-5 py-2.5 text-sm disabled:opacity-50 inline-flex items-center gap-2"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={resetOpen}
        onClose={() => {
          setResetOpen(false);
          setPassword("");
        }}
        title="Reset Parent Password"
        size="sm"
      >
        <div className="space-y-4">
          <Field label="New Password (min 8 characters)">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
            />
          </Field>
          <div className="flex justify-end gap-3 pt-4 border-t border-brand-line">
            <button
              onClick={() => {
                setResetOpen(false);
                setPassword("");
              }}
              className="px-4 py-2.5 text-sm font-medium text-brand-body bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={savePassword}
              disabled={busy || password.length < 8}
              className="sd-btn sd-btn-apply px-5 py-2.5 text-sm disabled:opacity-50 inline-flex items-center gap-2"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              Reset Password
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmOpen === "toggle"}
        onClose={() => setConfirmOpen(null)}
        onConfirm={toggleActive}
        title={active ? "Deactivate Parent" : "Activate Parent"}
        message={
          active
            ? `This will disable login access for ${fullName}. You can reactivate anytime.`
            : `This will re-enable login access for ${fullName}.`
        }
        confirmLabel={active ? "Deactivate" : "Activate"}
        loading={busy}
      />
      <ConfirmDialog
        isOpen={confirmOpen === "delete"}
        onClose={() => setConfirmOpen(null)}
        onConfirm={deleteParent}
        title="Delete Parent"
        message={`This will permanently delete ${fullName} and their account, removing all child links. This action cannot be undone.`}
        loading={busy}
      />
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2.5 bg-brand-paper border border-brand-line rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy";

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 px-4">
      <dt className="text-sm text-brand-muted">{label}</dt>
      <dd className="text-sm font-medium text-brand-ink text-right break-all">{value}</dd>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-brand-body mb-1.5">{label}</label>
      {children}
    </div>
  );
}