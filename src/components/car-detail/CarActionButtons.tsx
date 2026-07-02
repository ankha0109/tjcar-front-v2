"use client";

import { App } from "antd";
import { useTranslations } from "next-intl";
import { cn } from "@/utils";
import { useCompare } from "@/hooks/useCompare";
import { useWishlist } from "@/hooks/useWishlist";
import type { WishlistItem } from "@/types/wishlist";

type Props = {
  /** The detail page's car — drives the wishlist identity + snapshot. */
  item: WishlistItem;
  /**
   * Show the compare pill. Only detail pages whose id the compare endpoint can
   * re-fetch upstream enable this (Japan AJES lots, Korea CARAPIS listings);
   * local stock (`/cars/[id]`) stays wishlist-only.
   */
  enableCompare?: boolean;
};

/**
 * Wishlist + compare actions for the detail-page header, to the right of the
 * title. The heart is wired to the shared wishlist (guest localStorage or the
 * account, via {@link useWishlist}); compare uses the device-local tray
 * ({@link useCompare}). Reuses the `car.card.wishlist` / `car.card.compare` labels.
 */
export default function CarActionButtons({
  item,
  enableCompare = false,
}: Props) {
  const t = useTranslations("car.card");
  const tc = useTranslations("compare");
  const { message } = App.useApp();
  const { isWishlisted, toggle } = useWishlist();
  const wishlisted = isWishlisted(item.source, item.id);
  const { isCompared, toggle: toggleCompare } = useCompare();
  const compared = enableCompare && isCompared(item.source, item.id);

  return (
    <div className="flex shrink-0 items-center gap-2">
      {/* Wishlist — icon-only heart toggle */}
      <button
        type="button"
        onClick={() => toggle(item)}
        aria-pressed={wishlisted}
        aria-label={t("wishlist")}
        title={t("wishlist")}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full border transition active:scale-95",
          wishlisted
            ? "border-rose-200 bg-rose-50 text-rose-500 dark:border-rose-900/50 dark:bg-rose-950/40"
            : "border-neutral-200 text-neutral-500 hover:border-neutral-300 hover:text-rose-500 dark:border-neutral-800 dark:text-neutral-400 dark:hover:border-neutral-700",
        )}
      >
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill={wishlisted ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" />
        </svg>
      </button>

      {/* Compare — labeled pill toggle */}
      {enableCompare && (
        <button
          type="button"
          onClick={() => {
            if (toggleCompare(item) === "full") {
              message.warning(tc("fullWarning"));
            }
          }}
          aria-pressed={compared}
          className={cn(
            "flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium transition active:scale-95",
            compared
              ? "border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
              : "border-neutral-200 text-neutral-700 hover:border-neutral-300 dark:border-neutral-800 dark:text-neutral-300 dark:hover:border-neutral-700",
          )}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M3 7h13l-3-3" />
            <path d="M21 17H8l3 3" />
          </svg>
          <span>{t("compare")}</span>
        </button>
      )}
    </div>
  );
}
