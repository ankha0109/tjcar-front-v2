"use client";

import { App, Form, InputNumber, Modal } from "antd";
import { useTranslations } from "next-intl";
import { useUpdateBidPrice } from "@/hooks/useBids";
import { formatJpy, formatMnt } from "@/lib/bidConfig";
import { ApiError } from "@/services/Api";
import type { Bid } from "@/types/bid";

type FormValues = { bid_price: number };

type Props = {
  bid: Bid;
  open: boolean;
  onClose: () => void;
};

/**
 * Change the offered price on an open bid.
 *
 * The API re-checks both gates (open status, 2-hour cutoff) and answers 422 with
 * a Mongolian message, so failures are surfaced verbatim rather than
 * re-worded here.
 */
export default function BidPriceEditModal({ bid, open, onClose }: Props) {
  const t = useTranslations("dashboard.bidEdit");
  const { modal } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const mutation = useUpdateBidPrice(bid.id);

  const isJpy = bid.currency === "JPY";
  const format = isJpy ? formatJpy : formatMnt;

  const submit = async (values: FormValues) => {
    try {
      await mutation.mutateAsync(values.bid_price);
      onClose();
      modal.success({
        title: t("successTitle"),
        content: t("successBody"),
        okText: t("ok"),
        centered: true,
      });
    } catch (err) {
      modal.error({
        title: t("errorTitle"),
        content: err instanceof ApiError ? err.message : t("errorFallback"),
        okText: t("ok"),
        centered: true,
      });
    }
  };

  return (
    <Modal
      open={open}
      title={t("title")}
      okText={t("submit")}
      cancelText={t("cancel")}
      confirmLoading={mutation.isPending}
      onOk={() => form.submit()}
      onCancel={onClose}
      destroyOnHidden
      centered
    >
      <Form<FormValues>
        form={form}
        layout="vertical"
        onFinish={submit}
        initialValues={{ bid_price: bid.bid_price }}
        requiredMark={false}
      >
        <Form.Item
          name="bid_price"
          label={t("priceLabel")}
          rules={[
            { required: true, message: t("required") },
            {
              validator: (_, value) => {
                if (value == null || value === "") return Promise.resolve();
                return Number(value) > 0
                  ? Promise.resolve()
                  : Promise.reject(new Error(t("mustBePositive")));
              },
            },
          ]}
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

        <p className="text-[12px] text-neutral-500">
          {t("currentPrice", { price: format(bid.bid_price) })}
        </p>
      </Form>
    </Modal>
  );
}
