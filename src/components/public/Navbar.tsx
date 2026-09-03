"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Star, Menu, X, LogIn, ChevronRight, MapPin } from "lucide-react";
import { useSiteContent } from "@/lib/use-site-content";

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

  const admissionOpen =
    (settings["admissions.status"] || "open").toLowerCase() === "open";
  const tagline = settings["school.tagline"] || "Caring Nursery, Primary & JSS";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Admission ribbon */}
      <div className="bg-school-gold text-school-dark text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-center gap-2 text-center">
          <span className="inline-flex items-center gap-1.5 font-semibold tracking-wide">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-school-dark opacity-60`} />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-school-dark" />
            </span>
            {admissionOpen
              ? "Admission is Open"
              : "Admissions currently closed"}
          </span>
          <Link href="/admissions" className="hidden sm:inline-flex items-center gap-1 font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity">
            Apply today
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Main navbar */}
      <nav
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/90 backdrop-blur-md shadow-soft border-b border-gray-100"
            : "bg-white"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 lg:h-[72px]">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="flex items-center justify-center w-10 h-10 lg:w-11 lg:h-11 bg-school-dark rounded-xl shadow-soft group-hover:shadow-soft-md transition-shadow">
                <Star className="w-5 h-5 lg:w-[22px] lg:h-[22px] text-school-gold fill-school-gold/40" />
              </div>
              <div className="hidden sm:block leading-tight">
                <p className="font-heading font-bold text-school-dark text-lg lg:text-xl">
                  STAR <span className="text-school-blue">DreamWorks</span>
                </p>
                <p className="text-[10px] lg:text-xs text-gray-500 font-medium tracking-wider uppercase">
                  {tagline}
                </p>
              </div>
            </Link>

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== "/" && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? "text-school-blue bg-school-blue/5"
                        : "text-gray-600 hover:text-school-dark hover:bg-gray-50"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* Desktop CTA */}
            <div className="hidden lg:flex items-center gap-3">
              <Link
                href="/login"
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-school-dark transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Login
              </Link>
              <Link
                href="/admissions"
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-school-dark rounded-lg hover:bg-school-blue transition-colors"
              >
                Apply Now
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Mobile toggle */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-soft-xl z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-9 h-9 bg-school-dark rounded-lg">
                <Star className="w-5 h-5 text-school-gold fill-school-gold/40" />
              </div>
              <span className="font-heading font-bold text-school-dark">Menu</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-1">
              {navLinks.map((link) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== "/" && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-school-blue/5 text-school-blue"
                        : "text-gray-600 hover:bg-gray-50 hover:text-school-dark"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            <div className="mt-6 space-y-3">
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Login
              </Link>
              <Link
                href="/admissions"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-semibold text-white bg-school-dark rounded-xl"
              >
                Apply Now
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="p-5 border-t border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <MapPin className="w-4 h-4 text-school-gold" />
              {settings["school.location"] || "Ajah, Lagos, Nigeria"}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
