"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import CarCard from "@/components/cards/CarCard";
import { useWishlist } from "@/hooks/useWishlist";
import { wishlistItemToCarItem } from "@/lib/wishlist";
import { wishlistHref, wishlistKey } from "@/types/wishlist";
import { getCountdown } from "@/utils/carCountdown";

/**
 * The saved-car list itself — guests read the localStorage store, signed-in
 * customers the DB, both through {@link useWishlist}. Reuses the listing
 * `CarCard`; the card's own heart doubles as the remove control. Items whose
 * auction date has passed are marked "ended" but kept, since the auction may
 * already be gone upstream.
 *
 * Split out of the route so `wishlist/page.tsx` stays a server component: the
 * page owns metadata, the locale and the heading, this owns everything that
 * depends on the wishlist store.
 */
export default function WishlistBoard() {
  const t = useTranslations("wishlist");
  const { items, count, isReady, isAuthenticated } = useWishlist();

  return (
    <>
      {!isAuthenticated && count > 0 && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
          {t("guestHint")}{" "}
          <Link
            href="/auth/login"
            className="font-semibold underline underline-offset-2"
          >
            {t("guestHintCta")}
          </Link>
        </div>
      )}

      {count === 0 ? (
        isReady ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-neutral-200 py-20 text-center dark:border-neutral-800">
            <p className="text-base font-medium text-neutral-700 dark:text-neutral-300">
              {t("empty.title")}
            </p>
            <p className="max-w-sm text-sm text-neutral-500 dark:text-neutral-400">
              {t("empty.description")}
            </p>
            <Link
              href="/japan"
              className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              {t("empty.cta")}
            </Link>
          </div>
        ) : null
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => {
            const ended = getCountdown(item.auctionDate)?.passed ?? false;
            return (
              <Link
                key={wishlistKey(item.source, item.id)}
                href={wishlistHref(item.source, item.id)}
                className="relative block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                {ended && (
                  <span className="absolute left-2.5 top-2.5 z-10 rounded-full bg-neutral-900/85 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur">
                    {t("ended")}
                  </span>
                )}
                <div className={ended ? "opacity-70" : undefined}>
                  <CarCard
                    car={wishlistItemToCarItem(item)}
                    hidePrice={item.priceMnt === 0}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}

/**
 * The line under the heading. Lives in the page's `<header>`, next to a
 * server-rendered `<h1>`, so it is its own component rather than part of
 * {@link WishlistBoard} — `useWishlist` is store-backed, so the extra consumer
 * costs nothing and never disagrees with the list below.
 */
export function WishlistSummary() {
  const t = useTranslations("wishlist");
  const { count } = useWishlist();

  return (
    <p className="text-sm text-neutral-500 dark:text-neutral-400">
      {count > 0 ? t("count", { count }) : t("description")}
    </p>
  );
}
