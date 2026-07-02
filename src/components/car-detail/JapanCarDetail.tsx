import { getLocale, getTranslations } from "next-intl/server";
import PremiumGallery from "./PremiumGallery";
import CarActionButtons from "./CarActionButtons";
import CarEvaluation from "./CarEvaluation";
import CarBidSection from "./CarBidSection";
import RateCard from "./RateCard";
import LandedPriceCard from "./LandedPriceCard";
import ChassisYearVerify from "./ChassisYearVerify";
import PriceHistoryChart from "./PriceHistoryChart";
import { parseImages, type CarFixture, carTitle } from "@/lib/carFixtures";
import { wishlistItemFromFixture } from "@/lib/wishlist";
import { getComparableSales, sameSpecLabel } from "@/lib/priceHistory";
import { getConfig } from "@/services/config";
import { getColorSwatch } from "@/utils/carColor";
import {
  formatEngine,
  formatMileage,
  formatTransmission,
} from "@/utils/carFormat";

type Props = {
  car: CarFixture;
};

/**
 * Japan auction lot detail page. A live-bidding experience distinct from the
 * plain {@link CarDetail} used for Korea/Cars listings: it groups the auction
 * countdown, venue, lot number and bid form into one action card, surfaces the
 * MNT landed price + inspection grade as headline tiles, and adds the
 * chassis-year verification and inspection-sheet legend. A separate
 * KoreaCarDetail will follow — similar shell, different specifics.
 */
export default async function JapanCarDetail({ car }: Props) {
  const locale = await getLocale();
  const t = await getTranslations("carDetail");
  const tFmt = await getTranslations("car.card");

  // Live JPY→MNT rate for the bid panel's approximate-value preview.
  const jpyRate = (await getConfig()).JPY;

  const title = carTitle(car);
  const allImages = parseImages(car.IMAGES);
  // The first gallery image is the auction evaluation (inspection) sheet — split
  // it out into its own section, as long as a car photo remains for the gallery.
  const hasEvaluation = allImages.length > 1;
  const evaluationImage = hasEvaluation ? allImages[0] : undefined;
  const images = hasEvaluation ? allImages.slice(1) : allImages;
  const startNum = Number(car.START);
  const avgNum = Number(car.AVG_PRICE) || 0;
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
    { label: t("specs.color"), value: car.COLOR || undefined },
    { label: t("specs.transmission"), value: transmission },
    { label: t("specs.drive"), value: driveLabel },
  ];

  const detailedRows: Array<{ label: string; value: string; wide?: boolean }> = [
    { label: t("specs.grade"), value: car.GRADE || "—" },
    { label: t("specs.chassis"), value: car.KUZOV || "—" },
    // Equipment is a long comma-separated list — give it the full row width.
    { label: t("specs.equipment"), value: car.EQUIP || "—", wide: true },
  ];

  return (
    <article className="mx-auto w-full max-w-7xl px-0 lg:px-6 lg:py-8">
      <div className="lg:grid lg:grid-cols-[1.4fr_1fr] lg:items-start lg:gap-x-10 lg:gap-y-8">
        {/* Gallery — top-left; full-bleed on mobile (no side padding) */}
        <div className="lg:col-start-1 lg:row-start-1">
          <div className="pt-2 lg:p-0">
            <PremiumGallery
              images={images}
              alt={title}
              isPremium={car.AUCTION_TYPE === "1"}
              lot={car.LOT}
            />
          </div>
        </div>

        {/* Info column — right on desktop, spans both gallery rows */}
        <div className="flex flex-col gap-5 px-4 py-5 lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:py-0">
          <header className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1">
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
              item={wishlistItemFromFixture(car, "japan")}
              enableCompare
            />
          </header>

          {/* Headline tiles — inspection grade + MNT landed price */}
          <div className="grid grid-cols-2 gap-3">
            <RateCard rate={car.RATE} label={t("specs.rate")} />
            <LandedPriceCard
              auctionId={car.ID}
              chassis={car.KUZOV}
              engineSize={car.ENG_V}
              year={car.YEAR}
              rate={car.RATE}
              avgPrice={avgNum}
            />
          </div>

          {/* Quick specs — key figures right under the grade/price tiles */}
          <section className="grid grid-cols-3 gap-2">
            {quickSpecs.map(({ label, value }) => (
              <div
                key={label}
                className="flex flex-col gap-0.5 rounded-xl border border-neutral-200/80 bg-white px-3 py-2.5 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <span className="text-[10.5px] font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  {label}
                </span>
                <span className="truncate text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
                  {value || "—"}
                </span>
              </div>
            ))}
          </section>

          {/* Auction action card — countdown + venue/lot + gated bid form */}
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
        </div>

        {/* Details under the gallery — full spec table + chassis-year verify */}
        <div className="flex flex-col gap-5 px-4 py-5 lg:col-start-1 lg:row-start-2 lg:px-0 lg:py-0">
          <section>
            <h2 className="mb-3 text-[15px] font-semibold text-neutral-900 dark:text-neutral-100">
              {t("specs.fullTitle")}
            </h2>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {detailedRows.map((row) => (
                <div
                  key={row.label}
                  className={`flex flex-col gap-1 rounded-xl border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900 ${row.wide ? "col-span-2 sm:col-span-3" : ""}`}
                >
                  <dt className="text-[11px] font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    {row.label}
                  </dt>
                  <dd className="break-words text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
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

          <ChassisYearVerify
            markaName={car.MARKA_NAME}
            chassis={car.KUZOV}
            serial={car.SERIAL}
          />
        </div>
      </div>

      {/* Auction evaluation sheet + AI assistant + mark legend — full width */}
      {evaluationImage && <CarEvaluation image={evaluationImage} car={car} />}

      {/* Comparable sold-car price history — full width */}
      <PriceHistoryChart
        data={getComparableSales(car)}
        specLabel={sameSpecLabel(car)}
        locale={locale}
      />

      {/* Spacer so the mobile sticky bid bar never covers the last content. */}
      <div className="h-20 lg:hidden" aria-hidden />
    </article>
  );
}
