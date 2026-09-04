"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LogIn, ChevronRight, MapPin, Phone } from "lucide-react";
import { useSiteContent } from "@/lib/use-site-content";
import Logo from "@/components/public/Logo";
import MobileActionBar from "@/components/public/MobileActionBar";
import {
  displayPhones,
  displayAddress,
  telHref,
  formatPhone,
} from "@/lib/school-contact";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/academics", label: "Academics" },
  { href: "/admissions", label: "Admissions" },
  { href: "/news", label: "News & Events" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { settings } = useSiteContent();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const admissionOpen =
    (settings["admissions.status"] || "open").toLowerCase() === "open";
  const phones = displayPhones(settings["school.phone"]);
  const address = displayAddress(settings["school.location"]);
  const tagline = settings["school.tagline"] || "Pre-School, Nursery, Primary & High School";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Drawer accessibility: move focus in on open, trap Tab inside,
  // close on Escape, and return focus to the toggle on close.
  useEffect(() => {
    if (!isOpen) return;
    closeRef.current?.focus();
    const toggleEl = toggleRef.current;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        return;
      }
      if (e.key === "Tab" && drawerRef.current) {
        const items = Array.from(
          drawerRef.current.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled])'
          )
        ).filter((el) => el.tabIndex >= 0);
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      toggleEl?.focus();
    };
  }, [isOpen]);

  return (
    <>
      {/* Skip link for keyboard and screen-reader users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-brand-yellow focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-brand-navy-deep"
      >
        Skip to content
      </a>
      {/* Contact topbar — verified school lines, tap-to-call on mobile */}
      <div className="bg-brand-navy-deep text-white/85 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-1.5 flex items-center justify-between gap-3">
          <p className="hidden md:flex items-center gap-1.5 min-w-0">
            <MapPin className="w-3.5 h-3.5 text-brand-yellow shrink-0" />
            <span className="truncate">{address}</span>
          </p>
          <p className="md:hidden flex items-center gap-1.5 font-medium shrink-0">
            <Phone className="w-3.5 h-3.5 text-brand-yellow shrink-0" />
            <a href={telHref(phones[0])} className="font-semibold tracking-wide hover:text-brand-yellow transition-colors">
              {formatPhone(phones[0])}
            </a>
          </p>
          <div className="hidden md:flex items-center gap-1 shrink-0">
            <Phone className="w-3.5 h-3.5 text-brand-yellow" />
            {phones.map((p, i) => (
              <span key={p} className="flex items-center">
                {i > 0 && <span className="mx-1.5 text-white/30">|</span>}
                <a
                  href={telHref(p)}
                  className="font-semibold tracking-wide hover:text-brand-yellow transition-colors"
                >
                  {formatPhone(p)}
                </a>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Admission ribbon */}
      <div className="bg-brand-yellow text-brand-navy-deep text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-center gap-2 text-center">
          <span className="inline-flex items-center gap-2 font-bold tracking-wide">
            <span className="sd-live-dot inline-block h-2 w-2 rounded-full bg-brand-green" />
            {admissionOpen
              ? "Admission is Open — Pre-School to High School"
              : "Admissions currently closed"}
          </span>
          {admissionOpen && (
            <Link
              href="/admissions"
              className="hidden sm:inline-flex items-center gap-0.5 font-bold text-brand-red underline underline-offset-2 hover:text-brand-red-dark transition-colors"
            >
              Apply today
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      {/* Main navbar */}
      <nav
        className={`sticky top-0 z-50 transition-shadow duration-300 bg-white ${
          scrolled ? "shadow-soft-md border-b border-brand-line" : ""
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between gap-4 h-[76px] lg:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center shrink-0" aria-label="STAR DreamWorks Schools — home">
              <Logo tagline={tagline} />
            </Link>

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-0.5 min-w-0">
              {navLinks.map((link) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== "/" && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`relative px-2.5 py-2.5 text-sm font-semibold rounded-lg whitespace-nowrap transition-colors ${
                      isActive
                        ? "text-brand-red"
                        : "text-brand-body hover:text-brand-navy hover:bg-brand-navy/5"
                    }`}
                  >
                    {link.label}
                    {isActive && (
                      <span className="absolute left-2.5 right-2.5 -bottom-0.5 h-0.5 rounded-full bg-brand-yellow" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Desktop CTA */}
            <div className="hidden lg:flex items-center gap-2 shrink-0">
              <Link
                href="/login"
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold whitespace-nowrap text-brand-body hover:text-brand-navy transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Login
              </Link>
              <Link href="/admissions" className="sd-btn sd-btn-apply px-5 py-2.5 text-sm whitespace-nowrap">
                Apply Now
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Mobile toggle */}
            <button
              ref={toggleRef}
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2.5 -mr-2 rounded-lg text-brand-navy hover:bg-brand-paper transition-colors"
              aria-label={isOpen ? "Close menu" : "Open menu"}
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-brand-navy-deep/50 z-40 lg:hidden animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        ref={drawerRef}
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-soft-xl z-50 transform transition-transform duration-300 ease-out lg:hidden flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!isOpen}
      >
        <div className="flex items-center justify-between p-5 border-b border-brand-line">
          <Logo crestClassName="w-9 h-9" />
            <button
              ref={closeRef}
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg text-brand-muted hover:bg-brand-paper transition-colors"
              aria-label="Close menu"
            >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <nav className="space-y-1" aria-label="Mobile">
            {navLinks.map((link, i) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  tabIndex={isOpen ? 0 : -1}
                  style={{ "--enter-delay": `${60 + i * 40}ms` } as React.CSSProperties}
                    className={`flex items-center justify-between px-4 py-3 min-h-[48px] rounded-xl text-sm font-semibold transition-colors ${
                      isOpen ? "sd-drawer-item" : "opacity-0"
                    } ${
                    isActive
                      ? "bg-brand-red/5 text-brand-red"
                      : "text-brand-body hover:bg-brand-paper hover:text-brand-navy"
                  }`}
                >
                  {link.label}
                  <ChevronRight className="w-4 h-4 opacity-40" />
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 space-y-3">
            <Link
              href="/login"
              onClick={() => setIsOpen(false)}
              tabIndex={isOpen ? 0 : -1}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-semibold text-brand-navy border border-brand-line rounded-xl hover:bg-brand-paper transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Login
            </Link>
            <Link
              href="/admissions"
              onClick={() => setIsOpen(false)}
              tabIndex={isOpen ? 0 : -1}
              className="sd-btn sd-btn-apply w-full px-4 py-3 text-sm"
            >
              Apply Now
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="mt-6 rounded-xl bg-brand-paper border border-brand-line p-4 space-y-2.5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-brand-muted">
              Call the school
            </p>
            {phones.map((p) => (
              <a
                key={p}
                href={telHref(p)}
                className="flex items-center gap-2 text-sm font-bold text-brand-navy hover:text-brand-red transition-colors"
              >
                <Phone className="w-4 h-4 text-brand-red" />
                {formatPhone(p)}
              </a>
            ))}
          </div>
        </div>

        <div className="p-5 border-t border-brand-line">
          <div className="flex items-start gap-2 text-xs text-brand-muted leading-relaxed">
            <MapPin className="w-4 h-4 text-brand-yellow shrink-0 mt-0.5" />
            {address}
          </div>
        </div>
      </div>

      <MobileActionBar />
    </>
  );
}
