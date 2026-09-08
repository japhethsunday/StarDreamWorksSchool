"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Loader2, Users, Eye, Send, X, Check, Search, Mail } from "lucide-react";
import Modal from "@/components/dashboard/Modal";
import ConfirmDialog from "@/components/dashboard/ConfirmDialog";
import RichTextEditor from "@/components/dashboard/RichTextEditor";

const CATEGORY_META: Record<string, { label: string; emoji: string }> = {
  STUDENTS: { label: "Students", emoji: "🎓" },
  PARENTS: { label: "Parents", emoji: "👨‍👩‍👧" },
  TEACHERS: { label: "Teachers", emoji: "📚" },
  ADMINS: { label: "Admins", emoji: "🛡️" },
};

interface RecipientCount {
  category: string;
  count: number;
}

interface Recipient {
  id: string;
  name: string;
  email: string;
  userId: string | null;
}

interface ComposeEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSent: (campaignId?: string) => void;
}

export default function ComposeEmailModal({ isOpen, onClose, onSent }: ComposeEmailModalProps) {
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("<p></p>");
  const [counts, setCounts] = useState<RecipientCount[]>([]);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [recipientsLoading, setRecipientsLoading] = useState(false);
  const [specificMode, setSpecificMode] = useState(false);
  const [specificIds, setSpecificIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  const [preview, setPreview] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const filteredRecipients = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return recipients;
    return recipients.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q)
    );
  }, [recipients, search]);

  const loadCounts = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/emails/recipients");
      if (!res.ok) return;
      const data = await res.json();
      setCounts(data.counts || []);
    } catch {
      // Counts are non-critical — fail silently.
    }
  }, []);

  const loadRecipients = useCallback(async (cats: string[]) => {
    if (cats.length === 0) {
      setRecipients([]);
      return;
    }
    setRecipientsLoading(true);
    try {
      const res = await fetch(`/api/admin/emails/recipients?categories=${cats.join(",")}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setRecipients(data.recipients || []);
    } catch {
      setRecipients([]);
    } finally {
      setRecipientsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadCounts();
      setError("");
      setNotice("");
    }
  }, [isOpen, loadCounts]);

  useEffect(() => {
    if (isOpen && selectedCats.length > 0) {
      loadRecipients(selectedCats);
    }
  }, [isOpen, selectedCats, loadRecipients]);

  const reset = () => {
    setSubject("");
    setContent("<p></p>");
    setSelectedCats([]);
    setSpecificMode(false);
    setSpecificIds([]);
    setSearch("");
    setPreview(false);
    setConfirm(false);
    setSending(false);
    setError("");
    setNotice("");
    setCounts([]);
    setRecipients([]);
  };

  const toggleCat = (cat: string) => {
    setSelectedCats((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const totalSelected = useMemo(() => {
    const catRecipients = new Set(recipients.map((r) => r.id));
    if (specificMode && specificIds.length > 0) {
      return specificIds.length;
    }
    return catRecipients.size;
  }, [specificMode, specificIds, recipients]);

  const effectiveRecipientIds = useMemo(() => {
    if (specificMode && specificIds.length > 0) return specificIds;
    return null;
  }, [specificMode, specificIds]);

  const canSend =
    subject.trim().length > 0 &&
    content.replace(/<[^>]*>/g, "").trim().length > 0 &&
    selectedCats.length > 0 &&
    totalSelected > 0 &&
    !sending;

  const handleSend = async () => {
    setSending(true);
    setError("");
    try {
      const reqId = `cmp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const res = await fetch("/api/admin/emails/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          html: content,
          categories: selectedCats,
          userIds: effectiveRecipientIds,
          requestId: reqId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNotice("Email sent to recipients.");
        setConfirm(false);
        onSent(data.data?.id);
      } else {
        setError(data.error || data.message || "Failed to send email.");
        setConfirm(false);
      }
    } catch {
      setError("Failed to send email. Please try again.");
      setConfirm(false);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Compose email" size="lg">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
          {/* Left: composition */}
          <div className="md:col-span-3 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-brand-navy mb-1.5">Subject</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject…"
                className="w-full rounded-lg border border-brand-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-navy mb-1.5">Message</label>
              <RichTextEditor value={content} onChange={setContent} placeholder="Write your email content here…" />
            </div>
          </div>

          {/* Right: recipients */}
          <div className="md:col-span-2 space-y-4">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-brand-navy mb-2">
                <Users className="w-4 h-4" />
                Recipients
              </label>
              {counts.length === 0 && (
                <p className="text-xs text-brand-muted mb-2">Loading recipient counts…</p>
              )}
              <div className="space-y-2">
                {counts.map((c) => {
                  const meta = CATEGORY_META[c.category] || { label: c.category, emoji: "📧" };
                  const active = selectedCats.includes(c.category);
                  return (
                    <label
                      key={c.category}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
                        active
                          ? "border-brand-green bg-green-50/60"
                          : "border-brand-line bg-white hover:bg-brand-paper"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={() => toggleCat(c.category)}
                        className="accent-brand-green"
                      />
                      <span className="text-base">{meta.emoji}</span>
                      <span className="flex-1 text-sm font-semibold text-brand-navy">{meta.label}</span>
                      <span className="rounded-full bg-brand-paper px-2 py-0.5 text-xs font-bold text-brand-navy">
                        {c.count} {c.count === 1 ? "recipient" : "recipients"}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {selectedCats.length > 0 && (
              <div className="rounded-xl border border-brand-line bg-brand-paper/50 p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-brand-navy">
                    {totalSelected.toLocaleString()} recipient{totalSelected === 1 ? "" : "s"} selected
                  </p>
                  <button
                    type="button"
                    onClick={() => setSpecificMode((m) => !m)}
                    className="text-xs font-semibold text-brand-green hover:underline"
                  >
                    {specificMode ? "Send to all in category" : "Choose specific recipients"}
                  </button>
                </div>

                {specificMode && (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search name or email…"
                        className="w-full rounded-lg border border-brand-line bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-brand-green"
                      />
                    </div>
                    {recipientsLoading ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="w-5 h-5 animate-spin text-brand-muted" />
                      </div>
                    ) : (
                      <div className="max-h-44 overflow-y-auto space-y-1 border border-brand-line rounded-lg bg-white p-1">
                        {filteredRecipients.length === 0 && (
                          <p className="px-2 py-3 text-center text-xs text-brand-muted">No recipients match.</p>
                        )}
                        {filteredRecipients.slice(0, 200).map((r) => {
                          const checked = specificIds.includes(r.id);
                          return (
                            <label
                              key={r.id}
                              className="flex items-start gap-2 rounded-md px-2 py-1.5 hover:bg-brand-paper cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                className="mt-0.5 accent-brand-green"
                                checked={checked}
                                onChange={() =>
                                  setSpecificIds((ids) =>
                                    checked ? ids.filter((i) => i !== r.id) : [...ids, r.id]
                                  )
                                }
                              />
                              <span className="min-w-0 text-xs">
                                <span className="block truncate font-semibold text-brand-navy">{r.name || "—"}</span>
                                <span className="block truncate text-brand-muted">{r.email}</span>
                              </span>
                            </label>
                          );
                        })}
                        {filteredRecipients.length > 200 && (
                          <p className="px-2 py-1 text-center text-[11px] text-brand-muted">
                            Showing first 200 of {filteredRecipients.length}. Use search to narrow.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            <Mail className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
        {notice && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
            <Check className="w-4 h-4 shrink-0" />
            {notice}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              reset();
              onClose();
            }}
            className="rounded-lg border border-brand-line bg-white px-4 py-2.5 text-sm font-semibold text-brand-body hover:bg-brand-paper transition-colors"
          >
            <X className="w-4 h-4 inline mr-1.5 -mt-0.5" />
            Discard
          </button>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setPreview(true)}
              disabled={!subject.trim() || !content.replace(/<[^>]*>/g, "").trim()}
              className="inline-flex items-center gap-2 rounded-lg border border-brand-line bg-white px-4 py-2.5 text-sm font-semibold text-brand-navy hover:bg-brand-paper transition-colors disabled:opacity-40"
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
            <button
              type="button"
              onClick={() => setConfirm(true)}
              disabled={!canSend}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-green px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition-colors disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
              Send email
            </button>
          </div>
        </div>
      </Modal>

      {/* Preview */}
      <Modal isOpen={preview} onClose={() => setPreview(false)} title="Email preview" size="lg">
        <div className="space-y-4">
          <div className="rounded-lg bg-brand-paper border border-brand-line px-4 py-3 text-sm">
            <p className="font-semibold text-brand-navy">{subject || "Untitled email"}</p>
            <p className="mt-1 text-xs text-brand-muted">
              To: {selectedCats.map((c) => CATEGORY_META[c]?.label || c).join(", ") || "No category"} ·{" "}
              {totalSelected.toLocaleString()} recipient{totalSelected === 1 ? "" : "s"}
            </p>
          </div>
          <div className="rounded-xl border border-brand-line overflow-hidden bg-white">
            <iframe
              title="Email preview"
              sandbox=""
              srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8" /><style>body{font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#1b2340;line-height:1.6;padding:24px;}h2{color:#131a3e;font-weight:700;}h3{color:#131a3e;font-weight:600;}ul,ol{padding-left:20px;}blockquote{border-left:3px solid #f5b301;padding-left:12px;color:#3f4756;font-style:italic;}a{color:#1e7a4c;}</style></head><body>${content}</body></html>`}
              className="h-[420px] w-full rounded-lg border border-brand-line bg-white"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setPreview(false)}
              className="rounded-lg bg-brand-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-navy-deep transition-colors"
            >
              Back to composer
            </button>
          </div>
        </div>
      </Modal>

      {/* Multi-recipient confirmation */}
      <ConfirmDialog
        isOpen={confirm}
        onClose={() => !sending && setConfirm(false)}
        onConfirm={handleSend}
        title="Confirm sending email"
        message={`You're about to send this email to ${totalSelected.toLocaleString()} recipient${totalSelected === 1 ? "" : "s"}. The message will be delivered individually to each person. Confirm to continue?`}
        confirmLabel={sending ? "Sending…" : "Send email"}
        loading={sending}
      />
    </>
  );
}