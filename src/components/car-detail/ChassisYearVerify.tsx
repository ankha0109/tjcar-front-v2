"use client";

import { useState } from "react";
import { Button, Form, Input, Space } from "antd";
import { useTranslations } from "next-intl";
import Api, { ApiError } from "@/services/Api";

type Props = {
  /** Chassis / body code (KUZOV) — pre-fills the first input. */
  chassis?: string;
  /** Frame serial (SERIAL) — pre-fills the second input. */
  serial?: string;
  /**
   * Whole VIN in one piece. Encar listings carry it that way (the performance
   * inspection's `vin`), so passing this switches the form to a single
   * pre-filled input and sends the value as typed instead of joining
   * chassis + serial. Takes precedence over both.
   */
  vin?: string;
};

type VerifyValues = { chassis?: string; serial?: string; vin?: string };

/**
 * GET /vin/{vin} — partsouq's parts catalog, read through the scraper service.
 * `production_date` is already `YYYY-MM`, and it is the car's own build date
 * rather than its model generation's production window. Either field can be
 * null: partsouq records different things for different makes.
 */
type VinLookupResult = {
  production_date?: string | null;
  color_code?: string | null;
  color_name?: string | null;
};

/**
 * "Арлын дугаараар он баталгаажуулах" — looks a car's manufacture date and
 * colour code up in partsouq's parts catalog via GET /vin/{vin}. The listing
 * pre-fills the form; the buyer can correct it before checking. A 404 means
 * "not found".
 *
 * Both numbers go to the same endpoint, because partsouq resolves both and keys
 * each without its dashes:
 *
 * - Japan lot: KUZOV + SERIAL, joined into a frame number (`AXAH544016407`).
 * - Encar listing: the whole 17-char VIN (`JTMW1RFV1KD025709`).
 *
 * Only what partsouq's Toyota catalog holds (Toyota and Lexus) comes back with
 * data; every other make answers 404 and lands on the "not found" message.
 */
export default function ChassisYearVerify({ chassis, serial, vin }: Props) {
  const t = useTranslations("carDetail.verify");
  const singleVin = vin !== undefined;
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VinLookupResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(false);

  const onFinish = async (values: VerifyValues) => {
    setResult(null);
    setNotFound(false);
    setError(false);
    setLoading(true);
    try {
      // Partsouq keys both a VIN and a frame number without punctuation, so the
      // two form shapes collapse to one lookup: strip everything that is not a
      // letter or a digit and send what is left.
      const number = (
        singleVin
          ? (values.vin ?? "")
          : `${values.chassis ?? ""}${values.serial ?? ""}`
      )
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "");

      const res = await Api.get<{ data?: VinLookupResult }>(`/vin/${number}`);

      if (res?.data) setResult(res.data);
      else setNotFound(true);
    } catch (err) {
      // 404 is "the catalog does not hold this car". 502/503 mean the lookup
      // service itself could not answer — an error, not "no such car".
      if (err instanceof ApiError && err.status === 404) setNotFound(true);
      else setError(true);
    } finally {
      setLoading(false);
    }
  };

  const rows: Array<{ label: string; value?: string }> = result
    ? [
        { label: t("made"), value: result.production_date ?? undefined },
        {
          label: t("colorCode"),
          // partsouq names the paint too; the code alone means little to a buyer.
          value:
            [result.color_code, result.color_name].filter(Boolean).join(" · ") ||
            undefined,
        },
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
        initialValues={singleVin ? { vin } : { chassis, serial }}
        onFinish={onFinish}
        requiredMark={false}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          {singleVin ? (
            <Form.Item
              name="vin"
              noStyle
              rules={[{ required: true, message: t("required") }]}
            >
              <Input
                placeholder={t("vinPlaceholder")}
                aria-label={t("vinPlaceholder")}
                className="flex-1"
              />
            </Form.Item>
          ) : (
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
          )}
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
              <dt className="text-[11px] font-medium uppercase text-neutral-400 dark:text-neutral-500">
                {row.label}
              </dt>
              <dd className="font-semibold text-neutral-900 dark:text-neutral-100">
                {row.value?.trim() || "-"}
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
