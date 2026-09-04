"use client";

import Link from "next/link";
import { MapPin, Phone, Mail, ArrowRight } from "lucide-react";
import { useSiteContent } from "@/lib/use-site-content";
import Logo from "@/components/public/Logo";
import {
  displayPhones,
  displayAddress,
  telHref,
  formatPhone,
  SCHOOL_SIGNATURE_LINE,
} from "@/lib/school-contact";

export default function Footer() {
  const { settings } = useSiteContent();
  const name = settings["school.name"] || "STAR DreamWorks Schools";
  const tagline = settings["school.tagline"] || "Pre-School, Nursery, Primary & High School";
  const address = displayAddress(settings["school.location"]);
  const phones = displayPhones(settings["school.phone"]);
  const email = settings["school.email"];

  const quickLinks = [
    { label: "Home", href: "/" },
    { label: "About Us", href: "/about" },
    { label: "Academics", href: "/academics" },
    { label: "Admissions", href: "/admissions" },
    { label: "News & Events", href: "/news" },
    { label: "Gallery", href: "/gallery" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <footer className="bg-brand-navy-deep text-white">
      {/* Admissions CTA band */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <span className="sd-live-dot mt-1.5 inline-block h-2.5 w-2.5 rounded-full bg-brand-green shrink-0" />
            <div>
              <p className="font-heading text-lg font-bold">
                Admission is open
              </p>
              <p className="text-sm text-white/60 mt-1">
                Creche, Kindergarten, Nursery, Primary and Secondary School —
                call or send an enquiry today.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full sm:w-auto">
            <Link
              href="/admissions"
              className="sd-btn sd-btn-apply px-6 py-3 text-sm"
            >
              Apply for Admission
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href={telHref(phones[0])}
              className="sd-btn sd-btn-outline-light px-6 py-3 text-sm"
            >
              <Phone className="w-4 h-4" />
              {formatPhone(phones[0])}
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block mb-5" aria-label={`${name} — home`}>
              <Logo variant="light" tagline={tagline} />
            </Link>
            <p className="text-sm text-white/55 leading-relaxed max-w-xs">
              A caring pre-school, nursery, primary and high school in Ajah,
              Lagos — combining strong academics with good character.
            </p>
            <p className="mt-4 text-sm font-semibold italic text-brand-yellow">
              “{SCHOOL_SIGNATURE_LINE}”
            </p>
          </div>

          {/* Quick Links */}
          <nav aria-label="Footer">
            <h3 className="font-heading font-bold text-xs uppercase tracking-widest mb-5 text-brand-yellow">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <div>
            <h3 className="font-heading font-bold text-xs uppercase tracking-widest mb-5 text-brand-yellow">
              Contact Us
            </h3>
            <ul className="space-y-4 text-sm text-white/60">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-brand-yellow mt-0.5 shrink-0" />
                <span>{address}</span>
              </li>
              {phones.map((p) => (
                <li key={p} className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-brand-yellow mt-0.5 shrink-0" />
                  <a
                    href={telHref(p)}
                    className="font-semibold text-white/80 hover:text-brand-yellow transition-colors"
                  >
                    {formatPhone(p)}
                  </a>
                </li>
              ))}
              {email ? (
                <li className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-brand-yellow mt-0.5 shrink-0" />
                  <a
                    href={`mailto:${email}`}
                    className="hover:text-white transition-colors break-all"
                  >
                    {email}
                  </a>
                </li>
              ) : null}
            </ul>
          </div>

          {/* Admissions */}
          <div>
            <h3 className="font-heading font-bold text-xs uppercase tracking-widest mb-5 text-brand-yellow">
              Admissions
            </h3>
            <p className="text-sm text-white/60 leading-relaxed mb-4">
              Applications are open for Creche, Kindergarten, Nursery, Primary
              and Secondary School.
            </p>
            <Link
              href="/admissions"
              className="inline-flex items-center gap-2 text-sm font-bold text-brand-yellow hover:text-white transition-colors"
            >
              View Admissions
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-white/40">
            &copy; {new Date().getFullYear()} {name}. All rights reserved.
          </p>
          <p className="text-xs text-white/40">
            Education = Knowledge · Knowledge = Power · Power = Respect ·
            Respect = Happiness
          </p>
        </div>
      </div>

      {/* Spacer so the mobile quick-action bar never covers footer content */}
      <div aria-hidden="true" className="h-[72px] md:hidden" />
    </footer>
  );
}
