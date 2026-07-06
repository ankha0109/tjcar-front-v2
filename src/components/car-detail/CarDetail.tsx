import { getLocale, getTranslations } from "next-intl/server";
import CarGallery from "./CarGallery";
import CarActionButtons from "./CarActionButtons";
import CarEvaluation from "./CarEvaluation";
import CarBidCta from "./CarBidCta";
import CarBidSection from "./CarBidSection";
import KoreaDetailExtras from "./KoreaDetailExtras";
import PriceHistoryChart from "./PriceHistoryChart";
import { parseImages, type CarFixture, carTitle } from "@/lib/carFixtures";
import { wishlistItemFromFixture } from "@/lib/wishlist";
import type { CarSource } from "@/types/car";
import type { KoreaInspection, KoreaOptionGroup } from "@/types/korea";
import { getComparableSales, sameSpecLabel } from "@/lib/priceHistory";
import { getConfig } from "@/services/config";
import { getColorSwatch } from "@/utils/carColor";
import { formatEngine, formatMileage, formatTransmission } from "@/utils/carFormat";
import { cn } from "@/utils";

type Props = {
  car: CarFixture;
  /** Hide JPY price (auction detail, where we don't surface cost/start price). */
  hidePrice?: boolean;
  /** Enable the live auction bid panel (Japan auction detail only). */
  enableBid?: boolean;
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
   * Encar (Korea) pricing + official listing link, rendered as its own price
   * card (the JPY card stays hidden via `hidePrice` on Korea detail). Options
   * and the performance inspection render in their own sections below.
   */
  encar?: {
    priceKrw: number | null;
    priceMnt: number | null;
    officialUrl: string | null;
    options?: KoreaOptionGroup[];
    inspection?: KoreaInspection | null;
  };
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function formatDate(iso: string, locale: string) {
  const d = new Date(iso.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(locale, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function CarDetail({
  car,
  hidePrice,
  enableBid,
  source = "korea",
  priceMnt = 0,
  enableCompare,
  encar,
}: Props) {
  const locale = await getLocale();
  const t = await getTranslations("carDetail");
  const tFmt = await getTranslations("car.card");

  // Live JPY→MNT rate for the bid panel; only fetched where bidding is enabled.
  const jpyRate = enableBid ? (await getConfig()).JPY : 0;

  const title = carTitle(car);
  const allImages = parseImages(car.IMAGES);
  // The first gallery image is the auction evaluation (inspection) sheet — split
  // it out into its own section, as long as a car photo remains for the gallery.
  const hasEvaluation = allImages.length > 1;
  const evaluationImage = hasEvaluation ? allImages[0] : undefined;
  const images = hasEvaluation ? allImages.slice(1) : allImages;
  const startNum = Number(car.START);
  const avgNum = Number(car.AVG_PRICE);
  const colorSwatch = car.COLOR ? getColorSwatch(car.COLOR) : null;
  const mileage = formatMileage(Number(car.MILEAGE) || undefined, tFmt);
  const engine = formatEngine(Number(car.ENG_V) || undefined);
  const transmission = formatTransmission(car.KPP, tFmt);
  const driveLabel =
    car.LHDRIVE === "1" ? t("specs.driveLHD") : t("specs.driveRHD");

  const quickSpecs: Array<{ label: string; value: string | undefined }> = [
    { label: t("specs.year"), value: car.YEAR },
    { label: t("specs.mileage"), value: mileage },
    { label: t("specs.engine"), value: engine },
    {
      label: t("specs.color"),
      value: car.COLOR || undefined,
    },
    { label: t("specs.transmission"), value: transmission },
    { label: t("specs.drive"), value: driveLabel },
  ];

  const detailedRows: Array<{ label: string; value: string }> = [
    { label: t("specs.grade"), value: car.GRADE || "—" },
    { label: t("specs.chassis"), value: car.KUZOV || "—" },
    { label: t("specs.equipment"), value: car.EQUIP || "—" },
  ];

  return (
    <article className="mx-auto w-full max-w-7xl px-0 lg:px-6 lg:py-8">
      <div className="lg:grid lg:grid-cols-[1.4fr_1fr] lg:items-start lg:gap-10">
        {/* Gallery — full-bleed on mobile (no side padding) */}
        <div className="lg:order-1">
          <div className="pt-2 lg:p-0">
            <CarGallery images={images} alt={title} />
          </div>
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
                {colorSwatch && car.COLOR && (
                  <>
                    <span aria-hidden>·</span>
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className={`h-3 w-3 rounded-full ${colorSwatch.ring ? "ring-1 ring-neutral-300" : ""}`}
                        style={{ background: colorSwatch.bg }}
                        aria-hidden
                      />
                      {car.COLOR}
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

          {/* Valuation hero — RATE (most important) + LOT, grouped once */}
          <section className="flex items-center justify-between gap-4 rounded-2xl bg-neutral-900 p-4 ring-1 ring-white/10 dark:bg-neutral-800">
            <div>
              <div className="text-[11px] font-semibold uppercase text-neutral-400">
                {t("specs.rate")}
              </div>
              <div className="mt-0.5 text-4xl font-extrabold leading-none tabular-nums text-emerald-400">
                {car.RATE || "—"}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] font-semibold uppercase text-neutral-400">
                {t("specs.lot")}
              </div>
              <div className="mt-0.5 text-lg font-semibold tabular-nums text-neutral-100">
                {car.LOT || "—"}
              </div>
            </div>
          </section>

          {/* Encar price card + official listing link (Korea detail only) */}
          {encar && (encar.priceMnt || encar.priceKrw || encar.officialUrl) && (
            <section className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
              {encar.priceMnt ? (
                <>
                  <div className="text-[11px] font-semibold uppercase text-neutral-500 dark:text-neutral-400">
                    {t("encar.priceLabel")}
                  </div>
                  <div className="mt-1 text-2xl font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
                    ₮{formatNumber(encar.priceMnt)}
                  </div>
                </>
              ) : null}
              {encar.priceKrw ? (
                <div className="mt-0.5 text-[12px] tabular-nums text-neutral-500 dark:text-neutral-400">
                  ₩{formatNumber(encar.priceKrw)}
                </div>
              ) : null}
              {encar.officialUrl && (
                <a
                  href={encar.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-neutral-900 text-[13px] font-semibold text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
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

          {/* Price card — start/avg JPY (omitted on auction detail) */}
          {!hidePrice && (
            <section className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="text-[11px] font-semibold uppercase text-neutral-500 dark:text-neutral-400">
                {t("price.startLabel")}
              </div>
              <div className="mt-1 text-2xl font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
                ¥{formatNumber(startNum || 0)}
              </div>
              {avgNum > 0 && (
                <div className="mt-0.5 text-[12px] tabular-nums text-neutral-500 dark:text-neutral-400">
                  {t("price.avgPrefix")} ¥{formatNumber(avgNum)}
                </div>
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

          {/* Auction info card */}
          <section className="flex flex-col gap-3 rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
            <h2 className="text-[14px] font-semibold text-neutral-900 dark:text-neutral-100">
              {t("auction.title")}
            </h2>
            <dl className="grid grid-cols-1 gap-2 text-[13px] sm:grid-cols-2">
              <Row label={t("specs.auction")} value={car.AUCTION || "—"} />
              <Row
                label={t("specs.auctionDate")}
                value={
                  car.AUCTION_DATE ? formatDate(car.AUCTION_DATE, locale) : "—"
                }
              />
            </dl>
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

          {/* Encar performance inspection + grouped options (Korea detail only) */}
          {encar && (
            <KoreaDetailExtras
              inspection={encar.inspection}
              options={encar.options}
            />
          )}

          {/* Bid panel (auction) or the coming-soon CTA (listings). */}
          {enableBid ? (
            <CarBidSection
              auctionId={car.ID}
              startPrice={startNum || 0}
              status={car.STATUS}
              auctionDate={car.AUCTION_DATE}
              auctionLocation={car.AUCTION}
              lot={car.LOT}
              chassis={car.KUZOV}
              engineSize={car.ENG_V}
              year={car.YEAR}
              rate={car.RATE}
              jpyRate={jpyRate}
            />
          ) : (
            <div className="hidden lg:block">
              <CarBidCta carTitle={title} />
              <p className="mt-2 text-[12px] text-neutral-500 dark:text-neutral-400">
                {t("bid.helper")}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Auction evaluation sheet + static AI assistant — full width */}
      {evaluationImage && <CarEvaluation image={evaluationImage} car={car} />}

      {/* Comparable sold-car price history — full width */}
      <PriceHistoryChart
        data={getComparableSales(car)}
        specLabel={sameSpecLabel(car)}
        locale={locale}
      />

      {/* Mobile sticky CTA — coming-soon listings only; the bid panel renders
          its own sticky bar + drawer when enableBid is set. */}
      {!enableBid && (
        <>
          <div className="lg:hidden fixed inset-x-0 bottom-0 z-30 border-t border-neutral-100 bg-white/95 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur-xl dark:border-neutral-900 dark:bg-neutral-950/95">
            <div
              className={cn(
                "flex items-center gap-3",
                hidePrice ? "justify-stretch" : "justify-between",
              )}
            >
              {!hidePrice && (
                <div className="flex flex-col">
                  <span className="text-[10.5px] font-semibold uppercase text-neutral-400">
                    {t("price.startLabel")}
                  </span>
                  <span className="text-base font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
                    ¥{formatNumber(startNum || 0)}
                  </span>
                </div>
              )}
              <div className={cn("shrink-0", hidePrice && "flex-1")}>
                <CarBidCta carTitle={title} />
              </div>
            </div>
          </div>
          {/* Spacer so sticky CTA doesn't cover last content on mobile */}
          <div className="h-20 lg:hidden" aria-hidden />
        </>
      )}
    </article>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[11px] font-medium uppercase text-neutral-400 dark:text-neutral-500">
        {label}
      </dt>
      <dd className="font-medium text-neutral-900 dark:text-neutral-100">{value}</dd>
    </div>
  );
}
