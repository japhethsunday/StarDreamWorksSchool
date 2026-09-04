"use client";

import { useState, useEffect, useCallback } from "react";
import { Activity as ActivityIcon, AlertCircle, Search } from "lucide-react";
import DataTable from "@/components/dashboard/DataTable";
import EmptyState from "@/components/dashboard/EmptyState";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";

interface LogEntry {
  id: string;
  action: string;
  details?: string | null;
  createdAt: string;
  user?: { name?: string; email?: string; role?: string } | null;
}

const ROLES = ["ADMIN", "TEACHER", "STUDENT", "PARENT"];

export default function AdminActivityPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (role) params.set("role", role);
      if (from) params.set("from", new Date(from).toISOString());
      if (to) params.set("to", new Date(`${to}T23:59:59`).toISOString());
      const res = await fetch(`/api/admin/activity?${params.toString()}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setLogs(data.data || []);
      setTotal(data.total || 0);
    } catch {
      setError("Failed to load activity.");
    } finally {
      setLoading(false);
    }
  }, [role, from, to]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = logs.filter(
    (l) =>
      l.action?.toLowerCase().includes(search.toLowerCase()) ||
      l.details?.toLowerCase().includes(search.toLowerCase()) ||
      l.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      l.user?.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-[family-name:var(--font-poppins)] text-2xl font-bold text-school-dark">
          Platform Activity
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Audit trail of actions across the platform{total > 0 ? ` · ${total} matching records` : ""}.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-end">
          <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 flex-1">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search action, details, or actor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm outline-none w-full"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20"
            >
              <option value="">All Roles</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r.charAt(0) + r.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20"
              title="From date"
            />
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20"
              title="To date"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading activity..." fullScreen />
      ) : error ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-gray-600">{error}</p>
          <button onClick={fetchData} className="px-4 py-2 bg-school-blue text-white text-sm rounded-xl">
            Retry
          </button>
        </div>
      ) : filtered.length === 0 && !search ? (
        <EmptyState
          icon={<ActivityIcon className="w-10 h-10 text-gray-400" />}
          title="No activity yet"
          description="Administrative actions will appear here as they happen."
        />
      ) : (
        <DataTable
          columns={[
            {
              key: "action",
              label: "Action",
              render: (v: string) => (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                  {v?.replace(/_/g, " ")}
                </span>
              ),
            },
            {
              key: "details",
              label: "Details",
              render: (v: string) => <span className="text-gray-600 text-sm">{v || "—"}</span>,
            },
            {
              key: "user",
              label: "Actor",
              render: (_: unknown, row: LogEntry) => (
                <div>
                  <p className="font-medium text-gray-800 text-sm">{row.user?.name || "—"}</p>
                  <p className="text-xs text-gray-400">{row.user?.email || ""}</p>
                  {row.user?.role && (
                    <span className="text-[10px] font-semibold uppercase text-brand-muted">
                      {row.user.role}
                    </span>
                  )}
                </div>
              ),
            },
            {
              key: "createdAt",
              label: "When",
              render: (v: string) => (
                <span className="text-gray-500 text-xs">
                  {new Date(v).toLocaleString("en-NG", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              ),
            },
          ]}
          data={filtered}
          emptyMessage="No activity matches your filters."
        />
      )}
    </div>
  );
}