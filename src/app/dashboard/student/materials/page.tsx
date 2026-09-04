"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FolderOpen,
  AlertCircle,
  FileText,
  Link2,
  Video,
  Image as ImageIcon,
  File,
  FileType,
} from "lucide-react";
import { isSafeUrl } from "@/lib/utils";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";
import EmptyState from "@/components/dashboard/EmptyState";
import DataTable from "@/components/dashboard/DataTable";

interface Material {
  id: string;
  title: string;
  description?: string;
  type: string;
  fileUrl?: string;
  subject?: { id: string; name: string } | null;
  subjectName?: string;
  uploadedAt: string;
}

const typeMeta: Record<string, { icon: React.ReactNode; color: string }> = {
  PDF: { icon: <FileText className="w-4 h-4" />, color: "bg-red-100 text-red-600" },
  DOCUMENT: { icon: <FileType className="w-4 h-4" />, color: "bg-blue-100 text-blue-600" },
  IMAGE: { icon: <ImageIcon className="w-4 h-4" />, color: "bg-green-100 text-green-600" },
  VIDEO: { icon: <Video className="w-4 h-4" />, color: "bg-purple-100 text-purple-600" },
  LINK: { icon: <Link2 className="w-4 h-4" />, color: "bg-amber-100 text-amber-600" },
};

function TypeBadge({ type }: { type: string }) {
  const meta = typeMeta[type] || {
    icon: <File className="w-4 h-4" />,
    color: "bg-gray-100 text-gray-600",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${meta.color}`}
    >
      {meta.icon}
      {type}
    </span>
  );
}

export default function StudentMaterials() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [subjectOptions, setSubjectOptions] = useState<string[]>([]);

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/student/materials");
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to load materials.");
      }
      const json = await res.json();
      const data = json.data || json || [];
      setMaterials(data);
      const options = Array.from(
        new Set(
          data
            .map((m: Material) => m.subject?.name || m.subjectName)
            .filter(Boolean)
        )
      ) as string[];
      setSubjectOptions(options);
    } catch (err: any) {
      setError(err.message || "Failed to load materials.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const filtered = materials.filter(
    (m) =>
      subjectFilter === "all" ||
      (m.subject?.name || m.subjectName) === subjectFilter
  );

  if (loading) return <LoadingSpinner text="Loading materials..." fullScreen />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-gray-600 font-medium">{error}</p>
        <button
          onClick={fetchMaterials}
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
          Learning Materials
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Study materials shared by your teachers.
        </p>
      </div>

      {subjectOptions.length > 0 && (
        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue transition-all sm:max-w-xs"
        >
          <option value="all">All Subjects</option>
          {subjectOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )}

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft-sm">
          <EmptyState
            icon={<FolderOpen className="w-9 h-9 text-gray-400" />}
            title={materials.length === 0 ? "No materials available" : "No matching materials"}
            description={
              materials.length === 0
                ? "Your teachers haven't shared any learning materials yet."
                : "Try a different subject filter."
            }
          />
        </div>
      ) : (
        <DataTable
          columns={[
            {
              key: "title",
              label: "Material",
              render: (v, row) => (
                <div>
                  <p className="font-medium text-gray-800">{v}</p>
                  {row.description && (
                    <p className="text-xs text-gray-400 line-clamp-1">{row.description}</p>
                  )}
                </div>
              ),
            },
            { key: "type", label: "Type", render: (v) => <TypeBadge type={v} /> },
            {
              key: "subject",
              label: "Subject",
              render: (_, row) => (
                <span className="text-gray-600">{row.subject?.name || row.subjectName || "—"}</span>
              ),
            },
            {
              key: "uploadedAt",
              label: "Uploaded",
              render: (v) => (
                <span className="text-gray-500 text-xs">
                  {new Date(v).toLocaleDateString("en-NG", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              ),
            },
            {
              key: "actions",
              label: "",
              render: (_, row) =>
                row.fileUrl && isSafeUrl(row.fileUrl) ? (
                  <a
                    href={row.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-school-green bg-school-green/10 rounded-lg hover:bg-school-green/20 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Open
                  </a>
                ) : (
                  <span className="text-gray-400 text-xs">—</span>
                ),
            },
          ]}
          data={filtered}
          emptyMessage="No materials available"
        />
      )}
    </div>
  );
}
