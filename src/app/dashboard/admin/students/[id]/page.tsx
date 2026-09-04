"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  UserRound,
  BookOpenCheck,
  ClipboardList,
  Users,
  Activity,
  Mail,
  Loader2,
  AlertCircle,
  Phone,
  Cake,
  MapPin,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import ProfileHeader from "@/components/dashboard/ProfileHeader";
import ProfileTabs from "@/components/dashboard/ProfileTabs";
import ActivityTimeline from "@/components/dashboard/ActivityTimeline";
import { useCanPermission } from "@/lib/use-permission";
import Modal from "@/components/dashboard/Modal";
import ConfirmDialog from "@/components/dashboard/ConfirmDialog";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";

interface StudentDetail {
  id: string;
  userId: string;
  studentId: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  dateOfBirth: string;
  gender: string;
  classId: string | null;
  parentContact?: string | null;
  address?: string | null;
  academicSession?: string | null;
  admissionDate: string;
  status: string;
  user: { email: string; phone?: string | null; isActive: boolean; createdAt: string };
  class: { id: string; name: string; level?: string | null; section?: string | null; academicSession?: string | null } | null;
  parentLinks: {
    parent: {
      id: string;
      firstName: string;
      lastName: string;
      phone?: string | null;
      address?: string | null;
      occupation?: string | null;
      user: { email: string };
    };
  }[];
  submissions: {
    id: string;
    content?: string | null;
    files?: string | null;
    submittedAt: string;
    grade?: number | null;
    feedback?: string | null;
    status: string;
    assignment: { title: string; dueDate: string; subject: { name: string } | null };
  }[];
  grades: {
    id: string;
    academicSession: string;
    term: string;
    score: number;
    maxScore?: number;
    grade: string;
    remarks?: string | null;
    subject: { id: string; name: string; code?: string | null };
    class: { name: string } | null;
    teacher: { id: string; firstName: string; lastName: string } | null;
  }[];
  _count: { submissions: number; grades: number };
}

interface ClassOption {
  id: string;
  name: string;
}

const tabs = [
  { key: "overview", label: "Overview", icon: <UserRound className="w-4 h-4" /> },
  { key: "academic", label: "Academic", icon: <BookOpenCheck className="w-4 h-4" /> },
  { key: "submissions", label: "Assignments", icon: <ClipboardList className="w-4 h-4" /> },
  { key: "family", label: "Family", icon: <Users className="w-4 h-4" /> },
  { key: "activity", label: "Activity", icon: <Activity className="w-4 h-4" /> },
];

