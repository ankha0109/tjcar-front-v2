import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import CarActionButtons from "./CarActionButtons";
import CarBreadcrumb, { type Crumb } from "./CarBreadcrumb";
import CarGallery from "./CarGallery";
import ChinaSpecSheet from "./ChinaSpecSheet";
import ListingLandedPriceCard from "./ListingLandedPriceCard";
import OrderInquiry from "./OrderInquiry";
import PriceTile from "./PriceTile";
import {
  ChassisIcon,
  ColorIcon,
  DrivetrainIcon,
  EngineIcon,
  FuelIcon,
  MileageIcon,
  RegistrationIcon,
  SeatIcon,
  TransmissionIcon,
  YearIcon,
} from "@/components/icons/CarSpecIcons";
import { formatMnt } from "@/lib/bidConfig";
import { chinaListingToFixture } from "@/lib/chinaAdapter";
import { carTitle, parseImages } from "@/lib/carFixtures";
import { getDevice } from "@/lib/device";
import { wishlistItemFromFixture } from "@/lib/wishlist";
import {
  chinaColorLabel,
  chinaColorSwatchName,
  type ChinaListing,
} from "@/types/china";
import { cn } from "@/utils";
import { getColorSwatch } from "@/utils/carColor";
import type { VehicleCostResult } from "@/types/vehicleCost";
import {
  formatEngineWithPower,
  formatMileage,
  formatTransmission,
} from "@/utils/carFormat";

type Props = {
  listing: ChinaListing;
  /** What the calculator priced this listing at, landed in Mongolia. */
  landedCost: VehicleCostResult;
};

function formatCny(value: number) {
  return `¥${new Intl.NumberFormat("en-US").format(value)}`;
}

/**
 * Detail page for a China dealer listing (`GET /china/{id}`, route
 * `/china/{id}`).
 *
 * The Korea page's shell — title band, gallery left, a column of cards right,
 * the mobile sticky bar — over the API's detail row: the mirror's price and
 * facts, completed from the upstream's full row with every photo, the VIN,
 * the headline facts of the spec sheet and the sheet itself. When that read
 * fails the extras are simply empty and the page shows what the mirror holds.
 *
 * The price shown is the landed one — the dealer's price plus the costs inside
 * China and every Mongolian import tax, priced server-side the way TJ CAR's
 * calculator prices its China tab. When the calculator cannot price a listing
 * (no displacement on a petrol car, no rate), the yuan asking price stands in,
 * marked as excluding all of that.
 *
 * It does not reuse `EncarDetail`, for the reason `GarageCarDetail` gives: that
 * component's landed-price card, options panel and condition reports are all
 * Encar-only, and its breadcrumb is `/korea`'s.
 */
