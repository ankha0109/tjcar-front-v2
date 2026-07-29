export type ColorSwatch = { bg: string; ring?: boolean };

const COLOR_SWATCH: Record<string, ColorSwatch> = {
  // Mongolian
  цагаан: { bg: "#ffffff", ring: true },
  хар: { bg: "#161616" },
  саарал: { bg: "#7c8088" },
  мөнгөлөг: { bg: "#cdd2d8" },
  цэнхэр: { bg: "#2858a7" },
  улаан: { bg: "#c8302d" },
  ногоон: { bg: "#2c7a4b" },
  шар: { bg: "#e7bc1a" },
  бор: { bg: "#6e4a2c" },
  ягаан: { bg: "#e08aa5" },
  // English
  white: { bg: "#ffffff", ring: true },
  black: { bg: "#161616" },
  gray: { bg: "#7c8088" },
  grey: { bg: "#7c8088" },
  silver: { bg: "#cdd2d8" },
  blue: { bg: "#2858a7" },
  red: { bg: "#c8302d" },
  green: { bg: "#2c7a4b" },
  yellow: { bg: "#e7bc1a" },
  brown: { bg: "#6e4a2c" },
  pink: { bg: "#e08aa5" },
  // Russian
  белый: { bg: "#ffffff", ring: true },
  черный: { bg: "#161616" },
  серый: { bg: "#7c8088" },
  серебристый: { bg: "#cdd2d8" },
  синий: { bg: "#2858a7" },
  красный: { bg: "#c8302d" },
  зеленый: { bg: "#2c7a4b" },
  желтый: { bg: "#e7bc1a" },
  коричневый: { bg: "#6e4a2c" },
};

/**
 * Encar `colorName` (Korean, passed through raw by the backend) → canonical
 * color key. Keys double as `carDetail.colors.*` i18n message keys; every key
 * must exist in all three locale files.
 */
const KOREAN_COLOR_KEY: Record<string, string> = {
  흰색: "white",
  진주색: "pearl",
  검정색: "black",
  검정투톤: "black",
  쥐색: "gray",
  회색: "gray",
  진회색: "gray",
  은색: "silver",
  은회색: "silver",
  파란색: "blue",
  청색: "blue",
  남색: "blue",
  하늘색: "blue",
  빨간색: "red",
  적색: "red",
  초록색: "green",
  녹색: "green",
  노란색: "yellow",
  갈색: "brown",
  밤색: "brown",
  분홍색: "pink",
  베이지색: "beige",
  주황색: "orange",
  보라색: "purple",
  금색: "gold",
};

const CANONICAL_SWATCH: Record<string, ColorSwatch> = {
  white: { bg: "#ffffff", ring: true },
  // Pearl is a pearlescent *white*, not cream — it has to read as white at the
  // 10–12px the swatches render at.
  pearl: { bg: "#fbfaf6", ring: true },
  black: { bg: "#161616" },
  gray: { bg: "#7c8088" },
  silver: { bg: "#cdd2d8" },
  blue: { bg: "#2858a7" },
  red: { bg: "#c8302d" },
  green: { bg: "#2c7a4b" },
  yellow: { bg: "#e7bc1a" },
  brown: { bg: "#6e4a2c" },
  pink: { bg: "#e08aa5" },
  beige: { bg: "#d9c7a7" },
  orange: { bg: "#d97a2b" },
  purple: { bg: "#6d4a9e" },
  gold: { bg: "#c4a24d" },
  wine: { bg: "#7b2233" },
  ivory: { bg: "#f6f0e2", ring: true },
};

/** Canonical key for a Korean (Encar) color name, or null when unmapped. */
export function colorNameKey(name: string): string | null {
  return KOREAN_COLOR_KEY[name.trim()] ?? null;
}

const UNKNOWN_SWATCH: ColorSwatch = { bg: "#9ca3af" };

const lookup = (key: string): ColorSwatch | undefined =>
  COLOR_SWATCH[key] ?? CANONICAL_SWATCH[key];

/**
 * Paint swatch for a raw colour string.
 *
 * AJES writes `COLOR` free-form — `"PEARL"`, `"PEARL 2"`, `"PEARL WHITE"`,
 * `"D GREEN"`, `"GRAY 2"` — so an exact-match table alone drops most of the
 * feed onto the unknown grey. Failing that, the variant digits are stripped and
 * the words are read right to left: English colour names put the base colour
 * last, so "pearl white" is white and "d green" is green.
 */
export function getColorSwatch(name: string): ColorSwatch {
  const koreanKey = colorNameKey(name);
  if (koreanKey) return CANONICAL_SWATCH[koreanKey];

  const cleaned = name.trim().toLowerCase();
  const exact = lookup(cleaned);
  if (exact) return exact;

  const words = cleaned
    .replace(/\d+/g, " ")
    .split(/[^\p{L}]+/u)
    .filter(Boolean);
  for (let i = words.length - 1; i >= 0; i--) {
    const hit = lookup(words[i]);
    if (hit) return hit;
  }
  return UNKNOWN_SWATCH;
}
