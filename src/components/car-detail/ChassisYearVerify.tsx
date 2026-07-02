"use client";

import { useState } from "react";
import { Button, Form, Input, Space } from "antd";
import { useTranslations } from "next-intl";
import Api, { ApiError } from "@/services/Api";

type Props = {
  /** Make name — sent lowercased as `vendor`. */
  markaName: string;
  /** Chassis / body code (KUZOV) — pre-fills the first input. */
  chassis: string;
  /** VIN serial (SERIAL) — pre-fills the second input. */
  serial: string;
};

type VerifyValues = { chassis: string; serial: string };

type VerifyResult = {
  modelname?: string;
  year?: string;
  month?: string;
  gradecode?: string;
  modelcode?: string;
  engineno?: string;
  colorcode?: string;
};

/**
 * "Арлын дугаараар он баталгаажуулах" — verifies a lot's manufacture year (and
 * a few build codes) against the maker's VIN database via POST /verify-month
 * ({ vendor, vin }). The listing's chassis/serial pre-fill the form; the buyer
 * can correct them before checking. A 404 from the backend means "not found".
 */
export default function ChassisYearVerify({
  markaName,
  chassis,
  serial,
}: Props) {
  const t = useTranslations("carDetail.verify");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(false);

  const onFinish = async (values: VerifyValues) => {
    setResult(null);
    setNotFound(false);
    setError(false);
    setLoading(true);
    try {
      const res = await Api.post<{ data?: VerifyResult }>("/verify-month", {
        vendor: (markaName || "").toLowerCase(),
        vin: `${values.chassis}-${values.serial}`,
      });
      const data = res?.data;
      if (data && Object.keys(data).length > 0) {
        setResult(data);
      } else {
        setNotFound(true);
      }
    } catch (err) {
      // The backend aborts 404 ("Not found") when the VIN is unknown.
      if (err instanceof ApiError && err.status === 404) setNotFound(true);
      else setError(true);
    } finally {
      setLoading(false);
    }
  };

  const rows: Array<{ label: string; value?: string }> = result
    ? [
        { label: t("model"), value: result.modelname },
        {
          label: t("made"),
          value:
            result.year || result.month
              ? `${result.year ?? ""}${result.month ? `-${result.month}` : ""}`
              : undefined,
        },
        { label: t("grade"), value: result.gradecode },
        { label: t("modelCode"), value: result.modelcode },
        { label: t("engineCode"), value: result.engineno },
        { label: t("colorCode"), value: result.colorcode },
      ]
    : [];

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <h2 className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-100">
        {t("title")}
      </h2>
      <p className="mt-0.5 mb-3 text-[12px] text-neutral-500 dark:text-neutral-400">
        {t("subtitle")}
      </p>

      <Form<VerifyValues>
        layout="vertical"
        initialValues={{ chassis, serial }}
        onFinish={onFinish}
        requiredMark={false}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <Space.Compact className="flex-1">
            <Form.Item
              name="chassis"
              noStyle
              rules={[{ required: true, message: t("required") }]}
            >
              <Input
                placeholder={t("chassisPlaceholder")}
                aria-label={t("chassisPlaceholder")}
                className="w-2/5"
              />
            </Form.Item>
            <Form.Item
              name="serial"
              noStyle
              rules={[{ required: true, message: t("required") }]}
            >
              <Input
                placeholder={t("serialPlaceholder")}
                aria-label={t("serialPlaceholder")}
                className="w-3/5"
              />
            </Form.Item>
          </Space.Compact>
          <Form.Item noStyle>
            <Button type="primary" htmlType="submit" loading={loading}>
              {t("submit")}
            </Button>
          </Form.Item>
        </div>
      </Form>

      {result && (
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 text-[13px]">
          {rows.map((row) => (
            <div key={row.label} className="flex flex-col gap-0.5">
              <dt className="text-[11px] font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                {row.label}
              </dt>
              <dd className="font-semibold text-neutral-900 dark:text-neutral-100">
                {row.value?.trim() || "—"}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {notFound && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[12.5px] text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
          {t("notFound")}
        </p>
      )}
      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-[12.5px] text-red-600 dark:bg-red-950/40 dark:text-red-400">
          {t("error")}
        </p>
      )}
    </section>
  );
}
