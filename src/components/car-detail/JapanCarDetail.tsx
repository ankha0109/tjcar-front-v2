import type { ReactNode } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import CarBreadcrumb from "./CarBreadcrumb";
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
import { toComparableSales, sameSpecLabel } from "@/lib/priceHistory";
import { getDevice } from "@/lib/device";
import { getAuctionHistory } from "@/services/auctions";
import { getConfig } from "@/services/config";
import { auctionSchedule } from "@/utils/auctionTime";
import { parseAuctionInfo } from "@/utils/auctionInfo";
import {
  ChassisIcon,
  ColorIcon,
  DriveIcon,
  DrivetrainIcon,
  EngineIcon,
  EquipmentIcon,
  MileageIcon,
  RateIcon,
  TransmissionIcon,
  YearIcon,
} from "@/components/icons/CarSpecIcons";
import { getColorSwatch } from "@/utils/carColor";
import {
  formatDrivetrain,
  formatEngineWithPower,
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
  // Breadcrumb reuses the site nav's own label for /japan rather than a second
  // translation of the same thing.
  const tNav = await getTranslations("header.nav");

  // Live JPY→MNT rate for the bid panel's approximate-value preview.
  const jpyRate = (await getConfig()).JPY;

  // The phone shell already renders the lot title as an <h1> in its sticky
  // header (`@mobileHeader/japan/[id]`), so the in-page title section is for the
  // desktop shell only. The gate is the same device cookie that picks the shell
  // (not a breakpoint) — a narrow desktop window has no sticky header and still
  // needs the title.
  const device = await getDevice();
  const showTitleHeader = device !== "mobile";

  const title = carTitle(car);
  // Used twice: the title section's buttons and the mobile sticky bar's.
  const wishlistItem = wishlistItemFromFixture(car, "japan");

  // Breadcrumb steps. `carTitle` is brand + model, so using it as the last step
  // under a brand step would read "TOYOTA › TOYOTA RAV4" — each step must add
  // only its own increment. Split only when both halves exist; a lot with no
  // model (or no brand) keeps the whole title as its single last step.
  const brandCrumb = car.MARKA_NAME.trim();
  const modelCrumb = car.MODEL_NAME.trim();
  const showBrandCrumb = Boolean(brandCrumb && modelCrumb);
  const allImages = parseImages(car.IMAGES);
  // The first gallery image is the auction evaluation (inspection) sheet — split
  // it out into its own section, as long as a car photo remains for the gallery.
  const hasEvaluation = allImages.length > 1;
  const evaluationImage = hasEvaluation ? allImages[0] : undefined;
  const images = hasEvaluation ? allImages.slice(1) : allImages;
  const startNum = Number(car.START);
  const colorSwatch = car.COLOR ? getColorSwatch(car.COLOR) : null;
  const mileage = formatMileage(Number(car.MILEAGE) || undefined, tFmt);
  // Compact single tile so it fits one grid cell, e.g. "2,500CC (128HP)".
  const engineValue = formatEngineWithPower(
    Number(car.ENG_V) || undefined,
    Number(car.PW) || undefined,
  );
  const transmission = formatTransmission(car.KPP, tFmt);
  const drivetrain = formatDrivetrain(car.PRIV, tFmt);
  const driveLabel =
    car.LHDRIVE === "1" ? t("specs.driveLHD") : t("specs.driveRHD");

  // Both auction clocks: Japan (GMT+9, the zone AJES sends AUCTION_DATE in) and
  // Ulaanbaatar (GMT+8). Numeric output, so it is identical on server and
  // client. The countdown itself still ticks in the browser.
  const schedule = auctionSchedule(car.AUCTION_DATE);

  // Exterior/interior grades, dug out of the free-text INFO blob. Whatever the
  // auction house left unpublished is simply left out of the grid rather than
  // shown as a dash.
  const info = parseAuctionInfo(car.INFO);

  // Comparable sold lots (AJES `stats`) feeding the trend chart. Chassis AND
  // rate are pinned: make/model/year alone mixes generations and grades, and the
  // gap between a rate 5 car and a rate R one is wide enough that one chart line
  // across both reads as "a rate 5 car goes for this". The upstream applies its
  // 10-row limit AFTER these filters, so narrowing costs no sample size. When a
  // grade genuinely has no sales the section hides — better than a wrong price.
  // Supplementary either way, so an upstream hiccup just hides it rather than
  // failing the whole lot page.
  const historyRows = await getAuctionHistory({
    mark_name: car.MARKA_NAME,
    model_name: car.MODEL_NAME,
    year: car.YEAR,
    chassis: car.KUZOV,
    rate: car.RATE,
  }).catch((err) => {
    console.error("[Japan] /japan/history fetch failed:", err);
    return [];
  });
  const comparableSales = toComparableSales(historyRows, jpyRate);
  const comparableSpec = sameSpecLabel(car);

  // Grade is deliberately absent: the desktop shell trails it after the title,
  // and the phone shell carries it as the sticky header's second line
  // (`@mobileHeader/japan/[id]`). Cells whose icon is still to come fall back to
  // an invisible spacer so the columns stay aligned.
  const quickSpecs: Array<{
    label: string;
    value: string | undefined;
    icon?: ReactNode;
  }> = [
    { label: t("specs.year"), value: car.YEAR, icon: <YearIcon /> },
    { label: t("specs.mileage"), value: mileage, icon: <MileageIcon /> },
    { label: t("specs.engine"), value: engineValue, icon: <EngineIcon /> },
    {
      label: t("specs.color"),
      value: car.COLOR || undefined,
      icon: colorSwatch ? <ColorIcon swatch={colorSwatch} /> : undefined,
    },
    {
      label: t("specs.transmission"),
      value: transmission,
      icon: <TransmissionIcon />,
    },
    { label: t("specs.drive"), value: driveLabel, icon: <DriveIcon /> },
    {
      label: t("specs.drivetrain"),
      value: drivetrain,
      icon: <DrivetrainIcon />,
    },
    {
      label: t("specs.chassis"),
      value: car.KUZOV || undefined,
      icon: <ChassisIcon />,
    },
    {
      label: t("specs.equipment"),
      value: car.EQUIP || undefined,
      icon: <EquipmentIcon />,
    },
    ...(info.rateExt
      ? [
          {
            label: t("specs.rateExt"),
            value: info.rateExt,
            icon: <RateIcon />,
          },
        ]
      : []),
    ...(info.rateInt
      ? [
          {
            label: t("specs.rateInt"),
            value: info.rateInt,
            icon: <RateIcon />,
          },
        ]
      : []),
  ];

  return (
    <article className="mx-auto w-full max-w-7xl px-0 lg:px-6 lg:py-8">
      {/* Title band — the breadcrumb row plus the title/actions row, both full
          page width above the gallery. Skipped on the phone shell, whose sticky
          header already carries the title and a back chevron. Below `lg` the
          actions move to the mobile sticky bid bar, so exactly one copy of them
          exists at any width. Separation from the gallery is spacing only, no
          divider. `pt-5 lg:pt-0` on the breadcrumb because <article>'s
          `lg:py-8` does not apply below `lg`, where the band would otherwise
          sit flush under the site header. */}
      {showTitleHeader && (
        <>
          {/* `marka`/`model` are the brand + model-name filters the auction
              list already reads (see queryToFilters), so each step lands on the
              same make/model the filter panel would produce. The model step
              therefore links instead of marking the current page. */}
          <CarBreadcrumb
            ariaLabel={t("breadcrumb.aria")}
            className="px-4 pt-5 pb-3 lg:px-0 lg:pt-0"
            items={[
              { label: t("breadcrumb.home"), href: "/" },
              { label: tNav("japan"), href: "/japan" },
              ...(showBrandCrumb
                ? [
                    {
                      label: brandCrumb,
                      href: `/japan?marka=${encodeURIComponent(brandCrumb)}`,
                    },
                    {
                      label: modelCrumb,
                      href: `/japan?marka=${encodeURIComponent(brandCrumb)}&model=${encodeURIComponent(modelCrumb)}`,
                    },
                  ]
                : [{ label: title }]),
            ]}
          />
          <header className="flex items-center justify-between gap-3 px-4 pb-6 lg:px-0">
            {/* Grade trails the title on the same baseline rather than taking
                its own line — the band is above the fold, so the row saved is
                worth more than the separation. Year + color are in the quick
                specs below, so grade is all that trails here. */}
            <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
              <h1 className="text-2xl font-bold leading-tight text-neutral-900 dark:text-neutral-100 lg:text-[28px]">
                {title}
              </h1>
              {car.GRADE && (
                <span className="text-2xl font-normal leading-tight text-neutral-600 lg:text-[28px] dark:text-neutral-400">
                  {car.GRADE}
                </span>
              )}
            </div>
            <div className="hidden shrink-0 lg:block">
              <CarActionButtons item={wishlistItem} enableCompare />
            </div>
          </header>
        </>
      )}
      <div className="flex flex-col lg:flex-row lg:items-start lg:gap-x-10">
        {/* Left column — gallery only, full-bleed on mobile (no side padding).
            As a flex column its height is its own content, so it no longer
            stretches to match the tall info column. */}
        <div className="lg:min-w-0 lg:grow-[1.4] lg:basis-0">
          <PremiumGallery
            images={images}
            alt={title}
            isPremium={car.AUCTION_TYPE === "1"}
            lot={car.LOT}
          />
        </div>

        {/* Info column — right on desktop, independent height from the left */}
        <div className="flex flex-col gap-5 py-5 lg:min-w-0 lg:grow lg:basis-0 lg:py-0">
          {/* Headline tiles — inspection grade + MNT landed price */}
          <div className="grid grid-cols-5 gap-3">
            <div className="col-span-2">
              <RateCard rate={car.RATE} label={t("specs.rate")} />
            </div>
            <div className="col-span-3">
              <LandedPriceCard priceMnt={car.PRICE_MNT} />
            </div>
          </div>

          {/* Auction action card — quick specs, then countdown + venue/lot + gated bid form, split by dividers */}
          <CarBidSection
            auctionId={car.ID}
            startPrice={startNum || 0}
            status={car.STATUS}
            auctionDate={car.AUCTION_DATE}
            schedule={schedule}
            auctionLocation={car.AUCTION}
            town={car.TOWN}
            lot={car.LOT}
            chassis={car.KUZOV}
            engineSize={car.ENG_V}
            year={car.YEAR}
            rate={car.RATE}
            jpyRate={jpyRate}
            actions={
              <CarActionButtons
                item={wishlistItem}
                enableCompare
                variant="bar"
              />
            }
            quickSpecs={
              <div className="grid grid-cols-3 gap-x-3 gap-y-4">
                {quickSpecs.map(({ label, value, icon }) => (
                  <div key={label} className="flex items-center gap-1.25">
                    {icon ? (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-neutral-0 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                        {icon}
                      </span>
                    ) : (
                      // Invisible spacer — keeps the columns lined up until the
                      // remaining icons land.
                      <span className="h-6 w-6 shrink-0" aria-hidden />
                    )}
                    <div className="flex min-w-0 flex-col gap-0 leading-normal">
                      <span className="text-[11px] font-medium uppercase text-neutral-400 dark:text-neutral-500">
                        {label}
                      </span>
                      <span className="truncate text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
                        {value || "-"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            }
          />

          {/* Chassis-year verification — closes the info column. The lot's own
              KUZOV/SERIAL pre-fill it, so it is a one-tap check of the
              manufacture year against the maker's VIN records. */}
          <ChassisYearVerify
            markaName={car.MARKA_NAME}
            chassis={car.KUZOV}
            serial={car.SERIAL}
          />
        </div>
      </div>

      {/* Evaluation (inspection) sheet + AI explainer. The most consulted part
          of the lot, so it leads the full-width sections below the fold, with
          the sheet and the assistant side by side and room to breathe. */}
      {evaluationImage && <CarEvaluation image={evaluationImage} car={car} />}

      {/* Comparable sold cars — the trend chart across the full page width, after
          the evaluation sheet. Every per-sale detail lives in its tooltip, so no
          companion table. */}
      {comparableSales.length > 0 && (
        <section className="mt-8 border-t border-neutral-200 px-4 pt-8 lg:mt-12 lg:px-0 lg:pt-10 dark:border-neutral-800">
          <PriceHistoryChart
            data={comparableSales}
            specLabel={comparableSpec}
            locale={locale}
          />
        </section>
      )}

      {/* Spacer so the mobile sticky bid bar never covers the last content. */}
      <div className="h-20 lg:hidden" aria-hidden />
    </article>
  );
}
