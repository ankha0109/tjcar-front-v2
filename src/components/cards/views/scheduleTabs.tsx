"use client";

import { useState } from "react";
import { Button, Drawer } from "antd";
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

export type ScheduleDayOption = {
  key: string; // "YYYY-MM-DD"
  topLabel: string; // relative label ("Маргааш") or dow ("Sat")
  day: string; // "04"
  month: string; // "Jul"
  weekend?: boolean;
  count?: number;
};

// Mobile replacement for ScheduleTabList: a rail-styled trigger that opens a
// bottom drawer of day options. Parents gate it behind `sm:hidden`; the
// component itself has no breakpoint knowledge.
export function ScheduleDayDrawer({
  selected,
  onSelect,
  allLabel,
  allCount,
  days,
  title,
  emptyLabel,
}: {
  selected: string; // "all" | "YYYY-MM-DD"
  onSelect: (key: string) => void;
  allLabel: string;
  allCount?: number;
  days: ScheduleDayOption[];
  title: string;
  emptyLabel?: string;
}) {
  const [open, setOpen] = useState(false);

  const activeDay = days.find((d) => d.key === selected);
  const triggerLabel =
    selected === "all"
      ? allLabel
      : activeDay
        ? `${activeDay.topLabel} · ${activeDay.day} ${activeDay.month}`
        : selected;

  const pick = (key: string) => {
    onSelect(key);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="flex h-10 w-full min-w-0 items-center justify-between gap-2 rounded-2xl border border-neutral-200/80 bg-neutral-50/70 px-3.5 text-[12.5px] font-bold text-neutral-800 transition-colors hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-100 dark:hover:bg-neutral-800"
      >
        <span className="truncate">{triggerLabel}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0 text-neutral-400"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        placement="bottom"
        size="auto"
        title={title}
        styles={{
          header: { padding: "16px 20px", borderBottom: "1px solid #f5f5f5" },
          body: { padding: "8px 8px 16px" },
          section: { borderTopLeftRadius: 16, borderTopRightRadius: 16 },
        }}
      >
        <div role="listbox" aria-label={title} className="flex flex-col">
          <DrawerRow
            isActive={selected === "all"}
            onClick={() => pick("all")}
            label={allLabel}
            count={allCount}
            emptyLabel={emptyLabel}
          />
          {days.map((d) => (
            <DrawerRow
              key={d.key}
              isActive={selected === d.key}
              onClick={() => pick(d.key)}
              label={`${d.day} ${d.month}`}
              topLabel={d.topLabel}
              weekend={d.weekend}
              count={d.count}
              emptyLabel={emptyLabel}
            />
          ))}
        </div>
      </Drawer>
    </>
  );
}

function DrawerRow({
  isActive,
  onClick,
  label,
  topLabel,
  weekend,
  count,
  emptyLabel,
}: {
  isActive: boolean;
  onClick: () => void;
  label: string;
  topLabel?: string;
  weekend?: boolean;
  count?: number;
  emptyLabel?: string;
}) {
  const isEmpty = count === 0;
  return (
    <button
      type="button"
      role="option"
      aria-selected={isActive}
      onClick={onClick}
      className={cn(
        "flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-colors",
        isActive
          ? "bg-neutral-100 dark:bg-neutral-800"
          : "hover:bg-neutral-50 dark:hover:bg-neutral-800/60",
        !isActive && isEmpty && "opacity-50",
      )}
    >
      <span
        className={cn(
          "inline-flex h-4 w-4 shrink-0 items-center justify-center text-neutral-900 dark:text-neutral-100",
          !isActive && "invisible",
        )}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </span>
      <span className="flex min-w-0 flex-1 items-baseline gap-1.5">
        {topLabel && (
          <span
            className={cn(
              "shrink-0 text-[10px] font-semibold uppercase tracking-wide",
              weekend
                ? "text-rose-500"
                : "text-neutral-400 dark:text-neutral-500",
            )}
          >
            {topLabel}
          </span>
        )}
        <span className="truncate text-[13.5px] font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
          {label}
        </span>
      </span>
      {count != null && !isEmpty && (
        <span className="rounded-full bg-primary/10 px-1.5 text-[10.5px] font-semibold leading-4.5 tabular-nums text-primary">
          {count}
        </span>
      )}
      {isEmpty && emptyLabel && (
        <span className="text-[10.5px] font-medium text-neutral-400">
          {emptyLabel}
        </span>
      )}
    </button>
  );
}
