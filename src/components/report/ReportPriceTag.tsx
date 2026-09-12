import { useTranslations } from "next-intl";
import { cn } from "@/utils";
import type { ReportPricing } from "@/services/config";

type Props = {
  pricing: ReportPricing;
  /** `lg` is for the two places the price is the point: the hero and the buy step/modal. */
  size?: "sm" | "lg";
  className?: string;
};

/**
 * The one place the report price is rendered — struck-through list price, the
 * price actually charged, and the percent off, all driven by `reportPricing()`.
 *
 * Every surface that quotes a price goes through here so a promo can never
 * half-apply: when `discounted` is false this collapses to a single number and
 * the page reads exactly as it did before the promo started.
 *
 * No `"use client"`: `useTranslations` works in both environments, and this
 * renders inside a Server Component (`ReportSteps`) and a client one
 * (`ReportLookupModal`, `ReportHero`) alike.
 */
export default function ReportPriceTag({
  pricing,
  size = "sm",
  className,
}: Props) {
  const t = useTranslations("reportPrice");
  const { price, listPrice, discounted, percentOff } = pricing;

  return (
    <span
      className={cn(
        "inline-flex flex-wrap items-baseline gap-x-2 gap-y-1",
        className,
      )}
    >
      {discounted ? (
        <span
          className={cn(
            "text-neutral-400 line-through dark:text-neutral-500",
            size === "lg" ? "text-[15px]" : "text-[13px]",
          )}
        >
          <span className="sr-only">{t("wasLabel")} </span>
          {listPrice.toLocaleString("mn-MN")}₮
        </span>
      ) : null}

      <span
        className={cn(
          "font-semibold",
          discounted ? "text-primary" : "text-neutral-900 dark:text-neutral-50",
          size === "lg" ? "text-[22px]" : "text-[17px]",
        )}
      >
        {price.toLocaleString("mn-MN")}₮
      </span>

      {discounted ? (
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11.5px] font-semibold text-primary">
          {t("discountBadge", { percent: percentOff })}
        </span>
      ) : null}
    </span>
  );
}
