import Link from "next/link";
import {
  Star,
  MapPin,
  Phone,
  Mail,
  Clock,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
} from "lucide-react";

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Academics", href: "/academics" },
  { label: "Admissions", href: "/admissions" },
  { label: "News & Events", href: "/news" },
  { label: "Gallery", href: "/gallery" },
  { label: "Contact", href: "/contact" },
];

const academics = [
  { label: "Nursery School", href: "/academics#nursery" },
  { label: "Primary School", href: "/academics#primary" },
  { label: "Junior Secondary", href: "/academics#jss" },
  { label: "Our Curriculum", href: "/academics" },
  { label: "Admissions Guide", href: "/admissions" },
];

const socials = [
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Youtube, href: "#", label: "Youtube" },
];

export default function Footer() {
  return (
    <footer className="bg-school-dark text-white">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Brand column */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-3 mb-5">
              <div className="flex items-center justify-center w-11 h-11 bg-gradient-to-br from-school-blue to-blue-700 rounded-xl">
                <Star className="w-6 h-6 text-school-gold fill-school-gold/30" />
              </div>
              <div>
                <p className="font-[family-name:var(--font-poppins)] text-lg font-bold leading-tight">
                  STAR DreamWorks
                </p>
                <p className="text-[10px] text-gray-400 tracking-wider uppercase">
                  Schools
                </p>
              </div>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              Nurturing young minds with quality education, strong values, and a
              commitment to excellence. Building tomorrow&apos;s leaders today.
            </p>
            <div className="flex items-center gap-3">
              {socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="flex items-center justify-center w-9 h-9 bg-white/10 rounded-lg text-gray-400 hover:bg-school-gold hover:text-school-dark transition-all duration-200"
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-[family-name:var(--font-poppins)] font-semibold text-sm uppercase tracking-wider mb-5 text-school-gold">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Academics */}
          <div>
            <h3 className="font-[family-name:var(--font-poppins)] font-semibold text-sm uppercase tracking-wider mb-5 text-school-gold">
              Our Programs
            </h3>
            <ul className="space-y-3">
              {academics.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-[family-name:var(--font-poppins)] font-semibold text-sm uppercase tracking-wider mb-5 text-school-gold">
              Contact Us
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-school-gold mt-0.5 shrink-0" />
                <span className="text-sm text-gray-400">
                  Ajah, Lagos, Nigeria
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-school-gold mt-0.5 shrink-0" />
                <span className="text-sm text-gray-400">
                  +234 (0) XXX XXX XXXX
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-school-gold mt-0.5 shrink-0" />
                <span className="text-sm text-gray-400">
                  info@stardreamworksschools.com
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-school-gold mt-0.5 shrink-0" />
                <span className="text-sm text-gray-400">
                  Mon - Fri: 7:00 AM - 4:00 PM
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-500">
              &copy; {new Date().getFullYear()} STAR DreamWorks Schools. All
              rights reserved.
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <Link href="/about" className="hover:text-gray-300 transition-colors">
                Privacy Policy
              </Link>
              <span>|</span>
              <Link href="/about" className="hover:text-gray-300 transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
