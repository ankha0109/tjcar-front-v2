/**
 * AJES ships a lot's extra facts as one free-text `INFO` string, and every
 * auction house writes it differently:
 *
 *   "Inspection: Jun. 2028, Rate ext: A, Rate int: A"          (CAA, BAYAUC, …)
 *   "Inspection:Jun.2029, Seats:4&#20154;, Type:5W, … ,
 *    Comments:&#12371;…, Rate ext: A, Rate int: A"              (Honda AA, …)
 *
 * The second shape is a raw dump: HTML-entity-encoded Japanese free text that
 * renders as `4&#20154;` if printed as-is. So we pull out only the two grades
 * worth showing and drop the rest. USS (premium) lots send INFO empty.
 */

/** Grades the auction house published for a lot, if any. */
export type AuctionInfo = {
  /** Exterior grade off the auction sheet — A/B/C/D. */
  rateExt?: string;
  /** Interior grade off the auction sheet — A/B/C/D. */
  rateInt?: string;
};

/** Values arrive HTML-encoded, sometimes doubly so (`&amp;nbsp`). */
function decodeEntities(raw: string): string {
  return raw
    .replace(/&#x([0-9a-f]+);?/gi, (_, hex: string) =>
      String.fromCodePoint(parseInt(hex, 16)),
    )
    .replace(/&#(\d+);?/g, (_, dec: string) =>
      String.fromCodePoint(Number(dec)),
    )
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;?/gi, " ");
}

/**
 * Decode one AJES free-text value for display. The same entity encoding used in
 * `INFO` shows up in `GRADE`, so `"RS&#65393;&#65412;&#65438; Van"` has to be
 * turned into `"RSアド Van"` before it reaches the page: entities decoded, then
 * NFKC-normalised so the halfwidth katakana AJES emits (`ｱﾄﾞ`) folds into the
 * fullwidth forms the auction sheet actually shows, dakuten included.
 *
 * These strings are DATA, never markup — decode them here and render as text.
 * `dangerouslySetInnerHTML` would hand backend text to the HTML parser (an XSS
 * hole) and still leave the halfwidth katakana unreadable.
 */
export function decodeAuctionText(raw: string | undefined): string {
  return decodeEntities(raw ?? "")
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim();
}

/** `-`, `—` and blanks all mean "the auction house did not publish this". */
function clean(value: string | undefined): string | undefined {
  const text = decodeAuctionText(value);
  return !text || text === "-" || text === "—" ? undefined : text;
}

/** Read one `Key: value` pair out of the comma-separated blob. */
function field(raw: string, key: string): string | undefined {
  const match = new RegExp(`${key}\\s*:\\s*([^,]*)`, "i").exec(raw);
  return clean(match?.[1]);
}

/** Parse AJES `INFO`. Both fields are optional — many lots publish neither. */
export function parseAuctionInfo(raw: string | undefined): AuctionInfo {
  if (!raw?.trim()) return {};
  return {
    rateExt: field(raw, "Rate ext"),
    rateInt: field(raw, "Rate int"),
  };
}
