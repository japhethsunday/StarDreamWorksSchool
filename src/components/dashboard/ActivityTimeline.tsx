"use client";

import { useEffect, useState } from "react";
import {
  LogIn,
  LogOut,
  Plus,
  Pencil,
  Trash2,
  KeyRound,
  Activity,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface ActivityLog {
  id: string;
  action: string;
  details?: string | null;
  ipAddress?: string | null;
  createdAt: string;
}

function actionStyle(action: string) {
  const a = (action || "").toUpperCase();
  if (a === "LOGIN")
    return { icon: LogIn, classes: "bg-green-50 text-brand-green" };
  if (a === "LOGOUT") return { icon: LogOut, classes: "bg-gray-100 text-gray-500" };
  if (a.includes("DELETE")) return { icon: Trash2, classes: "bg-red-50 text-brand-red" };
  if (a.includes("PASSWORD")) return { icon: KeyRound, classes: "bg-amber-50 text-amber-600" };
  if (a.includes("ACTIVATE")) return { icon: Plus, classes: "bg-green-50 text-brand-green" };
  if (a.includes("DEACTIVATE")) return { icon: LogOut, classes: "bg-amber-50 text-amber-600" };
  if (a.includes("CREATE")) return { icon: Plus, classes: "bg-green-50 text-brand-green" };
  if (a.includes("UPDATE") || a.includes("PUBLISH") || a.includes("STATUS"))
    return { icon: Pencil, classes: "bg-blue-50 text-school-blue" };
  return { icon: Activity, classes: "bg-gray-100 text-gray-500" };
}

export default function ActivityTimeline({
  userId,
  limit = 30,
  centered = false,
}: {
  userId: string;
  limit?: number;
  centered?: boolean;
}) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/admin/activity?userId=${encodeURIComponent(userId)}&limit=${limit}`
        );
        if (!res.ok) throw new Error("Failed to load activity");
        const json = await res.json();
        if (!cancelled) setLogs(json.data || []);
      } catch (e: any) {
        if (!cancelled) setError(e.message || "Failed to load activity");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [userId, limit]);

  if (loading)
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-5 h-5 text-brand-navy animate-spin" />
      </div>
    );

  if (error)
    return <p className="text-sm text-brand-red text-center py-8">{error}</p>;

  if (logs.length === 0)
    return (
      <div className="text-center py-10">
        <Activity className="w-8 h-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-brand-muted">No activity recorded yet.</p>
      </div>
    );

  return (
    <div className="relative">
      <div
        className={`${
          centered ? "absolute" : ""
        } left-[18px] top-2 bottom-2 w-px bg-brand-line`}
      />
      <div className="space-y-5">
        {logs.map((log) => {
          const { icon: Icon, classes } = actionStyle(log.action);
          return (
            <div key={log.id} className="relative flex items-start gap-4 pl-0">
              <div
                className={`z-10 w-9 h-9 shrink-0 rounded-full flex items-center justify-center ${classes}`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-brand-ink">
                    {log.action
                      .toLowerCase()
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase())}
                  </p>
                  <span
                    className="text-xs text-brand-muted"
                    title={format(new Date(log.createdAt), "PPpp")}
                  >
                    {formatDistanceToNow(new Date(log.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                {log.details && (
                  <p className="text-sm text-brand-body mt-0.5">{log.details}</p>
                )}
                {log.ipAddress && (
                  <p className="text-xs text-brand-muted mt-1">IP: {log.ipAddress}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}