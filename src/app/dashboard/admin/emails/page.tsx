"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Mail, PenSquare, RotateCcw, Search, AlertCircle, Users, Eye, CheckCircle2, XCircle, Clock3 } from "lucide-react";
import DataTable from "@/components/dashboard/DataTable";
import Modal from "@/components/dashboard/Modal";
import EmptyState from "@/components/dashboard/EmptyState";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";
import ComposeEmailModal from "@/components/dashboard/ComposeEmailModal";

/* ── Individual email log types ───────────────────────────────────── */
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
  "EXAM_PUBLISHED",
  "EXAM_SUBMITTED",
  "EXAM_RESULT_RELEASED",
  "SYSTEM_ALERT",
  "BULK_EMAIL",
];

/* ── Campaign row types ───────────────────────────────────────────── */
interface CampaignRow {
  id: string;
  subject: string;
  sender: string;
  categories: string[];
  recipientCount: number;
  status: string;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  error: string | null;
  sentByEmail: string | null;
  sentAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

interface CampaignListResponse {
  success: boolean;
  data: CampaignRow[];
  total: number;
  page: number;
  pageSize: number;
}

interface CampaignLogRow {
  id: string;
  to: string;
  subject: string;
  status: string;
  error: string | null;
  remoteId: string | null;
  attempts: number;
  sentAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
}

const CATEGORY_LABEL: Record<string, string> = {
  STUDENTS: "Students",
  PARENTS: "Parents",
  TEACHERS: "Teachers",
  ADMINS: "Admins",
};

const statusStyle: Record<string, string> = {
  SENDING: "bg-blue-100 text-blue-700",
  SENT: "bg-yellow-100 text-yellow-700",
  DELIVERED: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
  BOUNCED: "bg-red-100 text-red-700",
  COMPLAINED: "bg-orange-100 text-orange-700",
  REJECTED: "bg-red-100 text-red-700",
  QUEUED: "bg-blue-100 text-blue-700",
  PARTIALLY_FAILED: "bg-orange-100 text-orange-700",
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
  EXAM_PUBLISHED: "Exam published",
  EXAM_SUBMITTED: "Exam submitted",
  EXAM_RESULT_RELEASED: "Exam result released",
  SYSTEM_ALERT: "System alert",
  BULK_EMAIL: "Bulk campaign",
};

const campaignStatus = (s: string): { cls: string; icon: React.ReactNode; label: string } => {
  switch (s) {
    case "QUEUED":
    case "SENDING":
      return { cls: "bg-blue-100 text-blue-700", icon: <Clock3 className="w-3.5 h-3.5" />, label: s === "QUEUED" ? "Queued" : "Sending" };
    case "SENT":
      return { cls: "bg-green-100 text-green-700", icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: "Sent" };
    case "PARTIALLY_FAILED":
      return { cls: "bg-orange-100 text-orange-700", icon: <AlertCircle className="w-3.5 h-3.5" />, label: "Partially failed" };
    case "FAILED":
      return { cls: "bg-red-100 text-red-700", icon: <XCircle className="w-3.5 h-3.5" />, label: "Failed" };
    default:
      return { cls: "bg-gray-100 text-gray-700", icon: <Mail className="w-3.5 h-3.5" />, label: s };
  }
};

const fmtDate = (v: string | null | undefined) =>
  v
    ? new Date(v).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

export default function AdminEmailsPage() {
  /* Campaign tab state */
  const [tab, setTab] = useState<"campaigns" | "logs">("campaigns");
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [campaignsTotal, setCampaignsTotal] = useState(0);
  const [campaignsPage, setCampaignsPage] = useState(1);
  const [campaignsStatus, setCampaignsStatus] = useState("");
  const [campaignsSearch, setCampaignsSearch] = useState("");
  const [campaignsQ, setCampaignsQ] = useState("");
  const [campaignsLoading, setCampaignsLoading] = useState(true);
  const [campaignsError, setCampaignsError] = useState("");
  const [viewingCampaign, setViewingCampaign] = useState<CampaignRow | null>(null);
  const [campaignDetail, setCampaignDetail] = useState<{ data: any; logs: CampaignLogRow[] } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  /* Individual log tab state (existing) */
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

  /* Compose */
  const [composeOpen, setComposeOpen] = useState(false);

  const fetchLogs = useCallback(async () => {
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

  const fetchCampaigns = useCallback(async () => {
    try {
      setCampaignsLoading(true);
      setCampaignsError("");
      const params = new URLSearchParams();
      if (campaignsStatus) params.set("status", campaignsStatus);
      if (campaignsQ) params.set("q", campaignsQ);
      params.set("page", String(campaignsPage));
      const res = await fetch(`/api/admin/emails/campaigns?${params.toString()}`);
      if (!res.ok) throw new Error("Failed");
      const data: CampaignListResponse = await res.json();
      setCampaigns(data.data || []);
      setCampaignsTotal(data.total || 0);
    } catch {
      setCampaignsError("Failed to load email campaigns.");
    } finally {
      setCampaignsLoading(false);
    }
  }, [campaignsStatus, campaignsQ, campaignsPage]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

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
      fetchLogs();
    } catch {
      setNotice("Retry failed.");
    } finally {
      setBusy(false);
    }
  };

  const openCampaignDetail = async (c: CampaignRow) => {
    setViewingCampaign(c);
    setDetailLoading(true);
    setCampaignDetail(null);
    try {
      const res = await fetch(`/api/admin/emails/campaigns/${c.id}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setCampaignDetail({ data: data.data, logs: data.logs || [] });
    } catch {
      setCampaignDetail({ data: null, logs: [] });
    } finally {
      setDetailLoading(false);
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

  const campaignColumns = [
    {
      key: "subject",
      label: "Subject",
      render: (v: string, row: CampaignRow) => (
        <span className="block max-w-[280px] truncate font-medium text-brand-navy">{v}</span>
      ),
    },
    {
      key: "categories",
      label: "Audience",
      render: (v: string[], row: CampaignRow) => (
        <div className="flex flex-wrap gap-1 max-w-[220px]">
          {(v || []).map((c) => (
            <span key={c} className="rounded-full bg-brand-paper px-2 py-0.5 text-[11px] font-bold text-brand-navy">
              {CATEGORY_LABEL[c] || c}
            </span>
          ))}
          {row.recipientCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-brand-muted">
              <Users className="w-3 h-3" /> {row.recipientCount.toLocaleString()}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (v: string) => {
        const s = campaignStatus(v);
        return (
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${s.cls}`}>
            {s.icon}
            {s.label}
          </span>
        );
      },
    },
    {
      key: "counts",
      label: "Sent / Failed",
      render: (_: string, row: CampaignRow) => (
        <span className="text-xs text-brand-body">
          <span className="font-bold text-brand-green">{row.sentCount}</span>
          <span className="text-brand-muted"> / </span>
          <span className={`font-bold ${row.failedCount ? "text-brand-red" : "text-brand-muted"}`}>{row.failedCount}</span>
          {row.status === "SENT" && <span className="ml-1 text-brand-muted">({row.deliveredCount} delivered)</span>}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Date",
      render: (v: string) => <span className="text-xs">{fmtDate(v)}</span>,
    },
    {
      key: "id",
      label: "",
      render: (_: string, row: CampaignRow) => (
        <div className="flex items-center justify-end">
          <button
            onClick={() => openCampaignDetail(row)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-brand-green hover:bg-green-50 rounded-lg transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            View
          </button>
        </div>
      ),
    },
  ];

  const logColumns = [
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
    { key: "attempts", label: "Attempts" },
    {
      key: "createdAt",
      label: "Date",
      render: (v: string) => <span className="text-xs">{fmtDate(v)}</span>,
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-navy">Email Communications</h1>
          <p className="mt-1 text-sm text-brand-muted">
            Compose and send emails to students, parents, teachers, and staff — with full delivery tracking.
          </p>
        </div>
        <button
          onClick={() => setComposeOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-navy-deep transition-colors"
        >
          <PenSquare className="w-4 h-4" />
          Compose email
        </button>
      </div>

      {notice && (
        <div className="flex items-center gap-2 rounded-lg border border-brand-line bg-brand-paper px-4 py-3 text-sm text-brand-navy">
          <Mail className="w-4 h-4 text-brand-green" />
          {notice}
        </div>
      )}

      {/* Summary chips (individual message stats) */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {summaryChips.map((chip) => (
          <div key={chip.label} className={`rounded-xl px-4 py-3 ${chip.cls}`}>
            <p className="text-xl font-bold leading-none">{chip.value}</p>
            <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-widest opacity-80">{chip.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-brand-line">
        {([
          { key: "campaigns", label: "Campaigns" },
          { key: "logs", label: "Individual messages" },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              tab === t.key
                ? "border-brand-green text-brand-navy"
                : "border-transparent text-brand-muted hover:text-brand-navy"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Campaigns tab */}
      {tab === "campaigns" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
              <input
                value={campaignsQ}
                onChange={(e) => { setCampaignsQ(e.target.value); setCampaignsPage(1); }}
                placeholder="Search campaign subject…"
                className="w-full rounded-lg border border-brand-line bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
              />
            </div>
            <select
              value={campaignsStatus}
              onChange={(e) => { setCampaignsStatus(e.target.value); setCampaignsPage(1); }}
              className="rounded-lg border border-brand-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-green"
            >
              <option value="">All statuses</option>
              <option value="QUEUED">Queued</option>
              <option value="SENDING">Sending</option>
              <option value="SENT">Sent</option>
              <option value="PARTIALLY_FAILED">Partially failed</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          {campaignsError && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="w-4 h-4" />
              {campaignsError}
            </div>
          )}

          {campaignsLoading ? (
            <LoadingSpinner />
          ) : campaigns.length === 0 ? (
            <EmptyState
              icon={<Mail className="w-8 h-8 text-brand-muted" />}
              title="No email campaigns yet"
              description="Use the Compose email button to send your first bulk email to students, parents, teachers, or admins."
              action={{ label: "Compose email", onClick: () => setComposeOpen(true) }}
            />
          ) : (
            <DataTable columns={campaignColumns} data={campaigns} emptyMessage="No campaigns found" />
          )}

          {campaignsTotal > 0 && (
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setCampaignsPage((p) => Math.max(1, p - 1))}
                disabled={campaignsPage <= 1}
                className="rounded-lg border border-brand-line bg-white px-3 py-2 text-sm font-semibold text-brand-navy hover:bg-brand-paper disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-brand-muted">Page {campaignsPage}</span>
              <button
                onClick={() => setCampaignsPage((p) => p + 1)}
                disabled={campaigns.length < 25}
                className="rounded-lg border border-brand-line bg-white px-3 py-2 text-sm font-semibold text-brand-navy hover:bg-brand-paper disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Individual logs tab */}
      {tab === "logs" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && setSearch(q)}
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
              onClick={() => setSearch(q)}
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
            <DataTable columns={logColumns} data={rows} emptyMessage="No emails found" />
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
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={rows.length < (counts.total > 25 ? 25 : 1)}
                className="rounded-lg border border-brand-line bg-white px-3 py-2 text-sm font-semibold text-brand-navy hover:bg-brand-paper disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Compose modal */}
      <ComposeEmailModal
        isOpen={composeOpen}
        onClose={() => setComposeOpen(false)}
        onSent={() => {
          setComposeOpen(false);
          fetchCampaigns();
          fetchLogs();
        }}
      />

      {/* Campaign detail modal */}
      {viewingCampaign && (
        <Modal isOpen={true} title="Campaign details" onClose={() => { setViewingCampaign(null); setCampaignDetail(null); }} size="lg">
          {detailLoading ? (
            <LoadingSpinner />
          ) : (
            <div className="space-y-4 text-sm">
              {campaignDetail?.data ? (
                <>
                  <div className="rounded-lg bg-brand-paper border border-brand-line px-4 py-3">
                    <p className="font-semibold text-brand-navy">{campaignDetail.data.subject}</p>
                    <p className="mt-0.5 text-xs text-brand-muted break-all">From: {campaignDetail.data.sender}</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: "Audience", value: (campaignDetail.data.categories || []).map((c: string) => CATEGORY_LABEL[c] || c).join(", ") || "—" },
                      { label: "Recipients", value: String(campaignDetail.data.recipientCount ?? 0) },
                      { label: "Sent", value: String(campaignDetail.data.sentCount ?? 0) },
                      { label: "Delivered", value: String(campaignDetail.data.deliveredCount ?? 0) },
                      { label: "Failed", value: String(campaignDetail.data.failedCount ?? 0) },
                      { label: "Created", value: fmtDate(campaignDetail.data.createdAt) },
                      { label: "Completed", value: fmtDate(campaignDetail.data.completedAt) },
                      { label: "Sent by", value: campaignDetail.data.sentByEmail || "—" },
                    ].map((f) => (
                      <div key={f.label} className="rounded-xl border border-brand-line bg-white p-3">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-brand-muted">{f.label}</p>
                        <p className="mt-1 font-semibold text-brand-navy break-words">{f.value}</p>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-brand-muted mb-2">
                      <Mail className="w-3.5 h-3.5" /> Per-recipient log ({campaignDetail.logs.length} shown)
                    </p>
                    {campaignDetail.logs.length === 0 ? (
                      <p className="text-xs text-brand-muted">No per-recipient rows recorded.</p>
                    ) : (
                      <div className="max-h-80 overflow-y-auto rounded-xl border border-brand-line">
                        <table className="w-full text-xs">
                          <thead className="sticky top-0 bg-brand-paper">
                            <tr>
                              <th className="text-left px-3 py-2 font-bold text-brand-navy">Recipient</th>
                              <th className="text-left px-3 py-2 font-bold text-brand-navy">Status</th>
                              <th className="text-left px-3 py-2 font-bold text-brand-navy">Error</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {campaignDetail.logs.map((log) => (
                              <tr key={log.id}>
                                <td className="px-3 py-2 text-brand-body break-all">{log.to}</td>
                                <td className="px-3 py-2">
                                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${statusStyle[log.status] || "bg-gray-100 text-gray-700"}`}>
                                    {log.status}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-red-600 break-words max-w-[240px]">{log.error || "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm text-brand-muted">Campaign details could not be loaded.</p>
              )}
              <div className="flex justify-end">
                <button
                  onClick={() => { setViewingCampaign(null); setCampaignDetail(null); }}
                  className="rounded-lg bg-brand-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-navy-deep transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Individual log detail modal */}
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
                <p className="mt-1 text-brand-body">{fmtDate(viewing.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-brand-muted">Delivered</p>
                <p className="mt-1 text-brand-body">
                  {viewing.deliveredAt ? fmtDate(viewing.deliveredAt) : "—"}
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