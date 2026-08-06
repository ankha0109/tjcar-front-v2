"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useRef, useState } from "react";
import { CarItem } from "@/types/car";
import { TugrigIcon } from "@/components/icons/TugrigIcon";
import { getGradeInfo } from "@/utils/auctionGrade";
import { AuctionImageSize, withImageSize } from "@/utils/auctionImage";
import { getAuctionMoment } from "@/utils/auctionMoment";
import { formatEngine, formatMileage } from "@/utils/carFormat";
import { cn } from "@/utils";
import { CardActions } from "./shared/CardActions";
import { CountdownBadge } from "./shared/CountdownBadge";
import {
  PREMIUM_CARD_BORDER_CLASSES,
  PremiumBadge,
  isPremiumCar,
} from "./shared/PremiumBadge";
import { defaultPriceLabelKey } from "./shared/priceLabel";
import {
  ColorDot,
  EngineIcon,
  MileageIcon,
  YearIcon,
} from "./shared/SpecIcons";

type Props = {
  car: CarItem;
  /**
   * Image size variant for Japanese auction CDN.
   * - "card" (default): &w=320, suited to the card width
   * - "thumb": &h=50, tiny preview
   * - "original": no size param
   */
  imageSize?: AuctionImageSize;
  /** Hide the price footer (e.g. auction listing where MNT price is unavailable). */
  hidePrice?: boolean;
  /** Hide the compare toggle (cards whose `source` mislabels the id's upstream). */
  disableCompare?: boolean;
  /**
   * Overrides the price caption. Japanese auction cards show a comparable-sales
   * average, so that is the default; Korean listings and in-stock cars carry a
   * real asking price.
   */
  priceLabel?: string;
  /**
   * Status pill over the photo, top-left. Only in-stock cars use it — the slot
   * is otherwise the premium badge's, and stock cars are never premium.
   */
  badge?: React.ReactNode;
  /**
   * Preload the cover photo. Only the handful of cards that can hold the LCP —
   * the first row of a listing grid — should set it: `priority` emits a
   * `<link rel=preload>` into `<head>`, so a whole 40-card page of them fires
   * 40 highest-priority image fetches before the browser knows what is even on
   * screen. Everything else stays `loading="lazy"`.
   */
  imagePriority?: boolean;
};

const MAX_SCRUB_IMAGES = 4;

/** Grid cell width: full-bleed on the two-column phone card, 320px at `xl`. */
const SCRUB_SIZES = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px";

/**
 * How many leading cards of a listing grid get `imagePriority`. One `xl` row —
 * two rows on the two-column phone grid — which is as far as the fold reaches
 * and as far as preloading pays for itself.
 */
export const PRIORITY_CARDS = 4;

