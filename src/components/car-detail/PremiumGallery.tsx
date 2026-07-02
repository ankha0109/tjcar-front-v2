"use client";

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { MINIMUM_BALANCE } from "@/lib/bidConfig";
import { withImageSize } from "@/utils/auctionImage";
import BrandButton from "@/components/ui/BrandButton";
import CarGallery from "./CarGallery";

type Props = {
  images: string[];
  alt: string;
  /** AUCTION_TYPE === "1" — a paid USS (premium) lot. */
  isPremium: boolean;
  /** Lot number, shown on the locked teaser. */
  lot: string;
};

/**
 * Gallery with the USS premium gate. Premium (AUCTION_TYPE "1") lots are a paid
 * source: their photos are only viewable by a signed-in customer whose wallet
 * balance clears {@link MINIMUM_BALANCE}. Otherwise the gallery is replaced with
 * a locked teaser (blurred first frame + how to unlock). The backend already
 * swaps in the premium images server-side for qualifying users, so an unlocked
 * premium lot just gets a "handle with care" banner above the normal gallery.
 */
export default function PremiumGallery({ images, alt, isPremium, lot }: Props) {
  const t = useTranslations("carDetail");
  const { status } = useSession();
  const { balance } = useWalletBalance();
  const pathname = usePathname();

  const deposited = status === "authenticated" && balance >= MINIMUM_BALANCE;
  const locked = isPremium && !deposited;

  if (locked) {
    const teaser = images[0] ? withImageSize(images[0], "card") : undefined;
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
            LOT: {lot || "—"} · {t("gallery.premiumContactLabel")}{" "}
            {t("gallery.premiumPhone")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {isPremium && (
        <div className="mx-3 flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 lg:mx-0 dark:border-emerald-900/50 dark:bg-emerald-950/30">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <path d="m9 11 3 3L22 4" />
          </svg>
          <span className="text-[12px] leading-snug text-emerald-700 dark:text-emerald-300">
            {t("gallery.premiumBanner")}
          </span>
        </div>
      )}
      <CarGallery images={images} alt={alt} />
    </div>
  );
}
