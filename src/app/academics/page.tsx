"use client";

import Link from "next/link";
import { GraduationCap, ArrowRight, Sparkles } from "lucide-react";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import PageHero from "@/components/public/PageHero";
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
          <div className="max-w-2xl mb-14">
            <span className="inline-block text-sm font-semibold text-school-gold uppercase tracking-wider mb-3">
              Educational levels
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-school-dark mb-4">
              A stage for every child
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Each level is designed to care for children and build strong
              academic foundations and confidence as they grow.
            </p>
          </div>

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
                return (
                  <div
                    key={lvl.id}
                    id={lvl.slug}
                    className={`scroll-mt-24 rounded-3xl border p-8 lg:p-12 ${
                      index % 2 === 0
                        ? "bg-school-dark border-school-dark text-white"
                        : "bg-white border-gray-100 shadow-soft-sm"
                    }`}
                  >
                    <div className="grid lg:grid-cols-[1fr_1.2fr] gap-10 items-start">
                      <div>
                        <div className="flex items-center gap-4 mb-6">
                          <div
                            className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                              index % 2 === 0 ? "bg-school-gold" : "bg-school-blue/5"
                            }`}
                          >
                            <GraduationCap
                              className={`w-7 h-7 ${
                                index % 2 === 0 ? "text-school-dark" : "text-school-blue"
                              }`}
                            />
                          </div>
                          <div>
                            <h2 className="font-heading text-2xl sm:text-3xl font-bold">
                              {lvl.name}
                            </h2>
                            {lvl.ageRange && (
                              <span
                                className={`text-sm font-semibold ${
                                  index % 2 === 0 ? "text-school-gold" : "text-school-gold"
                                }`}
                              >
                                {lvl.ageRange}
                              </span>
                            )}
                          </div>
                        </div>
                        <p
                          className={`leading-relaxed mb-6 ${
                            index % 2 === 0 ? "text-white/80" : "text-gray-600"
                          }`}
                        >
                          {lvl.description || "Programme details will be added by the school."}
                        </p>
                        <Link
                          href="/admissions"
                          className={`inline-flex items-center gap-2 font-semibold text-sm ${
                            index % 2 === 0 ? "text-school-gold" : "text-school-blue"
                          }`}
                        >
                          Enquire about this level
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>

                      {highlights.length > 0 && (
                        <div
                          className={`rounded-2xl p-8 ${
                            index % 2 === 0 ? "bg-white/5" : "bg-gray-50"
                          }`}
                        >
                          <h3
                            className={`font-heading font-semibold mb-5 ${
                              index % 2 === 0 ? "text-white" : "text-school-dark"
                            }`}
                          >
                            What we focus on
                          </h3>
                          <ul className="space-y-3.5">
                            {highlights.map((h) => (
                              <li key={h} className="flex items-start gap-3">
                                <Sparkles
                                  className={`w-5 h-5 shrink-0 mt-0.5 ${
                                    index % 2 === 0 ? "text-school-gold" : "text-school-blue"
                                  }`}
                                />
                                <span
                                  className={`text-sm leading-relaxed ${
                                    index % 2 === 0 ? "text-white/80" : "text-gray-600"
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

      <Footer />
    </div>
  );
}
