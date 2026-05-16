"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import dayjs from "dayjs";
import "dayjs/locale/mn";
import FeaturedCard from "@/components/cards/FeaturedCard";
import FeaturedAuctionFilters from "@/components/cards/FeaturedAuctionFilters";
import {
  FilterOptions,
  FilterValues,
  filtersToQuery,
} from "@/types/filters";
import { FeaturedCar } from "@/types/featured";
import { cn } from "@/utils";

dayjs.locale("mn");

type Props = {
  initialCars: FeaturedCar[];
  initialFilters: FilterValues;
  filterOptions?: FilterOptions;
};

const RELATIVE_LABELS: Record<number, string> = {
  1: "Маргааш",
  2: "Нөгөөдөр",
};

const DAYS_AHEAD = 7;
const FILTER_DEBOUNCE_MS = 400;

function serializeFilters(filters: FilterValues): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filtersToQuery(filters))) {
    params.set(k, String(v));
  }
  return params.toString();
}

export default function FeaturedAuctionSchedule({
  initialCars,
  initialFilters,
  filterOptions,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<string>("all");
  const [filters, setFilters] = useState<FilterValues>(initialFilters);
  const lastPushedRef = useRef<string>(serializeFilters(initialFilters));

  useEffect(() => {
    const next = serializeFilters(filters);
    if (next === lastPushedRef.current) return;
    const handler = setTimeout(() => {
      lastPushedRef.current = next;
      startTransition(() => {
        router.replace(next ? `/?${next}` : "/", { scroll: false });
      });
    }, FILTER_DEBOUNCE_MS);
    return () => clearTimeout(handler);
  }, [filters, router]);

  const cars = initialCars;
  const isFetching = isPending;

  const days = useMemo(() => {
    const today = dayjs().startOf("day");
    return Array.from({ length: DAYS_AHEAD }, (_, i) => {
      const offset = i + 1;
      const d = today.add(offset, "day");
      return {
        key: d.format("YYYY-MM-DD"),
        topLabel: RELATIVE_LABELS[offset] ?? d.format("dddd"),
        middle: d.format("MM.DD"),
        full: d.format("YYYY-MM-DD"),
      };
    });
  }, []);

  const countsByDate = useMemo(() => {
    const m = new Map<string, number>();
    for (const car of cars) {
      const key = dayjs(car.AUCTION_DATE).format("YYYY-MM-DD");
      if (!key) continue;
      m.set(key, (m.get(key) ?? 0) + 1);
    }
    return m;
  }, [cars]);

  const filteredCars = useMemo(() => {
    if (selected === "all") return cars;
    return cars.filter(
      (c) => dayjs(c.AUCTION_DATE).format("YYYY-MM-DD") === selected,
    );
  }, [cars, selected]);

  const activeDayLabel = useMemo(() => {
    if (selected === "all") return null;
    const day = days.find((d) => d.key === selected);
    return day ? `${day.topLabel} · ${day.full}` : null;
  }, [selected, days]);

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-semibold tracking-tight text-neutral-900">
            Онцлох машинууд
          </h2>
          <p className="mt-1 text-[13px] text-neutral-500">
            {activeDayLabel
              ? activeDayLabel
              : "Ойрын 7 хоногийн дуудлагын хуваарь"}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium uppercase tracking-[0.16em] text-neutral-400">
          {isFetching ? (
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
          ) : (
            <span className="h-1 w-1 rounded-full bg-neutral-400" />
          )}
          {isFetching ? "Шинэчилж байна" : `Нийт ${filteredCars.length} машин`}
        </span>
      </div>

      <FeaturedAuctionFilters
        value={filters}
        onChange={setFilters}
        options={filterOptions}
      />

      <div className="-mx-4 mt-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div role="tablist" className="flex items-stretch gap-1.5">
          <TabButton
            isActive={selected === "all"}
            onClick={() => setSelected("all")}
            topLabel="Бүгд"
            middle={String(cars.length)}
            bottom="машин"
          />
          <div className="mx-1 self-stretch border-l border-neutral-200" />
          {days.map((day) => {
            const count = countsByDate.get(day.key) ?? 0;
            return (
              <TabButton
                key={day.key}
                isActive={selected === day.key}
                onClick={() => setSelected(day.key)}
                topLabel={day.topLabel}
                middle={day.middle}
                bottom={count > 0 ? `${count} машин` : "Хоосон"}
                dim={count === 0}
              />
            );
          })}
        </div>
      </div>

      {filteredCars.length > 0 ? (
        <div
          className={cn(
            "mt-6 grid grid-cols-1 gap-4 transition-opacity sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
            isFetching && "opacity-60",
          )}
        >
          {filteredCars.map((car) => (
            <FeaturedCard key={car.ID} car={car} />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </section>
  );
}

type TabButtonProps = {
  isActive: boolean;
  onClick: () => void;
  topLabel: string;
  middle: string;
  bottom: string;
  dim?: boolean;
};

function TabButton({
  isActive,
  onClick,
  topLabel,
  middle,
  bottom,
  dim,
}: TabButtonProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={onClick}
      className={cn(
        "group relative flex min-w-21 shrink-0 flex-col items-center justify-center rounded-2xl px-4 py-2.5 transition-all duration-200",
        isActive
          ? "bg-neutral-900 text-white shadow-[0_8px_20px_-10px_rgba(0,0,0,0.4)]"
          : "bg-neutral-100/70 text-neutral-700 hover:-translate-y-0.5 hover:bg-neutral-100",
        dim && !isActive && "opacity-60",
      )}
    >
      <span
        className={cn(
          "text-[10px] font-semibold uppercase tracking-[0.16em]",
          isActive ? "text-white/70" : "text-neutral-500",
        )}
      >
        {topLabel}
      </span>
      <span className="mt-0.5 text-[15px] font-semibold tabular-nums tracking-tight">
        {middle}
      </span>
      <span
        className={cn(
          "mt-1 text-[10.5px] font-medium tabular-nums",
          isActive
            ? "text-white/75"
            : dim
              ? "text-neutral-400"
              : "text-primary",
        )}
      >
        {bottom}
      </span>
      {isActive && (
        <span className="absolute -bottom-1 left-1/2 h-1 w-1.5 -translate-x-1/2 rounded-full bg-primary" />
      )}
    </button>
  );
}

function EmptyState() {
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
      <p className="mt-3 text-[14px] font-medium tracking-tight text-neutral-700">
        Тохирох машин олдсонгүй
      </p>
      <p className="mt-1 text-[12.5px] text-neutral-500">
        Шүүлтийн нөхцлөө өөрчилж үзнэ үү
      </p>
    </div>
  );
}
