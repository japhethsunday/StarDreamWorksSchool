"use client";

import { useState, useEffect } from "react";
import { Loader2, Bell, Check, ShieldCheck } from "lucide-react";

interface Prefs {
  assignment: boolean;
  grade: boolean;
  feedback: boolean;
  announcements: boolean;
  materials: boolean;
  academicUpdates: boolean;
}

const SETTINGS: Array<{ key: keyof Prefs; label: string; description: string }> = [
  { key: "assignment", label: "Assignments", description: "New assignments, deadline reminders and overdue notices." },
  { key: "grade", label: "Grades & results", description: "Result publication and assignment grading." },
  { key: "feedback", label: "Teacher feedback", description: "Comments and feedback from teachers." },
  { key: "announcements", label: "Announcements", description: "Class and school-wide announcements." },
  { key: "materials", label: "Learning materials", description: "New learning materials uploaded for your class." },
  { key: "academicUpdates", label: "Academic updates", description: "General academic progress updates." },
];

export default function NotificationSettingsPage() {
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/notifications/preferences");
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        setPrefs(data.data);
      } catch {
        setError("Failed to load notification preferences.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggle = (key: keyof Prefs) => {
    if (!prefs) return;
    setPrefs({ ...prefs, [key]: !prefs[key] });
  };

  const save = async () => {
    if (!prefs) return;
    try {
      setSaving(true);
      setMessage("");
      setError("");
      const res = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed");
      setMessage("Notification preferences saved.");
    } catch {
      setError("Failed to save notification preferences.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-brand-navy animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-brand-navy">Email Notifications</h1>
        <p className="mt-1 text-sm text-brand-muted">
          Choose which email notifications you receive from STAR DreamWorks Schools.
        </p>
      </div>

      <div className="rounded-xl border border-brand-line bg-white overflow-hidden">
        {SETTINGS.map((setting, idx) => (
          <div
            key={setting.key}
            className={`flex items-start justify-between gap-4 px-5 py-4 ${idx > 0 ? "border-t border-brand-line" : ""}`}
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-brand-navy">{setting.label}</p>
              <p className="mt-0.5 text-xs text-brand-muted">{setting.description}</p>
            </div>
            <button
              role="switch"
              aria-checked={prefs ? prefs[setting.key] : true}
              onClick={() => toggle(setting.key)}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                prefs?.[setting.key] ? "bg-brand-green" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  prefs?.[setting.key] ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 rounded-lg bg-brand-paper border border-brand-line px-4 py-3 text-xs text-brand-muted">
        <ShieldCheck className="w-4 h-4 text-brand-green shrink-0" />
        Security emails (password resets, account status, security alerts) are always sent and cannot be disabled.
      </div>

      {message && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          <Check className="w-4 h-4" />
          {message}
        </div>
      )}
      {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

      <button
        onClick={save}
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-lg bg-brand-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-navy-deep transition-colors disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
        {saving ? "Saving…" : "Save preferences"}
      </button>
    </div>
  );
}