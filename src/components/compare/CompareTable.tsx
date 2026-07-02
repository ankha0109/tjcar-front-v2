"use client";

import Image from "next/image";
import { Fragment } from "react";
import { useTranslations } from "next-intl";
import { Button } from "antd";
import { Link } from "@/i18n/navigation";
import { formatMnt } from "@/lib/bidConfig";
import {
  COMPARE_SECTIONS,
  type CompareValue,
  type ComparedCar,
} from "@/lib/compareAdapter";
import type { CarSource } from "@/types/car";
import { compareKey } from "@/types/compare";
import { cn } from "@/utils";

type Props = {
  cars: ComparedCar[];
  onRemove: (source: CarSource, id: string) => void;
};

/**
 * Hand-rolled table (antd Table fights the group-section rows + sticky label
 * column). Unified rows: a value one source can't fill renders as "—"; rows
 * empty for EVERY column are dropped, so a same-source comparison never shows
 * the other source's section.
 */
export default function CompareTable({ cars, onRemove }: Props) {
  const t = useTranslations();

  const renderValue = (value: CompareValue) => {
    if (value === null || value === "") {
      return <span className="text-neutral-300 dark:text-neutral-600">—</span>;
    }
    if (typeof value === "boolean") {
      return value ? t("compare.yes") : t("compare.no");
    }
    if (typeof value === "object") {
      // Evaluation sheet — thumbnail that opens the full sheet in a new tab.
      return (
        <a
          href={value.image}
          target="_blank"
          rel="noreferrer"
          className="inline-block"
          aria-label={t("compare.rows.evaluation")}
        >
          <Image
            src={value.image}
            alt={t("compare.rows.evaluation")}
            width={112}
            height={80}
            unoptimized
            className="h-20 w-auto rounded-md object-contain ring-1 ring-neutral-200 transition hover:opacity-80 dark:ring-neutral-800"
          />
        </a>
      );
    }
    return value;
  };

  const sections = COMPARE_SECTIONS.map((section) => ({
    ...section,
    rows: section.rows.filter((row) =>
      cars.some((car) => {
        const v = car.values[row.key];
        return v !== null && v !== "";
      }),
    ),
  })).filter((section) => section.rows.length > 0);

  const labelCellClass =
    "sticky left-0 z-10 border-b border-neutral-100 bg-white px-3 py-2.5 text-left align-top text-[12.5px] font-medium text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400";

  // `table-fixed` sizes columns from the header row only: the label column is
  // w-36 and every car column splits the rest EQUALLY — content length can no
  // longer widen a column and stretch its photo. The min width scales with the
  // column count so 3-4 cars still get usable columns behind a horizontal scroll.
  const minTableWidth = 144 + cars.length * 200;

  return (
    <div className="overflow-x-auto rounded-2xl border border-neutral-200 dark:border-neutral-800">
      <table
        className="w-full table-fixed border-separate border-spacing-0 text-sm"
        style={{ minWidth: minTableWidth }}
      >
        <thead>
          <tr>
            <th
              className={cn(labelCellClass, "z-20 w-36 bg-white dark:bg-neutral-950")}
            />
            {cars.map((car) => (
              <th
                key={compareKey(car.source, car.id)}
                className="border-b border-neutral-100 bg-white px-3 pb-3 pt-4 text-left align-top font-normal dark:border-neutral-800 dark:bg-neutral-950"
              >
                <div className="relative">
                  <Link href={car.href} className="group block">
                    {/* Fixed 4:3 box (CarCard pattern) so every column header
                        renders the same height regardless of the photo's own
                        aspect ratio. */}
                    <div className="relative mb-2 aspect-4/3 w-full overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
                      {car.image ? (
                        <Image
                          src={car.image}
                          alt={car.title}
                          fill
                          sizes="240px"
                          unoptimized
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-neutral-400">
                          {t("car.card.noImage")}
                        </div>
                      )}
                    </div>
                    <p className="truncate text-[13.5px] font-semibold text-neutral-900 group-hover:underline dark:text-neutral-100">
                      {car.title}
                    </p>
                  </Link>
                  {car.subtitle && (
                    <p className="mt-0.5 truncate text-[11.5px] font-normal text-neutral-500 dark:text-neutral-400">
                      {car.subtitle}
                    </p>
                  )}
                  {car.priceMnt != null && (
                    <p className="mt-1 text-[13px] font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
                      {formatMnt(car.priceMnt)}
                    </p>
                  )}
                  <Button
                    type="text"
                    size="small"
                    shape="circle"
                    aria-label={t("compare.dropdown.remove")}
                    onClick={() => onRemove(car.source, car.id)}
                    className="absolute! right-0 top-0 bg-white/85! shadow-sm! ring-1! ring-black/5! dark:bg-neutral-900/85!"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" x2="6" y1="6" y2="18" />
                      <line x1="6" x2="18" y1="6" y2="18" />
                    </svg>
                  </Button>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sections.map((section) => (
            <Fragment key={section.key}>
              <tr>
                <td
                  colSpan={cars.length + 1}
                  className="border-b border-neutral-100 bg-neutral-50 px-3 py-2 text-[11.5px] font-semibold uppercase tracking-wider text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400"
                >
                  {t(section.labelKey)}
                </td>
              </tr>
              {section.rows.map((row) => (
                <tr key={row.key}>
                  <td className={labelCellClass}>{t(row.labelKey)}</td>
                  {cars.map((car) => (
                    <td
                      key={compareKey(car.source, car.id)}
                      className="break-words border-b border-neutral-100 px-3 py-2.5 align-top text-[13px] text-neutral-900 dark:border-neutral-800 dark:text-neutral-100"
                    >
                      {renderValue(car.values[row.key] ?? null)}
                    </td>
                  ))}
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
