"use client";

import { useEffect } from "react";
import { App, Form, Input, InputNumber, Segmented } from "antd";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import Api, { ApiError } from "@/services/Api";
import { WALLET_BALANCE_KEY } from "@/hooks/useWalletBalance";
import BrandButton from "@/components/ui/BrandButton";
import { advanceTier, formatJpy, formatMnt } from "@/lib/bidConfig";

type BidValues = {
  bid_price: number;
  currency: "MNT" | "JPY";
};

type Props = {
  /** AJES lot id — sent as `auction_id` to POST /bids. */
  auctionId: string;
  /** JPY start price (auction opening price). */
  startPrice: number;
  /** Minimum acceptable MNT bid, from POST /calculator. */
  minAmount: number;
  /** Calculator request still in flight. */
  loadingMin: boolean;
  /** Whether the user may switch currency (v1: user.type === 2). */
  canChooseCurrency: boolean;
  /** Live JPY → MNT rate, for the approximate MNT preview on JPY bids. */
  jpyRate: number;
  /** Called right before navigation on a successful bid (e.g. close the drawer). */
  onSubmitted?: () => void;
};

export default function CarBidForm({
  auctionId,
  startPrice,
  minAmount,
  loadingMin,
  canChooseCurrency,
  jpyRate,
  onSubmitted,
}: Props) {
  const t = useTranslations("carDetail.bid");
  const { modal } = App.useApp();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [form] = Form.useForm<BidValues>();
  const currency = Form.useWatch("currency", form) ?? "MNT";
  const bidPrice = Form.useWatch("bid_price", form) ?? 0;

  // Re-run the min-price validation whenever the currency flips, since the
  // threshold (JPY start vs MNT minimum) changes with it.
  useEffect(() => {
    if (form.getFieldValue("bid_price") != null) {
      form.validateFields(["bid_price"]).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currency]);

  const isJpy = currency === "JPY";

  const submitBid = (values: BidValues) => {
    modal.confirm({
      title: t("confirmTitle"),
      content: t("confirmBody"),
      okText: t("confirmOk"),
      cancelText: t("confirmCancel"),
      centered: true,
      onOk: async () => {
        try {
          const res = await Api.post<{ message?: string }>("/bids", {
            auction_id: auctionId,
            bid_price: values.bid_price,
            currency: values.currency,
          });
          onSubmitted?.();
          // Refresh the wallet balance so any hold/deduction the backend applies
          // is reflected in the header (and any still-mounted bid gate).
          queryClient.invalidateQueries({ queryKey: WALLET_BALANCE_KEY });
          modal.success({
            title: t("successTitle"),
            content: res?.message || t("successFallback"),
            okText: t("ok"),
            centered: true,
          });
          router.push("/dashboard");
        } catch (err) {
          modal.error({
            title: t("errorTitle"),
            content: err instanceof ApiError ? err.message : t("errorFallback"),
            okText: t("ok"),
            centered: true,
          });
        }
      },
    });
  };

  const tier = advanceTier(bidPrice);
  const advance = (bidPrice * tier.percent) / 100;
  const remainder = (bidPrice * tier.remainderPercent) / 100;

  return (
    <Form<BidValues>
      form={form}
      layout="vertical"
      onFinish={submitBid}
      initialValues={{ currency: "MNT", bid_price: undefined }}
      requiredMark={false}
    >
      {/* Currency toggle — only type-2 users may bid in JPY. */}
      <Form.Item name="currency" hidden>
        <Input />
      </Form.Item>
      {canChooseCurrency && (
        <div className="mb-4">
          <Segmented<"MNT" | "JPY">
            block
            size="large"
            value={currency}
            onChange={(v) => form.setFieldValue("currency", v)}
            options={[
              { label: "₮ MNT", value: "MNT" },
              { label: "¥ JPY", value: "JPY" },
            ]}
          />
        </div>
      )}

      <Form.Item
        name="bid_price"
        label={
          <span className="text-[13px] font-semibold text-neutral-800 dark:text-neutral-200">
            {isJpy ? t("priceLabelJpy") : t("priceLabelMnt")}
          </span>
        }
        tooltip={t("priceTooltip")}
        rules={[
          { required: true, message: t("required") },
          {
            validator: (_, value) => {
              if (value == null || value === "") return Promise.resolve();
              if (isJpy) {
                return Number(value) > startPrice
                  ? Promise.resolve()
                  : Promise.reject(
                      new Error(t("belowMinJpy", { min: formatJpy(startPrice) })),
                    );
              }
              return Number(value) > minAmount
                ? Promise.resolve()
                : Promise.reject(
                    new Error(t("belowMinMnt", { min: formatMnt(minAmount) })),
                  );
            },
          },
        ]}
        className="mb-1.5"
      >
        <InputNumber<number>
          className="w-full"
          size="large"
          min={0}
          controls={false}
          prefix={
            <span className="pr-1 text-neutral-400">{isJpy ? "¥" : "₮"}</span>
          }
          formatter={(value) =>
            `${value ?? ""}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
          }
          parser={(value) => (value ? Number(value.replace(/[^\d]/g, "")) : 0)}
        />
      </Form.Item>

      {/* Minimum / start-price hint. */}
      <div className="mb-4 flex items-center gap-1.5 text-[12px] text-neutral-500 dark:text-neutral-400">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
        <span className="tabular-nums">
          {isJpy
            ? t("startPriceHelp", { min: formatJpy(startPrice) })
            : t("minPriceHelp", { min: formatMnt(minAmount) })}
        </span>
      </div>

      {/* JPY bid → approximate MNT value (live /config rate). */}
      {isJpy && bidPrice > 0 && jpyRate > 0 && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-3 text-[13px] dark:border-neutral-800 dark:bg-neutral-900/60">
          <span className="text-neutral-500 dark:text-neutral-400">
            {t("approxMnt")}
          </span>
          <span className="text-[15px] font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
            ≈ {formatMnt(bidPrice * jpyRate)}
          </span>
        </div>
      )}

      {/* Advance-payment breakdown — MNT bids only (frontend estimate). */}
      {!isJpy && bidPrice > 0 && (
        <div className="mb-4 overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between gap-3 bg-neutral-50 px-3.5 py-3 dark:bg-neutral-900/60">
            <span className="flex items-center gap-2 text-[13px] font-medium text-neutral-700 dark:text-neutral-300">
              <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[11px] font-bold text-primary">
                {tier.percent}%
              </span>
              {t("advanceLabel", { percent: tier.percent })}
            </span>
            <span className="text-[15px] font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
              {formatMnt(advance)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-neutral-200 px-3.5 py-3 text-[13px] dark:border-neutral-800">
            <span className="text-neutral-500 dark:text-neutral-400">
              {t("remainderLabel")}
            </span>
            <span className="font-semibold tabular-nums text-neutral-700 dark:text-neutral-300">
              {formatMnt(remainder)}
            </span>
          </div>
        </div>
      )}

      <BrandButton block size="large" htmlType="submit" loading={loadingMin}>
        {t("submit")}
      </BrandButton>
    </Form>
  );
}
