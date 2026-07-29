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
import { getAuctionMoment } from "@/utils/auctionMoment";
import { formatEngine, formatMileage } from "@/utils/carFormat";
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
        render: (_, car) => <CarNameCell car={car} t={t} />,
      },
      {
        title: tCol("year"),
        dataIndex: "year",
        key: "year",
        width: 70,
        render: (year: string | undefined) => year ?? "-",
      },
      {
        title: tCol("mileage"),
        dataIndex: "mileageKm",
        key: "mileage",
        width: 105,
        responsive: ["sm"],
        render: (_, car) => formatMileage(car.mileageKm, t) ?? "-",
      },
      {
        title: tCol("engine"),
        dataIndex: "engineCc",
        key: "engine",
        width: 70,
        responsive: ["lg"],
        render: (cc: number | undefined) => formatEngine(cc) ?? "-",
      },
      {
        title: tCol("color"),
        dataIndex: "color",
        key: "color",
        width: 105,
        responsive: ["xl"],
        render: (color: string | undefined) => {
          if (!color) return <span className="text-neutral-400">-</span>;
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
        width: 65,
        responsive: ["xl"],
        render: (_, car) => {
          const grade = getGradeInfo(car.auction?.grade);
          if (!grade) return <span className="text-neutral-400">-</span>;
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
        title: tCol("time"),
        key: "time",
        // Wide enough for the longest pill, "Нөгөөдөр"-class day word + HH:mm.
        width: 150,
        responsive: ["sm"],
        render: (_, car) => {
          const moment = getAuctionMoment(car.auction?.date, car.source);
          if (!moment) return <span className="text-neutral-400">-</span>;
          return <CountdownBadge moment={moment} size="sm" />;
        },
      },
      {
        title: tCol("price"),
        key: "price",
        width: 120,
        align: "right",
        responsive: ["xl"],
        render: (_, car) => <PriceCell car={car} />,
      },
      {
        title: "",
        key: "actions",
        width: 92,
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
      {/* No `scroll.x` (and no `fixed` columns): the inner scroll container
          antd creates becomes a ~1400px-wide composited layer spanning every
          row, and with 40+ rows Chromium intermittently fails to rasterize it
          (whole bands of the table—or the page—render blank on scroll).
          Narrow viewports shed secondary columns via `responsive` instead. */}
      <Table<CarItem>
        columns={columns}
        dataSource={cars}
        rowKey="id"
        pagination={false}
        size="middle"
        tableLayout="fixed"
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
          isPremiumCar(car.auction?.type) ? "featured-car-row-premium" : ""
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
          {/* Below `sm` the name column is too narrow to carry both; the amber
              row tint already marks the lot as premium there. */}
          {isPremium && (
            <PremiumBadge size="sm" className="hidden sm:inline-flex" />
          )}
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
      <span className="text-[14px] font-bold text-neutral-900 dark:text-neutral-100">
        {mntPrice}
      </span>
    </div>
  );
}
