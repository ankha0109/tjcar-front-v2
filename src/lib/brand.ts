// Shared brand helpers used by the home "brands" section and the
// `/japan/brands` manufacturers explorer.

/**
 * Normalise a brand name for matching: backend names arrive upper-cased
 * ("TOYOTA"), curated lists use title case ("Mercedes-Benz"). Strip case and
 * punctuation so both sides compare equal.
 */
export const norm = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");

/** Manufacturer logo from the carlogos.org CDN ("Mercedes-Benz" → mercedes-benz). */
export function brandLogoUrl(marka: string) {
  const slug = marka.toLowerCase().replace(/\s+/g, "-");
  return `https://www.carlogos.org/car-logos/${slug}-logo.png`;
}

/**
 * Curated "top" Japanese makes shown first. The backend `/filters` feed has no
 * popularity/featured flag, so this hard-coded order is the de-facto ranking
 * (it also drives the featured grid in `CarSearchSection`).
 */
export const TOP_JAPAN_MAKES = [
  "Toyota",
  "Lexus",
  "Mercedes-Benz",
  "Subaru",
  "Nissan",
  "Mitsubishi",
  "Honda",
  "Mazda",
  "Suzuki",
] as const;
