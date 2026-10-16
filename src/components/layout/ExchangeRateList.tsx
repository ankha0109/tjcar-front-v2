"use client";

import { useTranslations } from "next-intl";
import { ChinaIcon, JapanIcon, KoreaIcon, UsaIcon } from "@/components/icons";
import { formatRate } from "@/lib/exchangeRates";
import { useRates } from "@/providers/RatesProvider";
import { cn } from "@/utils";

/**
 * `code` doubles as the {@link Rates} key and — lower-cased — the
 * `header.topbar.rates.*` message key.
 *
 * Flags rather than currency signs: the yen and the yuan share `¥`, so the
 * signs left JPY and CNY telling themselves apart by colour alone. The flags
 * are the same artwork as the market links in the nav.
 */
const CURRENCIES = [
  { code: "USD", Flag: UsaIcon },
  { code: "JPY", Flag: JapanIcon },
  { code: "KRW", Flag: KoreaIcon },
  { code: "CNY", Flag: ChinaIcon },
] as const;

type Props = {
  /**
   * `menu` is the light-or-dark card in the tablet menu and the mobile drawer;
   * `footer` is the row inside the footer's permanently dark brand column;
   * `strip` is one inline row in the desktop header's permanently dark top
   * strip, its label shown only from `xl` up, where the strip has room for it.
   */
  variant: "menu" | "footer" | "strip";
  className?: string;
};

/**
 * The site's USD / JPY / KRW / CNY → MNT rates, live from `GET /config`.
 *
 * Every consumer prints the same row — flag, code, rate — and differs only in
 * its frame. A currency whose rate is 0 — what `getConfig` returns when the
 * API call fails, or when a backend has no row for it yet — is dropped, and
 * with nothing left to show the whole block disappears rather than leaving a
 * labelled empty box.
 */
export default function ExchangeRateList({ variant, className }: Props) {
  const t = useTranslations("header.topbar.rates");
  const rates = useRates();

  const shown = CURRENCIES.filter(({ code }) => rates[code] > 0);
  if (shown.length === 0) return null;

  const strip = variant === "strip";
  // The strip and the footer both sit on a permanently dark surface.
  const onDark = strip || variant === "footer";

  const items = shown.map(({ code, Flag }, i) => (
    <span
      key={code}
      className={cn(
        "items-center gap-1.5 text-[12px]",
        // A desktop shell in a phone-narrow window keeps only the first two
        // rates in the strip; all four overrun it below `sm`.
        strip && i >= 2 ? "hidden sm:flex" : "flex",
      )}
    >
      <Flag aria-hidden className="h-4 w-4 shrink-0" />
      <span
        className={
          onDark ? "text-neutral-400" : "text-neutral-500 dark:text-neutral-400"
        }
      >
        {t(code.toLowerCase())}
      </span>
      <span
        className={cn(
          "font-semibold",
          onDark ? "text-white" : "text-neutral-900 dark:text-neutral-100",
        )}
      >
        {formatRate(rates[code])}₮
      </span>
    </span>
  ));

  if (strip) {
    return (
      <div className={cn("flex items-center gap-4", className)}>
        <span className="hidden text-[12px] text-neutral-400 xl:inline">
          {t("label")}
        </span>
        {items}
      </div>
    );
  }

  return (
    <div className={className}>
      <div
        className={cn(
          "font-semibold uppercase",
          onDark
            ? "mb-2 text-[11px] text-neutral-500"
            : "mb-1.5 text-[10.5px] text-neutral-400 dark:text-neutral-500",
        )}
      >
        {t("label")}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {items}
      </div>
    </div>
  );
}
