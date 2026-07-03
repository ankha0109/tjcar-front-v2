"use client";

import { Button } from "antd";
import { cn } from "@/utils";

// Segmented date rail: calendar-style two-line tiles inside one rounded
// container. Matches ViewModeSwitcher's rail exactly (border + tinted bg +
// p-1 + 32px inner buttons) so the two controls read as one aligned system.
export function ScheduleTabList({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="tablist"
      className="inline-flex items-stretch gap-0.5 rounded-2xl border border-neutral-200/80 bg-neutral-50/70 p-1 dark:border-neutral-800 dark:bg-neutral-900/40"
    >
      {children}
    </div>
  );
}

// h-8 keeps the tile the same height as ViewModeSwitcher's buttons; the two
// text lines stay readable by dropping to micro sizes with leading-none.
const TILE_BASE =
  "group! relative! inline-flex! h-8! shrink-0! flex-col! items-center! justify-center! gap-[3px]! rounded-xl! border-0! px-2.5! transition-all! duration-150! focus:outline-none! focus-visible:ring-2! focus-visible:ring-primary/40!";

const TILE_INACTIVE =
  "bg-transparent! text-neutral-800! hover:bg-white! hover:shadow-sm! dark:text-neutral-100! dark:hover:bg-neutral-800!";

const TILE_ACTIVE =
  "bg-neutral-900! text-white! shadow-sm! dark:bg-white! dark:text-neutral-900!";

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
      className={cn(
        TILE_BASE,
        "min-w-12!",
        isActive ? TILE_ACTIVE : TILE_INACTIVE,
      )}
    >
      <span className="inline-flex items-center gap-1.5">
        <span className="text-[12.5px] font-bold">{label}</span>
        {count != null && <CountBadge value={count} isActive={isActive} />}
      </span>
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
        TILE_BASE,
        "min-w-14!",
        isActive ? TILE_ACTIVE : TILE_INACTIVE,
        !isActive && isEmpty && "opacity-50!",
      )}
    >
      <span className="inline-flex items-center gap-1 leading-none">
        {highlight && (
          <span
            className={cn(
              "h-1 w-1 shrink-0 rounded-full",
              isActive ? "bg-current opacity-70" : "bg-primary",
            )}
          />
        )}
        <span
          className={cn(
            "whitespace-nowrap text-[9px] font-semibold uppercase leading-none tracking-wide",
            weekend
              ? isActive
                ? "text-rose-300 dark:text-rose-500"
                : "text-rose-500"
              : isActive
                ? "opacity-60"
                : "text-neutral-400 dark:text-neutral-500",
          )}
        >
          {topLabel}
        </span>
        {showCount && !isEmpty && (
          <CountBadge value={count} isActive={isActive} />
        )}
      </span>
      <span className="inline-flex items-baseline gap-1">
        <span className="text-[12.5px] font-bold leading-none tabular-nums">
          {day}
        </span>
        <span
          className={cn(
            "whitespace-nowrap text-[8.5px] font-medium uppercase leading-none",
            isActive ? "opacity-55" : "text-neutral-400 dark:text-neutral-500",
          )}
        >
          {month}
        </span>
        {showCount && isEmpty && (
          <span
            className={cn(
              "text-[8.5px] font-medium leading-none",
              isActive ? "opacity-60" : "text-neutral-400",
            )}
          >
            {emptyLabel}
          </span>
        )}
      </span>
    </Button>
  );
}

function CountBadge({ value, isActive }: { value: number; isActive: boolean }) {
  return (
    <span
      className={cn(
        "rounded-full px-1 text-[9px] font-semibold leading-3.5 tabular-nums",
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
