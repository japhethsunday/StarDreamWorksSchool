"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  AlertCircle,
  Inbox,
  Calendar,
  Phone,
  MapPin,
  Baby,
  GraduationCap,
  User,
} from "lucide-react";
import DataTable from "@/components/dashboard/DataTable";
import Modal from "@/components/dashboard/Modal";
import EmptyState from "@/components/dashboard/EmptyState";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";

interface Enquiry {
  id: string;
  childFirstName: string;
  childLastName: string;
  dateOfBirth: string | null;
  level: string;
  studentClass: string | null;
  parentName: string;
  phone: string;
  email: string | null;
  address: string | null;
  message: string | null;
  status: string;
  createdAt: string;
}

const STATUSES = ["NEW", "CONTACTED", "APPROVED", "REJECTED"] as const;

const statusStyle: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700",
  CONTACTED: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

export default function AdminAdmissionsPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [currentStatus, setCurrentStatus] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewing, setViewing] = useState<Enquiry | null>(null);
  const [updating, setUpdating] = useState(false);

  const getCount = (s?: string) =>
    counts ? counts[s || "TOTAL"] ?? 0 : 0;

  const fetchData = useCallback(async (status = currentStatus) => {
    try {
      setLoading(true);
      setError("");
      const query = status ? `?status=${status}` : "";
      const res = await fetch(`/api/admin/admissions${query}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setEnquiries(data.data || []);
      const c: Record<string, number> = { TOTAL: (data.data || []).length };
      (data.counts || []).forEach((g: { status: string; _count: { _all: number } }) => {
        c[g.status] = g._count._all;
      });
      setCounts(c);
    } catch {
      setError("Failed to load admission enquiries.");
    } finally {
      setLoading(false);
    }
  }, [currentStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const changeStatus = async (status: string) => {
    if (!viewing) return;
    setUpdating(true);
    try {
      const res = await fetch("/api/admin/admissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: viewing.id, status }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update status.");
      }
      setViewing({ ...viewing, status });
      fetchData();
    } catch (e: any) {
      alert(e.message || "Failed to update status.");
    } finally {
      setUpdating(false);
    }
  };

  const columns = [
    {
      key: "parentName",
      label: "Parent",
      render: (val: string) => <span className="font-medium text-gray-800">{val}</span>,
    },
    {
      key: "child",
      label: "Child",
      render: (_: any, row: Enquiry) => (
        <span className="text-gray-600">
          {[row.childFirstName, row.childLastName].filter(Boolean).join(" ") || "—"}
        </span>
      ),
    },
    {
      key: "level",
      label: "Level",
      render: (val: string) => (
        <span className="px-2.5 py-1 bg-school-blue/10 text-school-blue text-xs font-medium rounded-full capitalize">
          {val}
        </span>
      ),
    },
    {
      key: "phone",
      label: "Phone",
      render: (val: string) => <span className="text-gray-500 text-xs">{val || "—"}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (val: string) => (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle[val] || "bg-gray-100 text-gray-600"}`}>
          {val}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Date",
      render: (val: string) => (
        <span className="text-gray-400 text-xs flex items-center gap-1">
          <Calendar className="w-3 h-3" /> {new Date(val).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      label: "View",
      className: "text-right",
      render: (_: any, row: Enquiry) => (
        <button
          onClick={() => setViewing(row)}
          className="px-3 py-1.5 text-xs font-medium text-school-blue bg-school-blue/10 hover:bg-school-blue/20 rounded-lg transition-colors"
        >
          View
        </button>
      ),
    },
  ];

  if (loading) return <LoadingSpinner text="Loading admission enquiries..." fullScreen />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-gray-600">{error}</p>
        <button onClick={() => fetchData()} className="px-4 py-2 bg-school-blue text-white text-sm rounded-xl">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-[family-name:var(--font-poppins)] text-2xl font-bold text-school-dark">Admission Enquiries</h2>
        <p className="text-sm text-gray-500 mt-1">{getCount("TOTAL")} total</p>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        {["", ...STATUSES].map((s) => {
          const active = currentStatus === s;
          const label = s || "ALL";
          const count = s ? getCount(s) : getCount("TOTAL");
          return (
            <button
              key={label}
              onClick={() => setCurrentStatus(s)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                active ? "bg-school-blue text-white shadow-glow-blue" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      {enquiries.length === 0 ? (
        <EmptyState
          icon={<Inbox className="w-10 h-10 text-gray-400" />}
          title="No enquiries"
          description={currentStatus ? `No enquiries with "${currentStatus}" status.` : "Admission enquiries submitted from the public website will appear here."}
        />
      ) : (
        <DataTable columns={columns} data={enquiries} emptyMessage="No enquiries to display." />
      )}

      {/* Detail modal */}
      <Modal isOpen={!!viewing} onClose={() => setViewing(null)} title="Admission Enquiry">
        {viewing && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusStyle[viewing.status] || "bg-gray-100 text-gray-600"}`}>
                {viewing.status}
              </span>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {new Date(viewing.createdAt).toLocaleString()}
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Baby className="w-4 h-4 text-school-blue mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Child</p>
                  <p className="text-sm font-medium text-gray-800">
                    {[viewing.childFirstName, viewing.childLastName].filter(Boolean).join(" ") || "—"}
                  </p>
                  {viewing.dateOfBirth && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      DOB: {new Date(viewing.dateOfBirth).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <GraduationCap className="w-4 h-4 text-school-blue mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Level</p>
                  <p className="text-sm font-medium text-gray-800 capitalize">{viewing.level}</p>
                  {viewing.studentClass && (
                    <p className="text-xs text-gray-500 mt-0.5">Class: {viewing.studentClass}</p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-school-blue mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Parent</p>
                  <p className="text-sm font-medium text-gray-800">{viewing.parentName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-school-blue mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Contact</p>
                  <a href={`tel:${viewing.phone}`} className="text-sm font-medium text-school-blue">{viewing.phone}</a>
                  {viewing.email && (
                    <a href={`mailto:${viewing.email}`} className="block text-xs text-school-blue mt-0.5">
                      {viewing.email}
                    </a>
                  )}
                </div>
              </div>
              {viewing.address && (
                <div className="flex items-start gap-3 sm:col-span-2">
                  <MapPin className="w-4 h-4 text-school-blue mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Address</p>
                    <p className="text-sm font-medium text-gray-800">{viewing.address}</p>
                  </div>
                </div>
              )}
            </div>

            {viewing.message && (
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Message</p>
                <p className="text-sm text-gray-700 leading-relaxed">{viewing.message}</p>
              </div>
            )}

            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Update status</p>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => changeStatus(s)}
                    disabled={updating || viewing.status === s}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                      viewing.status === s
                        ? "bg-school-blue text-white disabled:opacity-50"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {updating && (
                <p className="flex items-center gap-2 text-xs text-gray-400 mt-3">
                  <Loader2 className="w-3 h-3 animate-spin" /> Updating...
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
