"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Megaphone,
  AlertCircle,
  Building2,
  Users,
  AlertTriangle,
  Info,
} from "lucide-react";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";
import EmptyState from "@/components/dashboard/EmptyState";

interface Announcement {
  id: string;
  title: string;
  content: string;
  targetType: string;
  priority: string;
  createdAt: string;
  author?: { name: string } | null;
  className?: string;
  authorName?: string;
}

function PriorityIcon({ priority }: { priority: string }) {
  if (priority === "URGENT")
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-700">
        <AlertTriangle className="w-3 h-3" /> Urgent
      </span>
    );
  if (priority === "IMPORTANT")
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
        <Info className="w-3 h-3" /> Important
      </span>
    );
  return null;
}

export default function StudentAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"ALL" | "CLASS" | "SCHOOL">("ALL");

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/student/announcements");
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to load announcements.");
      }
      const json = await res.json();
      setAnnouncements(json.data || json || []);
    } catch (err: any) {
      setError(err.message || "Failed to load announcements.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const filtered = announcements.filter(
    (a) => filter === "ALL" || a.targetType === filter
  );

  const filters: { key: "ALL" | "CLASS" | "SCHOOL"; label: string }[] = [
    { key: "ALL", label: "All" },
    { key: "CLASS", label: "My Class" },
    { key: "SCHOOL", label: "School-wide" },
  ];

  if (loading) return <LoadingSpinner text="Loading announcements..." fullScreen />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-gray-600 font-medium">{error}</p>
        <button
          onClick={fetchAnnouncements}
          className="px-4 py-2 bg-school-blue text-white text-sm font-medium rounded-xl hover:bg-primary transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-[family-name:var(--font-poppins)] text-2xl font-bold text-school-dark">
          Announcements
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          School-wide and class announcements for you.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
              filter === f.key
                ? "bg-school-blue text-white shadow-sm"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft-sm">
          <EmptyState
            icon={<Megaphone className="w-9 h-9 text-gray-400" />}
            title={announcements.length === 0 ? "No announcements" : "No matching announcements"}
            description={
              announcements.length === 0
                ? "There are no announcements for you right now."
                : "Try a different filter."
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((ann) => (
            <div
              key={ann.id}
              className={`bg-white rounded-2xl border shadow-soft-sm p-5 sm:p-6 ${
                ann.priority === "URGENT"
                  ? "border-red-200"
                  : ann.priority === "IMPORTANT"
                  ? "border-amber-200"
                  : "border-gray-100"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  {ann.targetType === "SCHOOL" ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-school-blue/10 text-school-blue">
                      <Building2 className="w-3 h-3" /> School-wide
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-school-green/10 text-school-green">
                      <Users className="w-3 h-3" /> Class
                    </span>
                  )}
                  <PriorityIcon priority={ann.priority} />
                </div>
                <span className="text-xs text-gray-400 shrink-0">
                  {new Date(ann.createdAt).toLocaleDateString("en-NG", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>

              <h3 className="mt-3 font-[family-name:var(--font-poppins)] font-bold text-school-dark text-lg">
                {ann.title}
              </h3>
              <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">{ann.content}</p>

              {(ann.authorName || ann.author) && (
                <p className="mt-4 text-xs text-gray-400">
                  Posted by{" "}
                  <span className="font-medium text-gray-500">
                    {ann.authorName || ann.author?.name}
                  </span>
                  {ann.className && ` · for ${ann.className}`}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
