import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import CarGallery from "./CarGallery";
import CarActionButtons from "./CarActionButtons";
import CarBreadcrumb, { type Crumb } from "./CarBreadcrumb";
import ChassisYearVerify from "./ChassisYearVerify";
import KoreaDetailExtras from "./KoreaDetailExtras";
import KoreaLandedPriceCard from "./KoreaLandedPriceCard";
import KoreaOptionsPanel from "./KoreaOptionsPanel";
import { formatMnt } from "@/lib/bidConfig";
import { parseImages, type CarFixture, carTitle } from "@/lib/carFixtures";
import { getDevice } from "@/lib/device";
import { wishlistItemFromFixture } from "@/lib/wishlist";
import type { CarSource } from "@/types/car";
import type {
  KoreaInspection,
  KoreaInsurance,
  KoreaOptionGroup,
} from "@/types/korea";
import type { VehicleCostResult } from "@/types/vehicleCost";
import {
  ChassisIcon,
  ColorIcon,
  EngineIcon,
  FuelIcon,
  MileageIcon,
  RegistrationIcon,
  SeatIcon,
  TransmissionIcon,
  YearIcon,
} from "@/components/icons/CarSpecIcons";
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
    /**
     * The `/korea` list's `brand` + `model` filter values, for the breadcrumb's
     * brand/model steps. `brandSlug` is the slug (`kia`), `modelName` the Encar
     * model name (`K9`) — NOT the fixture's `MODEL_NAME`, which carries the
     * fuller `model_detail` line the filter would not match.
     */
    brandSlug?: string | null;
    modelName?: string | null;
    /** Normalized backend value: petrol/diesel/hybrid/electric/hydrogen/lpg. */
    fuelType?: string | null;
    seatCount?: number | null;
    /** YYYYMM first-registration month. */
    yearMonth?: string | null;
    options?: KoreaOptionGroup[];
    inspection?: KoreaInspection | null;
    insurance?: KoreaInsurance | null;
  };
  /**
   * Landed-cost breakdown. The page maps Encar's fuel type to an excise class
   * and prices the car server-side, so the total is in the first paint and the
   * buyer is asked nothing. `result` is `null` when the fuel type maps to no
   * class; omit `landedCost` itself to hide the card entirely.
   */
  landedCost?: { result: VehicleCostResult | null };
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
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
    value,
  );
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
  landedCost,
}: Props) {
  const t = await getTranslations("carDetail");
  const tFmt = await getTranslations("car.card");
  // Breadcrumb reuses the site nav's own label for /korea rather than a second
  // translation of the same thing.
  const tNav = await getTranslations("header.nav");

  // The phone shell renders the title as an <h1> in its sticky header
  // (`@mobileHeader/korea/[id]`), so the in-page title band is for the desktop
  // shell only. The gate is the same device cookie that picks the shell (not a
  // breakpoint) — a narrow desktop window has no sticky header and still needs
  // the title.
  const device = await getDevice();
  const showTitleHeader = device !== "mobile";

  const title = carTitle(car);
  // Used twice: the title band's buttons and the mobile sticky bar's.
  const wishlistItem = wishlistItemFromFixture(car, source, priceMnt);

  // Breadcrumb steps. `carTitle` is brand + model, so using it as the last step
  // under a brand step would read "Kia › Kia The K9" — each step must add only
  // its own increment. The brand/model steps link into the `/korea` list's own
  // filters; with no slug to filter by there is nothing to link, so the trail
  // keeps the whole title as one plain step instead.
  const brandCrumb = car.MARKA_NAME.trim();
  const modelCrumb = car.MODEL_NAME.trim();
  const brandHref = encar?.brandSlug
    ? `/korea?brand=${encodeURIComponent(encar.brandSlug)}`
    : undefined;
  const modelHref =
    brandHref && encar?.modelName
      ? `${brandHref}&model=${encodeURIComponent(encar.modelName)}`
      : undefined;
  const brandModelCrumbs: Crumb[] =
    brandHref && brandCrumb && modelCrumb
      ? [
          { label: brandCrumb, href: brandHref },
          { label: modelCrumb, href: modelHref },
        ]
      : [{ label: title }];

  // Encar photos are all car photos — no auction evaluation sheet to split off.
  const images = parseImages(car.IMAGES);
  const colorKey = car.COLOR ? colorNameKey(car.COLOR) : null;
  const colorLabel = colorKey
    ? t(`colors.${colorKey}`)
    : car.COLOR || undefined;
  const colorSwatch = car.COLOR ? getColorSwatch(car.COLOR) : null;
  const mileage = formatMileage(Number(car.MILEAGE) || undefined, tFmt);
  // Encar keeps its compact "2,998cc" style (vs formatEngine's "2,998 CC").
  const engV = Number(car.ENG_V) || 0;
  const engine = engV > 0 ? `${formatNumber(engV)}cc` : undefined;
  const transmission = formatTransmission(car.KPP, tFmt);
  const fuelType = encar?.fuelType || undefined;
  const fuel = fuelType
    ? FUEL_KEYS.has(fuelType)
      ? t(`fuel.${fuelType}`)
      : fuelType
    : undefined;
  // The government performance inspection is the only place an Encar listing
  // states the VIN, so it is what the year-verification form checks. Encar
  // keeps the number whole, so the form pre-fills one field rather than the
  // Japan lot page's chassis + serial pair. With no inspection on file there is
  // nothing to pre-fill and the card would just be an empty lookup box, so it
  // drops out entirely. Rendered twice, CSS-gated: under the gallery on
  // desktop, in the info column below `lg`.
  const vin = encar?.inspection?.vin?.trim() || null;
  const chassisVerify = (
    <ChassisYearVerify markaName={car.MARKA_NAME} vin={vin ?? ""} />
  );
  const priceMain = encar?.priceMnt || null;
  const priceSub = encar?.priceKrw || null;
  // What the mobile sticky bar quotes. With the price hero gone, the landed
  // total is the only price the page shows, so the bar quotes that rather than
  // the Encar asking price — a number that would otherwise appear nowhere else.
  // Falls back to the asking price when the calculator had nothing to say.
  const landedTotal =
    landedCost?.result && landedCost.result.ok
      ? landedCost.result.cost.total.amount
      : null;

  // One grid for every spec, the same shape the Japan lot page uses — the split
  // between "quick specs" tiles and a separate detail table only made the same
  // information look like two different kinds of fact. Grade is absent: it
  // trails the title. Cells whose icon is still to come fall back to an
  // invisible spacer so the columns stay aligned.
  const specs: Array<{
    label: string;
    value: string | undefined;
    icon?: ReactNode;
  }> = [
    { label: t("specs.year"), value: car.YEAR, icon: <YearIcon /> },
    { label: t("specs.mileage"), value: mileage, icon: <MileageIcon /> },
    { label: t("specs.engine"), value: engine, icon: <EngineIcon /> },
    { label: t("specs.fuel"), value: fuel, icon: <FuelIcon /> },
    {
      label: t("specs.transmission"),
      value: transmission,
      icon: <TransmissionIcon />,
    },
    {
      label: t("specs.color"),
      value: colorLabel,
      icon: colorSwatch ? <ColorIcon swatch={colorSwatch} /> : undefined,
    },
    {
      label: t("specs.bodyType"),
      value: car.KUZOV || undefined,
      icon: <ChassisIcon />,
    },
    {
      label: t("specs.seats"),
      value: encar?.seatCount ? String(encar.seatCount) : undefined,
      icon: <SeatIcon />,
    },
    {
      label: t("specs.regMonth"),
      value: encar?.yearMonth ? formatYearMonth(encar.yearMonth) : undefined,
      icon: <RegistrationIcon />,
    },
  ];

  return (
    <article className="mx-auto w-full max-w-7xl px-0 lg:px-6 lg:py-8">
      {/* Title band — the breadcrumb row plus the title/actions row, both full
          page width above the gallery. Skipped on the phone shell, whose sticky
          header already carries the title and a back chevron. Below `lg` the
          actions move to the mobile sticky bar, so exactly one copy of them
          exists at any width. `pt-5 lg:pt-0` on the breadcrumb because
          <article>'s `lg:py-8` does not apply below `lg`, where the band would
          otherwise sit flush under the site header. */}
      {showTitleHeader && (
        <>
          <CarBreadcrumb
            ariaLabel={t("breadcrumb.aria")}
            className="px-4 pt-5 pb-3 lg:px-0 lg:pt-0"
            items={[
              { label: t("breadcrumb.home"), href: "/" },
              { label: tNav("korea"), href: "/korea" },
              ...brandModelCrumbs,
            ]}
          />
          {/* Grade trails the title on the same baseline rather than taking its
              own line — the band is above the fold, so the row saved is worth
              more than the separation. */}
          <header className="flex items-center justify-between gap-3 px-4 pb-6 lg:px-0">
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
              <CarActionButtons
                item={wishlistItem}
                enableCompare={enableCompare}
              />
            </div>
          </header>
        </>
      )}
      <div className="lg:grid lg:grid-cols-[1.4fr_1fr] lg:items-start lg:gap-10">
        {/* Gallery — full-bleed on mobile (no side padding) */}
        <div className="lg:order-1">
          <div className="pt-2 lg:p-0">
            <CarGallery images={images} alt={title} />
          </div>
          {/* Chassis-year form and options both live under the gallery on
              desktop; on mobile they render in the info column instead, so the
              price stays next to the photos. */}
          {vin && (
            <div className="hidden lg:mt-6 lg:block">{chassisVerify}</div>
          )}
          {encar && (
            <div className="hidden lg:mt-6 lg:block">
              <KoreaOptionsPanel options={encar.options} />
            </div>
          )}
        </div>

        {/* Info column. `px-4` is the mobile gutter the full-bleed gallery
            forces onto the children (the article itself is `px-0` below `lg`);
            on desktop the article's own `lg:px-6` already provides it, so this
            has to drop or the column sits 16px inside its grid track — a wider
            gap than the gallery's and a right edge that misses the header's. */}
        <div className="flex flex-col gap-5 px-4 py-5 lg:order-2 lg:px-0 lg:py-0">
          {/* Landed cost — the only price block on the page. The Encar asking
              price is its first breakdown row, so a separate price hero above
              it only said the same number twice; the new-car price it used to
              carry moved into this card's footnotes. */}
          {landedCost && (
            <KoreaLandedPriceCard
              result={landedCost.result}
              newPriceKrw={encar?.newPriceKrw}
            />
          )}

          {/* The source listing, kept from the old price hero. */}
          {encar?.officialUrl && (
            <a
              href={encar.officialUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="flex h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-neutral-200 text-[13px] font-semibold text-neutral-900 transition hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900 dark:border-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-900 dark:hover:text-neutral-100"
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

          {/* Specs — one card, the Japan lot page's icon grid */}
          <section className="flex flex-col gap-4 rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
            <div className="grid grid-cols-3 gap-x-3 gap-y-4">
              {specs.map(({ label, value, icon }) => (
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
            {car.INFO && (
              <p className="border-t border-neutral-200 pt-3 text-[12px] text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
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

          {/* Mobile placement of the chassis-year form — the desktop copy sits
              under the gallery. */}
          {vin && <div className="lg:hidden">{chassisVerify}</div>}

          {/* Mobile-only options placement (desktop shows them under the gallery) */}
          {encar && (
            <div className="lg:hidden">
              <KoreaOptionsPanel options={encar.options} />
            </div>
          )}
        </div>
      </div>

      {/* Mobile sticky price bar — the price plus the actions the title band
          hides below `lg`. `md:pr-24` keeps the controls clear of the AI chat
          FAB, which sits over the bar's right edge from 768px up. */}
      {encar && (landedTotal || priceMain || priceSub) && (
        <>
          <div className="lg:hidden fixed inset-x-0 bottom-0 z-30 border-t border-neutral-100 bg-white/95 px-4 md:pr-24 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur-xl dark:border-neutral-900 dark:bg-neutral-950/95">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 flex-col">
                <span className="text-[11px] font-semibold uppercase text-neutral-400">
                  {t("encar.priceLabel")}
                </span>
                <span className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  {landedTotal
                    ? formatMnt(landedTotal)
                    : priceMain
                      ? `₮${formatNumber(priceMain)}`
                      : `₩${formatNumber(priceSub ?? 0)}`}
                </span>
              </div>
              {/* Wishlist + compare sit here below `lg`, where the title band
                  hides them — exactly one copy at any width. The listing link
                  drops its label to fit beside them; the labelled copy is in
                  the info column, under the price card. */}
              <div className="flex shrink-0 items-center gap-2">
                <CarActionButtons
                  item={wishlistItem}
                  enableCompare={enableCompare}
                  variant="bar"
                />
                {encar.officialUrl && (
                  <a
                    href={encar.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    aria-label={t("encar.officialLink")}
                    title={t("encar.officialLink")}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                      aria-hidden
                    >
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </div>
          {/* Spacer so the sticky bar doesn't cover last content on mobile */}
          <div className="h-20 lg:hidden" aria-hidden />
        </>
      )}
    </article>
  );
}
