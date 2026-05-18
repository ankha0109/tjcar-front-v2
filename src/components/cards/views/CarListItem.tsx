"use client";

import Image from "next/image";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { CarItem } from "@/types/car";
import { TugrigIcon } from "@/components/icons/TugrigIcon";
import { getGradeInfo } from "@/utils/auctionGrade";
import { withImageSize } from "@/utils/auctionImage";
import { getCountdown } from "@/utils/carCountdown";
import {
  formatEngine,
  formatMileage,
  formatTransmission,
} from "@/utils/carFormat";
import { cn } from "@/utils";
import { CardActions } from "../shared/CardActions";
import { CountdownBadge } from "../shared/CountdownBadge";
import {
  PREMIUM_CARD_RING_CLASSES,
  PremiumBadge,
  isPremiumCar,
} from "../shared/PremiumBadge";
import {
  ColorDot,
  IconCalendar,
  IconEngine,
  IconGauge,
  IconSteering,
  IconTransmission,
} from "../shared/SpecIcons";

export default function CarListItem({ car }: { car: CarItem }) {
  const t = useTranslations("car.card");

  const isPremium = isPremiumCar(car.auction?.type);

  const heroImage = useMemo(() => {
    const src = car.images[0];
    if (!src) return null;
    return car.source === "japan" ? withImageSize(src, "card") : src;
  }, [car.images, car.source]);

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
        "group relative flex flex-col gap-3 overflow-hidden rounded-xl border bg-white p-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_48px_-24px_rgba(15,15,15,0.18),0_2px_4px_-2px_rgba(15,15,15,0.06)] sm:flex-row dark:bg-neutral-900",
        isPremium
          ? PREMIUM_CARD_RING_CLASSES
          : "border-neutral-200/80 hover:border-neutral-300 dark:border-neutral-800 dark:hover:border-neutral-700",
      )}
    >
      <div className="relative aspect-4/3 w-full shrink-0 overflow-hidden rounded-lg bg-neutral-100 sm:w-45 md:w-50 dark:bg-neutral-800">
        {heroImage ? (
          <Image
            src={heroImage}
            alt={`${car.marka} ${car.model}`}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 200px"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-neutral-400">
            {t("noImage")}
          </div>
        )}
        {isPremium && (
          <PremiumBadge size="sm" className="absolute left-2 top-2" />
        )}
        <CardActions />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[15px] font-medium text-neutral-500 dark:text-neutral-100">
              {car.marka}{" "}
              <span className="font-semibold text-neutral-900 dark:text-neutral-400">
                {car.model}
              </span>
            </h3>
            {car.grade && (
              <p className="mt-0.5 truncate text-[12px] text-neutral-500 dark:text-neutral-400">
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

        {/* Inline spec row with icons */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px] text-neutral-700 dark:text-neutral-200">
          {car.year && (
            <SpecInline icon={<IconCalendar />} value={car.year} />
          )}
          {mileageLabel && (
            <SpecInline icon={<IconGauge />} value={mileageLabel} />
          )}
          {engineLabel && (
            <SpecInline icon={<IconEngine />} value={engineLabel} />
          )}
          {transmissionLabel && (
            <SpecInline icon={<IconTransmission />} value={transmissionLabel} />
          )}
          {car.color && (
            <SpecInline
              icon={<ColorDot color={car.color} />}
              value={<span className="capitalize">{car.color}</span>}
            />
          )}
          {car.drivetrain && (
            <SpecInline
              icon={<IconSteering />}
              value={t(`drive.${car.drivetrain === "LHD" ? "lhd" : "rhd"}`)}
            />
          )}
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-neutral-200 pt-2.5 dark:border-neutral-800">
          <div className="flex items-center gap-2 text-[11.5px]">
            {car.auction?.lot && (
              <span className="text-neutral-500 dark:text-neutral-400">
                {t("lotLabel")}{" "}
                <span className="font-semibold tabular-nums text-neutral-800 dark:text-neutral-200">
                  #{car.auction.lot}
                </span>
              </span>
            )}
            <CountdownBadge
              countdown={countdown}
              rawDate={car.auction?.date}
              source={car.source}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
              {t("avgPriceLabel")}
            </span>
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
        </div>
      </div>
    </article>
  );
}

function SpecInline({
  icon,
  value,
}: {
  icon: React.ReactNode;
  value: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center text-neutral-400 dark:text-neutral-500">
        {icon}
      </span>
      <span className="font-medium text-neutral-900 dark:text-neutral-100">
        {value}
      </span>
    </span>
  );
}
