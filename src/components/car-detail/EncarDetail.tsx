import { getTranslations } from "next-intl/server";
import CarGallery from "./CarGallery";
import CarActionButtons from "./CarActionButtons";
import KoreaDetailExtras from "./KoreaDetailExtras";
import KoreaOptionsPanel from "./KoreaOptionsPanel";
import { parseImages, type CarFixture, carTitle } from "@/lib/carFixtures";
import { wishlistItemFromFixture } from "@/lib/wishlist";
import type { CarSource } from "@/types/car";
import type {
  KoreaInspection,
  KoreaInsurance,
  KoreaOptionGroup,
} from "@/types/korea";
import { colorNameKey, getColorSwatch } from "@/utils/carColor";
import { formatMileage, formatTransmission } from "@/utils/carFormat";

type Props = {
  car: CarFixture;
  /** Wishlist source for this car (stock/Korea by default). */
  source?: CarSource;
  /** MNT price for the wishlist snapshot (the fixture has no MNT field). */
  priceMnt?: number;
  /**
   * Show the compare pill. Only pages whose id the compare endpoint can
   * re-fetch upstream set this (`/korea/[id]`); local stock ids would 404.
   */
  enableCompare?: boolean;
  /**
   * Encar listing facts that don't fit the AJES-shaped fixture: fixed-price
   * money, the extra spec fields, grouped options and the government
   * performance inspection.
   */
  encar?: {
    priceKrw: number | null;
    priceMnt: number | null;
    /** New-car (factory) KRW price, shown as context under the asking price. */
    newPriceKrw?: number | null;
    officialUrl: string | null;
    /** Normalized backend value: petrol/diesel/hybrid/electric/hydrogen/lpg. */
    fuelType?: string | null;
    seatCount?: number | null;
    /** YYYYMM first-registration month. */
    yearMonth?: string | null;
    options?: KoreaOptionGroup[];
    inspection?: KoreaInspection | null;
    insurance?: KoreaInsurance | null;
  };
};

/** `carDetail.fuel.*` keys that exist in the locale files (backend FUEL_MAP). */
const FUEL_KEYS = new Set([
  "petrol",
  "diesel",
  "hybrid",
  "electric",
  "hydrogen",
  "lpg",
]);

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

/** "202012" → "2020.12" */
function formatYearMonth(ym: string) {
  return /^\d{6}$/.test(ym) ? `${ym.slice(0, 4)}.${ym.slice(4)}` : ym;
}

