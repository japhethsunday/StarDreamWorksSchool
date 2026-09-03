"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Plus,
  Search,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  MapPin,
  Clock,
} from "lucide-react";
import DataTable from "@/components/dashboard/DataTable";
import Modal from "@/components/dashboard/Modal";
import ConfirmDialog from "@/components/dashboard/ConfirmDialog";
import EmptyState from "@/components/dashboard/EmptyState";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";

interface EventItem {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  isPublished: boolean;
}

interface FormData {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
}

const emptyForm: FormData = { title: "", description: "", startDate: "", endDate: "", location: "" };

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/events");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setEvents(data.data || data.events || []);
    } catch {
      setError("Failed to load events.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = events.filter(
    (e) => e.title?.toLowerCase().includes(search.toLowerCase()) || e.location?.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setForm(emptyForm); setEditingId(null); setModalOpen(true); };
  const openEdit = (evt: EventItem) => {
    setForm({
      title: evt.title || "",
      description: evt.description || "",
      startDate: evt.startDate ? new Date(evt.startDate).toISOString().slice(0, 16) : "",
      endDate: evt.endDate ? new Date(evt.endDate).toISOString().slice(0, 16) : "",
      location: evt.location || "",
    });
    setEditingId(evt.id);
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = editingId ? `/api/admin/events/${editingId}` : "/api/admin/events";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, isPublished: true }) });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.message || "Failed"); }
      setModalOpen(false);
      fetchData();
    } catch (e: any) { alert(e.message || "Error"); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/events/${confirmDelete}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setConfirmDelete(null);
      fetchData();
    } catch { alert("Failed to delete"); } finally { setDeleting(false); }
  };

  const columns = [
    {
      key: "title",
      label: "Event",
      render: (val: string, row: EventItem) => (
        <div>
          <p className="font-medium text-gray-800">{val}</p>
          {row.location && (
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" /> {row.location}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "startDate",
      label: "Start",
      render: (val: string) => (
        <span className="text-gray-600 flex items-center gap-1 text-xs">
          <Clock className="w-3 h-3 text-gray-400" />
          {val ? new Date(val).toLocaleString() : "N/A"}
        </span>
      ),
    },
    {
      key: "endDate",
      label: "End",
      render: (val: string) => (
        <span className="text-gray-600 text-xs">
          {val ? new Date(val).toLocaleString() : "N/A"}
        </span>
      ),
    },
    {
      key: "isPublished",
      label: "Status",
      render: (val: boolean) => (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${val ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
          {val ? "Published" : "Hidden"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      className: "text-right",
      render: (_: any, row: EventItem) => (
        <div className="flex items-center justify-end gap-2">
          <button onClick={() => openEdit(row)} className="p-2 text-gray-400 hover:text-school-blue hover:bg-blue-50 rounded-lg transition-colors">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => setConfirmDelete(row.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  if (loading) return <LoadingSpinner text="Loading events..." fullScreen />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-gray-600">{error}</p>
        <button onClick={fetchData} className="px-4 py-2 bg-school-blue text-white text-sm rounded-xl">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-[family-name:var(--font-poppins)] text-2xl font-bold text-school-dark">Events</h2>
          <p className="text-sm text-gray-500 mt-1">{events.length} events total</p>
        </div>
        <button onClick={openAdd} className="sd-btn sd-btn-apply px-5 py-2.5 text-sm">
          <Plus className="w-4 h-4" /> New Event
        </button>
      </div>

      <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 w-full sm:w-80">
        <Search className="w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Search events..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent text-sm outline-none w-full" />
      </div>

      {filtered.length === 0 && !search ? (
        <EmptyState icon={<Calendar className="w-10 h-10 text-gray-400" />} title="No events" description="Create school events to keep everyone informed." action={{ label: "New Event", onClick: openAdd }} />
      ) : (
        <DataTable columns={columns} data={filtered} emptyMessage="No events found." />
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit Event" : "New Event"}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Event Title</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue" placeholder="e.g. Open Day" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue resize-none" placeholder="Event details..." />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date & Time</label>
              <input type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date & Time</label>
              <input type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
            <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue" placeholder="School Hall, etc." />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.title} className="sd-btn sd-btn-apply px-5 py-2.5 text-sm disabled:opacity-50">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingId ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={handleDelete} title="Delete Event" message="Are you sure you want to delete this event?" loading={deleting} />
    </div>
  );
}
