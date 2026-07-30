import type { ThemeConfig } from "antd";

// Shared by `ViewModeSwitcher` and `ScheduleDaySegmented`: the two rails sit
// side by side on the auction toolbar and have to read as one control system.
// `size="large"` makes the label 32px tall (controlHeightLG 40 − 2 ×
// trackPadding) and reads `borderRadiusLG` for the track, `borderRadius` for
// the item AND the sliding thumb — the thumb has no semantic class of its own,
// so its colour and radius can only come from tokens.
export const SEGMENTED_THEME: ThemeConfig = {
  components: {
    Segmented: {
      trackBg: "rgba(250, 250, 250, 0.7)", // neutral-50/70
      trackPadding: 4,
      borderRadiusLG: 16, // track — rounded-2xl
      borderRadius: 12, // item + thumb — rounded-xl
      itemColor: "#737373", // neutral-500
      // Hover only lifts the tile to white, it does NOT darken the content: the
      // pointer sits on the tile the thumb is sliding towards, antd drops the
      // white hover layer for the length of that slide, and neutral-900 content
      // on the neutral-900 thumb would blink out of sight every click.
      itemHoverColor: "#737373",
      itemHoverBg: "#ffffff",
      itemActiveBg: "#ffffff",
      itemSelectedBg: "#171717", // neutral-900
      itemSelectedColor: "#ffffff",
    },
  },
};
