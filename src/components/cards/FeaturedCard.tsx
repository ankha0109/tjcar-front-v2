"use client";

import { Rate } from "antd";
import Image from "next/image";
import dayjs from "dayjs";
import { useTranslations } from "next-intl";
import { FeaturedCar } from "@/types/featured";
import { TugrigIcon } from "@/components/icons/TugrigIcon";
import { cn } from "@/utils";

type Props = {
  car: FeaturedCar;
};

const COLOR_SWATCH: Record<string, { bg: string; ring?: boolean }> = {
  // Mongolian
  цагаан: { bg: "#ffffff", ring: true },
  хар: { bg: "#161616" },
  саарал: { bg: "#7c8088" },
  мөнгөлөг: { bg: "#cdd2d8" },
  цэнхэр: { bg: "#2858a7" },
  улаан: { bg: "#c8302d" },
  ногоон: { bg: "#2c7a4b" },
  шар: { bg: "#e7bc1a" },
  бор: { bg: "#6e4a2c" },
  ягаан: { bg: "#e08aa5" },
  // English
  white: { bg: "#ffffff", ring: true },
  black: { bg: "#161616" },
  gray: { bg: "#7c8088" },
  grey: { bg: "#7c8088" },
  silver: { bg: "#cdd2d8" },
  blue: { bg: "#2858a7" },
  red: { bg: "#c8302d" },
  green: { bg: "#2c7a4b" },
  yellow: { bg: "#e7bc1a" },
  brown: { bg: "#6e4a2c" },
  pink: { bg: "#e08aa5" },
  // Russian (auctions often label in Russian)
  белый: { bg: "#ffffff", ring: true },
  черный: { bg: "#161616" },
  серый: { bg: "#7c8088" },
  серебристый: { bg: "#cdd2d8" },
  синий: { bg: "#2858a7" },
  красный: { bg: "#c8302d" },
  зеленый: { bg: "#2c7a4b" },
  желтый: { bg: "#e7bc1a" },
  коричневый: { bg: "#6e4a2c" },
};

function getColorSwatch(name: string) {
  const key = (name || "").trim().toLowerCase();
  return COLOR_SWATCH[key] ?? { bg: "#9ca3af" };
}

type CountdownResult =
  | { kind: "today"; urgent: true; passed: false }
  | { kind: "tomorrow"; urgent: true; passed: false }
  | { kind: "days"; days: number; urgent: boolean; passed: false }
  | { kind: "date"; label: string; urgent: false; passed: true }
  | null;

function getCountdown(dateStr: string): CountdownResult {
  if (!dateStr) return null;
  const d = dayjs(dateStr);
  if (!d.isValid()) return null;
  const days = d.startOf("day").diff(dayjs().startOf("day"), "day");
  if (days < 0) return { kind: "date", label: d.format("YYYY/MM/DD"), urgent: false, passed: true };
  if (days === 0) return { kind: "today", urgent: true, passed: false };
  if (days === 1) return { kind: "tomorrow", urgent: true, passed: false };
  if (days <= 3) return { kind: "days", days, urgent: true, passed: false };
  return { kind: "days", days, urgent: false, passed: false };
}

