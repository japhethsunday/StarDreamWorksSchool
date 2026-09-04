"use client";

import {
  Mail,
  Phone,
  Pencil,
  KeyRound,
  Power,
  Trash2,
  Loader2,
} from "lucide-react";

interface ProfileHeaderProps {
  name: string;
  roleLabel: string;
  idLabel?: string;
  initials: string;
  email?: string;
  phone?: string;
  active: boolean;
  statusLabel?: string;
  stats?: { label: string; value: string | number }[];
  onEdit?: () => void;
  onResetPassword?: () => void;
  onToggleActive?: () => void;
  onDelete?: () => void;
  busy?: boolean;
}

export default function ProfileHeader({
  name,
  roleLabel,
  idLabel,
  initials,
  email,
  phone,
  active,
  statusLabel,
  stats = [],
  onEdit,
  onResetPassword,
  onToggleActive,
  onDelete,
  busy,
}: ProfileHeaderProps) {
  return (
    <div className="bg-white rounded-xl border border-brand-line shadow-sm overflow-hidden">
      <div className="px-5 py-6 sm:px-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-green to-brand-navy flex items-center justify-center text-white text-2xl font-bold ring-4 ring-brand-paper shadow-lg shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-heading text-2xl font-bold text-brand-ink tracking-tight">
                  {name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-brand-yellow-soft text-brand-navy-deep text-xs font-semibold">
                  {roleLabel}
                </span>
                {idLabel && (
                  <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-brand-muted text-xs font-mono">
                    {idLabel}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 mt-1.5 flex-wrap text-sm text-brand-muted">
                {email && (
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="w-4 h-4" /> {email}
                  </span>
                )}
                {phone && (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="w-4 h-4" /> {phone}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap lg:justify-end">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                active ? "bg-green-100 text-brand-green" : "bg-red-100 text-brand-red"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  active ? "bg-brand-green" : "bg-brand-red"
                }`}
              />
              {statusLabel || (active ? "Active" : "Inactive")}
            </span>
            {onResetPassword && (
              <button
                onClick={onResetPassword}
                disabled={busy}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-brand-navy bg-brand-paper border border-brand-line rounded-xl hover:bg-brand-cream transition-colors disabled:opacity-50"
              >
                <KeyRound className="w-4 h-4" /> Reset Password
              </button>
            )}
            {onScrollAndEdit(onEdit, busy)}
            {onToggleActive && (
              <button
                onClick={onToggleActive}
                disabled={busy}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-xl border transition-colors disabled:opacity-50 ${
                  active
                    ? "text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100"
                    : "text-brand-green bg-green-50 border-green-200 hover:bg-green-100"
                }`}
              >
                <Power className="w-4 h-4" />
                {active ? "Deactivate" : "Activate"}
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                disabled={busy}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-brand-red bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            )}
          </div>
        </div>

        {stats.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6">
            {stats.map((s) => (
              <div
                key={s.label}
                className="bg-brand-paper rounded-xl px-4 py-3 border border-brand-line"
              >
                <p className="text-xs text-brand-muted font-medium">{s.label}</p>
                <p className="text-xl font-bold text-brand-navy mt-0.5">
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function onScrollAndEdit(
  onEdit: (() => void) | undefined,
  busy?: boolean
): React.ReactNode {
  if (!onEdit) return null;
  return (
    <button
      onClick={onEdit}
      disabled={busy}
      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white bg-brand-navy rounded-xl hover:bg-brand-navy-deep transition-colors disabled:opacity-50"
    >
      {busy ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Pencil className="w-4 h-4" />
      )}{" "}
      Edit Profile
    </button>
  );
}