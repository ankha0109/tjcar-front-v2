"use client";

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { usePremiumImages } from "@/hooks/usePremiumImages";
import { MINIMUM_BALANCE } from "@/lib/bidConfig";
import { withImageSize } from "@/utils/auctionImage";
import BrandButton from "@/components/ui/BrandButton";
import CarGallery from "./CarGallery";

type Props = {
  images: string[];
  alt: string;
  /** AUCTION_TYPE === "1" — a paid USS (premium) lot. */
  isPremium: boolean;
  /** Human auction lot number — shown on the locked teaser, sent as `lotNumber`. */
  lot: string;
  /** The lot's opaque `ID` — what the scrape is keyed by. NOT the lot number. */
  auctionId: string;
  /** Completed premium urls already delivered with the lot, if any. */
  premiumImages: string[] | null;
  make: string;
  model: string;
  year: string;
  mileage: string;
  modelType: string;
  gradeOrigin: string;
};

/** The scraper takes numbers; the lot fixture stringifies everything. */
function num(value: string): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

/**
 * Gallery with the USS premium gate. Premium (AUCTION_TYPE "1") lots are a paid
 * source: their photos are only viewable by a signed-in customer whose wallet
 * balance clears {@link MINIMUM_BALANCE}. Otherwise the gallery is replaced with
 * a locked teaser (blurred first frame + how to unlock).
 *
 * For a customer who IS through the gate, the extra premium photo set is fetched
 * on mount — no button, matching v1 — and prepended to the carousel when it
 * lands. While that runs, the gallery is replaced by a waiting panel built from
 * the same shell as the locked teaser: a USS lot without its premium set carries
 * only a couple of thumbnail-sized stills, and blowing those up to full width
 * looks worse than a deliberate placeholder. A FAILED scrape falls back to the
 * ordinary gallery plus a strip, so the customer is never left with nothing.
 */
export default function PremiumGallery({
  images,
  alt,
  isPremium,
  lot,
  auctionId,
  premiumImages,
  make,
  model,
  year,
  mileage,
  modelType,
  gradeOrigin,
}: Props) {
  const t = useTranslations("carDetail");
  const { status } = useSession();
  const { balance } = useWalletBalance();
  const pathname = usePathname();

  const deposited = status === "authenticated" && balance >= MINIMUM_BALANCE;
  const locked = isPremium && !deposited;

  const premium = usePremiumImages({
    enabled: isPremium && !locked,
    auctionId,
    seed: premiumImages,
    filters: {
      make,
      model,
      yearStart: num(year),
      yearEnd: num(year),
      mileageStart: num(mileage),
      mileageEnd: num(mileage),
      modelType: modelType || undefined,
      gradeOrigin: gradeOrigin || undefined,
      lotNumber: lot || undefined,
    },
  });

  // Both full-bleed panels below sit on the same darkened, blurred first frame.
  const teaser = images[0] ? withImageSize(images[0], "card") : undefined;

  if (locked) {
    return (
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-900 lg:rounded-2xl">
        {teaser && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={teaser}
            alt=""
            aria-hidden
            className="h-full w-full scale-110 object-cover opacity-25 blur-lg"
          />
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </span>
          <h3 className="text-[15px] font-semibold text-white">
            {t("gallery.premiumLockedTitle")}
          </h3>
          <p className="max-w-md text-[13px] leading-relaxed text-neutral-300">
            {t("gallery.premiumLockedBody")}
          </p>
          <div className="mt-1 flex items-center gap-2">
            {status !== "authenticated" ? (
              <Link
                href={`/auth/login?callbackUrl=${encodeURIComponent(pathname)}`}
              >
                <BrandButton size="middle">{t("bid.login")}</BrandButton>
              </Link>
            ) : (
              <Link href="/dashboard">
                <BrandButton size="middle">{t("bid.contact")}</BrandButton>
              </Link>
            )}
          </div>
          <p className="text-[12px] text-neutral-400">
            LOT: {lot || "-"} · {t("gallery.premiumContactLabel")}{" "}
            {t("gallery.premiumPhone")}
          </p>
        </div>
      </div>
    );
  }

  // The waiting panel takes the gallery's place rather than sitting above it:
  // the stills a USS lot ships without its premium set are thumbnail-sized, and
  // stretching those across the column reads as a broken gallery.
  if (isPremium && premium.status === "loading") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-900 lg:rounded-2xl"
      >
        {teaser && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={teaser}
            alt=""
            aria-hidden
            className="h-full w-full scale-110 object-cover opacity-25 blur-lg"
          />
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20">
            {/* Slow halo behind the spinner — reads as "still working" from across
                the room, where a 16px spinner alone does not. */}
            <span className="absolute inset-0 animate-ping rounded-full bg-white/10" aria-hidden />
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="relative animate-spin" aria-hidden>
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </span>
          <h3 className="text-[15px] font-semibold text-white">
            {t("gallery.premiumLoading")}
          </h3>
          <p className="max-w-md text-[13px] leading-relaxed text-neutral-300">
            {t("gallery.premiumLoadingBody")}
          </p>
          <p className="text-[12px] text-neutral-400">LOT: {lot || "-"}</p>
        </div>
      </div>
    );
  }

  // Premium photos lead: they are the reason a customer paid to see this lot.
  const allImages = [...premium.images, ...images];

  return (
    <div className="flex flex-col gap-3">
      {isPremium && premium.status === "failed" && (
        <div role="status" aria-live="polite" className="mx-3 flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 lg:mx-0 dark:border-red-900/50 dark:bg-red-950/30">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-red-600 dark:text-red-400" aria-hidden>
            <circle cx="12" cy="12" r="10" />
            <path d="m15 9-6 6M9 9l6 6" />
          </svg>
          <span className="text-[12px] leading-snug text-red-700 dark:text-red-300">
            {t("gallery.premiumFailed")}
          </span>
        </div>
      )}

      {isPremium && premium.status === "completed" && (
        <div role="status" aria-live="polite" className="mx-3 flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 lg:mx-0 dark:border-emerald-900/50 dark:bg-emerald-950/30">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <path d="m9 11 3 3L22 4" />
          </svg>
          <span className="text-[12px] leading-snug text-emerald-700 dark:text-emerald-300">
            {t("gallery.premiumBanner")}
          </span>
        </div>
      )}

      {/*
        Remount when the premium set lands. `CarGallery` holds `selectedIndex`
        and a `visited` set of indices, and embla keeps its numeric index
        across a reInit — prepending N slides mid-view would silently slide the
        customer from auction photo 3 to premium photo 3 and leave `visited`
        pointing at the wrong images. Starting over lands on the first premium
        photo, which is what they were waiting for anyway.
      */}
      {/*
        `stripSize="thumb"` (AJES `&h=50`, ~4 KB) rather than the default
        `card` (`&w=320`, ~33 KB): the strip renders 64px wide on phones and
        ~110px in the desktop grid, and a USS lot brings dozens of photos, so
        the strip alone was the heaviest thing on the page. Japan only — Korea
        lots keep the `card` strip.
      */}
      <CarGallery
        key={premium.images.length > 0 ? "premium" : "base"}
        images={allImages}
        alt={alt}
        stripSize="thumb"
      />
    </div>
  );
}