export default async function ChinaDetail({ listing, landedCost }: Props) {
  const t = await getTranslations("carDetail");
  const tFmt = await getTranslations("car.card");
  // Reuse the site nav's own label for this section rather than a second
  // translation of the same thing.
  const tNav = await getTranslations("header.nav");
  const tChina = await getTranslations("china");

  // The phone shell renders the title in its sticky header
  // (`@mobileHeader/china/[id]`), so the in-page trail + title are for the
  // desktop shell. Gated on the device cookie that picks the shell, not on a
  // breakpoint: a narrow desktop window has no sticky header and still needs it.
  const device = await getDevice();
  const showTitleHeader = device !== "mobile";

  const car = chinaListingToFixture(listing);
  const title = carTitle(car);
  const priceMnt = listing.price_mnt ?? null;
  const priceCny = listing.price_cny ?? null;
  const landed = landedCost.ok ? landedCost.cost.total : null;

  // The snapshot keeps the card-size thumbnail the API already sized, not the
  // full-size first photo, and the yuan price beside the tugrik one.
  const wishlistItem = {
    ...wishlistItemFromFixture(car, "china", priceMnt ?? 0),
    thumbnail: listing.thumb ?? undefined,
    priceOriginal: priceCny
      ? { amount: priceCny, currency: "CNY" as const }
      : undefined,
  };

  // Breadcrumb steps link into the `/china` list's own filters. `carTitle` is
  // brand + model, so the model step carries the model alone — "BMW › X5", not
  // "BMW › BMW X5". Without ids there is nothing to link, so the whole title
  // stays one plain step.
  const brandHref =
    listing.brand_id != null ? `/china?brand_id=${listing.brand_id}` : undefined;
  const modelHref =
    brandHref && listing.model_id != null
      ? `${brandHref}&model_id=${listing.model_id}`
      : undefined;
  const brandModelCrumbs: Crumb[] =
    brandHref && car.MARKA_NAME && car.MODEL_NAME
      ? [
          { label: car.MARKA_NAME, href: brandHref },
          { label: car.MODEL_NAME, href: modelHref },
        ]
      : [{ label: title }];

  const images = parseImages(car.IMAGES);
  const color = listing.color || undefined;
  const fuelType = listing.fuel_type || undefined;

  // Brand, model and grade are in the title band, so this grid holds only what
  // the title cannot say. Empty cells are dropped rather than shown as a dash:
  // an electric car has no displacement, only its horsepower.
  const specs: Array<{
    label: string;
    value: string | undefined;
    icon?: ReactNode;
    /** Spans both columns. */
    wide?: boolean;
  }> = [
      { label: t("specs.year"), value: car.YEAR || undefined, icon: <YearIcon /> },
      {
        label: t("specs.mileage"),
        value: formatMileage(listing.mileage ?? undefined, tFmt),
        icon: <MileageIcon />,
      },
      {
        label: t("specs.engine"),
        value: formatEngineWithPower(
          listing.engine_cc ?? undefined,
          listing.power ?? undefined,
        ),
        icon: <EngineIcon />,
      },
      {
        label: t("specs.fuel"),
        // AutoHome's six types, which the API only ever sends.
        value: fuelType ? tChina(`fuels.${fuelType}`) : undefined,
        icon: <FuelIcon />,
      },
      {
        label: t("specs.transmission"),
        value: formatTransmission(listing.transmission ?? undefined, tFmt),
        icon: <TransmissionIcon />,
      },
      {
        label: t("specs.drivetrain"),
        value: listing.drive ? tFmt(`drivetrain.${listing.drive}`) : undefined,
        icon: <DrivetrainIcon />,
      },
      {
        label: t("specs.bodyType"),
        value: listing.body_type || undefined,
        icon: <ChassisIcon />,
      },
      {
        label: t("specs.color"),
        value: color ? chinaColorLabel(color, t) : undefined,
        icon: (
          <ColorIcon swatch={getColorSwatch(chinaColorSwatchName(color ?? ""))} />
        ),
      },
      {
        label: t("specs.seats"),
        value: listing.seats ? String(listing.seats) : undefined,
        icon: <SeatIcon />,
      },
      {
        label: t("specs.regMonth"),
        value: listing.first_registered?.replaceAll("-", ".") || undefined,
        icon: <RegistrationIcon />,
      },
      // No location glyph exists yet; the grid renders a spacer in its place.
      { label: t("specs.location"), value: listing.city || undefined },
      // Seventeen characters do not fit half the card on a phone.
      { label: t("china.vin"), value: listing.vin || undefined, wide: true },
    ].filter((spec) => spec.value);

  return (
    <article className="mx-auto w-full max-w-7xl px-0 lg:px-6 lg:py-8">
      {/* Title band — breadcrumb plus the title/actions row, both full page
          width above the gallery. Skipped on the phone shell, whose sticky
          header already carries the title and grade. */}
      {showTitleHeader && (
        <>
          <CarBreadcrumb
            ariaLabel={t("breadcrumb.aria")}
            className="px-4 pt-5 pb-3 lg:px-0 lg:pt-0"
            items={[
              { label: t("breadcrumb.home"), href: "/" },
              { label: tNav("china"), href: "/china" },
              ...brandModelCrumbs,
            ]}
          />
          <header className="flex items-center justify-between gap-3 px-4 pb-6 lg:px-0">
            <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
              <h1 className="text-2xl font-bold leading-tight text-neutral-900 lg:text-[28px] dark:text-neutral-100">
                {title}
              </h1>
              {car.GRADE && (
                <span className="text-2xl font-normal leading-tight text-neutral-600 lg:text-[28px] dark:text-neutral-400">
                  {car.GRADE}
                </span>
              )}
            </div>
            {/* Below `lg` the actions live in the sticky bar instead, so
                exactly one copy of the heart exists at any width. No
                `enableCompare`: `GET /compare` fetches Japan and Korea only. */}
            <div className="hidden shrink-0 lg:block">
              <CarActionButtons item={wishlistItem} />
            </div>
          </header>
        </>
      )}

      <div className="lg:grid lg:grid-cols-[1.4fr_1fr] lg:items-start lg:gap-10">
        {/* Gallery — full-bleed on mobile (no side padding). The AJES host
            resizes on `&h=`, so the strip takes the ~4 KB thumb variant; eight
            columns because a full listing runs to 40-odd photos. */}
        <div className="pt-2 lg:p-0">
          <CarGallery
            images={images}
            alt={title}
            stripSize="thumb"
            stripColumns={8}
          />
        </div>

        {/* Info column. `px-4` is the mobile gutter the full-bleed gallery
            forces onto the children; on desktop the article's own `lg:px-6`
            already provides it. */}
        <div className="flex flex-col gap-5 px-4 py-5 lg:px-0 lg:py-0">
          {/* The asking price, only when there is no landed one to show: the
              landed card states it as its first row anyway. The tugrik figure
              leads; the yuan price it was converted from rides the caption. */}
          {!landed && (
            <div className="flex flex-col gap-2">
              <PriceTile
                label={t("china.priceLabel")}
                amount={priceMnt}
                fallback={priceCny ? formatCny(priceCny) : "-"}
                action={
                  priceMnt != null && priceCny ? (
                    <span className="shrink-0 text-[12px] font-semibold text-neutral-500 dark:text-neutral-400">
                      {formatCny(priceCny)}
                    </span>
                  ) : undefined
                }
              />
              <p className="px-1 text-[12px] leading-snug text-neutral-500 dark:text-neutral-400">
                {t("china.priceNote")}
              </p>
            </div>
          )}

          {/* Landed cost — or, when it could not be priced, why not. */}
          <ListingLandedPriceCard
            result={landedCost}
            newPrice={
              listing.new_price_cny
                ? {
                    label: t("china.newPriceLabel"),
                    amount: listing.new_price_cny,
                    currency: "CNY",
                  }
                : null
            }
          />

          {/* Specs — two columns, as on `/garage`: a third column truncates
              the city ("Kunming Yunnan") and the body class ("Medium and
              large SUV"). */}
          <section className="rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
            <div className="grid grid-cols-2 gap-x-3 gap-y-4">
              {specs.map(({ label, value, icon, wide }) => (
                <div
                  key={label}
                  className={cn(
                    "flex items-center gap-1.25",
                    wide && "col-span-2",
                  )}
                >
                  {icon ? (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-neutral-0 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                      {icon}
                    </span>
                  ) : (
                    // Invisible spacer — keeps the label column aligned.
                    <span className="h-6 w-6 shrink-0" aria-hidden />
                  )}
                  <div className="flex min-w-0 flex-col gap-0 leading-normal">
                    <span className="text-[11px] font-medium uppercase text-neutral-400 dark:text-neutral-500">
                      {label}
                    </span>
                    <span className="truncate text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
                      {value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Order CTA — after the price and the specs, as on `/korea/{id}`.
              Opens the contact sheet; the conversation moves to Messenger or
              the phone. */}
          <OrderInquiry carTitle={title} />
        </div>
      </div>

      {/* The full spec sheet — full width under both columns, as Korea's
          options panel sits. `px-4` is the mobile gutter (the article is
          `px-0` below `lg`). */}
      <div className="px-4 lg:mt-8 lg:px-0">
        <ChinaSpecSheet specs={listing.specs} options={listing.options} />
      </div>

      {/* Mobile sticky bar — the price plus the actions the title band hides
          below `lg`. `md:pr-24` keeps the controls clear of the AI chat FAB,
          which sits over the bar's right edge from 768px up. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-100 bg-white/95 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur-xl md:pr-24 lg:hidden dark:border-neutral-900 dark:bg-neutral-950/95">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col">
            <span className="text-[11px] font-semibold uppercase text-neutral-400">
              {landed ? landed.label : t("china.priceLabel")}
            </span>
            <span className="truncate text-base font-bold text-neutral-900 dark:text-neutral-100">
              {landed
                ? formatMnt(landed.amount)
                : priceMnt != null
                  ? formatMnt(priceMnt)
                  : priceCny
                    ? formatCny(priceCny)
                    : "-"}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <CarActionButtons item={wishlistItem} variant="bar" />
            <OrderInquiry carTitle={title} variant="bar" />
          </div>
        </div>
      </div>
      {/* Spacer so the sticky bar doesn't cover the last content on mobile */}
      <div className="h-20 lg:hidden" aria-hidden />
    </article>
  );
}
