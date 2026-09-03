"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Star,
  Menu,
  X,
  Phone,
  LogIn,
  ChevronRight,
} from "lucide-react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/academics", label: "Academics" },
  { href: "/admissions", label: "Admissions" },
  { href: "/news", label: "News" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Top bar */}
      <div className="bg-school-dark text-white/80 text-sm hidden lg:block">
        <div className="max-w-7xl mx-auto px-6 py-2 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-school-gold" />
              +234 (0) XXX XXX XXXX
            </span>
            <span>info@stardreamworksschools.com</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Ajah, Lagos, Nigeria</span>
          </div>
        </div>
      </div>

      {/* Main navbar */}
      <nav
        className={`fixed w-full z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md shadow-soft-md top-0"
            : "bg-white/80 backdrop-blur-sm"
        } ${scrolled ? "lg:top-0" : "lg:top-8"}`}
        style={{ top: scrolled ? 0 : 32 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-school-blue to-school-dark rounded-xl shadow-glow-blue group-hover:shadow-glow-gold transition-shadow duration-300">
                <Star className="w-5 h-5 lg:w-6 lg:h-6 text-school-gold fill-school-gold/30" />
              </div>
              <div className="hidden sm:block">
                <p className="font-[family-name:var(--font-poppins)] text-lg lg:text-xl font-bold text-school-dark leading-tight">
                  STAR DreamWorks
                </p>
                <p className="text-[10px] lg:text-xs text-gray-500 font-medium tracking-wider uppercase">
                  Caring Nursery, Primary & JSS
                </p>
              </div>
            </Link>

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative px-3 xl:px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive
                        ? "text-school-blue bg-school-blue/5"
                        : "text-gray-600 hover:text-school-dark hover:bg-gray-50"
                    }`}
                  >
                    {link.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-school-gold rounded-full" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Desktop CTA */}
            <div className="hidden lg:flex items-center gap-3">
              <Link
                href="/login"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-school-blue border border-school-blue/20 rounded-lg hover:bg-school-blue/5 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Login
              </Link>
              <Link
                href="/admissions"
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-school-gold to-secondary rounded-lg shadow-glow-gold hover:shadow-lg transition-all duration-300"
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
          {/* Drawer header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-9 h-9 bg-gradient-to-br from-school-blue to-school-dark rounded-lg">
                <Star className="w-5 h-5 text-school-gold fill-school-gold/30" />
              </div>
              <span className="font-[family-name:var(--font-poppins)] font-bold text-school-dark">
                Menu
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer links */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-school-blue/10 text-school-blue"
                        : "text-gray-600 hover:bg-gray-50 hover:text-school-dark"
                    }`}
                  >
                    {link.label}
                    {isActive && (
                      <span className="ml-auto w-1.5 h-1.5 bg-school-gold rounded-full" />
                    )}
                  </Link>
                );
              })}
            </div>

            <div className="mt-6 space-y-3">
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-medium text-school-blue border border-school-blue/20 rounded-xl hover:bg-school-blue/5 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Login
              </Link>
              <Link
                href="/admissions"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-school-gold to-secondary rounded-xl shadow-glow-gold"
              >
                Apply Now
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Drawer footer */}
          <div className="p-5 border-t border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Phone className="w-4 h-4 text-school-gold" />
              +234 (0) XXX XXX XXXX
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
