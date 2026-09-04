"use client";

import Link from "next/link";
import { GraduationCap, ArrowRight, Sparkles } from "lucide-react";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import PageHero from "@/components/public/PageHero";
import Reveal from "@/components/public/Reveal";
import { useSiteContent } from "@/lib/use-site-content";

function parseHighlights(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function AcademicsPage() {
  const { levels, loading } = useSiteContent();
  const ordered = [...levels].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="min-h-screen">
      <Navbar />
      <PageHero
        eyebrow="Academics"
        title="Our programmes"
        description="From creche through to secondary school, a caring learning journey at every stage."
      />

      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="max-w-2xl mb-14">
            <p className="sd-eyebrow mb-3">Educational levels</p>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-brand-ink tracking-tight mb-4">
              A stage for every child
            </h2>
            <p className="text-brand-body leading-relaxed">
              Each level is designed to care for children and build strong
              academic foundations and confidence as they grow.
            </p>
          </Reveal>

          {loading && (
            <div className="space-y-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-56 bg-gray-200/60 rounded-3xl animate-pulse" />
              ))}
            </div>
          )}

          {!loading && (
            <div className="space-y-8">
              {ordered.map((lvl, index) => {
                const highlights = parseHighlights(lvl.highlights);
                const dark = index % 2 === 0;
                return (
                  <Reveal key={lvl.id}>
                  <div
                    id={lvl.slug}
                    className={`scroll-mt-24 rounded-2xl border p-8 lg:p-12 ${
                      dark
                        ? "sd-hero-surface border-brand-navy-deep text-white"
                        : "bg-white border-brand-line"
                    }`}
                  >
                    <div className="grid lg:grid-cols-[1fr_1.2fr] gap-10 items-start">
                      <div>
                        <div className="flex items-center gap-4 mb-6">
                          <div
                            className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                              dark ? "bg-brand-yellow" : "bg-brand-red/5 border border-brand-red/10"
                            }`}
                          >
                            <GraduationCap
                              className={`w-7 h-7 ${
                                dark ? "text-brand-navy-deep" : "text-brand-red"
                              }`}
                            />
                          </div>
                          <div>
                            <h2 className={`font-heading text-2xl sm:text-3xl font-bold tracking-tight ${dark ? "text-white" : "text-brand-ink"}`}>
                              {lvl.name}
                            </h2>
                            {lvl.ageRange && (
                              <span
                                className={`text-sm font-bold ${
                                  dark ? "text-brand-yellow" : "text-brand-red"
                                }`}
                              >
                                {lvl.ageRange}
                              </span>
                            )}
                          </div>
                        </div>
                        <p
                          className={`leading-relaxed mb-6 ${
                            dark ? "text-white/80" : "text-brand-body"
                          }`}
                        >
                          {lvl.description || "Programme details will be added by the school."}
                        </p>
                        <Link
                          href="/admissions"
                          className={`inline-flex items-center gap-2 font-bold text-sm ${
                            dark ? "text-brand-yellow hover:text-white" : "text-brand-red hover:text-brand-red-dark"
                          } transition-colors`}
                        >
                          Enquire about this level
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>

                      {highlights.length > 0 && (
                        <div
                          className={`rounded-2xl p-8 ${
                            dark ? "bg-white/5 border border-white/10" : "bg-brand-paper border border-brand-line"
                          }`}
                        >
                          <h3
                            className={`font-heading font-bold mb-5 ${
                              dark ? "text-white" : "text-brand-ink"
                            }`}
                          >
                            What we focus on
                          </h3>
                          <ul className="space-y-3.5">
                            {highlights.map((h) => (
                              <li key={h} className="flex items-start gap-3">
                                <Sparkles
                                  className={`w-5 h-5 shrink-0 mt-0.5 ${
                                    dark ? "text-brand-yellow" : "text-brand-red"
                                  }`}
                                />
                                <span
                                  className={`text-sm leading-relaxed ${
                                    dark ? "text-white/80" : "text-brand-body"
                                  }`}
                                >
                                  {h}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                  </Reveal>
                );
              })}
            </div>
          )}

          {!loading && ordered.length === 0 && (
            <div className="text-center py-20 bg-gray-50 rounded-3xl border border-gray-100">
              <p className="text-gray-500">
                Programme information is being prepared by the school. Please
                check back soon.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Resources — documents are issued by the school office; nothing is
          offered for download until the school provides the actual files. */}
      <section className="pb-20 lg:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="max-w-2xl mb-8">
            <p className="sd-eyebrow mb-3">Resources</p>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-brand-ink tracking-tight">
              Documents & guides
            </h2>
          </Reveal>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { title: "School Prospectus", text: "An overview of our programmes, values and daily life." },
              { title: "Academic Calendar", text: "Term dates, holidays and key school events." },
              { title: "Fee Guidelines", text: "Fee structure and payment guidance for parents." },
            ].map((r, i) => (
              <Reveal key={r.title} delay={i * 80}>
                <div className="sd-card p-6 h-full flex flex-col">
                  <h3 className="font-heading font-bold text-brand-ink mb-2">{r.title}</h3>
                  <p className="text-sm text-brand-muted leading-relaxed mb-4 flex-1">{r.text}</p>
                  <p className="text-xs text-brand-muted mb-4">
                    <span className="inline-block font-bold uppercase tracking-widest text-brand-navy bg-brand-yellow/25 rounded-full px-2.5 py-1">
                      Coming soon
                    </span>
                  </p>
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-red hover:text-brand-red-dark transition-colors"
                  >
                    Request from the school office
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
