"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Settings, Save, Loader2, User, Shield } from "lucide-react";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const user = session?.user as any;

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch("/api/admin/settings/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading") return <LoadingSpinner text="Loading settings..." fullScreen />;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="font-[family-name:var(--font-poppins)] text-2xl font-bold text-school-dark">Settings</h2>
        <p className="text-sm text-gray-500 mt-1">Manage your account settings</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-soft-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-school-blue/10 rounded-xl flex items-center justify-center">
            <User className="w-5 h-5 text-school-blue" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">Profile</h3>
            <p className="text-xs text-gray-500">Update your personal information</p>
          </div>
        </div>

        <form onSubmit={handleProfileSave} className="space-y-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-school-blue to-primary rounded-2xl flex items-center justify-center text-white text-xl font-bold">
              {user?.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "A"}
            </div>
            <div>
              <p className="font-medium text-gray-800">{user?.name}</p>
              <p className="text-sm text-gray-500">{user?.role}</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
            <input type="text" defaultValue={user?.name || ""} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input type="email" defaultValue={user?.email || ""} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue" />
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving} className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-school-blue to-primary rounded-xl shadow-glow-blue hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
            {saved && <span className="text-sm text-green-600 font-medium">Changes saved!</span>}
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-soft-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">Security</h3>
            <p className="text-xs text-gray-500">Change your password</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue" />
          </div>
          <button disabled={!currentPassword || !newPassword} className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-all disabled:opacity-50">
            Update Password
          </button>
        </div>
      </div>
    </div>
  );
}
