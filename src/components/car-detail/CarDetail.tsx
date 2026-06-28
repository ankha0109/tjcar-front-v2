import { getLocale, getTranslations } from "next-intl/server";
import CarGallery from "./CarGallery";
import CarBidCta from "./CarBidCta";
import { parseImages, type CarFixture, carTitle } from "@/lib/carFixtures";
import { getColorSwatch } from "@/utils/carColor";
import { formatEngine, formatMileage, formatTransmission } from "@/utils/carFormat";
import { cn } from "@/utils";

type Props = {
  car: CarFixture;
  /** Hide JPY price (auction detail, where we don't surface cost/start price). */
  hidePrice?: boolean;
};

function formatJpy(value: number) {
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

export default async function CarDetail({ car, hidePrice }: Props) {
  const locale = await getLocale();
  const t = await getTranslations("carDetail");
  const tFmt = await getTranslations("car.card");

  const title = carTitle(car);
  const images = parseImages(car.IMAGES);
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
    { label: t("specs.lot"), value: car.LOT || "—" },
    { label: t("specs.grade"), value: car.GRADE || "—" },
    { label: t("specs.chassis"), value: car.KUZOV || "—" },
    { label: t("specs.equipment"), value: car.EQUIP || "—" },
    { label: t("specs.rate"), value: car.RATE || "—" },
    { label: t("specs.auction"), value: car.AUCTION || "—" },
    {
      label: t("specs.auctionDate"),
      value: car.AUCTION_DATE ? formatDate(car.AUCTION_DATE, locale) : "—",
    },
  ];

  return (
    <article className="mx-auto w-full max-w-7xl px-0 lg:px-6 lg:py-8">
      <div className="lg:grid lg:grid-cols-[1.4fr_1fr] lg:items-start lg:gap-10">
        {/* Gallery */}
        <div className="lg:order-1">
          <div className="px-3 pt-3 lg:p-0">
            <CarGallery images={images} alt={title} />
          </div>
        </div>

        {/* Info column */}
        <div className="flex flex-col gap-5 px-4 py-5 lg:order-2 lg:py-0">
          <header className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              <span>{car.AUCTION || "—"}</span>
              <span aria-hidden>·</span>
              <span>
                {t("specs.lot")} {car.LOT}
              </span>
            </div>
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
          </header>

          {/* Price card */}
          <section
            className={cn(
              "flex items-end gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900",
              hidePrice ? "justify-end" : "justify-between",
            )}
          >
            {!hidePrice && (
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  {t("price.startLabel")}
                </div>
                <div className="mt-1 text-2xl font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
                  ¥{formatJpy(startNum || 0)}
                </div>
                {avgNum > 0 && (
                  <div className="mt-0.5 text-[12px] tabular-nums text-neutral-500 dark:text-neutral-400">
                    {t("price.avgPrefix")} ¥{formatJpy(avgNum)}
                  </div>
                )}
              </div>
            )}
            <div className="text-right">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                {t("specs.rate")}
              </div>
              <div className="mt-1 inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-emerald-50 px-3 text-[15px] font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                {car.RATE || "—"}
              </div>
            </div>
          </section>

          {/* Quick specs */}
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
              <Row label={t("specs.lot")} value={car.LOT || "—"} />
              <Row label={t("specs.rate")} value={car.RATE || "—"} />
            </dl>
          </section>

          {/* Desktop CTA */}
          <div className="hidden lg:block">
            <CarBidCta carTitle={title} />
            <p className="mt-2 text-[12px] text-neutral-500 dark:text-neutral-400">
              {t("bid.helper")}
            </p>
          </div>
        </div>
      </div>

      {/* Full spec table — full width */}
      <section className="mt-6 px-4 lg:px-0">
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

      {/* Mobile sticky CTA */}
      <div className="lg:hidden fixed inset-x-0 bottom-0 z-30 border-t border-neutral-100 bg-white/95 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur-xl dark:border-neutral-900 dark:bg-neutral-950/95">
        <div
          className={cn(
            "flex items-center gap-3",
            hidePrice ? "justify-stretch" : "justify-between",
          )}
        >
          {!hidePrice && (
            <div className="flex flex-col">
              <span className="text-[10.5px] font-semibold uppercase tracking-wider text-neutral-400">
                {t("price.startLabel")}
              </span>
              <span className="text-base font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
                ¥{formatJpy(startNum || 0)}
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
    </article>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[11px] font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
        {label}
      </dt>
      <dd className="font-medium text-neutral-900 dark:text-neutral-100">{value}</dd>
    </div>
  );
}
