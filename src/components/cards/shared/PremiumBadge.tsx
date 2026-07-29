"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/utils";
import { openPremiumInfo } from "@/components/modal/premiumInfoBus";

/**
 * Premium (paid USS) marker: one flat gold chip, no gradient and no glyph. The
 * card border ({@link PREMIUM_CARD_BORDER_CLASSES}) is the same colour, so the
 * chip and the frame read as one cue.
 *
 * Tapping it explains what Premium is — the badge owns that interaction so no
 * call site has to wire it up. The modal itself is mounted app-wide
 * (`PremiumInfoModalRoot`); see `premiumInfoBus` for why it cannot live here.
 */
export function PremiumBadge({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md";
}) {
  const t = useTranslations("car.card");
  const tInfo = useTranslations("car.premiumInfo");

  return (
    <button
      type="button"
      aria-label={tInfo("badgeAria")}
      onClick={(e) => {
        // Every call site nests the badge in something clickable — a <Link>
        // on the cards, an `onRow` row in the table view.
        e.preventDefault();
        e.stopPropagation();
        openPremiumInfo();
      }}
      className={cn(
        // `yellow-500` (#eab308) is Tailwind's closest match to the brand's
        // #feb000 premium gold.
        "inline-flex cursor-pointer items-center rounded-md bg-yellow-500 font-semibold uppercase tracking-wide text-black/80 transition-colors hover:bg-yellow-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-500",
        // The line height rides on the size utility (`/tight`): a standalone
        // `leading-tight` would be dropped by tailwind-merge, which treats
        // `text-[…]` as overriding line height.
        size === "sm"
          ? "px-1.5 py-1 text-[9.5px]/tight"
          : "px-1.5 py-1 text-[10px]/tight",
        className,
      )}
    >
      {t("premium")}
    </button>
  );
}

/** Single hairline in the badge's own gold — no ring, no glow. */
export const PREMIUM_CARD_BORDER_CLASSES = "border-yellow-500";

export function isPremiumCar(auctionType: string | undefined): boolean {
  return auctionType === "1";
}
