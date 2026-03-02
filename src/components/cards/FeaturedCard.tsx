"use client";

import { Card, Tag, Rate } from "antd";
import Image from "next/image";
import { FeaturedCar } from "@/types/featured";
import { TugrigIcon } from "@/components/icons/TugrigIcon";
import dayjs from "dayjs";

type Props = {
  car: FeaturedCar;
};

const KPP_LABELS: Record<string, string> = {
  AT: "Автомат",
  FAT: "Бүтэн автомат",
  IAT: "Интеллект автомат",
  MT: "Механик",
};

export default function FeaturedCard({ car }: Props) {
  const firstImage = car.IMAGES?.split("#")[0];
  const startPrice = Number(car.START).toLocaleString();
  const mntPrice = car.PRICE_MNT?.toLocaleString();
  const transmission = KPP_LABELS[car.KPP] ?? car.KPP;
  const auctionDate = dayjs(car.AUCTION_DATE).format("YYYY/MM/DD");

  return (
    <Card
      hoverable
      className="overflow-hidden"
      styles={{ body: { padding: 12 } }}
      cover={
        <div className="relative w-full h-44 bg-gray-100">
          {firstImage ? (
            <Image
              src={firstImage}
              alt={`${car.MARKA_NAME} ${car.MODEL_NAME}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 320px"
              unoptimized
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Зураг байхгүй
            </div>
          )}
          <div className="absolute top-2 left-2">
            <Tag color="blue" className="text-xs font-medium">
              {car.AUCTION}
            </Tag>
          </div>
          <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
            #{car.LOT}
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-2">
        <div>
          <div className="flex items-start justify-between gap-1">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight">
              {car.MARKA_NAME} {car.MODEL_NAME}
            </h3>
            <Rate
              disabled
              defaultValue={Number(car.RATE)}
              count={5}
              className="text-xs shrink-0"
              style={{ fontSize: 11 }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{car.GRADE}</p>
        </div>

        <div className="grid grid-cols-3 gap-1 text-xs text-gray-600">
          <div className="flex flex-col">
            <span className="text-gray-400">Он</span>
            <span className="font-medium">{car.YEAR}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-400">Явсан</span>
            <span className="font-medium">
              {Number(car.MILEAGE).toLocaleString()} км
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-400">Мотор</span>
            <span className="font-medium">{Number(car.ENG_V) / 100}L</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-400">Хурд</span>
            <span className="font-medium">{transmission}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-400">Өнгө</span>
            <span className="font-medium capitalize">{car.COLOR}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-400">Дуусах</span>
            <span className="font-medium">{auctionDate}</span>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-2 mt-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">Эхлэх үнэ</p>
              <p className="text-sm font-bold text-gray-900">
                ¥{startPrice}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">MNT</p>
              <div className="flex items-center gap-0.5 justify-end">
                <TugrigIcon size={14} className="text-gray-700" />
                <p className="text-sm font-bold text-gray-700">{mntPrice}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
