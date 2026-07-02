"use client";

import Image from "next/image";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { CarItem } from "@/types/car";
import { TugrigIcon } from "@/components/icons/TugrigIcon";
import { getGradeInfo } from "@/utils/auctionGrade";
import { withImageSize } from "@/utils/auctionImage";
import { getCountdown } from "@/utils/carCountdown";
import { formatEngine, formatMileage, formatTransmission } from "@/utils/carFormat";
import { cn } from "@/utils";
import { CardActions } from "../shared/CardActions";
import { CountdownBadge } from "../shared/CountdownBadge";
import { PremiumBadge, isPremiumCar } from "../shared/PremiumBadge";
import { ColorDot } from "../shared/SpecIcons";

export default function CarTableView({
  cars,
  hidePrice,
  onRowClick,
  disableCompare,
}: {
  cars: CarItem[];
  hidePrice?: boolean;
  onRowClick?: (car: CarItem) => void;
  /** Hide the compare toggle (cards whose `source` mislabels the id's upstream). */
  disableCompare?: boolean;
}) {
  const t = useTranslations("car.card");
  const tCol = useTranslations("featured.schedule.view.col");

  const columns = useMemo<ColumnsType<CarItem>>(() => {
    const cols: ColumnsType<CarItem> = [
      {
        title: tCol("car"),
        dataIndex: "marka",
        key: "car",
        width: 280,
        fixed: "left",
        render: (_, car) => <CarNameCell car={car} t={t} />,
      },
      {
        title: tCol("year"),
        dataIndex: "year",
        key: "year",
        width: 80,
        render: (year: string | undefined) => (
          <span className="tabular-nums">{year ?? "—"}</span>
        ),
      },
      {
        title: tCol("mileage"),
        dataIndex: "mileageKm",
        key: "mileage",
        width: 120,
        render: (_, car) => (
          <span className="tabular-nums">
            {formatMileage(car.mileageKm, t) ?? "—"}
          </span>
        ),
      },
      {
        title: tCol("engine"),
        dataIndex: "engineCc",
        key: "engine",
        width: 80,
        render: (cc: number | undefined) => (
          <span className="tabular-nums">{formatEngine(cc) ?? "—"}</span>
        ),
      },
      {
        title: tCol("transmission"),
        dataIndex: "transmission",
        key: "transmission",
        width: 100,
        render: (raw: string | undefined) =>
          formatTransmission(raw, t) ?? (
            <span className="text-neutral-400">—</span>
          ),
      },
      {
        title: tCol("color"),
        dataIndex: "color",
        key: "color",
        width: 130,
        render: (color: string | undefined) => {
          if (!color) return <span className="text-neutral-400">—</span>;
          return (
            <span className="inline-flex items-center gap-1.5 capitalize">
              <ColorDot color={color} size={10} />
              {color}
            </span>
          );
        },
      },
      {
        title: tCol("grade"),
        key: "grade",
        width: 90,
        render: (_, car) => {
          const grade = getGradeInfo(car.auction?.grade);
          if (!grade) return <span className="text-neutral-400">—</span>;
          const description = t(`grade.description.${grade.tier}`);
          return (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ring-1",
                grade.classes.badgeBg,
                grade.classes.badgeRing,
                grade.classes.badgeText,
              )}
              title={description}
            >
              {grade.symbol}
            </span>
          );
        },
      },
      {
        title: tCol("lot"),
        key: "lot",
        width: 90,
        render: (_, car) => (
          <span className="tabular-nums text-neutral-600 dark:text-neutral-300">
            {car.auction?.lot ? `#${car.auction.lot}` : "—"}
          </span>
        ),
      },
      {
        title: tCol("time"),
        key: "time",
        width: 130,
        render: (_, car) => {
          const countdown = getCountdown(car.auction?.date);
          if (!countdown) return <span className="text-neutral-400">—</span>;
          return (
            <CountdownBadge
              countdown={countdown}
              rawDate={car.auction?.date}
              source={car.source}
              size="sm"
            />
          );
        },
      },
      {
        title: tCol("price"),
        key: "price",
        width: 140,
        align: "right",
        render: (_, car) => <PriceCell car={car} />,
      },
      {
        title: "",
        key: "actions",
        width: 90,
        fixed: "right",
        align: "center",
        render: (_, car) => (
          <div className="flex justify-center">
            <CardActions
              car={car}
              visibility="always"
              absolute={false}
              disableCompare={disableCompare}
            />
          </div>
        ),
      },
    ];
    return hidePrice ? cols.filter((c) => c.key !== "price") : cols;
  }, [t, tCol, hidePrice, disableCompare]);

  return (
    <div className="-mx-4 px-4 lg:mx-0 lg:px-0">
      <Table<CarItem>
        columns={columns}
        dataSource={cars}
        rowKey="id"
        pagination={false}
        size="middle"
        scroll={{ x: "max-content" }}
        className="featured-car-table"
        onRow={
          onRowClick
            ? (car) => ({
                onClick: () => onRowClick(car),
                style: { cursor: "pointer" },
              })
            : undefined
        }
        rowClassName={(car) =>
          isPremiumCar(car.auction?.type)
            ? "featured-car-row-premium"
            : ""
        }
      />
    </div>
  );
}

function CarNameCell({
  car,
  t,
}: {
  car: CarItem;
  t: ReturnType<typeof useTranslations>;
}) {
  const isPremium = isPremiumCar(car.auction?.type);
  const heroImage = useMemo(() => {
    const src = car.images[0];
    if (!src) return null;
    return car.source === "japan" ? withImageSize(src, "thumb") : src;
  }, [car.images, car.source]);

  return (
    <div className="flex items-center gap-3">
      <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-100 ring-1 ring-neutral-200/70 dark:bg-neutral-800 dark:ring-neutral-700">
        {heroImage ? (
          <Image
            src={heroImage}
            alt={`${car.marka} ${car.model}`}
            fill
            className="object-cover"
            sizes="64px"
            unoptimized
          />
        ) : (
          <span className="flex h-full items-center justify-center text-[9px] text-neutral-400">
            {t("noImage")}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <div className="truncate text-[13px] font-medium text-neutral-500 dark:text-neutral-400">
            {car.marka}{" "}
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
              {car.model}
            </span>
          </div>
          {isPremium && <PremiumBadge size="sm" />}
        </div>
        {car.grade && (
          <div className="truncate text-[11px] text-neutral-500 dark:text-neutral-400">
            {car.grade}
          </div>
        )}
      </div>
    </div>
  );
}

function PriceCell({ car }: { car: CarItem }) {
  const mntPrice = car.price.mnt.toLocaleString();
  return (
    <div className="flex items-center justify-end gap-0.5">
      <TugrigIcon
        size={13}
        className="text-neutral-900 dark:text-neutral-100"
      />
      <span className="text-[14px] font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
        {mntPrice}
      </span>
    </div>
  );
}
