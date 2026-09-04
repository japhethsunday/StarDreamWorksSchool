"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  UserRound,
  BookOpen,
  ClipboardList,
  Activity,
  GraduationCap,
  Briefcase,
  Mail,
  Loader2,
  AlertCircle,
  Search,
} from "lucide-react";
import { format } from "date-fns";
import ProfileHeader from "@/components/dashboard/ProfileHeader";
import ProfileTabs from "@/components/dashboard/ProfileTabs";
import ActivityTimeline from "@/components/dashboard/ActivityTimeline";
import Modal from "@/components/dashboard/Modal";
import ConfirmDialog from "@/components/dashboard/ConfirmDialog";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";
import { useCanPermission } from "@/lib/use-permission";

interface TeacherDetail {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  qualification?: string | null;
  specialization?: string | null;
  createdAt: string;
  user: {
    email: string;
    phone?: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  classes: { class: { id: string; name: string; level?: string | null; section?: string | null } }[];
  subjects: { subject: { id: string; name: string; code?: string | null; level?: string | null } }[];
  assignments: {
    id: string;
    title: string;
    dueDate: string;
    subject: { name: string } | null;
    class: { name: string } | null;
    _count: { submissions: number };
  }[];
  _count: { classes: number; subjects: number; assignments: number; materials: number; gradesGiven: number };
}

interface PickOption {
  id: string;
  name: string;
}

const tabs = [
  { key: "overview", label: "Overview", icon: <UserRound className="w-4 h-4" /> },
  { key: "teaching", label: "Classes & Subjects", icon: <BookOpen className="w-4 h-4" /> },
  { key: "assignments", label: "Assignments", icon: <ClipboardList className="w-4 h-4" /> },
  { key: "activity", label: "Activity", icon: <Activity className="w-4 h-4" /> },
];

export default function TeacherProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const canViewActivity = useCanPermission("VIEW_ACTIVITY");
  const [teacher, setTeacher] = useState<TeacherDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const [editOpen, setEditOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState<"toggle" | "delete" | null>(null);
  const [busy, setBusy] = useState(false);

  const [classes, setClasses] = useState<PickOption[]>([]);
  const [subjects, setSubjects] = useState<PickOption[]>([]);
  const [pickedClasses, setPickedClasses] = useState<string[]>([]);
  const [pickedSubjects, setPickedSubjects] = useState<string[]>([]);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    qualification: "",
    specialization: "",
  });
  const [password, setPassword] = useState("");
  const [assignSearch, setAssignSearch] = useState("");

  const fetchTeacher = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/teachers/${params.id}`);
      if (res.status === 404) {
        setError("Teacher not found.");
        return;
      }
      if (!res.ok) throw new Error("Failed to load teacher");
      const json = await res.json();
      setTeacher(json.data);
    } catch (e: any) {
      setError(e.message || "Failed to load teacher");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchTeacher();
  }, [fetchTeacher]);

  const openEdit = async () => {
    if (!teacher) return;
    setEditForm({
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      email: teacher.user.email,
      phone: teacher.phone || teacher.user.phone || "",
      qualification: teacher.qualification || "",
      specialization: teacher.specialization || "",
    });
    setPickedClasses(teacher.classes.map((c) => c.class.id));
    setPickedSubjects(teacher.subjects.map((s) => s.subject.id));
    setEditOpen(true);
    const refRes = await fetch("/api/admin/reference");
    if (refRes.ok) {
      const ref = await refRes.json();
      const d = ref.data || {};
      setClasses((d.classes || []).map((x: any) => ({ id: x.id, name: x.name })));
      setSubjects((d.subjects || []).map((x: any) => ({ id: x.id, name: x.name })));
    }
  };

  const saveEdit = async () => {
    if (!teacher) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/teachers/${teacher.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          email: editForm.email,
          phone: editForm.phone || undefined,
          qualification: editForm.qualification,
          specialization: editForm.specialization,
          classIds: pickedClasses,
          subjectIds: pickedSubjects,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update teacher");
      }
      setEditOpen(false);
      fetchTeacher();
    } catch (e: any) {
      alert(e.message || "Failed to update teacher");
    } finally {
      setBusy(false);
    }
  };

  const savePassword = async () => {
    if (!teacher) return;
    if (password.length < 8) {
      alert("Password must be at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/teachers/${teacher.id}`, {
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
    if (!teacher) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/teachers/${teacher.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !teacher.user.isActive }),
      });
      if (!res.ok) throw new Error("Failed to update teacher status");
      setConfirmOpen(null);
      fetchTeacher();
    } catch (e: any) {
      alert(e.message || "Failed to update status");
    } finally {
      setBusy(false);
    }
  };

  const deleteTeacher = async () => {
    if (!teacher) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/teachers/${teacher.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete teacher");
      router.push("/dashboard/admin/teachers");
    } catch (e: any) {
      alert(e.message || "Failed to delete teacher");
      setBusy(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading teacher profile..." fullScreen />;

  if (error || !teacher) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-brand-red" />
        </div>
        <p className="text-brand-body">{error || "Teacher not found."}</p>
        <button
          onClick={() => router.push("/dashboard/admin/teachers")}
          className="px-4 py-2 bg-brand-navy text-white text-sm rounded-xl"
        >
          Back to Teachers
        </button>
      </div>
    );
  }

  const fullName = `${teacher.firstName} ${teacher.lastName}`;
  const initials = `${teacher.firstName?.[0] || ""}${teacher.lastName?.[0] || ""}`.toUpperCase();
  const active = teacher.user.isActive;

  const filteredAssignments = teacher.assignments.filter(
    (a) =>
      a.title.toLowerCase().includes(assignSearch.toLowerCase()) ||
      (a.subject?.name || "").toLowerCase().includes(assignSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.push("/dashboard/admin/teachers")}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-muted hover:text-brand-navy transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Teachers
      </button>

      <ProfileHeader
        name={fullName}
        roleLabel="Teacher"
        idLabel="Teacher Profile"
        initials={initials}
        email={teacher.user.email}
        phone={teacher.phone || teacher.user.phone || undefined}
        active={active}
        stats={[
          { label: "Classes", value: teacher._count.classes },
          { label: "Subjects", value: teacher._count.subjects },
          { label: "Assignments", value: teacher._count.assignments },
          { label: "Materials", value: teacher._count.materials },
          { label: "Grades Given", value: teacher._count.gradesGiven },
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
                  <Briefcase className="w-4 h-4 text-brand-green" /> Professional Information
                </h3>
                <dl className="rounded-xl border border-brand-line divide-y divide-brand-line">
                  <InfoRow label="Qualification" value={teacher.qualification || "N/A"} />
                  <InfoRow label="Specialization" value={teacher.specialization || "N/A"} />
                  <InfoRow label="Joined" value={format(new Date(teacher.user.createdAt), "PPP")} />
                  <InfoRow label="Last Updated" value={format(new Date(teacher.user.updatedAt || teacher.createdAt), "PPP")} />
                </dl>
              </section>
              <section className="space-y-2">
                <h3 className="font-heading font-bold text-brand-ink flex items-center gap-2">
                  <Mail className="w-4 h-4 text-brand-green" /> Contact & Account
                </h3>
                <dl className="rounded-xl border border-brand-line divide-y divide-brand-line">
                  <InfoRow label="Email" value={teacher.user.email} />
                  <InfoRow label="Phone" value={teacher.phone || teacher.user.phone || "N/A"} />
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

          {activeTab === "teaching" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <section className="space-y-3">
                <h3 className="font-heading font-bold text-brand-ink">
                  Classes ({teacher.classes.length})
                </h3>
                {teacher.classes.length === 0 ? (
                  <p className="text-sm text-brand-muted">No classes assigned.</p>
                ) : (
                  <div className="space-y-2">
                    {teacher.classes.map((c) => (
                      <div
                        key={c.class.id}
                        className="flex items-center gap-3 p-3 rounded-xl border border-brand-line bg-brand-paper"
                      >
                        <div className="w-8 h-8 rounded-lg bg-brand-navy text-white flex items-center justify-center">
                          <GraduationCap className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-brand-ink">{c.class.name}</p>
                          {c.class.level && (
                            <p className="text-xs text-brand-muted">
                              {c.class.level}
                              {c.class.section ? ` · Section ${c.class.section}` : ""}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
              <section className="space-y-3">
                <h3 className="font-heading font-bold text-brand-ink">
                  Subjects ({teacher.subjects.length})
                </h3>
                {teacher.subjects.length === 0 ? (
                  <p className="text-sm text-brand-muted">No subjects assigned.</p>
                ) : (
                  <div className="space-y-2">
                    {teacher.subjects.map((s) => (
                      <div
                        key={s.subject.id}
                        className="flex items-center gap-3 p-3 rounded-xl border border-brand-line bg-brand-paper"
                      >
                        <div className="w-8 h-8 rounded-lg bg-brand-green text-white flex items-center justify-center">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-brand-ink">{s.subject.name}</p>
                          <p className="text-xs text-brand-muted">
                            {s.subject.code || "—"}
                            {s.subject.level ? ` · ${s.subject.level}` : ""}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {activeTab === "assignments" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-brand-paper border border-brand-line rounded-xl px-4 py-2.5 sm:max-w-xs">
                <Search className="w-4 h-4 text-brand-muted" />
                <input
                  type="text"
                  placeholder="Search assignments..."
                  value={assignSearch}
                  onChange={(e) => setAssignSearch(e.target.value)}
                  className="bg-transparent text-sm outline-none w-full"
                />
              </div>
              {filteredAssignments.length === 0 ? (
                <p className="text-sm text-brand-muted py-8 text-center">No assignments yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-brand-muted border-b border-brand-line">
                        <th className="py-2.5 pr-4 font-semibold">Title</th>
                        <th className="py-2.5 pr-4 font-semibold">Subject</th>
                        <th className="py-2.5 pr-4 font-semibold">Class</th>
                        <th className="py-2.5 pr-4 font-semibold">Due Date</th>
                        <th className="py-2.5 font-semibold">Submissions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-line">
                      {filteredAssignments.map((a) => (
                        <tr key={a.id}>
                          <td className="py-3 pr-4 font-medium text-brand-ink">{a.title}</td>
                          <td className="py-3 pr-4 text-brand-body">{a.subject?.name || "—"}</td>
                          <td className="py-3 pr-4 text-brand-body">{a.class?.name || "—"}</td>
                          <td className="py-3 pr-4 text-brand-muted">{format(new Date(a.dueDate), "PPp")}</td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-school-blue text-xs font-semibold">
                              {a._count.submissions}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === "activity" && (
            canViewActivity ? (
              <ActivityTimeline userId={teacher.userId} limit={40} />
            ) : (
              <p className="text-sm text-brand-muted text-center py-8">
                You need the "View Activity Log" permission to view activity for this teacher.
              </p>
            )
          )}
        </div>
      </div>

      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Teacher Profile">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="First Name">
              <input
                type="text"
                value={editForm.firstName}
                onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                className="w-full px-3 py-2.5 bg-brand-paper border border-brand-line rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy"
              />
            </Field>
            <Field label="Last Name">
              <input
                type="text"
                value={editForm.lastName}
                onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                className="w-full px-3 py-2.5 bg-brand-paper border border-brand-line rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy"
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Email">
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="w-full px-3 py-2.5 bg-brand-paper border border-brand-line rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy"
              />
            </Field>
            <Field label="Phone">
              <input
                type="text"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="w-full px-3 py-2.5 bg-brand-paper border border-brand-line rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy"
              />
            </Field>
          </div>
          <Field label="Qualification">
            <input
              type="text"
              value={editForm.qualification}
              onChange={(e) => setEditForm({ ...editForm, qualification: e.target.value })}
              className="w-full px-3 py-2.5 bg-brand-paper border border-brand-line rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy"
            />
          </Field>
          <Field label="Specialization">
            <input
              type="text"
              value={editForm.specialization}
              onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })}
              className="w-full px-3 py-2.5 bg-brand-paper border border-brand-line rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy"
            />
          </Field>
          <Field label="Classes">
            <MultiPick
              options={classes}
              picked={pickedClasses}
              onChange={setPickedClasses}
              placeholder="Select classes..."
            />
          </Field>
          <Field label="Subjects">
            <MultiPick
              options={subjects}
              picked={pickedSubjects}
              onChange={setPickedSubjects}
              placeholder="Select subjects..."
            />
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
        title="Reset Teacher Password"
        size="sm"
      >
        <div className="space-y-4">
          <Field label="New Password (min 8 characters)">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 bg-brand-paper border border-brand-line rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy"
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
        title={active ? "Deactivate Teacher" : "Activate Teacher"}
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
        onConfirm={deleteTeacher}
        title="Delete Teacher"
        message={`This will permanently delete ${fullName} and their account, including all associated links. This action cannot be undone.`}
        loading={busy}
      />
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 px-4">
      <dt className="text-sm text-brand-muted">{label}</dt>
      <dd className="text-sm font-medium text-brand-ink text-right break-all">
        {value}
      </dd>
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

function MultiPick({
  options,
  picked,
  onChange,
  placeholder,
}: {
  options: PickOption[];
  picked: string[];
  onChange: (ids: string[]) => void;
  placeholder: string;
}) {
  const toggle = (id: string) => {
    onChange(picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id]);
  };
  const search = "";
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2 min-h-[44px] rounded-xl border border-brand-line bg-brand-paper px-3 py-2">
        {picked.length === 0 && (
          <span className="text-sm text-brand-muted py-1">{placeholder}</span>
        )}
        {picked.map((id) => {
          const opt = options.find((o) => o.id === id);
          return (
            <span
              key={id}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-navy text-white text-xs font-medium rounded-full"
            >
              {opt?.name || id}
              <button type="button" onClick={() => toggle(id)} className="text-white/70 hover:text-white">
                ×
              </button>
            </span>
          );
        })}
      </div>
      {options.length > 0 && (
        <div className="max-h-40 overflow-y-auto border border-brand-line rounded-xl p-2 space-y-1">
          {options.filter((o) => o.name.toLowerCase().includes(search.toLowerCase())).map((opt) => (
            <label
              key={opt.id}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-brand-paper cursor-pointer text-sm"
            >
              <input
                type="checkbox"
                checked={picked.includes(opt.id)}
                onChange={() => toggle(opt.id)}
                className="accent-brand-navy"
              />
              <span className="text-brand-body">{opt.name}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}