export default function FeaturedCard({ car }: Props) {
  const t = useTranslations("featured.card");

  const images = car.IMAGES?.split("#").filter(Boolean) ?? [];
  const firstImage = images[0];
  const photoCount = images.length;

  const startPrice = Number(car.START || 0).toLocaleString();
  const mntPrice = (car.PRICE_MNT ?? 0).toLocaleString();
  const transmission =
    car.KPP === "MT" ? t("transmission.manual") :
    car.KPP && ["AT", "FAT", "IAT"].includes(car.KPP) ? t("transmission.auto") :
    car.KPP;
  const mileageKm = Number(car.MILEAGE || 0).toLocaleString();
  const engine = car.ENG_V ? `${(Number(car.ENG_V) / 100).toFixed(1)}L` : "—";
  const rate = Number(car.RATE) || 0;
  const countdown = getCountdown(car.AUCTION_DATE);
  const countdownLabel = countdown && (
    countdown.kind === "today" ? t("today") :
    countdown.kind === "tomorrow" ? t("tomorrow") :
    countdown.kind === "days" ? t("daysLeft", { days: countdown.days }) :
    countdown.label
  );
  const colorSwatch = getColorSwatch(car.COLOR);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-neutral-200/80 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-[0_24px_48px_-24px_rgba(15,15,15,0.18),0_2px_4px_-2px_rgba(15,15,15,0.06)]">
      {/* Image */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-neutral-100">
        {firstImage ? (
          <Image
            src={firstImage}
            alt={`${car.MARKA_NAME} ${car.MODEL_NAME}`}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-neutral-400">
            {t("noImage")}
          </div>
        )}

        {/* Bottom legibility gradient */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-black/55 via-black/10 to-transparent" />

        {/* Top-left: auction name */}
        <div className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-white/85 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-neutral-900 shadow-sm backdrop-blur-md ring-1 ring-black/5">
          {car.AUCTION}
        </div>

        {/* Top-right: lot */}
        <div className="absolute right-2.5 top-2.5 rounded-full bg-black/55 px-2 py-1 text-[10.5px] font-medium tabular-nums text-white backdrop-blur-md ring-1 ring-white/10">
          #{car.LOT}
        </div>

        {/* Bottom-left: countdown */}
        {countdown && (
          <div
            className={cn(
              "absolute bottom-2.5 left-2.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-tight ring-1 backdrop-blur-md",
              countdown.passed
                ? "bg-white/85 text-neutral-700 ring-black/5"
                : countdown.urgent
                  ? "bg-primary/95 text-white ring-white/20"
                  : "bg-white/85 text-neutral-900 ring-black/5",
            )}
          >
            {!countdown.passed && (
              <span className="relative flex h-1.5 w-1.5">
                <span
                  className={cn(
                    "absolute inline-flex h-full w-full rounded-full opacity-75",
                    countdown.urgent ? "animate-ping bg-white" : "bg-emerald-500",
                  )}
                />
                <span
                  className={cn(
                    "relative inline-flex h-1.5 w-1.5 rounded-full",
                    countdown.urgent ? "bg-white" : "bg-emerald-500",
                  )}
                />
              </span>
            )}
            {countdownLabel}
          </div>
        )}

        {/* Bottom-right: photo count */}
        {photoCount > 1 && (
          <div className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[10.5px] font-medium text-white backdrop-blur-md">
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
            {photoCount}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-3.5">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-[14px] font-semibold tracking-tight text-neutral-900">
              {car.MARKA_NAME}{" "}
              <span className="text-neutral-500 font-medium">
                {car.MODEL_NAME}
              </span>
            </h3>
            {car.GRADE && (
              <p className="mt-0.5 truncate text-[11.5px] text-neutral-500">
                {car.GRADE}
              </p>
            )}
          </div>
          {rate > 0 && (
            <div className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-1.5 py-0.5 ring-1 ring-amber-200/60">
              <Rate
                disabled
                value={rate}
                count={5}
                allowHalf
                style={{ fontSize: 10 }}
                className="text-amber-500!"
              />
            </div>
          )}
        </div>

        {/* Spec grid */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-xl bg-neutral-50/70 px-3 py-2.5 ring-1 ring-neutral-100">
          <Spec label={t("specs.year")} value={car.YEAR} />
          <Spec label={t("specs.mileage")} value={`${mileageKm} ${t("mileageUnit")}`} />
          <Spec label={t("specs.engine")} value={engine} />
          <Spec label={t("specs.transmission")} value={transmission} />
          <Spec
            label={t("specs.color")}
            value={
              <span className="inline-flex items-center gap-1.5 capitalize">
                <span
                  className={cn(
                    "inline-block h-2.5 w-2.5 rounded-full",
                    colorSwatch.ring && "ring-1 ring-neutral-300",
                  )}
                  style={{ backgroundColor: colorSwatch.bg }}
                />
                {car.COLOR || "—"}
              </span>
            }
          />
          <Spec
            label={t("specs.rate")}
            value={rate > 0 ? `${rate.toFixed(1)} / 5` : "—"}
          />
        </div>

        {/* Price */}
        <div className="mt-auto flex items-end justify-between gap-2 border-t border-dashed border-neutral-200 pt-3">
          <div className="min-w-0">
            <p className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-neutral-400">
              {t("startPriceLabel")}
            </p>
            <p className="text-[12.5px] font-semibold tabular-nums text-neutral-600">
              ¥{startPrice}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-neutral-400">
              {t("mntPriceLabel")}
            </p>
            <div className="flex items-center justify-end gap-0.5">
              <TugrigIcon size={14} className="text-neutral-900" />
              <p className="text-[15px] font-bold tabular-nums tracking-tight text-neutral-900">
                {mntPrice}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action shimmer on hover (caret arrow that slides in from right) */}
      <span className="pointer-events-none absolute right-3.5 top-3.5 inline-flex h-7 w-7 translate-x-2 items-center justify-center rounded-full bg-neutral-900 text-white opacity-0 shadow-lg transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="7" x2="17" y1="17" y2="7" />
          <polyline points="7 7 17 7 17 17" />
        </svg>
      </span>
    </article>
  );
}

function Spec({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-neutral-400">
        {label}
      </p>
      <p className="truncate text-[12px] font-medium text-neutral-900">
        {value}
      </p>
    </div>
  );
}
