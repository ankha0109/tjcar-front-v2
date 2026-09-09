import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import CarActionButtons from "@/components/car-detail/CarActionButtons";
import CarBreadcrumb from "@/components/car-detail/CarBreadcrumb";
import CarGallery from "@/components/car-detail/CarGallery";
import RateCard from "@/components/car-detail/RateCard";
import {
  ChassisIcon,
  ColorIcon,
  EngineIcon,
  MileageIcon,
  YearIcon,
} from "@/components/icons/CarSpecIcons";
import { formatMnt } from "@/lib/bidConfig";
import { carResourceToFixture, carTitle } from "@/lib/carFixtures";
import { getDevice } from "@/lib/device";
import { wishlistItemFromFixture } from "@/lib/wishlist";
import type { CarResource } from "@/types/car";
import { getColorSwatch } from "@/utils/carColor";
import { formatEngineWithPower, formatMileage } from "@/utils/carFormat";
import CarDescription from "./CarDescription";
import GarageContactCard from "./GarageContactCard";
import GaragePriceCard from "./GaragePriceCard";
import GarageStatusCard from "./GarageStatusCard";
import { SoldBadge } from "./StockBadge";

type Props = { car: CarResource };

/**
 * Detail page for a car we already own (`GET /cars/{id}`, route `/garage/{id}`).
 *
 * Built on the Japan lot page's shell — full-width title band above the photos,
 * gallery left, a column of cards right — with every auction affordance gone:
 * there is nothing to bid on, no inspection sheet, no comparable-sales chart and
 * no landed-price estimate, because the tugrik price is final and the car is
 * already bought. The bid panel's slot goes to the price tile, the seller's
 * write-up and {@link GarageContactCard}.
 *
 * It does not reuse `EncarDetail`: that component's landed-price card, options
 * panel and inspection block are all gated behind its Encar-only `encar` prop,
 * so feeding it a stock car would mean faking Korean listing data.
 */
