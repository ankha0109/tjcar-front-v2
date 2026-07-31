/**
 * Licence-plate / chassis-number input handling for the report lookup.
 *
 * Shared by the `/report` hero form and the home page's report panel so both
 * entry points normalise and validate identically — a plate typed on the home
 * page has to reach `/report` in exactly the form the hero would have produced,
 * because the hero turns it straight into a lookup.
 */

export type SearchMode = "plate" | "vin";

export type SearchError =
  | "required"
  | "tooShort"
  | "invalidChars"
  | "plateFormat"
  | null;

/** Uppercase, strip whitespace, normalise unicode hyphen variants to "-". */
function normalizeChassis(raw: string) {
  return raw
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[‐-―−－]/g, "-");
}

/* Plates are Cyrillic; map the Latin homoglyphs an English keyboard
   produces (A→А, Y/U→У, …) so "1234YBH" still validates. */
const LATIN_TO_CYRILLIC: Record<string, string> = {
  A: "А",
  B: "В",
  C: "С",
  E: "Е",
  H: "Н",
  I: "И",
  K: "К",
  M: "М",
  O: "О",
  P: "Р",
  T: "Т",
  X: "Х",
  Y: "У",
  U: "У",
};

function normalizePlate(raw: string) {
  return raw
    .toUpperCase()
    .replace(/[\s‐-―−－-]/g, "")
    .replace(/[A-Z]/g, (ch) => LATIN_TO_CYRILLIC[ch] ?? ch);
}

/** Clean raw keystrokes for the active mode. Safe to run on every change. */
export function normalizeFor(mode: SearchMode, raw: string) {
  return mode === "plate" ? normalizePlate(raw) : normalizeChassis(raw);
}

export function validate(mode: SearchMode, v: string): SearchError {
  if (!v) return "required";
  if (mode === "plate") {
    return /^\d{4}[А-ЯЁӨҮ]{3}$/u.test(v) ? null : "plateFormat";
  }
  if (!/^[A-Z0-9-]+$/.test(v)) return "invalidChars";
  if (v.length < 6) return "tooShort";
  return null;
}

/**
 * The query `/report` reads back. Exactly one key is present — the modal
 * branches on which one it got, and a plate takes an extra Autobox hop.
 */
export function reportSearchQuery(
  mode: SearchMode,
  value: string,
): { plate: string } | { vin: string } {
  return mode === "plate" ? { plate: value } : { vin: value };
}
