"use client";

import { Button } from "antd";
import { cn } from "@/utils";

// Slim, flat, single-row chips for the All + day selectors. No shadow, no lift —
// they sit inline with the page. Fixed h-9 keeps the strip short and even.
const CHIP_BASE =
  "group! relative! inline-flex! shrink-0! flex-row! items-center! gap-1.5! rounded-xl! px-3! h-9! border-0! transition-colors! duration-150! focus:outline-none! focus-visible:ring-2! focus-visible:ring-primary/40!";

const CHIP_INACTIVE =
  "bg-neutral-100! text-neutral-700! hover:bg-neutral-200/70! dark:bg-neutral-800/60! dark:text-neutral-200! dark:hover:bg-neutral-800!";

const CHIP_ACTIVE =
  "bg-neutral-900! text-white! dark:bg-white! dark:text-neutral-900!";

export function AllTab({
  isActive,
  onClick,
  label,
  count,
  unit,
}: {
  isActive: boolean;
  onClick: () => void;
  label: string;
  count?: number;
  unit?: string;
}) {
  return (
    <Button
      type="text"
      role="tab"
      aria-selected={isActive}
      onClick={onClick}
      title={count != null && unit ? `${count} ${unit}` : undefined}
      className={cn(CHIP_BASE, isActive ? CHIP_ACTIVE : CHIP_INACTIVE)}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn(isActive ? "" : "text-neutral-400 group-hover:text-neutral-600")}
      >
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
      <span className="text-[12.5px] font-semibold">{label}</span>
      {count != null && (
        <CountBadge value={count} isActive={isActive} />
      )}
    </Button>
  );
}

export function DayTab({
  isActive,
  onClick,
  topLabel,
  day,
  month,
  count,
  emptyLabel,
  weekend,
  highlight,
}: {
  isActive: boolean;
  onClick: () => void;
  topLabel: string;
  day: string;
  month: string;
  count?: number;
  emptyLabel?: string;
  weekend?: boolean;
  highlight?: boolean;
}) {
  const showCount = count != null;
  const isEmpty = showCount && count === 0;
  return (
    <Button
      type="text"
      role="tab"
      aria-selected={isActive}
      onClick={onClick}
      className={cn(
        CHIP_BASE,
        isActive ? CHIP_ACTIVE : CHIP_INACTIVE,
        !isActive && isEmpty && "opacity-50!",
      )}
    >
      {highlight && (
        <span
          className={cn(
            "h-1.5 w-1.5 shrink-0 rounded-full",
            isActive ? "bg-current opacity-70" : "bg-primary",
          )}
        />
      )}
      <span
        className={cn(
          "whitespace-nowrap text-[11px] font-semibold uppercase tracking-wide",
          isActive ? "" : weekend ? "text-rose-500" : "text-neutral-400",
        )}
      >
        {topLabel}
      </span>
      <span className="inline-flex items-baseline gap-0.5">
        <span className="text-[14px] font-bold leading-none tabular-nums">
          {day}
        </span>
        <span
          className={cn(
            "text-[9.5px] font-medium uppercase",
            isActive ? "opacity-55" : "text-neutral-400",
          )}
        >
          {month}
        </span>
      </span>
      {showCount &&
        (isEmpty ? (
          <span
            className={cn(
              "text-[10px] font-medium",
              isActive ? "opacity-60" : "text-neutral-400",
            )}
          >
            {emptyLabel}
          </span>
        ) : (
          <CountBadge value={count} isActive={isActive} />
        ))}
    </Button>
  );
}

function CountBadge({ value, isActive }: { value: number; isActive: boolean }) {
  return (
    <span
      className={cn(
        "rounded-full px-1.5 text-[10px] font-semibold leading-4.5 tabular-nums",
        isActive
          ? "bg-white/20 text-current dark:bg-neutral-900/15"
          : "bg-primary/10 text-primary",
      )}
    >
      {value}
    </span>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/40 py-16">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-neutral-200">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-neutral-400"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </div>
      <p className="mt-3 text-[14px] font-medium text-neutral-700">{title}</p>
      <p className="mt-1 text-[12.5px] text-neutral-500">{description}</p>
    </div>
  );
}