export default function StudentProfilePage() {
  const params = useParams<{ id: string }>();
  const canViewActivity = useCanPermission("VIEW_ACTIVITY");
  const router = useRouter();
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const [editOpen, setEditOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState<"toggle" | "delete" | null>(null);
  const [busy, setBusy] = useState(false);

  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [parents, setParents] = useState<{ id: string; name: string }[]>([]);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    email: "",
    dateOfBirth: "",
    gender: "MALE",
    classId: "",
    parentContact: "",
    address: "",
    academicSession: "",
    status: "ACTIVE",
  });
  const [pickedParents, setPickedParents] = useState<string[]>([]);
  const [password, setPassword] = useState("");

  const fetchStudent = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/students/${params.id}`);
      if (res.status === 404) {
        setError("Student not found.");
        return;
      }
      if (!res.ok) throw new Error("Failed to load student");
      const json = await res.json();
      setStudent(json.data);
    } catch (e: any) {
      setError(e.message || "Failed to load student");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchStudent();
  }, [fetchStudent]);

  const openEdit = async () => {
    if (!student) return;
    setEditForm({
      firstName: student.firstName,
      lastName: student.lastName,
      middleName: student.middleName || "",
      email: student.user.email,
      dateOfBirth: student.dateOfBirth?.split("T")[0] || "",
      gender: student.gender,
      classId: student.classId || "",
      parentContact: student.parentContact || "",
      address: student.address || "",
      academicSession: student.academicSession || student.class?.academicSession || "",
      status: student.status,
    });
    setPickedParents(student.parentLinks.map((p) => p.parent.id));
    setEditOpen(true);
    const refRes = await fetch("/api/admin/reference");
    if (refRes.ok) {
      const ref = await refRes.json();
      const d = ref.data || {};
      setClasses((d.classes || []).map((x: any) => ({ id: x.id, name: x.name })));
      setParents(
        (d.parents || []).map((x: any) => ({
          id: x.id,
          name: `${x.firstName || ""} ${x.lastName || ""}`.trim(),
        }))
      );
    }
  };

  const saveEdit = async () => {
    if (!student) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/students/${student.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editForm,
          middleName: editForm.middleName || undefined,
          parentContact: editForm.parentContact || undefined,
          address: editForm.address || undefined,
          academicSession: editForm.academicSession || undefined,
          parentIds: pickedParents,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update student");
      }
      setEditOpen(false);
      fetchStudent();
    } catch (e: any) {
      alert(e.message || "Failed to update student");
    } finally {
      setBusy(false);
    }
  };

  const savePassword = async () => {
    if (!student) return;
    if (password.length < 8) {
      alert("Password must be at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/students/${student.id}`, {
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
    if (!student) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/students/${student.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isActive: !student.user.isActive,
          status: !student.user.isActive ? "ACTIVE" : student.status,
        }),
      });
      if (!res.ok) throw new Error("Failed to update student status");
      setConfirmOpen(null);
      fetchStudent();
    } catch (e: any) {
      alert(e.message || "Failed to update status");
    } finally {
      setBusy(false);
    }
  };

  const deleteStudent = async () => {
    if (!student) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/students/${student.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete student");
      router.push("/dashboard/admin/students");
    } catch (e: any) {
      alert(e.message || "Failed to delete student");
      setBusy(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading student profile..." fullScreen />;

  if (error || !student) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-brand-red" />
        </div>
        <p className="text-brand-body">{error || "Student not found."}</p>
        <button
          onClick={() => router.push("/dashboard/admin/students")}
          className="px-4 py-2 bg-brand-navy text-white text-sm rounded-xl"
        >
          Back to Students
        </button>
      </div>
    );
  }

  const fullName = `${student.firstName} ${student.middleName ? student.middleName + " " : ""}${student.lastName}`;
  const initials = `${student.firstName?.[0] || ""}${student.lastName?.[0] || ""}`.toUpperCase();
  const active = student.user.isActive;
  const termGrades = computeGrades(student.grades);

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.push("/dashboard/admin/students")}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-muted hover:text-brand-navy transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Students
      </button>

      <ProfileHeader
        name={fullName}
        roleLabel="Student"
        idLabel={student.studentId}
        initials={initials}
        email={student.user.email}
        phone={student.parentContact || student.user.phone || undefined}
        active={active}
        statusLabel={student.status.charAt(0) + student.status.slice(1).toLowerCase()}
        stats={[
          { label: "Class", value: student.class?.name || "Unassigned" },
          { label: "Grades", value: student._count.grades },
          { label: "Submissions", value: student._count.submissions },
          { label: "Average", value: termGrades.overall ? `${termGrades.overall.toFixed(1)}%` : "—" },
          { label: "Linked Parents", value: student.parentLinks.length },
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
                    label="Date of Birth"
                    value={
                      <span className="inline-flex items-center gap-1.5">
                        <Cake className="w-4 h-4 text-brand-muted" />
                        {format(new Date(student.dateOfBirth), "PPP")}
                      </span>
                    }
                  />
                  <InfoRow label="Gender" value={student.gender.toLowerCase()} />
                  <InfoRow
                    label="Address"
                    value={
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-brand-muted" />
                        {student.address || "N/A"}
                      </span>
                    }
                  />
                  <InfoRow
                    label="Admitted"
                    value={
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-brand-muted" />
                        {format(new Date(student.admissionDate), "PPP")}
                      </span>
                    }
                  />
                </dl>
              </section>
              <section className="space-y-2">
                <h3 className="font-heading font-bold text-brand-ink flex items-center gap-2">
                  <Mail className="w-4 h-4 text-brand-green" /> Contact & Enrolment
                </h3>
                <dl className="rounded-xl border border-brand-line divide-y divide-brand-line">
                  <InfoRow label="Email" value={student.user.email} />
                  <InfoRow label="Parent Contact" value={student.parentContact || "N/A"} />
                  <InfoRow label="Class" value={student.class?.name || "Unassigned"} />
                  <InfoRow label="Academic Session" value={student.academicSession || student.class?.academicSession || "N/A"} />
                  <InfoRow
                    label="Enrolment Status"
                    value={
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          student.status === "ACTIVE"
                            ? "bg-green-100 text-brand-green"
                            : student.status === "SUSPENDED"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-gray-100 text-brand-muted"
                        }`}
                      >
                        {student.status.charAt(0) + student.status.slice(1).toLowerCase()}
                      </span>
                    }
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

          {activeTab === "academic" && (
            <div className="space-y-8">
              {termGrades.terms.length === 0 ? (
                <p className="text-sm text-brand-muted py-8 text-center">No grades recorded yet.</p>
              ) : (
                termGrades.terms.map((term) => (
                  <section key={term.key} className="space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h3 className="font-heading font-bold text-brand-ink">
                        {term.session} · {term.term}
                      </h3>
                      <span className="px-3 py-1 rounded-full bg-brand-navy text-white text-xs font-semibold">
                        Average: {term.average.toFixed(1)}%
                      </span>
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-brand-line">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-xs text-brand-muted bg-brand-paper border-b border-brand-line">
                            <th className="py-2.5 px-4 font-semibold">Subject</th>
                            <th className="py-2.5 px-4 font-semibold">Score</th>
                            <th className="py-2.5 px-4 font-semibold">Grade</th>
                            <th className="py-2.5 px-4 font-semibold">Remark</th>
                            <th className="py-2.5 px-4 font-semibold">Teacher</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-line">
                          {term.grades.map((g) => (
                            <tr key={g.id}>
                              <td className="py-3 px-4 font-medium text-brand-ink">{g.subject.name}</td>
                              <td className="py-3 px-4 text-brand-body">{g.score.toFixed ? g.score.toFixed(1) : g.score}</td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-school-blue text-xs font-bold">
                                  {g.grade}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-brand-muted">{g.remarks || "—"}</td>
                              <td className="py-3 px-4 text-brand-body">
                                {g.teacher ? `${g.teacher.firstName} ${g.teacher.lastName}` : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                ))
              )}
            </div>
          )}

          {activeTab === "submissions" && (
            <div className="space-y-4">
              {student.submissions.length === 0 ? (
                <p className="text-sm text-brand-muted py-8 text-center">
                  No assignment submissions yet.
                </p>
              ) : (
                student.submissions.map((s) => (
                  <div
                    key={s.id}
                    className="p-4 rounded-xl border border-brand-line bg-brand-paper"
                  >
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <p className="text-sm font-semibold text-brand-ink">{s.assignment.title}</p>
                        <p className="text-xs text-brand-muted mt-0.5">
                          {s.assignment.subject?.name || "General"} · Due{" "}
                          {format(new Date(s.assignment.dueDate), "PP")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-brand-muted">
                          {s.status.toLowerCase()}
                        </span>
                        {typeof s.grade === "number" && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-brand-green">
                            {s.grade}%
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-brand-muted mt-2">
                      Submitted {format(new Date(s.submittedAt), "PPpp")}
                    </p>
                    {s.feedback && (
                      <p className="text-sm text-brand-body mt-2 pt-2 border-t border-brand-line">
                        <span className="font-semibold text-brand-ink">Feedback: </span>
                        {s.feedback}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "family" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-bold text-brand-ink">
                  Linked Parents ({student.parentLinks.length})
                </h3>
              </div>
              {student.parentLinks.length === 0 ? (
                <p className="text-sm text-brand-muted py-8 text-center">No parents linked.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {student.parentLinks.map(({ parent }) => (
                    <button
                      key={parent.id}
                      onClick={() => router.push(`/dashboard/admin/parents/${parent.id}`)}
                      className="text-left p-4 rounded-xl border border-brand-line bg-brand-paper hover:border-brand-navy/40 transition-colors"
                    >
                      <p className="text-sm font-semibold text-brand-ink">
                        {parent.firstName} {parent.lastName}
                      </p>
                      <p className="text-xs text-brand-muted mt-0.5">{parent.user.email}</p>
                      <div className="flex items-center gap-3 mt-2 flex-wrap text-xs text-brand-body">
                        {parent.phone && (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" /> {parent.phone}
                          </span>
                        )}
                        {parent.occupation && <span>{parent.occupation}</span>}
                      </div>
                      <p className="text-xs text-school-blue mt-2 font-medium">
                        View Parent Profile →
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "activity" && (
            canViewActivity ? (
              <ActivityTimeline userId={student.userId} limit={40} />
            ) : (
              <p className="text-sm text-brand-muted text-center py-8">
                You need the "View Activity Log" permission to view activity for this student.
              </p>
            )
          )}
        </div>
      </div>

      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Student Profile">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="First Name">
              <input
                type="text"
                value={editForm.firstName}
                onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="Middle Name">
              <input
                type="text"
                value={editForm.middleName}
                onChange={(e) => setEditForm({ ...editForm, middleName: e.target.value })}
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
            <Field label="Date of Birth">
              <input
                type="date"
                value={editForm.dateOfBirth}
                onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                className={inputCls}
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Gender">
              <select
                value={editForm.gender}
                onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                className={inputCls}
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </Field>
            <Field label="Class">
              <select
                value={editForm.classId}
                onChange={(e) => setEditForm({ ...editForm, classId: e.target.value })}
                className={inputCls}
              >
                <option value="">Unassigned</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Parent Contact">
              <input
                type="text"
                value={editForm.parentContact}
                onChange={(e) => setEditForm({ ...editForm, parentContact: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="Academic Session">
              <input
                type="text"
                value={editForm.academicSession}
                onChange={(e) => setEditForm({ ...editForm, academicSession: e.target.value })}
                className={inputCls}
              />
            </Field>
          </div>
          <Field label="Address">
            <input
              type="text"
              value={editForm.address}
              onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
              className={inputCls}
            />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Enrolment Status">
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className={inputCls}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="GRADUATED">Graduated</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </Field>
            <Field label="Linked Parents">
              <div className="max-h-40 overflow-y-auto border border-brand-line rounded-xl p-2 space-y-1 bg-brand-paper">
                {parents.length === 0 && (
                  <p className="text-sm text-brand-muted px-3 py-2">No parents available.</p>
                )}
                {parents.map((p) => (
                  <label
                    key={p.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white cursor-pointer text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={pickedParents.includes(p.id)}
                      onChange={() =>
                        setPickedParents((prev) =>
                          prev.includes(p.id)
                            ? prev.filter((x) => x !== p.id)
                            : [...prev, p.id]
                        )
                      }
                      className="accent-brand-navy"
                    />
                    <span className="text-brand-body">{p.name}</span>
                  </label>
                ))}
              </div>
            </Field>
          </div>
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
        title="Reset Student Password"
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
        title={active ? "Deactivate Student" : "Activate Student"}
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
        onConfirm={deleteStudent}
        title="Delete Student"
        message={`This will permanently delete ${fullName} and their account, along with grades, submissions, and family links. This action cannot be undone.`}
        loading={busy}
      />
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2.5 bg-brand-paper border border-brand-line rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy";

function computeGrades(grades: StudentDetail["grades"]) {
  const sessions: Record<string, Record<string, { count: number; totalScore: number; maxTotal: number }>> = {};
  for (const g of grades) {
    const key = `${g.academicSession}__${g.term}`;
    sessions[g.academicSession] = sessions[g.academicSession] || {};
    sessions[g.academicSession][g.term] = sessions[g.academicSession][g.term] || {
      count: 0,
      totalScore: 0,
      maxTotal: 0,
    };
    sessions[g.academicSession][g.term].count += 1;
    sessions[g.academicSession][g.term].totalScore += g.score;
    sessions[g.academicSession][g.term].maxTotal += g.maxScore || 100;
  }
  const terms = Object.entries(sessions).flatMap(([session, termsMap]) =>
    Object.entries(termsMap).map(([term, agg]) => ({
      key: `${session}__${term}`,
      session,
      term,
      average: agg.maxTotal > 0 ? (agg.totalScore / agg.maxTotal) * 100 : 0,
      grades: grades.filter(
        (g) => g.academicSession === session && g.term === term
      ),
    }))
  );
  const overallScores = grades.reduce((a, g) => a + g.score, 0);
  const overallMax = grades.reduce((a, g) => a + (g.maxScore || 100), 0);
  const overall = grades.length > 0 && overallMax > 0 ? (overallScores / overallMax) * 100 : 0;
  return { terms, overall };
}

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