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

export default function AdminActivityPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/activity");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setLogs(data.data || []);
    } catch {
      setError("Failed to load activity.");
    } finally {
      setLoading(false);
    }
  }, []);

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

  if (loading) return <LoadingSpinner text="Loading activity..." fullScreen />;

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-[family-name:var(--font-poppins)] text-2xl font-bold text-school-dark">
          Platform Activity
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Recent administrative actions across the platform.
        </p>
      </div>

      <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 w-full sm:w-80">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search activity..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-sm outline-none w-full"
        />
      </div>

      {filtered.length === 0 && !search ? (
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
              render: (v: string) => (
                <span className="text-gray-600 text-sm">{v || "—"}</span>
              ),
            },
            {
              key: "user",
              label: "Actor",
              render: (_: unknown, row: LogEntry) => (
                <div>
                  <p className="font-medium text-gray-800 text-sm">{row.user?.name || "—"}</p>
                  <p className="text-xs text-gray-400">{row.user?.email || ""}</p>
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
          emptyMessage="No activity matches your search."
        />
      )}
    </div>
  );
}