export default function CarCard({
  car,
  imageSize = "card",
  hidePrice,
  disableCompare,
  priceLabel,
  badge,
  imagePriority = false,
}: Props) {
  const t = useTranslations("car.card");

  const isPremium = isPremiumCar(car.auction?.type);

  const scrubImages = useMemo(
    () =>
      car.images
        .slice(0, MAX_SCRUB_IMAGES)
        .map((u) => (car.source === "japan" ? withImageSize(u, imageSize) : u)),
    [car.images, car.source, imageSize],
  );

  const mileageLabel = formatMileage(car.mileageKm, t);
  const engineLabel = formatEngine(car.engineCc);
  const moment = getAuctionMoment(car.auction?.date, car.source);
  // Wishlist snapshots only carry the year, so the block can end up empty.
  const hasSpecs = Boolean(
    car.year || mileageLabel || engineLabel || car.color,
  );

  // AJES shouts colours ("PEARL WHITE"); title case is both calmer and narrow
  // enough to survive the half-width cell. Hand-typed colours — our own stock,
  // written in Mongolian — already carry their casing, and `capitalize` would
  // turn "Хар хөх" into "Хар Хөх", so only all-caps values get re-cased.
  const shoutedColor = car.color ? !/\p{Ll}/u.test(car.color) : false;

  const grade = getGradeInfo(car.auction?.grade);
  const gradeDescription = grade ? t(`grade.description.${grade.tier}`) : null;

  const mntPrice = car.price.mnt.toLocaleString();

  return (
    <article
      className={cn(
        // `h-full` so cards sharing a grid row line up: the grid stretches the
        // wrapping <Link>, and `mt-auto` on the meta row spreads the difference.
        "group relative flex h-full flex-col overflow-hidden rounded-xl border bg-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_48px_-24px_rgba(15,15,15,0.18),0_2px_4px_-2px_rgba(15,15,15,0.06)] dark:bg-neutral-900",
        isPremium
          ? PREMIUM_CARD_BORDER_CLASSES
          : "border-neutral-200/80 hover:border-neutral-300 dark:border-neutral-800 dark:hover:border-neutral-700",
      )}
    >
      <CarImageScrub
        images={scrubImages}
        alt={`${car.marka} ${car.model}`}
        fallback={t("noImage")}
        priority={imagePriority}
      >
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-black/55 via-black/10 to-transparent" />
        {isPremium && <PremiumBadge className="absolute left-2.5 top-2.5" />}
        {badge && <div className="absolute left-2.5 top-2.5 z-10">{badge}</div>}
      </CarImageScrub>

      <div className="flex flex-1 flex-col gap-2.5 p-3 sm:gap-3 sm:p-3.5">
        {/* Title row + Grade hero badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[13px] font-medium text-neutral-500 sm:text-[14px] dark:text-neutral-400">
              {car.marka}{" "}
              <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                {car.model}
              </span>
            </h3>
            {car.grade && (
              <p className="mt-0.5 truncate text-[11.5px] text-neutral-500 dark:text-neutral-400">
                {car.grade}
              </p>
            )}
          </div>
          {grade && (
            <span
              className={cn(
                "shrink-0 inline-flex h-7 min-w-7 items-center justify-center rounded-lg px-1.5 text-[12px] font-bold leading-none ring-1",
                grade.classes.badgeBg,
                grade.classes.badgeRing,
                grade.classes.badgeText,
              )}
              title={gradeDescription ?? undefined}
            >
              {grade.symbol}
            </span>
          )}
        </div>

        {/* Specs — year / mileage / engine / colour. No panel or padding of its
            own; on a two-column mobile card that chrome cost more height than
            the values themselves. */}
        {hasSpecs && (
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 sm:gap-y-1.5">
            {car.year && (
              <Spec
                icon={<YearIcon size={15} />}
                label={t("specs.year")}
                value={car.year}
              />
            )}
            {mileageLabel && (
              <Spec
                icon={<MileageIcon size={15} />}
                label={t("specs.mileage")}
                value={mileageLabel}
              />
            )}
            {engineLabel && (
              <Spec
                icon={<EngineIcon size={15} />}
                label={t("specs.engine")}
                value={engineLabel}
              />
            )}
            {car.color && (
              <Spec
                icon={<ColorDot color={car.color} size={13} />}
                label={t("specs.color")}
                value={
                  shoutedColor ? (
                    <span className="capitalize">{car.color.toLowerCase()}</span>
                  ) : (
                    car.color
                  )
                }
              />
            )}
          </div>
        )}

        {/*
         * LOT + auction slot, with the actions trailing. `flex-wrap` lets the
         * buttons drop to their own line on the narrow mobile card; on hover
         * devices they leave the flow for the photo and the row stays single.
         */}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 text-[11.5px]">
          {car.auction?.lot ? (
            <span className="truncate text-neutral-500 dark:text-neutral-400">
              {/* Dropping the word keeps the lot and the auction pill on one
                  line at the two-column mobile width. */}
              <span className="hidden sm:inline">{t("lotLabel")} </span>
              <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                #{car.auction.lot}
              </span>
            </span>
          ) : (
            <span />
          )}
          <CountdownBadge moment={moment} />
          <CardActions
            car={car}
            disableCompare={disableCompare}
            absolute={false}
            className="ml-auto shrink-0 pointer-fine:absolute pointer-fine:right-2.5 pointer-fine:top-2.5 pointer-fine:z-10"
          />
        </div>

        {/* Price — stacked below `sm`, where a nine-digit MNT figure and the
            label together overflow the two-column card. Korea keeps the stack at
            every width: "Солонгос дахь үнэ" is half again as long as the auction
            caption and never shares a row with the figure. */}
        {!hidePrice && (
          <div
            className={cn(
              "flex flex-col items-start gap-0.5 border-t border-dashed border-neutral-200 pt-2.5 sm:pt-3 dark:border-neutral-800",
              car.source !== "korea" &&
                "sm:flex-row sm:items-center sm:justify-between sm:gap-2",
            )}
          >
            <p className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
              {priceLabel ?? t(defaultPriceLabelKey(car.source))}
            </p>
            <div className="flex items-center gap-0.5">
              <TugrigIcon
                size={14}
                className="shrink-0 text-neutral-900 dark:text-neutral-100"
              />
              <p className="text-[14px] font-bold text-neutral-900 sm:text-[15px] dark:text-neutral-100">
                {mntPrice}
              </p>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

function Spec({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div
      className="flex min-w-0 items-center gap-1.5 py-0.5"
      title={typeof value === "string" ? `${label}: ${value}` : label}
    >
      {/* The icon is a `sm:`-and-up affordance: on the two-column mobile card a
          cell is ~68px, and 20px of icon pushes "125,000 км" into an ellipsis. */}
      <span className="hidden h-4 w-4 shrink-0 items-center justify-center text-neutral-400 sm:inline-flex dark:text-neutral-500">
        {icon}
      </span>
      <span className="truncate text-[11.5px] font-medium text-neutral-900 sm:text-[12px] dark:text-neutral-100">
        {value}
      </span>
    </div>
  );
}

/**
 * The cover photo, with the rest of the lot's shots revealed by sweeping the
 * pointer across it.
 *
 * Only the cover is ever in the DOM up front, and it is `loading="lazy"` unless
 * the card claims `priority` — a 40-card listing otherwise fetched every photo
 * of every lot before the visitor had scrolled past the first row. The scrub
 * frames mount on the first real hover, which is also the first moment they can
 * be seen: a touch device never hovers, so it never pays for them at all.
 */
function CarImageScrub({
  images,
  alt,
  fallback,
  children,
  priority = false,
}: {
  images: string[];
  alt: string;
  fallback: string;
  children?: React.ReactNode;
  priority?: boolean;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [armed, setArmed] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hasMany = images.length > 1;

  // `pointerType` gates out the synthetic enter a tap fires: on a phone the
  // scrub is unreachable, so mounting its images there is pure waste.
  const handleEnter = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (hasMany && e.pointerType === "mouse") setArmed(true);
    },
    [hasMany],
  );

  const handleMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!hasMany) return;
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const ratio = Math.max(0, Math.min(0.9999, x / rect.width));
      const idx = Math.floor(ratio * images.length);
      if (idx !== activeIdx) setActiveIdx(idx);
    },
    [hasMany, images.length, activeIdx],
  );

  const handleLeave = useCallback(() => {
    if (hasMany) setActiveIdx(0);
  }, [hasMany]);

  if (images.length === 0) {
    return (
      <div className="relative aspect-4/3 w-full overflow-hidden bg-neutral-100">
        <div className="flex h-full items-center justify-center text-xs text-neutral-400">
          {fallback}
        </div>
        {children}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onPointerEnter={handleEnter}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className="relative aspect-4/3 w-full overflow-hidden bg-neutral-100"
    >
      {/* The cover never fades out — it is the backdrop the scrub frames stack
          over, so a frame still in flight shows the cover rather than a hole. */}
      <Image
        src={images[0]}
        alt={alt}
        fill
        priority={priority}
        className="object-cover"
        sizes={SCRUB_SIZES}
        unoptimized
      />
      {armed &&
        images.slice(1).map((src, i) => (
          <Image
            key={src + i}
            src={src}
            alt=""
            fill
            className={cn(
              "object-cover transition-opacity duration-200 ease-out",
              i + 1 === activeIdx ? "opacity-100" : "opacity-0",
            )}
            sizes={SCRUB_SIZES}
            unoptimized
          />
        ))}

      {/* Scrub position. Sits along the bottom — the top corners belong to the
          premium badge and the action buttons — and needs `z-10` to clear the
          bottom gradient, which `children` paints after it. */}
      {hasMany && (
        <div className="pointer-events-none absolute inset-x-2 bottom-2 z-10 flex gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          {images.map((_, idx) => (
            <span
              key={idx}
              className={cn(
                "h-0.5 flex-1 rounded-full transition-colors duration-150",
                idx === activeIdx ? "bg-white" : "bg-white/40",
              )}
            />
          ))}
        </div>
      )}

      {children}
    </div>
  );
}
