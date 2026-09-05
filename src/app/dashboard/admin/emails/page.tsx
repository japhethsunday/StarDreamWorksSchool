"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Mail, Send, RotateCcw, Search, AlertCircle } from "lucide-react";
import DataTable from "@/components/dashboard/DataTable";
import Modal from "@/components/dashboard/Modal";
import EmptyState from "@/components/dashboard/EmptyState";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";

interface EmailRow {
  id: string;
  type: string;
  to: string;
  subject: string;
  status: string;
  error: string | null;
  remoteId: string | null;
  refId: string | null;
  attempts: number;
  sentAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ListResponse {
  success: boolean;
  data: EmailRow[];
  counts: Record<string, number>;
  page: number;
  pageSize: number;
}

const STATUSES = ["SENDING", "SENT", "DELIVERED", "FAILED", "BOUNCED", "COMPLAINED", "REJECTED"];
const EMAIL_TYPES = [
  "ACCOUNT_CREATED",
  "PASSWORD_RESET",
  "PASSWORD_CHANGED",
  "ACCOUNT_STATUS",
  "SECURITY_ALERT",
  "ADMISSION_ENQUIRY_RECEIVED",
  "ADMISSION_STATUS_CHANGED",
  "ANNOUNCEMENT",
  "ASSIGNMENT_PUBLISHED",
  "ASSIGNMENT_SUBMITTED",
  "ASSIGNMENT_GRADED",
  "ASSIGNMENT_REMINDER",
  "ASSIGNMENT_OVERDUE",
  "LEARNING_MATERIAL",
  "ACADEMIC_UPDATE",
  "GRADE_PUBLISHED",
  "SYSTEM_ALERT",
];

const statusStyle: Record<string, string> = {
  SENDING: "bg-blue-100 text-blue-700",
  SENT: "bg-yellow-100 text-yellow-700",
  DELIVERED: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
  BOUNCED: "bg-red-100 text-red-700",
  COMPLAINED: "bg-orange-100 text-orange-700",
  REJECTED: "bg-red-100 text-red-700",
};

const typeLabel: Record<string, string> = {
  ACCOUNT_CREATED: "Account created",
  PASSWORD_RESET: "Password reset",
  PASSWORD_CHANGED: "Password changed",
  ACCOUNT_STATUS: "Account status",
  SECURITY_ALERT: "Security alert",
  ADMISSION_ENQUIRY_RECEIVED: "Enquiry received",
  ADMISSION_STATUS_CHANGED: "Admission status",
  ANNOUNCEMENT: "Announcement",
  ASSIGNMENT_PUBLISHED: "Assignment published",
  ASSIGNMENT_SUBMITTED: "Assignment submitted",
  ASSIGNMENT_GRADED: "Assignment graded",
  ASSIGNMENT_REMINDER: "Assignment reminder",
  ASSIGNMENT_OVERDUE: "Assignment overdue",
  LEARNING_MATERIAL: "Learning material",
  ACADEMIC_UPDATE: "Academic update",
  GRADE_PUBLISHED: "Grade published",
  SYSTEM_ALERT: "System alert",
};

export default function AdminEmailsPage() {
  const [rows, setRows] = useState<EmailRow[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewing, setViewing] = useState<EmailRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (type) params.set("type", type);
      if (search) params.set("q", search);
      params.set("page", String(page));
      const res = await fetch(`/api/admin/emails?${params.toString()}`);
      if (!res.ok) throw new Error("Failed");
      const data: ListResponse = await res.json();
      setRows(data.data || []);
      setCounts(data.counts || {});
    } catch {
      setError("Failed to load email logs.");
    } finally {
      setLoading(false);
    }
  }, [status, type, search, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const applySearch = () => setPage(1);

  const resend = async (id: string) => {
    try {
      setBusy(true);
      setNotice("");
      const res = await fetch(`/api/admin/emails/${id}/resend`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setNotice(data.error || "Retry failed.");
        return;
      }
      setNotice("Email re-sent successfully.");
      setViewing(null);
      fetchData();
    } catch {
      setNotice("Retry failed.");
    } finally {
      setBusy(false);
    }
  };

  const sendTest = async () => {
    try {
      setBusy(true);
      setNotice("");
      const res = await fetch("/api/admin/emails", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setNotice("Test email sent to your inbox.");
        fetchData();
      } else {
        setNotice(data.message || "Test email failed.");
      }
    } catch {
      setNotice("Test email failed.");
    } finally {
      setBusy(false);
    }
  };

  const summaryChips = [
    { label: "Total", value: counts.total ?? 0, cls: "bg-brand-navy/5 text-brand-navy" },
    { label: "Delivered", value: counts.DELIVERED ?? 0, cls: "bg-green-100 text-green-700" },
    { label: "Sent", value: counts.SENT ?? 0, cls: "bg-yellow-100 text-yellow-700" },
    { label: "Failed", value: counts.FAILED ?? 0, cls: "bg-red-100 text-red-700" },
    { label: "Bounced", value: counts.BOUNCED ?? 0, cls: "bg-red-100 text-red-700" },
    { label: "Pending", value: counts.SENDING ?? 0, cls: "bg-blue-100 text-blue-700" },
  ];

  const columns = [
    {
      key: "to",
      label: "Recipient",
      render: (v: string) => <span className="font-medium text-brand-navy">{v}</span>,
    },
    {
      key: "type",
      label: "Type",
      render: (v: string) => <span className="text-xs font-semibold uppercase tracking-wide text-brand-muted">{typeLabel[v] || v}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (v: string) => (
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${statusStyle[v] || "bg-gray-100 text-gray-700"}`}>
          {v}
        </span>
      ),
    },
    {
      key: "subject",
      label: "Subject",
      render: (v: string) => <span className="block max-w-[260px] truncate">{v}</span>,
    },
    {
      key: "attempts",
      label: "Attempts",
    },
    {
      key: "createdAt",
      label: "Date",
      render: (v: string) =>
        new Date(v).toLocaleString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
    },
    {
      key: "id",
      label: "",
      render: (_: string, row: EmailRow) => (
        <div className="flex items-center gap-1.5 justify-end">
          <button
            onClick={() => setViewing(row)}
            className="px-2.5 py-1.5 text-xs font-semibold text-brand-green hover:bg-green-50 rounded-lg transition-colors"
          >
            View
          </button>
          {(row.status === "FAILED" || row.status === "SENDING") && (
            <button
              onClick={() => resend(row.id)}
              disabled={busy}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-brand-navy hover:bg-brand-paper rounded-lg transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Retry
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-navy">Email Logs</h1>
          <p className="mt-1 text-sm text-brand-muted">Every transactional email sent through the school portal, with delivery status.</p>
        </div>
        <button
          onClick={sendTest}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-navy-deep transition-colors disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          Send test email
        </button>
      </div>

      {notice && (
        <div className="flex items-center gap-2 rounded-lg border border-brand-line bg-brand-paper px-4 py-3 text-sm text-brand-navy">
          <Mail className="w-4 h-4 text-brand-green" />
          {notice}
        </div>
      )}

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {summaryChips.map((chip) => (
          <div key={chip.label} className={`rounded-xl px-4 py-3 ${chip.cls}`}>
            <p className="text-xl font-bold leading-none">{chip.value}</p>
            <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-widest opacity-80">{chip.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applySearch()}
            placeholder="Search recipient, subject, reference…"
            className="w-full rounded-lg border border-brand-line bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="rounded-lg border border-brand-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-green"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={type}
          onChange={(e) => { setType(e.target.value); setPage(1); }}
          className="rounded-lg border border-brand-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-green"
        >
          <option value="">All types</option>
          {EMAIL_TYPES.map((t) => (
            <option key={t} value={t}>{typeLabel[t] || t}</option>
          ))}
        </select>
        <button
          onClick={applySearch}
          className="rounded-lg bg-brand-paper border border-brand-line px-4 py-2.5 text-sm font-semibold text-brand-navy hover:bg-brand-yellow/20 transition-colors"
        >
          Apply
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No emails found"
          description={search || status || type ? "Try adjusting your filters." : "Emails will appear here once the school sends notifications."}
        />
      ) : (
        <DataTable columns={columns} data={rows} emptyMessage="No emails found" />
      )}

      {(counts.total ?? 0) > 0 && (
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-lg border border-brand-line bg-white px-3 py-2 text-sm font-semibold text-brand-navy hover:bg-brand-paper disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-brand-muted">Page {page}</span>
          {/* Rough next-page detection: show next if at least a full page loaded */}
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={rows.length < (counts.total > 25 ? 25 : 1)}
            className="rounded-lg border border-brand-line bg-white px-3 py-2 text-sm font-semibold text-brand-navy hover:bg-brand-paper disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {viewing && (
        <Modal isOpen={true} title="Email details" onClose={() => setViewing(null)}>
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-brand-muted">Recipient</p>
                <p className="mt-1 font-medium text-brand-navy break-all">{viewing.to}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-brand-muted">Status</p>
                <p className="mt-1">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${statusStyle[viewing.status] || "bg-gray-100 text-gray-700"}`}>
                    {viewing.status}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-brand-muted">Type</p>
                <p className="mt-1 font-medium text-brand-navy">{typeLabel[viewing.type] || viewing.type}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-brand-muted">Attempts</p>
                <p className="mt-1 font-medium text-brand-navy">{viewing.attempts || 1}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-muted">Subject</p>
              <p className="mt-1 font-medium text-brand-navy">{viewing.subject}</p>
            </div>
            {viewing.error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-red-700 break-words">
                {viewing.error}
              </div>
            )}
            {viewing.remoteId && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-brand-muted">Provider message ID</p>
                <p className="mt-1 font-mono text-xs text-brand-muted break-all">{viewing.remoteId}</p>
              </div>
            )}
            {viewing.refId && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-brand-muted">Reference</p>
                <p className="mt-1 font-mono text-xs text-brand-muted break-all">{viewing.refId}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-brand-muted">Created</p>
                <p className="mt-1 text-brand-body">{new Date(viewing.createdAt).toLocaleString("en-GB")}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-brand-muted">Delivered</p>
                <p className="mt-1 text-brand-body">
                  {viewing.deliveredAt ? new Date(viewing.deliveredAt).toLocaleString("en-GB") : "—"}
                </p>
              </div>
            </div>
            {viewing.status === "FAILED" && (
              <button
                onClick={() => resend(viewing.id)}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-green px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                Retry now
              </button>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}