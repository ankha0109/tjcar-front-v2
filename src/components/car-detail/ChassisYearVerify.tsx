"use client";

import { useState } from "react";
import { Button, Form, Input, Space } from "antd";
import { useTranslations } from "next-intl";
import Api, { ApiError } from "@/services/Api";

type Props = {
  /** Make name — sent lowercased as `vendor`. */
  markaName: string;
  /** Chassis / body code (KUZOV) — pre-fills the first input. */
  chassis?: string;
  /** VIN serial (SERIAL) — pre-fills the second input. */
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

/** POST /verify-month — the AJES maker database, keyed by chassis + serial. */
type VerifyMonthResult = {
  modelname?: string;
  year?: string;
  month?: string;
  gradecode?: string;
  modelcode?: string;
  engineno?: string;
  colorcode?: string;
};

/** GET /vin/{vin} — partsouq's parts catalog, keyed by a whole 17-char VIN. */
type VinLookupResult = {
  model?: string;
  model_code?: string;
  production_date?: string;
  trim_code?: string;
  engine_code?: string;
  color_code?: string;
  color_name?: string;
  color_image?: string;
};

/** What the card renders, whichever source answered. */
type BuildInfo = {
  model?: string;
  made?: string;
  grade?: string;
  modelCode?: string;
  engineCode?: string;
  colorCode?: string;
  colorName?: string;
  colorImage?: string;
};

function fromVerifyMonth(data: VerifyMonthResult): BuildInfo {
  return {
    model: data.modelname,
    made:
      data.year || data.month
        ? `${data.year ?? ""}${data.month ? `-${data.month}` : ""}`
        : undefined,
    grade: data.gradecode,
    modelCode: data.modelcode,
    engineCode: data.engineno,
    colorCode: data.colorcode,
  };
}

function fromVinLookup(data: VinLookupResult): BuildInfo {
  return {
    model: data.model,
    // Already `YYYY-MM`, and it is the car's own build date rather than the
    // model generation's production window.
    made: data.production_date,
    grade: data.trim_code,
    modelCode: data.model_code,
    engineCode: data.engine_code,
    colorCode: data.color_code,
    colorName: data.color_name,
    colorImage: data.color_image,
  };
}

/**
 * "Арлын дугаараар он баталгаажуулах" — verifies a car's manufacture year (and
 * a few build codes) against the maker's records. The listing pre-fills the
 * form; the buyer can correct it before checking. A 404 means "not found".
 *
 * Two shapes, because the two sources store the number differently — and each
 * has its own backend:
 *
 * - Japan lot: split (KUZOV + SERIAL) → POST /verify-month, the AJES database.
 * - Encar listing: one whole VIN → GET /vin/{vin}, read off partsouq's catalog.
 *   AJES cannot decode 17-char export VINs, and it is the only source that
 *   carries a colour code.
 *
 * Only VINs partsouq's Toyota catalog resolves (Toyota and Lexus) come back with
 * data; every other make answers 404 and lands on the "not found" message.
 */
export default function ChassisYearVerify({
  markaName,
  chassis,
  serial,
  vin,
}: Props) {
  const t = useTranslations("carDetail.verify");
  const singleVin = vin !== undefined;
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BuildInfo | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(false);

  const lookupByVin = async (raw: string): Promise<BuildInfo | null> => {
    // The route only accepts the 17-char VIN alphabet, so strip the spaces and
    // dashes people paste along with it rather than 404-ing on punctuation.
    const normalized = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const res = await Api.get<{ data?: VinLookupResult }>(`/vin/${normalized}`);

    return res?.data ? fromVinLookup(res.data) : null;
  };

  const lookupByChassis = async (
    values: VerifyValues,
  ): Promise<BuildInfo | null> => {
    const res = await Api.post<{ data?: VerifyMonthResult }>("/verify-month", {
      vendor: (markaName || "").toLowerCase(),
      vin: `${values.chassis}-${values.serial}`,
    });
    const data = res?.data;

    return data && Object.keys(data).length > 0 ? fromVerifyMonth(data) : null;
  };

  const onFinish = async (values: VerifyValues) => {
    setResult(null);
    setNotFound(false);
    setError(false);
    setLoading(true);
    try {
      const info = singleVin
        ? await lookupByVin(values.vin ?? "")
        : await lookupByChassis(values);

      if (info) setResult(info);
      else setNotFound(true);
    } catch (err) {
      // Both backends abort 404 when the number is unknown. A 502 means the
      // upstream catalog is down — that is an error, not "no such car".
      if (err instanceof ApiError && err.status === 404) setNotFound(true);
      else setError(true);
    } finally {
      setLoading(false);
    }
  };

  const rows: Array<{ label: string; value?: string; swatch?: string }> = result
    ? [
        { label: t("model"), value: result.model },
        { label: t("made"), value: result.made },
        { label: t("grade"), value: result.grade },
        { label: t("modelCode"), value: result.modelCode },
        { label: t("engineCode"), value: result.engineCode },
        {
          label: t("colorCode"),
          // partsouq names the paint too; the code alone means little to a buyer.
          value: [result.colorCode, result.colorName]
            .filter(Boolean)
            .join(" · "),
          swatch: result.colorImage,
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
              <dd className="flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-neutral-100">
                {row.swatch && row.value?.trim() && (
                  // eslint-disable-next-line @next/next/no-img-element -- partsouq host, not in next.config images
                  <img
                    src={row.swatch}
                    alt=""
                    aria-hidden="true"
                    className="size-4 shrink-0 rounded-full border border-neutral-300 object-cover dark:border-neutral-600"
                  />
                )}
                <span>{row.value?.trim() || "-"}</span>
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
