"use client";

import Link from "next/link";
import { MapPin, Phone, Mail, ArrowRight } from "lucide-react";
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

export default function ContactPage() {
  const { settings } = useSiteContent();
  const address = displayAddress(settings["school.location"]);
  const phones = displayPhones(settings["school.phone"]);
  const email = settings["school.email"];

  return (
    <div className="min-h-screen">
      <Navbar />
      <PageHero
        eyebrow="Contact us"
        title="We'd love to hear from you"
        description="Questions about our programmes, admissions or a visit? Call the school office or send an enquiry — we'll be glad to help."
      />

      <section className="py-20 lg:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
            <Reveal>
              <div className="sd-card p-7 h-full">
                <div className="w-11 h-11 bg-brand-red/5 border border-brand-red/10 rounded-xl flex items-center justify-center mb-4">
                  <MapPin className="w-5 h-5 text-brand-red" />
                </div>
                <p className="font-bold text-brand-ink mb-1">Address</p>
                <p className="text-sm text-brand-body leading-relaxed">{address}</p>
              </div>
            </Reveal>
            <Reveal delay={90}>
              <div className="sd-card p-7 h-full">
                <div className="w-11 h-11 bg-brand-red/5 border border-brand-red/10 rounded-xl flex items-center justify-center mb-4">
                  <Phone className="w-5 h-5 text-brand-red" />
                </div>
                <p className="font-bold text-brand-ink mb-1">Phone</p>
                <div className="space-y-1.5">
                  {phones.map((p) => (
                    <p key={p}>
                      <a
                        href={telHref(p)}
                        className="text-sm font-bold text-brand-body hover:text-brand-red transition-colors"
                      >
                        {formatPhone(p)}
                      </a>
                    </p>
                  ))}
                </div>
              </div>
            </Reveal>
            <Reveal delay={180}>
              <div className="sd-card p-7 h-full">
                <div className="w-11 h-11 bg-brand-red/5 border border-brand-red/10 rounded-xl flex items-center justify-center mb-4">
                  <Mail className="w-5 h-5 text-brand-red" />
                </div>
                <p className="font-bold text-brand-ink mb-1">Email</p>
                {email ? (
                  <a
                    href={`mailto:${email}`}
                    className="text-sm text-brand-body hover:text-brand-red transition-colors break-all"
                  >
                    {email}
                  </a>
                ) : (
                  <p className="text-sm text-brand-muted">
                    Prefer to talk? Please call any of the school lines and our
                    team will gladly help.
                  </p>
                )}
              </div>
            </Reveal>
          </div>

          <Reveal>
            <div className="sd-hero-surface rounded-2xl p-8 lg:p-12">
              <p className="sd-eyebrow sd-eyebrow-on-dark mb-3">Admissions</p>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-white tracking-tight mb-4">
                Send an admission enquiry
              </h2>
              <p className="text-white/70 leading-relaxed max-w-2xl mb-8">
                Our admissions team will be in touch with the information you
                need about creche, kindergarten, nursery, primary and secondary
                school places.
              </p>
              <Link href="/admissions" className="sd-btn sd-btn-apply px-7 py-3.5 text-[15px]">
                Start an enquiry
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
