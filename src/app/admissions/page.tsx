"use client";

import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  ChevronRight,
  MapPin,
  Phone,
  Mail,
  GraduationCap,
} from "lucide-react";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import PageHero from "@/components/public/PageHero";
import Reveal from "@/components/public/Reveal";
import { useSiteContent } from "@/lib/use-site-content";
import {
  displayPhones,
  displayAddress,
  telHref,
  formatPhone,
} from "@/lib/school-contact";

interface FormState {
  childFirstName: string;
  childLastName: string;
  dateOfBirth: string;
  level: string;
  studentClass: string;
  parentName: string;
  phone: string;
  email: string;
  address: string;
  message: string;
}

const emptyForm: FormState = {
  childFirstName: "",
  childLastName: "",
  dateOfBirth: "",
  level: "",
  studentClass: "",
  parentName: "",
  phone: "",
  email: "",
  address: "",
  message: "",
};

export default function AdmissionsPage() {
  const { settings, levels, loading } = useSiteContent();
  const admissionOpen = (settings["admissions.status"] || "open").toLowerCase() === "open";
  const message =
    settings["admissions.message"] ||
    "Applications are open for Creche, Kindergarten, Nursery, Primary and Secondary School.";
  const location = displayAddress(settings["school.location"]);
  const phones = displayPhones(settings["school.phone"]);
  const email = settings["school.email"];

  const ordered = [...levels].sort((a, b) => a.sortOrder - b.sortOrder);

  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const update = (key: keyof FormState, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/admissions/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Could not submit your enquiry.");
      }
      setDone(true);
    } catch (err: any) {
      setError(err.message || "Could not submit your enquiry.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all";

  return (
    <div className="min-h-screen">
      <Navbar />
      <PageHero
        eyebrow="Admissions"
        title="Admission is open"
        description="Applications are open for Creche, Kindergarten, Nursery, Primary and Secondary School."
      />

      {/* Status strip */}
      <section className="border-b border-brand-line bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <Reveal className="flex items-start gap-4">
            <div className="w-11 h-11 bg-brand-green/10 rounded-xl flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-brand-green" />
            </div>
            <div>
              <p className="font-heading font-bold text-brand-ink mb-1">
                {admissionOpen ? "We are currently accepting applications" : "Admissions status"}
              </p>
              <p className="text-brand-body leading-relaxed max-w-2xl">{message}</p>
            </div>
          </Reveal>
          <Reveal delay={120} className="shrink-0">
            <a
              href="#enquiry"
              className="sd-btn sd-btn-navy px-7 py-3.5 text-[15px]"
            >
              Start an enquiry
              <ArrowRight className="w-4 h-4" />
            </a>
          </Reveal>
        </div>
      </section>

      {/* Levels */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="max-w-2xl mb-12">
            <p className="sd-eyebrow mb-3">Choose a level</p>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-brand-ink tracking-tight mb-4">
              We welcome children at every stage
            </h2>
            <p className="text-brand-body leading-relaxed">
              Select the level you&apos;re applying for and we&apos;ll guide you
              through the enquiry and application process.
            </p>
          </Reveal>

          {loading && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-40 bg-gray-200/60 rounded-2xl animate-pulse" />
              ))}
            </div>
          )}

          {!loading && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {ordered.map((lvl, i) => {
                const active = form.level === lvl.slug;
                return (
                  <Reveal key={lvl.id} delay={(i % 3) * 80}>
                  <button
                    type="button"
                    onClick={() => {
                      update("level", lvl.slug);
                      document.getElementById("enquiry")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className={`group text-left bg-white border rounded-2xl p-7 transition-all w-full h-full ${
                      active
                        ? "border-brand-red ring-2 ring-brand-red/15"
                        : "border-brand-line hover:border-brand-red/40 shadow-soft-sm"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-brand-red/5 rounded-xl flex items-center justify-center group-hover:bg-brand-red/10 transition-colors">
                        <GraduationCap className="w-6 h-6 text-brand-red" />
                      </div>
                      {lvl.ageRange && (
                        <span className="text-xs font-bold text-brand-navy bg-brand-yellow/25 px-2.5 py-1 rounded-full">
                          {lvl.ageRange}
                        </span>
                      )}
                    </div>
                    <h3 className="font-heading text-lg font-bold text-brand-ink mb-2">
                      {lvl.name}
                    </h3>
                    <p className="text-sm text-brand-muted leading-relaxed line-clamp-2">
                      {lvl.description}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-brand-red">
                      Select level
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </button>
                  </Reveal>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Enquiry form */}
      <section id="enquiry" className="py-16 lg:py-20 bg-gray-50 border-t border-gray-100 scroll-mt-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {done ? (
            <div className="bg-white border border-gray-100 rounded-3xl p-10 lg:p-14 text-center shadow-soft-sm">
              <div className="w-16 h-16 bg-school-green/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-school-green" />
              </div>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-school-dark mb-3">
                Enquiry received
              </h2>
              <p className="text-gray-600 leading-relaxed max-w-md mx-auto mb-8">
                Thank you. We have received your admission enquiry and will be
                in touch with you shortly. If you have any urgent questions,
                please contact the school directly.
              </p>
              <div className="space-y-2 max-w-xs mx-auto">
                {phones.map((p) => (
                  <a key={p} href={telHref(p)} className="block font-bold text-brand-red hover:text-brand-red-dark transition-colors">
                    {formatPhone(p)}
                  </a>
                ))}
                {email && (
                  <a href={`mailto:${email}`} className="block font-semibold text-brand-navy">
                    {email}
                  </a>
                )}
              </div>
              <button
                onClick={() => {
                  setDone(false);
                  setForm(emptyForm);
                }}
                className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-school-dark text-white font-semibold rounded-lg hover:bg-school-blue transition-colors"
              >
                Submit another enquiry
              </button>
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-3xl p-8 lg:p-12 shadow-soft-sm">
              <div className="mb-8">
                <h2 className="font-heading text-2xl sm:text-3xl font-bold text-school-dark mb-2">
                  Admission enquiry
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  Complete the form below and our team will contact you with the
                  next steps.
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Child&apos;s first name *
                    </label>
                    <input
                      required
                      type="text"
                      value={form.childFirstName}
                      onChange={(e) => update("childFirstName", e.target.value)}
                      className={inputCls}
                      placeholder="Child's first name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Child&apos;s last name
                    </label>
                    <input
                      type="text"
                      value={form.childLastName}
                      onChange={(e) => update("childLastName", e.target.value)}
                      className={inputCls}
                      placeholder="Child's last name"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Date of birth
                    </label>
                    <input
                      type="date"
                      value={form.dateOfBirth}
                      onChange={(e) => update("dateOfBirth", e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      School level *
                    </label>
                    <select
                      required
                      value={form.level}
                      onChange={(e) => update("level", e.target.value)}
                      className={inputCls}
                    >
                      <option value="">Select a level...</option>
                      {ordered.map((lvl) => (
                        <option key={lvl.id} value={lvl.slug}>
                          {lvl.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Class / intended class (optional)
                  </label>
                  <input
                    type="text"
                    value={form.studentClass}
                    onChange={(e) => update("studentClass", e.target.value)}
                    className={inputCls}
                    placeholder="e.g. Nursery 2, Primary 4"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Parent / guardian name *
                    </label>
                    <input
                      required
                      type="text"
                      value={form.parentName}
                      onChange={(e) => update("parentName", e.target.value)}
                      className={inputCls}
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Phone number *
                    </label>
                    <input
                      required
                      type="tel"
                      value={form.phone}
                      onChange={(e) => update("phone", e.target.value)}
                      className={inputCls}
                      placeholder="Your contact number"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email address
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                      className={inputCls}
                      placeholder="you@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Address
                    </label>
                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) => update("address", e.target.value)}
                      className={inputCls}
                      placeholder="Your address"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Message (optional)
                  </label>
                  <textarea
                    rows={4}
                    value={form.message}
                    onChange={(e) => update("message", e.target.value)}
                    className={`${inputCls} resize-none`}
                    placeholder="Anything you'd like us to know"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="sd-btn sd-btn-apply w-full px-6 py-4 text-[15px] disabled:opacity-60"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                  Submit enquiry
                </button>
              </form>
            </div>
          )}
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`grid gap-5 ${email ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
            <Reveal>
              <div className="sd-card p-7 h-full">
                <MapPin className="w-6 h-6 text-brand-red mb-3" />
                <p className="font-bold text-brand-ink mb-1">Location</p>
                <p className="text-sm text-brand-body leading-relaxed">{location}</p>
              </div>
            </Reveal>
            <Reveal delay={90}>
              <div className="sd-card p-7 h-full">
                <Phone className="w-6 h-6 text-brand-red mb-3" />
                <p className="font-bold text-brand-ink mb-1">Phone</p>
                <div className="space-y-1">
                  {phones.map((p) => (
                    <p key={p}>
                      <a href={telHref(p)} className="text-sm font-bold text-brand-body hover:text-brand-red transition-colors">
                        {formatPhone(p)}
                      </a>
                    </p>
                  ))}
                </div>
              </div>
            </Reveal>
            {email && (
              <Reveal delay={180}>
                <div className="sd-card p-7 h-full">
                  <Mail className="w-6 h-6 text-brand-red mb-3" />
                  <p className="font-bold text-brand-ink mb-1">Email</p>
                  <a href={`mailto:${email}`} className="text-sm text-brand-body hover:text-brand-red transition-colors break-all">
                    {email}
                  </a>
                </div>
              </Reveal>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
