"use client";

import { useEffect, useMemo } from "react";
import { Alert } from "antd";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import CompareTable from "@/components/compare/CompareTable";
import { comparedCarFromEntry } from "@/lib/compareAdapter";
import { compareStore } from "@/lib/compareStore";
import type { CarSource } from "@/types/car";
import { buildCompareParam, type CompareEntry } from "@/types/compare";
import CompareEmptyState from "./CompareEmptyState";

type Props = {
  entries: CompareEntry[];
};

/**
 * Client side of `/compare?items=…`. The URL owns the comparison (refresh-safe),
 * so once at least one car loads the header tray auto-clears (spec: "амжилттай
 * болсон бол түр мэдээлэл цэвэрлэгдэнэ"). If every id died upstream the tray is
 * kept — a dead link must not destroy the user's picks.
 */
export default function CompareView({ entries }: Props) {
  const t = useTranslations();
  const router = useRouter();

  const anyFound = entries.some((entry) => entry.found);
  const missingCount = entries.filter((entry) => !entry.found).length;

  useEffect(() => {
    if (anyFound) compareStore.clear();
  }, [anyFound]);

  const cars = useMemo(
    () =>
      entries
        .map((entry) => comparedCarFromEntry(entry, t))
        .filter((car) => car !== null),
    [entries, t],
  );

  const handleRemove = (source: CarSource, id: string) => {
    const remaining = cars.filter(
      (car) => !(car.source === source && car.id === id),
    );
    router.replace(
      remaining.length > 0
        ? `/compare?items=${buildCompareParam(remaining)}`
        : "/compare",
    );
  };

  if (cars.length === 0) {
    return <CompareEmptyState />;
  }

  return (
    <div className="flex flex-col gap-4">
      {missingCount > 0 && (
        <Alert type="warning" showIcon message={t("compare.notice.missing")} />
      )}
      <CompareTable cars={cars} onRemove={handleRemove} />
    </div>
  );
}