export default async function GarageCarDetail({ car }: Props) {
  const t = await getTranslations("carDetail");
  const tg = await getTranslations("garage");
  const tFmt = await getTranslations("car.card");
  // Reuse the site nav's own label for this section rather than a second
  // translation of the same thing.
  const tNav = await getTranslations("header.nav");

  // The phone shell renders the title in its sticky header
  // (`@mobileHeader/garage/[id]`), so the in-page trail + title are for the
  // desktop shell. Gated on the device cookie that picks the shell, not on a
  // breakpoint: a narrow desktop window has no sticky header and still needs it.
  const device = await getDevice();
  const showTitleHeader = device !== "mobile";

  const fixture = carResourceToFixture(car);
  const title = carTitle(fixture);
  const isSold = car.status === "sold";

  // Admin uploads are all car photos — unlike an AJES lot, index 0 is not an
  // evaluation sheet, so nothing is sliced off.
  const images = car.images ?? [];

  const mileage = formatMileage(Number(fixture.MILEAGE) || undefined, tFmt);
  // No `PW` in the nine hand-typed `car_data` keys, so this is displacement
  // alone — "2,000CC", formatted by the same helper the lot pages use.
  const engine = formatEngineWithPower(Number(fixture.ENG_V) || undefined, undefined);
  // `COLOR` is hand-typed free-text ("Хар", "Сувдан цагаан"), which is exactly
  // what the swatch map keys off — it carries Mongolian names and falls back to
  // the last matching word, so "Сувдан цагаан" still resolves to white. An
  // unrecognised name gets the same grey dot it does on the lot pages.
  const color = fixture.COLOR || undefined;

  const wishlistItem = wishlistItemFromFixture(fixture, "stock", car.price);

  // One element, two placements: beside the grade when there is one, alone when
  // there is not.
  const priceTile = <GaragePriceCard price={car.price} isSold={isSold} />;

  // Brand, model and grade are in the title band (and, on the phone shell, in
  // the sticky header's two lines), so they are deliberately absent here — this
  // grid holds only what the title cannot say. Empty cells are dropped rather
  // than shown as a dash: `KUZOV` is null on most stock rows.
  const specs: Array<{
    label: string;
    value: string | undefined;
    icon: ReactNode;
  }> = [
    { label: t("specs.year"), value: fixture.YEAR || undefined, icon: <YearIcon /> },
    { label: t("specs.mileage"), value: mileage, icon: <MileageIcon /> },
    { label: t("specs.engine"), value: engine, icon: <EngineIcon /> },
    {
      label: t("specs.color"),
      value: color,
      icon: <ColorIcon swatch={getColorSwatch(color ?? "")} />,
    },
    {
      label: t("specs.chassis"),
      value: fixture.KUZOV || undefined,
      icon: <ChassisIcon />,
    },
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
              { label: tNav("ready"), href: "/garage" },
              { label: title },
            ]}
          />
          <header className="flex items-center justify-between gap-3 px-4 pb-6 lg:px-0">
            {/* Grade trails the title on the same baseline rather than taking
                its own line — the band is above the fold, so the row saved is
                worth more than the separation. */}
            <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
              <h1 className="text-2xl font-bold leading-tight text-neutral-900 lg:text-[28px] dark:text-neutral-100">
                {title}
              </h1>
              {fixture.GRADE && (
                <span className="text-2xl font-normal leading-tight text-neutral-600 lg:text-[28px] dark:text-neutral-400">
                  {fixture.GRADE}
                </span>
              )}
            </div>
            {/* Below `lg` the actions live in the sticky bar instead, so
                exactly one copy of the heart exists at any width — including a
                narrow desktop-shell window, which still renders this header.
                No `enableCompare`: `GET /compare` cannot re-fetch a local
                stock id, so stock cars are wishlist-only. */}
            <div className="hidden shrink-0 lg:block">
              <CarActionButtons item={wishlistItem} />
            </div>
          </header>
        </>
      )}

      {/* Flex, not grid: the write-up makes the info column taller than the
          gallery, and each column should end where its own content does. */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:gap-x-10">
        {/* Gallery — full-bleed on mobile (no side padding). `sizeVariants` is
            off because our own CDN keeps its variants in the file name, not in a
            `&w=` query suffix like the auction host. */}
        <div className="pt-2 lg:min-w-0 lg:grow-[1.4] lg:basis-0 lg:pt-0">
          <CarGallery images={images} alt={title} sizeVariants={false} />
        </div>

        {/* Info column. `px-4` is the mobile gutter the full-bleed gallery
            forces onto the children (the article itself is `px-0` below `lg`);
            on desktop the article's own `lg:px-6` already provides it, so this
            has to drop or the column sits 16px inside its track — a right edge
            that misses the header's. */}
        <div className="flex flex-col gap-5 px-4 py-5 lg:min-w-0 lg:grow lg:basis-0 lg:px-0 lg:py-0">
          {/* Where the car is, first and large. Dropped once sold: the price
              tile's whole face already reads "Зарагдсан", and the shipping
              stage of a car someone else drove off in is not news. */}
          {!isSold && car.type && (
            <GarageStatusCard
              type={car.type}
              label={tg(`type.${car.type}`)}
              caption={tg("statusLabel")}
              arrivalDate={car.arrival_date}
              arrivalLabel={tg("arrivalLabel")}
            />
          )}

          {/* Headline tiles — inspection grade + the tugrik asking price, the
              Japan lot page's 2/5 – 3/5 pairing, down to the grid. A stock row
              with no grade — `RATE` is hand-typed and sometimes blank — gives
              the price the whole width instead of a hole. */}
          {fixture.RATE ? (
            <div className="grid grid-cols-5 gap-3">
              <div className="col-span-2">
                <RateCard rate={fixture.RATE} label={t("specs.rate")} />
              </div>
              <div className="col-span-3">{priceTile}</div>
            </div>
          ) : (
            priceTile
          )}

          {/* Specs — one card, the Japan lot page's icon grid. Filled rather
              than the outline that page uses: here it has the write-up and the
              contact card under it, and an unfilled card between two filled
              ones reads as a hole in dark mode, where the page is near-black
              and the cards are not. */}
          <section className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            {/* Two columns, not the lot page's three: a stock row carries four
                or five facts against an auction lot's eleven, and at three the
                cells are narrow enough to truncate "Мөнгөлөг" while the last
                row sits two thirds empty. */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-4">
              {specs.map(({ label, value, icon }) => (
                <div key={label} className="flex items-center gap-1.25">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-neutral-0 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                    {icon}
                  </span>
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

          {/* The seller's own write-up. Hides itself when the field is empty,
              which is every car registered before the editor existed. */}
          <CarDescription html={car.description} />

          <GarageContactCard />
        </div>
      </div>

      {/* Mobile sticky bar. `md:pr-24` keeps the button clear of the AI chat FAB,
          which overlaps this corner between 768px and 1023px (iPad portrait). */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-100 bg-white/95 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur-xl md:pr-24 lg:hidden dark:border-neutral-900 dark:bg-neutral-950/95">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col">
            <span className="text-[11px] font-semibold uppercase text-neutral-400">
              {isSold ? tg("statusLabel") : tg("priceLabel")}
            </span>
            {isSold ? (
              <SoldBadge label={tg("sold")} className="mt-0.5 self-start" />
            ) : (
              <span className="truncate text-base font-bold text-neutral-900 dark:text-neutral-100">
                {formatMnt(car.price)}
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <CarActionButtons item={wishlistItem} variant="bar" />
            <a
              href="tel:+97675115888"
              className="flex h-10 items-center justify-center rounded-xl bg-neutral-900 px-4 text-[13px] font-semibold text-white dark:bg-white dark:text-neutral-900"
            >
              {tg("contact.cta")}
            </a>
          </div>
        </div>
      </div>
      {/* Spacer so the sticky bar doesn't cover the last content on mobile */}
      <div className="h-20 lg:hidden" aria-hidden />
    </article>
  );
}