export default async function EncarDetail({
  car,
  source = "korea",
  priceMnt = 0,
  enableCompare,
  encar,
}: Props) {
  const t = await getTranslations("carDetail");
  const tFmt = await getTranslations("car.card");

  const title = carTitle(car);
  // Encar photos are all car photos — no auction evaluation sheet to split off.
  const images = parseImages(car.IMAGES);
  const colorKey = car.COLOR ? colorNameKey(car.COLOR) : null;
  const colorLabel = colorKey ? t(`colors.${colorKey}`) : car.COLOR || undefined;
  const colorSwatch = car.COLOR ? getColorSwatch(car.COLOR) : null;
  const mileage = formatMileage(Number(car.MILEAGE) || undefined, tFmt);
  // Encar displacement is plain cc (2998 → "2,998cc"); formatEngine expects the
  // AJES unit, so don't reuse it here.
  const engV = Number(car.ENG_V) || 0;
  const engine = engV > 0 ? `${formatNumber(engV)}cc` : undefined;
  const transmission = formatTransmission(car.KPP, tFmt);
  const fuelType = encar?.fuelType || undefined;
  const fuel = fuelType
    ? FUEL_KEYS.has(fuelType)
      ? t(`fuel.${fuelType}`)
      : fuelType
    : undefined;
  const priceMain = encar?.priceMnt || null;
  const priceSub = encar?.priceKrw || null;

  const quickSpecs: Array<{ label: string; value: string | undefined }> = [
    { label: t("specs.year"), value: car.YEAR },
    { label: t("specs.mileage"), value: mileage },
    { label: t("specs.engine"), value: engine },
    { label: t("specs.fuel"), value: fuel },
    { label: t("specs.transmission"), value: transmission },
    {
      label: t("specs.seats"),
      value: encar?.seatCount ? String(encar.seatCount) : undefined,
    },
  ];

  const detailedRows: Array<{ label: string; value: string }> = [
    { label: t("specs.grade"), value: car.GRADE || "—" },
    { label: t("specs.bodyType"), value: car.KUZOV || "—" },
    { label: t("specs.color"), value: colorLabel || "—" },
    {
      label: t("specs.regMonth"),
      value: encar?.yearMonth ? formatYearMonth(encar.yearMonth) : "—",
    },
  ];

  return (
    <article className="mx-auto w-full max-w-7xl px-0 lg:px-6 lg:py-8">
      <div className="lg:grid lg:grid-cols-[1.4fr_1fr] lg:items-start lg:gap-10">
        {/* Gallery — full-bleed on mobile (no side padding) */}
        <div className="lg:order-1">
          <div className="pt-2 lg:p-0">
            <CarGallery images={images} alt={title} sizeVariants={!encar} />
          </div>
          {/* Options live under the gallery on desktop; on mobile they render
              at the end of the info column so the price stays next to the
              photos. */}
          {encar && (
            <div className="hidden lg:mt-6 lg:block">
              <KoreaOptionsPanel options={encar.options} />
            </div>
          )}
        </div>

        {/* Info column */}
        <div className="flex flex-col gap-5 px-4 py-5 lg:order-2 lg:py-0">
          <header className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold leading-tight text-neutral-900 dark:text-neutral-100 lg:text-[28px]">
                {title}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-[13px] text-neutral-600 dark:text-neutral-400">
                <span>{car.YEAR}</span>
                {car.GRADE && (
                  <>
                    <span aria-hidden>·</span>
                    <span>{car.GRADE}</span>
                  </>
                )}
                {colorSwatch && colorLabel && (
                  <>
                    <span aria-hidden>·</span>
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className={`h-3 w-3 rounded-full ${colorSwatch.ring ? "ring-1 ring-neutral-300" : ""}`}
                        style={{ background: colorSwatch.bg }}
                        aria-hidden
                      />
                      {colorLabel}
                    </span>
                  </>
                )}
              </div>
            </div>
            <CarActionButtons
              item={wishlistItemFromFixture(car, source, priceMnt)}
              enableCompare={enableCompare}
            />
          </header>

          {/* Price hero — the Encar asking price is the headline (fixed price,
              no auction). New-car price + the official listing link give it
              context. */}
          {encar && (priceMain || priceSub) && (
            <section className="rounded-2xl bg-neutral-900 p-4 ring-1 ring-white/10 dark:bg-neutral-800">
              <div className="text-[11px] font-semibold uppercase text-neutral-400">
                {t("encar.priceLabel")}
              </div>
              <div className="mt-1 text-4xl font-extrabold leading-none tabular-nums text-emerald-400">
                {priceMain
                  ? `₮${formatNumber(priceMain)}`
                  : `₩${formatNumber(priceSub ?? 0)}`}
              </div>
              {priceMain && priceSub ? (
                <div className="mt-1.5 text-[13px] tabular-nums text-neutral-400">
                  ₩{formatNumber(priceSub)}
                </div>
              ) : null}
              {encar.newPriceKrw ? (
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/10 pt-3 text-[12px]">
                  <span className="text-neutral-400">
                    {t("encar.newPriceLabel")}
                  </span>
                  <span className="tabular-nums text-neutral-300">
                    ₩{formatNumber(encar.newPriceKrw)}
                  </span>
                </div>
              ) : null}
              {encar.officialUrl && (
                <a
                  href={encar.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-white text-[13px] font-semibold text-neutral-900 transition hover:bg-neutral-200"
                >
                  {t("encar.officialLink")}
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-3.5 w-3.5"
                    aria-hidden
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              )}
            </section>
          )}

          {/* Quick specs */}
          <section className="grid grid-cols-3 gap-2">
            {quickSpecs.map(({ label, value }) => (
              <div
                key={label}
                className="flex flex-col gap-0.5 rounded-xl border border-neutral-200/80 bg-white px-3 py-2.5 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <span className="text-[10.5px] font-medium uppercase text-neutral-400 dark:text-neutral-500">
                  {label}
                </span>
                <span className="truncate text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
                  {value || "—"}
                </span>
              </div>
            ))}
          </section>

          {/* Full spec table */}
          <section>
            <h2 className="mb-3 text-[15px] font-semibold text-neutral-900 dark:text-neutral-100">
              {t("specs.fullTitle")}
            </h2>
            <dl className="overflow-hidden rounded-2xl border border-neutral-200 bg-white text-[13px] dark:border-neutral-800 dark:bg-neutral-900">
              {detailedRows.map((row, idx) => (
                <div
                  key={row.label}
                  className={`flex items-start gap-4 px-4 py-3 ${idx > 0 ? "border-t border-neutral-100 dark:border-neutral-800" : ""}`}
                >
                  <dt className="w-32 shrink-0 text-neutral-500 dark:text-neutral-400">
                    {row.label}
                  </dt>
                  <dd className="flex-1 font-medium text-neutral-900 dark:text-neutral-100">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
            {car.INFO && (
              <p className="mt-3 text-[12px] text-neutral-500 dark:text-neutral-400">
                {car.INFO}
              </p>
            )}
          </section>

          {/* Encar performance inspection + insurance history */}
          {encar && (
            <KoreaDetailExtras
              inspection={encar.inspection}
              insurance={encar.insurance}
            />
          )}

          {/* Mobile-only options placement (desktop shows them under the gallery) */}
          {encar && (
            <div className="lg:hidden">
              <KoreaOptionsPanel options={encar.options} />
            </div>
          )}
        </div>
      </div>

      {/* Mobile sticky price bar — quick access to the price + official listing */}
      {encar && (priceMain || priceSub) && (
        <>
          <div className="lg:hidden fixed inset-x-0 bottom-0 z-30 border-t border-neutral-100 bg-white/95 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur-xl dark:border-neutral-900 dark:bg-neutral-950/95">
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col">
                <span className="text-[10.5px] font-semibold uppercase text-neutral-400">
                  {t("encar.priceLabel")}
                </span>
                <span className="text-base font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
                  {priceMain
                    ? `₮${formatNumber(priceMain)}`
                    : `₩${formatNumber(priceSub ?? 0)}`}
                </span>
              </div>
              {encar.officialUrl && (
                <a
                  href={encar.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="flex h-10 shrink-0 items-center justify-center rounded-xl bg-neutral-900 px-4 text-[13px] font-semibold text-white dark:bg-white dark:text-neutral-900"
                >
                  {t("encar.officialLink")}
                </a>
              )}
            </div>
          </div>
          {/* Spacer so the sticky bar doesn't cover last content on mobile */}
          <div className="h-20 lg:hidden" aria-hidden />
        </>
      )}
    </article>
  );
}
