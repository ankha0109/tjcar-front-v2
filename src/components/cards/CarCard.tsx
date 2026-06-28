"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useRef, useState } from "react";
import { CarItem } from "@/types/car";
import { TugrigIcon } from "@/components/icons/TugrigIcon";
import { getGradeInfo } from "@/utils/auctionGrade";
import { AuctionImageSize, withImageSize } from "@/utils/auctionImage";
import { getCountdown } from "@/utils/carCountdown";
import {
  formatEngine,
  formatMileage,
  formatTransmission,
} from "@/utils/carFormat";
import { cn } from "@/utils";
import { CardActions } from "./shared/CardActions";
import { CountdownBadge } from "./shared/CountdownBadge";
import {
  PREMIUM_CARD_RING_CLASSES,
  PremiumBadge,
  isPremiumCar,
} from "./shared/PremiumBadge";
import {
  ColorDot,
  IconCalendar,
  IconEngine,
  IconGauge,
  IconSteering,
  IconTransmission,
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
};

const MAX_SCRUB_IMAGES = 4;

export default function CarCard({ car, imageSize = "card", hidePrice }: Props) {
  const t = useTranslations("car.card");

  const isPremium = isPremiumCar(car.auction?.type);

  const scrubImages = useMemo(
    () =>
      car.images
        .slice(0, MAX_SCRUB_IMAGES)
        .map((u) => (car.source === "japan" ? withImageSize(u, imageSize) : u)),
    [car.images, car.source, imageSize],
  );

  const transmissionLabel = formatTransmission(car.transmission, t);
  const mileageLabel = formatMileage(car.mileageKm, t);
  const engineLabel = formatEngine(car.engineCc);
  const countdown = getCountdown(car.auction?.date);

  const grade = getGradeInfo(car.auction?.grade);
  const gradeDescription = grade ? t(`grade.description.${grade.tier}`) : null;

  const mntPrice = car.price.mnt.toLocaleString();

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border bg-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_48px_-24px_rgba(15,15,15,0.18),0_2px_4px_-2px_rgba(15,15,15,0.06)] dark:bg-neutral-900",
        isPremium
          ? PREMIUM_CARD_RING_CLASSES
          : "border-neutral-200/80 hover:border-neutral-300 dark:border-neutral-800 dark:hover:border-neutral-700",
      )}
    >
      <CarImageScrub
        images={scrubImages}
        alt={`${car.marka} ${car.model}`}
        fallback={t("noImage")}
      >
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-black/55 via-black/10 to-transparent" />
        {isPremium && (
          <PremiumBadge className="absolute left-2.5 top-2.5" />
        )}
        <CardActions />
      </CarImageScrub>

      <div className="flex flex-1 flex-col gap-3 p-3.5">
        {/* Title row + Grade hero badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[14px] font-medium text-neutral-500 dark:text-neutral-100">
              {car.marka}{" "}
              <span className="text-neutral-900 font-semibold dark:text-neutral-400">
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
                "shrink-0 inline-flex h-7 min-w-7 items-center justify-center rounded-lg px-1.5 text-[12px] font-bold tabular-nums leading-none ring-1",
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

        {/* Spec grid */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 rounded-xl bg-neutral-50/70 px-3 py-2 ring-1 ring-neutral-100 dark:bg-neutral-800/60 dark:ring-neutral-800">
          {car.year && (
            <Spec icon={<IconCalendar />} label={t("specs.year")} value={car.year} />
          )}
          {mileageLabel && (
            <Spec icon={<IconGauge />} label={t("specs.mileage")} value={mileageLabel} />
          )}
          {engineLabel && (
            <Spec icon={<IconEngine />} label={t("specs.engine")} value={engineLabel} />
          )}
          {transmissionLabel && (
            <Spec
              icon={<IconTransmission />}
              label={t("specs.transmission")}
              value={transmissionLabel}
            />
          )}
          {car.color && (
            <Spec
              icon={<ColorDot color={car.color} />}
              label={t("specs.color")}
              value={<span className="capitalize">{car.color}</span>}
            />
          )}
          {car.drivetrain && (
            <Spec
              icon={<IconSteering />}
              label={t("specs.drive")}
              value={t(`drive.${car.drivetrain === "LHD" ? "lhd" : "rhd"}`)}
            />
          )}
        </div>

        {/* LOT + Auction date row */}
        {(car.auction?.lot || countdown) && (
          <div className="flex items-center justify-between gap-2 text-[11.5px]">
            {car.auction?.lot ? (
              <span className="text-neutral-500 dark:text-neutral-400">
                {t("lotLabel")}{" "}
                <span className="font-semibold tabular-nums text-neutral-800 dark:text-neutral-200">
                  #{car.auction.lot}
                </span>
              </span>
            ) : (
              <span />
            )}
            <CountdownBadge
              countdown={countdown}
              rawDate={car.auction?.date}
              source={car.source}
            />
          </div>
        )}

        {/* Avg price */}
        {!hidePrice && (
          <div className="mt-auto flex items-center justify-between gap-2 border-t border-dashed border-neutral-200 pt-3 dark:border-neutral-800">
            <p className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
              {t("avgPriceLabel")}
            </p>
            <div className="flex items-center gap-0.5">
              <TugrigIcon
                size={14}
                className="text-neutral-900 dark:text-neutral-100"
              />
              <p className="text-[15px] font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
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
      <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center text-neutral-400 dark:text-neutral-500">
        {icon}
      </span>
      <span className="truncate text-[12px] font-medium text-neutral-900 dark:text-neutral-100">
        {value}
      </span>
    </div>
  );
}

function CarImageScrub({
  images,
  alt,
  fallback,
  children,
}: {
  images: string[];
  alt: string;
  fallback: string;
  children?: React.ReactNode;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hasMany = images.length > 1;

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
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className="relative aspect-4/3 w-full overflow-hidden bg-neutral-100"
    >
      {images.map((src, idx) => (
        <Image
          key={src + idx}
          src={src}
          alt={alt}
          fill
          priority={idx === 0}
          className={cn(
            "object-cover transition-opacity duration-200 ease-out",
            idx === activeIdx ? "opacity-100" : "opacity-0",
          )}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
          unoptimized
        />
      ))}

      {hasMany && (
        <div className="pointer-events-none absolute inset-x-2 top-2 flex gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          {images.map((_, idx) => (
            <span
              key={idx}
              className={cn(
                "h-0.5 flex-1 rounded-full transition-colors duration-150",
                idx === activeIdx ? "bg-white" : "bg-white/35",
              )}
            />
          ))}
        </div>
      )}

      {children}
    </div>
  );
}
