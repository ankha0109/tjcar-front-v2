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

export function getColorSwatch(name: string): ColorSwatch {
  return COLOR_SWATCH[name.trim().toLowerCase()] ?? { bg: "#9ca3af" };
}
