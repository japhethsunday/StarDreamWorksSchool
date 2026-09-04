"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Save, AlertCircle, CheckCircle2, Building2, Megaphone, Home, Phone, Mail, MapPin } from "lucide-react";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";

const inputCls =
  "w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue";

export default function SiteContentPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/site-settings");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setSettings(data.data || {});
    } catch {
      setError("Failed to load site content.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const update = (key: string, value: string) => {
    setSaved(false);
    setSettings((s) => ({ ...s, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to save.");
      setSaved(true);
    } catch (e: any) {
      setError(e.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const SectionCard = ({ icon, title, description, children }: { icon: React.ReactNode; title: string; description: string; children: React.ReactNode }) => (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-soft-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
        <div className="w-10 h-10 bg-school-blue/5 rounded-xl flex items-center justify-center">{icon}</div>
        <div>
          <h3 className="font-[family-name:var(--font-poppins)] font-semibold text-school-dark">{title}</h3>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
      <div className="p-6 space-y-4">{children}</div>
    </div>
  );

  if (loading) return <LoadingSpinner text="Loading site content..." fullScreen />;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-[family-name:var(--font-poppins)] text-2xl font-bold text-school-dark">Site Content</h2>
          <p className="text-sm text-gray-500 mt-1">Content shown on the public website.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-school-blue to-primary text-white text-sm font-semibold rounded-xl shadow-glow-blue hover:shadow-lg transition-all disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save changes
        </button>
      </div>

      {saved && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <p className="text-sm text-green-700">Changes saved and live on the website.</p>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <SectionCard icon={<Building2 className="w-5 h-5 text-school-blue" />} title="School details" description="Name, tagline and contact information shown across the website.">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">School name</label>
          <input type="text" value={settings["school.name"] || ""} onChange={(e) => update("school.name", e.target.value)} className={inputCls} placeholder="STAR DreamWorks Schools" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Tagline</label>
          <input type="text" value={settings["school.tagline"] || ""} onChange={(e) => update("school.tagline", e.target.value)} className={inputCls} placeholder="Caring Nursery, Primary & JSS" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-gray-400" /> Location
          </label>
          <input type="text" value={settings["school.location"] || ""} onChange={(e) => update("school.location", e.target.value)} className={inputCls} placeholder="Ajah, Lagos, Nigeria" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-gray-400" /> Phone
            </label>
            <input type="text" value={settings["school.phone"] || ""} onChange={(e) => update("school.phone", e.target.value)} className={inputCls} placeholder="+234 ..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-gray-400" /> Email
            </label>
            <input type="text" value={settings["school.email"] || ""} onChange={(e) => update("school.email", e.target.value)} className={inputCls} placeholder="contact@..." />
          </div>
        </div>
      </SectionCard>

      <SectionCard icon={<Megaphone className="w-5 h-5 text-school-blue" />} title="Admissions" description="Admissions status and message shown on the homepage and admissions page.">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
          <select value={settings["admissions.status"] || "open"} onChange={(e) => update("admissions.status", e.target.value)} className={inputCls}>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
          <textarea rows={3} value={settings["admissions.message"] || ""} onChange={(e) => update("admissions.message", e.target.value)} className={`${inputCls} resize-none`} placeholder="Applications are open for Pre-school, Kindergarten, Nursery, Primary and High School." />
        </div>
      </SectionCard>

      <SectionCard icon={<Home className="w-5 h-5 text-school-blue" />} title="Homepage intro" description="The main introduction section on the homepage.">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Intro title</label>
          <input type="text" value={settings["homepage.introTitle"] || ""} onChange={(e) => update("homepage.introTitle", e.target.value)} className={inputCls} placeholder="Welcome to STAR DreamWorks Schools" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Intro body</label>
          <textarea rows={5} value={settings["homepage.introBody"] || ""} onChange={(e) => update("homepage.introBody", e.target.value)} className={`${inputCls} resize-none`} placeholder="A short description of the school." />
        </div>
      </SectionCard>
    </div>
  );
}
