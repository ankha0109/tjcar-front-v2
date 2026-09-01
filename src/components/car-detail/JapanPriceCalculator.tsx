"use client";

import { useState } from "react";
import { InputNumber } from "antd";
import { useTranslations } from "next-intl";
import BrandButton from "@/components/ui/BrandButton";
import CostBreakdown, { CostBreakdownPlaceholder } from "./CostBreakdown";
import Api, { ApiError } from "@/services/Api";
import type { ResourceObject } from "@/types/api";
import type { VehicleCost } from "@/types/vehicleCost";

type Props = {
  /** Auction house (AUCTION) — the backend prices nothing without its FOB row. */
  auctionName: string;
  /** Build year (YEAR). The auction states no month, so the age is assumed. */
  manufactureYear: number;
  /** Displacement in cc (ENG_V). */
  engineCc: number;
  /** Chassis code (KUZOV) — decides the hybrid excise class and the freight. */
  chassis: string;
  /** Prefills the input, so the first calculation is one tap away. */
  defaultPriceJpy?: number;
};

/**
 * The rows a Japanese answer carries, in the order the backend emits them
 * (`CostBreakdownBuilder::japanOriginLines`). Used only to outline the table
 * before the first calculation — see {@link CostBreakdownPlaceholder}.
 */
const PLACEHOLDER_LINES = [
  "BASE_PRICE",
  "JAPAN_COST",
  "JAPAN_SUBTOTAL_MNT",
  "FREIGHT",
  "EXCISE_TAX",
  "CUSTOMS_AND_VAT",
] as const;

/** Same refusals the Korean card treats as explanations rather than faults. */
function isRefusal(status: number): boolean {
  return status === 422 || status === 404 || status === 503;
}

/**
 * "Өөрийн үнээр тооцоолох" — the buyer types the yen they intend to bid and
 * gets the full tugrik breakdown for it.
 *
 * The tiles above answer "what will this car cost" on a price the buyer did not
 * choose: `PRICE_MNT` from comparable sales, `START_LANDED_MNT` from the
 * opening price. This answers the question they actually have — what their own
 * number lands at — with the same formula, so the figures agree. It sits beside
 * the comparable-sales chart for that reason: one column says what other cars
 * went for, the other what yours would cost.
 *
 * Every label, hint and amount in the result is built by
 * `POST /v1/vehicle-cost/calculate`; nothing is computed in the browser. The
 * request names the chassis and no freight: `transport_costs` is admin-owned
 * with no public endpoint, so the backend resolves that figure itself.
 *
 * Deliberately not calculated on mount. The page already shows two landed
 * prices without being asked; a third that fires before the buyer has typed
 * anything would just be a slower copy of one of them. The table is drawn from
 * the start all the same, dashed out, so the answer lands in place.
 */
export default function JapanPriceCalculator({
  auctionName,
  manufactureYear,
  engineCc,
  chassis,
  defaultPriceJpy,
}: Props) {
  const t = useTranslations("carDetail.japanCalculator");

  const [priceJpy, setPriceJpy] = useState<number | null>(
    defaultPriceJpy && defaultPriceJpy > 0 ? defaultPriceJpy : null,
  );
  const [cost, setCost] = useState<VehicleCost | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    if (!priceJpy || priceJpy <= 0) {
      setCost(null);
      setError(t("enterPrice"));

      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data } = await Api.post<ResourceObject<VehicleCost>>(
        "/v1/vehicle-cost/calculate",
        {
          country: "JAPAN",
          auctionName,
          purchasePriceJPY: Math.round(priceJpy),
          manufactureYear,
          engineCc,
          chassis,
        },
      );

      setCost(data);
    } catch (err) {
      setCost(null);

      if (err instanceof ApiError && isRefusal(err.status)) {
        const code = (err.details as { code?: string } | undefined)?.code;

        setError(
          code && t.has(`error.${code}`) ? t(`error.${code}`) : err.message,
        );
      } else {
        setError(t("error.NETWORK"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full min-w-0 flex-col">
      {/* Heading geometry copied from PriceHistoryChart: the two are columns of
          one section and have to read as siblings. */}
      <div className="mb-4 lg:mb-5">
        <h2 className="text-[17px] font-semibold tracking-tight text-neutral-900 lg:text-[20px] dark:text-neutral-100">
          {t("title")}
        </h2>
        <p className="mt-1 text-[13px] text-neutral-500 dark:text-neutral-400">
          {t("intro")}
        </p>
      </div>

      <section className="flex flex-1 flex-col rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
        <div className="flex flex-wrap items-center gap-2">
          <InputNumber
            value={priceJpy}
            onChange={setPriceJpy}
            onPressEnter={calculate}
            min={0}
            step={10_000}
            size="large"
            className="min-w-0 flex-1"
            /* Small enough that the input and the button still share one line
               at the narrowest this 30% column gets — the `lg` breakpoint
               itself. `flex-1` gives it the rest of the width anywhere wider. */
            style={{ minWidth: 120 }}
            placeholder={t("placeholder")}
            aria-label={t("inputLabel")}
            suffix="¥"
            formatter={(value) =>
              value == null ? "" : new Intl.NumberFormat("en-US").format(value)
            }
            parser={(value) => Number((value ?? "").replace(/[^\d]/g, ""))}
          />
          <BrandButton size="large" loading={loading} onClick={calculate}>
            {t("submit")}
          </BrandButton>
        </div>

        {cost ? (
          <CostBreakdown cost={cost} hintLabel={t("hintLabel")} />
        ) : (
          <CostBreakdownPlaceholder
            labels={PLACEHOLDER_LINES.map((code) => t(`lines.${code}`))}
            totalLabel={t("lines.TOTAL")}
          />
        )}

        {error && (
          <p className="mt-3 text-[13px] leading-relaxed text-amber-600 dark:text-amber-500">
            {error}
          </p>
        )}

        {/* `cost.verification.warnings` is deliberately not rendered for now.
            An auction lot never states its build month, so every quote carries
            the same "Үйлдвэрлэсэн сар мэдэгдэхгүй" notice and it reads as a
            fault in the quote rather than the caveat it is. The API still sends
            them — map over `cost.verification.warnings` here to bring the list
            back. KoreaLandedPriceCard withholds them for its own reason. */}

        {/* `mt-auto` pins the disclaimer to the bottom of the card, so the card
            can stretch to the chart's height without a gap under the total. */}
        <div className="mt-auto space-y-1.5 border-t border-neutral-200 pt-3 dark:border-neutral-800">
          <p className="text-[11px] leading-relaxed text-neutral-400 dark:text-neutral-500">
            {t("disclaimer")}
          </p>
          <p className="text-[11px] leading-relaxed text-neutral-400 dark:text-neutral-500">
            {t("note")}
          </p>
        </div>
      </section>
    </div>
  );
}
