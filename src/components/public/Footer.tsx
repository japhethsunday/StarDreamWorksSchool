"use client";

import Link from "next/link";
import { Star, MapPin, Phone, Mail, ArrowRight } from "lucide-react";
import { useSiteContent } from "@/lib/use-site-content";

export default function Footer() {
  const { settings } = useSiteContent();
  const name = settings["school.name"] || "STAR DreamWorks Schools";
  const tagline = settings["school.tagline"] || "Caring Nursery, Primary & JSS";
  const location = settings["school.location"] || "Ajah, Lagos, Nigeria";
  const phone = settings["school.phone"];
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
    <footer className="bg-school-dark text-white">
      {/* Admissions CTA band */}
      <div className="bg-school-blue/20 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-heading text-lg font-semibold">
              Ready to enrol your child?
            </p>
            <p className="text-sm text-white/60 mt-1">
              Learn about our admissions process and how to apply.
            </p>
          </div>
          <Link
            href="/admissions"
            className="inline-flex shrink-0 items-center gap-2 px-6 py-3 bg-school-gold text-school-dark text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            Apply Now
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-3 mb-5">
              <div className="flex items-center justify-center w-10 h-10 bg-school-gold rounded-lg">
                <Star className="w-5 h-5 text-school-dark fill-school-dark/40" />
              </div>
              <div className="leading-tight">
                <p className="font-heading font-bold text-lg">{name}</p>
                <p className="text-[10px] text-white/50 tracking-wider uppercase">
                  {tagline}
                </p>
              </div>
            </Link>
            <p className="text-sm text-white/50 leading-relaxed max-w-xs">
              A caring nursery, primary and junior secondary school in Ajah,
              Lagos — combining strong academics with good character.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-heading font-semibold text-sm uppercase tracking-wider mb-5 text-school-gold">
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
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-heading font-semibold text-sm uppercase tracking-wider mb-5 text-school-gold">
              Contact Us
            </h3>
            <ul className="space-y-4 text-sm text-white/60">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-school-gold mt-0.5 shrink-0" />
                <span>{location}</span>
              </li>
              {phone ? (
                <li className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-school-gold mt-0.5 shrink-0" />
                  <a href={`tel:${phone}`} className="hover:text-white transition-colors">
                    {phone}
                  </a>
                </li>
              ) : null}
              {email ? (
                <li className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-school-gold mt-0.5 shrink-0" />
                  <a href={`mailto:${email}`} className="hover:text-white transition-colors">
                    {email}
                  </a>
                </li>
              ) : null}
              {!phone && !email ? (
                <li className="text-white/40 italic">
                  Contact details to be confirmed by the school.
                </li>
              ) : null}
            </ul>
          </div>

          {/* Admissions */}
          <div>
            <h3 className="font-heading font-semibold text-sm uppercase tracking-wider mb-5 text-school-gold">
              Admissions
            </h3>
            <p className="text-sm text-white/60 leading-relaxed mb-4">
              Applications are open for Creche, Kindergarten, Nursery, Primary
              and Secondary School.
            </p>
            <Link
              href="/admissions"
              className="inline-flex items-center gap-2 text-sm font-semibold text-school-gold hover:text-white transition-colors"
            >
              View Admissions
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <p className="text-xs text-white/40 text-center sm:text-left">
            &copy; {new Date().getFullYear()} {name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
