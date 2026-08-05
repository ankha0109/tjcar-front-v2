"use client";

import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/utils";
import { ChevronIcon } from "./icons";

type Props = {
  /** Line icon, already sized and coloured by the caller. */
  icon: ReactNode;
  label: string;
  /** Count on the right. Hidden when 0 or undefined — a zero says nothing. */
  badge?: number;
  /** Replaces the chevron (a Switch, say). Makes the row non-navigating. */
  trailing?: ReactNode;
  /** Internal route. Exclusive with `external` and `onClick`. */
  href?: string;
  /** `tel:` or an absolute URL — rendered as a plain anchor. */
  external?: string;
  onClick?: () => void;
  /** Destructive styling, and no chevron: this row leaves rather than goes. */
  danger?: boolean;
};

/**
 * One row of the mobile dashboard menu.
 *
 * Touch feedback is `active:`, not `hover:` — Tailwind v4 gates hover behind
 * `(hover:hover)` in this project, so a hover style is invisible on a phone.
 */
export default function MobileMenuRow({
  icon,
  label,
  badge,
  trailing,
  href,
  external,
  onClick,
  danger,
}: Props) {
  const inner = (
    <>
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center",
          danger && "text-rose-500",
        )}
      >
        {icon}
      </span>
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-[15px]",
          danger
            ? "text-rose-600 dark:text-rose-400"
            : "text-neutral-900 dark:text-neutral-100",
        )}
      >
        {label}
      </span>
      {badge ? (
        <span className="shrink-0 rounded-full bg-neutral-100 px-2 text-[12px] font-semibold leading-5 tabular-nums text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
      {trailing ? (
        trailing
      ) : danger ? null : (
        <ChevronIcon className="h-3.5 w-3.5 shrink-0 text-neutral-300 dark:text-neutral-600" />
      )}
    </>
  );

  const className = cn(
    "flex min-h-[52px] w-full items-center gap-3 px-4 py-2 text-left",
    (href || external || onClick) &&
      "active:bg-neutral-50 dark:active:bg-neutral-800",
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }

  if (external) {
    return (
      <a href={external} className={className}>
        {inner}
      </a>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {inner}
      </button>
    );
  }

  return <div className={className}>{inner}</div>;
}
