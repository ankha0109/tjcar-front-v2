"use client";

import { useTranslations } from "next-intl";
import { formatRate } from "@/lib/exchangeRates";
import { useRates } from "@/providers/RatesProvider";
import { cn } from "@/utils";
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const DollarIcon = (props: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    {...props}
  >
    <line x1="12" y1="2" x2="12" y2="22" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const YenIcon = (props: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    {...props}
  >
    <path d="M6 3l6 9 6-9" />
    <line x1="12" y1="12" x2="12" y2="21" />
    <line x1="5" y1="14" x2="19" y2="14" />
    <line x1="5" y1="18" x2="19" y2="18" />
  </svg>
);

const WonIcon = (props: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    {...props}
  >
    <path d="M3 4.5L6.8 18 12 8.5 17.2 18 21 4.5" />
    <line x1="2.5" y1="11" x2="21.5" y2="11" />
    <line x1="2.5" y1="14.5" x2="21.5" y2="14.5" />
  </svg>
);

/**
 * `code` doubles as the {@link Rates} key and — lower-cased — the
 * `header.topbar.rates.*` message key.
 */
const CURRENCIES = [
  {
    code: "USD",
    Icon: DollarIcon,
    tone: "text-emerald-600 dark:text-emerald-400",
    darkTone: "text-emerald-400",
  },
  {
    code: "JPY",
    Icon: YenIcon,
    tone: "text-rose-500 dark:text-rose-400",
    darkTone: "text-rose-400",
  },
  {
    code: "KRW",
    Icon: WonIcon,
    tone: "text-sky-600 dark:text-sky-400",
    darkTone: "text-sky-400",
  },
] as const;

type Props = {
  /**
   * `menu` is the light-or-dark card in the desktop menu and the mobile drawer;
   * `footer` is the row inside the footer's permanently dark brand column.
   */
  variant: "menu" | "footer";
  className?: string;
};

/**
 * The site's USD / JPY / KRW → MNT rates, live from `GET /config`.
 *
 * The three consumers each used to carry their own copy of the markup and of
 * the currency icons. A currency whose rate is 0 — what `getConfig` returns
 * when the API call fails — is dropped, and with nothing left to show the whole
 * block disappears rather than leaving a labelled empty box.
 */
export default function ExchangeRateList({ variant, className }: Props) {
  const t = useTranslations("header.topbar.rates");
  const rates = useRates();

  const shown = CURRENCIES.filter(({ code }) => rates[code] > 0);
  if (shown.length === 0) return null;

  const footer = variant === "footer";

  return (
    <div className={className}>
      <div
        className={cn(
          "font-semibold uppercase",
          footer
            ? "mb-2 text-[11px] text-neutral-500"
            : "mb-1.5 text-[10.5px] text-neutral-400 dark:text-neutral-500",
        )}
      >
        {t("label")}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {shown.map(({ code, Icon, tone, darkTone }) => (
          <div key={code} className="flex items-center gap-1.5">
            <Icon className={cn("h-3.5 w-3.5", footer ? darkTone : tone)} />
            <span
              className={cn(
                "text-[12px] font-semibold",
                footer
                  ? "text-white"
                  : "text-neutral-900 dark:text-neutral-100",
              )}
            >
              {t(code.toLowerCase())} {formatRate(rates[code])}
            </span>
            <span
              className={cn(
                "text-[11px]",
                footer ? "text-neutral-500" : "text-neutral-400",
              )}
            >
              ₮
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
