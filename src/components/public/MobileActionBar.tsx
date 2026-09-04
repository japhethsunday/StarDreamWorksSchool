import Link from "next/link";
import { Phone, ChevronRight } from "lucide-react";
import {
  telHref,
  formatPhone,
  VERIFIED_PHONES,
} from "@/lib/school-contact";

/**
 * Mobile-only sticky quick-action bar: Call School + Apply Now.
 * Rendered on public pages via the Navbar. `md:hidden` keeps it off
 * tablet/desktop, and the footer carries a matching spacer so page
 * content is never covered.
 */
export default function MobileActionBar() {
  return (
    <div
      className="fixed bottom-0 inset-x-0 z-40 md:hidden border-t border-white/10 bg-brand-navy-deep/95 backdrop-blur px-4 pt-2.5"
      style={{ paddingBottom: "calc(0.625rem + env(safe-area-inset-bottom))" }}
    >
      <div className="flex gap-2.5">
        <a
          href={telHref(VERIFIED_PHONES[0])}
          aria-label={`Call the school on ${formatPhone(VERIFIED_PHONES[0])}`}
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-white/25 text-sm font-bold text-white transition-colors hover:bg-white/10"
        >
          <Phone className="w-4 h-4 text-brand-yellow" />
          Call School
        </a>
        <Link
          href="/admissions"
          className="sd-btn sd-btn-apply h-12 flex-1 px-4 text-sm"
        >
          Apply Now
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
