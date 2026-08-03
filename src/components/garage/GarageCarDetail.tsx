import { getTranslations } from "next-intl/server";
import CarActionButtons from "@/components/car-detail/CarActionButtons";
import CarBreadcrumb from "@/components/car-detail/CarBreadcrumb";
import CarGallery from "@/components/car-detail/CarGallery";
import { carResourceToFixture, carTitle } from "@/lib/carFixtures";
import { getDevice } from "@/lib/device";
import { wishlistItemFromFixture } from "@/lib/wishlist";
import type { CarResource } from "@/types/car";
import { formatMileage } from "@/utils/carFormat";
import GarageContactCard from "./GarageContactCard";
import { SoldBadge, StockBadge } from "./StockBadge";

type Props = { car: CarResource };

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
    value,
  );
}

/**
 * Detail page for a car we already own (`GET /cars/{id}`, route `/garage/{id}`).
 *
 * Same shell as the auction and Encar pages — gallery left, facts right — but
 * every auction affordance is gone: there is nothing to bid on, no inspection
 * sheet, no comparable-sales chart and no landed-price estimate, because the
 * tugrik price is final and the car is already bought. The bid panel's slot goes
 * to {@link GarageContactCard}.
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
  const engineCc = parseInt(fixture.ENG_V, 10);
  const engine = Number.isFinite(engineCc)
    ? `${formatNumber(engineCc)}cc`
    : undefined;
  // `COLOR` is hand-typed free-text Mongolian ("Сувдан цагаан"), which neither
  // the Korean colour map nor the AJES word-splitting can key off — so it prints
  // raw, with no swatch rather than a misleading grey one.
  const color = fixture.COLOR || undefined;

  const wishlistItem = wishlistItemFromFixture(fixture, "stock", car.price);

  const quickSpecs: Array<{ label: string; value: string | undefined }> = [
    { label: t("specs.year"), value: fixture.YEAR || undefined },
    { label: t("specs.mileage"), value: mileage },
    { label: t("specs.engine"), value: engine },
    { label: t("specs.color"), value: color },
    { label: t("specs.rate"), value: fixture.RATE || undefined },
    { label: t("specs.grade"), value: fixture.GRADE || undefined },
  ];

  const detailedRows: Array<{ label: string; value: string | undefined }> = [
    { label: tg("specs.marka"), value: fixture.MARKA_NAME || undefined },
    { label: tg("specs.model"), value: fixture.MODEL_NAME || undefined },
    { label: t("specs.year"), value: fixture.YEAR || undefined },
    { label: t("specs.mileage"), value: mileage },
    { label: t("specs.engine"), value: engine },
    { label: t("specs.color"), value: color },
    { label: t("specs.rate"), value: fixture.RATE || undefined },
    { label: t("specs.grade"), value: fixture.GRADE || undefined },
    { label: t("specs.chassis"), value: fixture.KUZOV || undefined },
    {
      label: tg("specs.purchaseType"),
      value: car.type ? tg(`type.${car.type}`) : undefined,
    },
  ].filter((row) => row.value);

  return (
    <article className="mx-auto w-full max-w-7xl px-0 lg:px-6 lg:py-8">
      {showTitleHeader && (
        <CarBreadcrumb
          ariaLabel={t("breadcrumb.aria")}
          className="px-4 pt-5 pb-3 lg:px-0 lg:pt-0"
          items={[
            { label: t("breadcrumb.home"), href: "/" },
            { label: tNav("ready"), href: "/garage" },
            { label: title },
          ]}
        />
      )}

      <div className="lg:grid lg:grid-cols-[1.4fr_1fr] lg:items-start lg:gap-10">
        {/* Gallery — full-bleed on mobile (no side padding). `sizeVariants` is
            off because our own CDN keeps its variants in the file name, not in a
            `&w=` query suffix like the auction host. */}
        <div className="lg:order-1">
          <div className="pt-2 lg:p-0">
            <CarGallery images={images} alt={title} sizeVariants={false} />
          </div>
        </div>

        {/* Info column */}
        <div className="flex flex-col gap-5 px-4 py-5 lg:order-2 lg:py-0">
          {/* Skipped on the phone shell, whose sticky header already carries the
              title — two <h1>s for one car otherwise. Year/grade/colour all
              repeat in the quick specs below, so nothing is lost. */}
          {showTitleHeader && (
            <header className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold leading-tight text-neutral-900 lg:text-[28px] dark:text-neutral-100">
                  {title}
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-[13px] text-neutral-600 dark:text-neutral-400">
                  {fixture.YEAR && <span>{fixture.YEAR}</span>}
                  {fixture.GRADE && (
                    <>
                      <span aria-hidden>·</span>
                      <span>{fixture.GRADE}</span>
                    </>
                  )}
                  {color && (
                    <>
                      <span aria-hidden>·</span>
                      <span>{color}</span>
                    </>
                  )}
                </div>
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
          )}

          {/* Price hero. A sold car shows the status in the price's place —
              branching on `status`, never on `status_label`, which the backend
              returns as "Идэвхтэй" for sold cars too. */}
          <section className="rounded-2xl bg-neutral-900 p-4 ring-1 ring-white/10 dark:bg-neutral-800">
            <div className="text-[11px] font-semibold uppercase text-neutral-400">
              {isSold ? tg("tabs.sold") : tg("priceLabel")}
            </div>
            {isSold ? (
              <div className="mt-1 text-3xl font-extrabold leading-none text-neutral-500">
                {tg("sold")}
              </div>
            ) : (
              <div className="mt-1 text-4xl font-extrabold leading-none text-emerald-400">
                ₮{formatNumber(car.price)}
              </div>
            )}

            {!isSold && car.type && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
                <StockBadge type={car.type} label={tg(`type.${car.type}`)} />
                {/* Only ever set on `arriving_soon` cars upstream. */}
                {car.arrival_date && (
                  <span className="text-[12px] text-neutral-400">
                    {tg("arrivalLabel")}: {car.arrival_date}
                  </span>
                )}
              </div>
            )}
          </section>

          {/* Quick specs */}
          <section className="grid grid-cols-3 gap-2">
            {quickSpecs.map(({ label, value }) => (
              <div
                key={label}
                className="flex flex-col gap-0.5 rounded-xl border border-neutral-200/80 bg-white px-3 py-2.5 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <span className="text-[11px] font-medium uppercase text-neutral-400 dark:text-neutral-500">
                  {label}
                </span>
                <span className="truncate text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
                  {value || "-"}
                </span>
              </div>
            ))}
          </section>

          {/* Full spec table. Rows with no value are dropped rather than shown
              as a dash — `KUZOV` is empty on most rows and `GRADE` on some. */}
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
          </section>

          <GarageContactCard />
        </div>
      </div>

      {/* Mobile sticky bar. `md:pr-24` keeps the button clear of the AI chat FAB,
          which overlaps this corner between 768px and 1023px (iPad portrait). */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-100 bg-white/95 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur-xl md:pr-24 lg:hidden dark:border-neutral-900 dark:bg-neutral-950/95">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col">
            <span className="text-[11px] font-semibold uppercase text-neutral-400">
              {isSold ? tg("tabs.sold") : tg("priceLabel")}
            </span>
            {isSold ? (
              <SoldBadge label={tg("sold")} className="mt-0.5 self-start" />
            ) : (
              <span className="truncate text-base font-bold text-neutral-900 dark:text-neutral-100">
                ₮{formatNumber(car.price)}
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
