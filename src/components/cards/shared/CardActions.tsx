"use client";

import { App, Button, Tooltip } from "antd";
import { useTranslations } from "next-intl";
import { cn } from "@/utils";
import { useCompare } from "@/hooks/useCompare";
import { useWishlist } from "@/hooks/useWishlist";
import { compareItemFromCarItem } from "@/lib/compare";
import { wishlistItemFromCarItem } from "@/lib/wishlist";
import type { CarItem } from "@/types/car";
import { isComparableSource } from "@/types/compare";

type Props = {
  /** The card's car — drives the wishlist identity + snapshot. */
  car: CarItem;
  /**
   * Visibility mode.
   * - "hover" (default): hidden until parent .group is hovered
   * - "always": always visible (useful for table rows / list items)
   */
  visibility?: "hover" | "always";
  /** Absolute overlay positioning by default. Set false for inline placement. */
  absolute?: boolean;
  /**
   * Hide the compare toggle even for a comparable source — for cards whose
   * `source` doesn't match the id's real upstream (e.g. FeaturedAuctionSchedule
   * labels AJES rows "korea", so a compare fetch would 404).
   */
  disableCompare?: boolean;
};

export function CardActions({
  car,
  visibility = "hover",
  absolute = true,
  disableCompare = false,
}: Props) {
  const t = useTranslations("car.card");
  const tc = useTranslations("compare");
  const { message } = App.useApp();
  const { isWishlisted, toggle } = useWishlist();
  const wishlisted = isWishlisted(car.source, car.id);
  const { isCompared, toggle: toggleCompare } = useCompare();
  const canCompare = !disableCompare && isComparableSource(car.source);
  const compared = canCompare && isCompared(car.source, car.id);

  const stop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      className={cn(
        "flex gap-1.5",
        absolute && "absolute right-2.5 top-2.5 z-10",
        visibility === "hover" &&
          "pointer-fine:opacity-0 transition-opacity duration-200 pointer-fine:group-hover:opacity-100 focus-within:opacity-100",
      )}
    >
      <Tooltip title={t("wishlist")} placement="bottom" mouseEnterDelay={0.2}>
        <Button
          type="text"
          shape="circle"
          aria-label={t("wishlist")}
          aria-pressed={wishlisted}
          onClick={(e) => {
            stop(e);
            toggle(wishlistItemFromCarItem(car));
          }}
          className={cn(
            "ring-1! backdrop-blur-md! active:scale-95! pointer-coarse:h-10! pointer-coarse:w-10! pointer-coarse:min-w-10!",
            wishlisted
              ? "bg-rose-500! text-white! ring-rose-300/40! shadow-md! hover:bg-rose-500!"
              : "bg-white/90! text-neutral-700! ring-black/5! shadow-sm! hover:bg-white! hover:text-rose-500!",
          )}
        >
          <svg
            className="pointer-coarse:size-4.25"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill={wishlisted ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" />
          </svg>
        </Button>
      </Tooltip>
      {canCompare && (
        <Tooltip title={t("compare")} placement="bottom" mouseEnterDelay={0.2}>
          <Button
            type="text"
            shape="circle"
            aria-label={t("compare")}
            aria-pressed={compared}
            onClick={(e) => {
              stop(e);
              if (toggleCompare(compareItemFromCarItem(car)) === "full") {
                message.warning(tc("fullWarning"));
              }
            }}
            className={cn(
              "ring-1! backdrop-blur-md! active:scale-95! pointer-coarse:h-10! pointer-coarse:w-10! pointer-coarse:min-w-10!",
              compared
                ? "bg-neutral-900! text-white! ring-white/20! shadow-md! hover:bg-neutral-900!"
                : "bg-white/90! text-neutral-700! ring-black/5! shadow-sm! hover:bg-white! hover:text-neutral-900!",
            )}
          >
            <svg
              className="pointer-coarse:size-4.25"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 7h13l-3-3" />
              <path d="M21 17H8l3 3" />
            </svg>
          </Button>
        </Tooltip>
      )}
    </div>
  );
}
