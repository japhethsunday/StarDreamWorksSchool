/**
 * Verified school contact details, transcribed exactly from the school's
 * official flyer/exercise-book cover (the visual source of truth).
 *
 * DO NOT edit these digits without confirming against the supplied material.
 * CMS settings (school.phone / school.location) may override display, but
 * these verified values are always used as the fallback.
 */

export const VERIFIED_PHONES = [
  "08038330066",
  "08023913673",
  "08080693316",
] as const;

export const VERIFIED_ADDRESS =
  "2, Sanmi Arewa Ara Street, Off Mobil Road, Oniseke Ilaje Bus-Stop, Ajah, Lagos.";

export const VERIFIED_LOCATION_SHORT = "Ajah, Lagos, Nigeria";

/** Genuine school motto lines printed on the flyer cover. */
export const SCHOOL_MOTTO_LINES = [
  { left: "EDUCATION", right: "KNOWLEDGE" },
  { left: "KNOWLEDGE", right: "POWER" },
  { left: "POWER", right: "RESPECT" },
  { left: "RESPECT", right: "HAPPINESS" },
] as const;

export const SCHOOL_SIGNATURE_LINE = "Your Dream Is Your Signature";

/** Levels line printed on the flyer's red ribbon. */
export const SCHOOL_LEVELS_RIBBON = "Creche, Nursery & Primary Schools";

/** Admission levels stated on the website admissions copy. */
export const ADMISSION_LEVELS = [
  "Creche",
  "Kindergarten",
  "Nursery",
  "Primary",
  "Secondary School",
] as const;

/** Convert a Nigerian 080... number to an international tel: link. */
export function telHref(phone: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  const intl = digits.startsWith("0") ? `+234${digits.slice(1)}` : `+${digits}`;
  return `tel:${intl}`;
}

/** Format 08038330066 -> 0803 833 0066 for readable display (digits unchanged). */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  if (digits.length === 11) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  return phone;
}

/**
 * Parse a CMS phone setting which may hold one or several comma-separated
 * numbers. Returns [] when empty so callers can fall back to VERIFIED_PHONES.
 */
export function parsePhones(raw: string | undefined | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
}

/** Display phones: CMS value first when set, otherwise the verified numbers. */
export function displayPhones(cmsPhone: string | undefined | null): string[] {
  const fromCms = parsePhones(cmsPhone);
  return fromCms.length > 0 ? fromCms : [...VERIFIED_PHONES];
}

/** Display address: CMS value when set, otherwise the verified address. */
export function displayAddress(
  cmsLocation: string | undefined | null
): string {
  const trimmed = (cmsLocation || "").trim();
  if (!trimmed || trimmed === VERIFIED_LOCATION_SHORT) {
    // The generic short location carries no street detail; prefer the full
    // verified address from the flyer while keeping the area reference.
    return VERIFIED_ADDRESS;
  }
  return trimmed;
}
