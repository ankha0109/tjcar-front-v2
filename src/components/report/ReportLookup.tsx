"use client";

import { useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Button, Skeleton } from "antd";
import { Link, useRouter } from "@/i18n/navigation";
import { ApiError } from "@/services/Api";
import { createReport, searchPlate, searchVin } from "@/services/reports";
import { isExistingReport, type VinSearchResult } from "@/types/report";

type Props = {
  /** Effective price in MNT, resolved server-side from GET /config. */
  price: number;
  /** Exactly one of these arrives from the hero form. */
  plate?: string;
  vin?: string;
};

type LookupOutcome =
  | { kind: "found"; car: VinSearchResult; plateNo?: string }
  | { kind: "owned"; reportId: string };

/**
 * Runs the plate → VIN → report chain behind /reports/check and turns it into
 * a buy decision.
 *
 * Two backend behaviours shape this component:
 *  - `POST /reports/search` answers with EITHER a car OR `{ exists: true }` for
 *    a VIN this customer already bought. The second branch must short-circuit
 *    the purchase or they pay twice for the same report.
 *  - Its 422 "not found" message is authored as HTML (`<br/>` tags) by the API,
 *    so it is rendered as markup rather than plain text.
 */
export default function ReportLookup({ price, plate, vin }: Props) {
  const t = useTranslations("reportCheck");
  const router = useRouter();
  const { status: authStatus } = useSession();

  const lookup = useQuery<LookupOutcome>({
    queryKey: ["report-lookup", plate ?? "", vin ?? ""],
    enabled: Boolean(plate || vin),
    retry: false,
    staleTime: 60_000,
    queryFn: async () => {
      let chassis = vin;
      let plateNo: string | undefined;

      // Plate entry resolves to a VIN first; Autobox is the only thing that
      // knows the mapping, and the report itself is always keyed by VIN.
      if (!chassis && plate) {
        const car = await searchPlate(plate);
        if (!car.modification_vin_no) {
          throw new ApiError(422, t("errors.plateNoVin"));
        }
        chassis = car.modification_vin_no;
        plateNo = car.car_plate;
      }

      if (!chassis) throw new ApiError(422, t("errors.missingInput"));

      const res = await searchVin(chassis);

      if (isExistingReport(res)) {
        return { kind: "owned", reportId: res.report_id };
      }

      return { kind: "found", car: res.data, plateNo };
    },
  });

  // Already purchased → straight to the report, no second charge. `replace` so
  // Back does not bounce the customer into the buy screen again.
  useEffect(() => {
    if (lookup.data?.kind === "owned") {
      router.replace(`/reports/${lookup.data.reportId}`);
    }
  }, [lookup.data, router]);

  // The API authors this message as HTML; derived, not stored, so it can never
  // lag a render behind the query that produced it.
  const notFoundHtml =
    lookup.error instanceof ApiError && lookup.error.status === 422
      ? lookup.error.message
      : null;

  const purchase = useMutation({
    mutationFn: async () => {
      if (lookup.data?.kind !== "found") throw new Error("no car");
      const { car, plateNo } = lookup.data;
      return createReport({
        vin: car.vin,
        car_data: { ...car },
        ...(plateNo ? { plate_no: plateNo } : {}),
      });
    },
    onSuccess: ({ report_id }) => router.push(`/reports/${report_id}`),
  });

  // Reached without a search term (bookmark, stray link) — the query is
  // disabled, so send them back to the form instead of rendering nothing.
  if (!plate && !vin) {
    return (
      <Panel title={t("noInputTitle")}>
        <p className="text-[13.5px] text-neutral-600 dark:text-neutral-300">
          {t("noInputBody")}
        </p>
        <Link
          href="/report"
          className="mt-5 inline-flex text-[13px] font-medium text-primary hover:underline"
        >
          {t("tryAgain")}
        </Link>
      </Panel>
    );
  }

  if (lookup.isLoading) {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <Skeleton active paragraph={{ rows: 4 }} />
      </div>
    );
  }

  if (notFoundHtml) {
    return (
      <Panel tone="error" title={t("notFoundTitle")}>
        {/* API-authored copy containing <br/>; not user input. */}
        <p
          className="text-[13.5px] leading-relaxed text-neutral-600 dark:text-neutral-300"
          dangerouslySetInnerHTML={{ __html: notFoundHtml }}
        />
        <Link
          href="/report"
          className="mt-5 inline-flex text-[13px] font-medium text-primary hover:underline"
        >
          {t("tryAgain")}
        </Link>
      </Panel>
    );
  }

  if (lookup.isError) {
    return (
      <Panel tone="error" title={t("errors.generic")}>
        <Link
          href="/report"
          className="inline-flex text-[13px] font-medium text-primary hover:underline"
        >
          {t("tryAgain")}
        </Link>
      </Panel>
    );
  }

  if (lookup.data?.kind === "owned") {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <Skeleton active paragraph={{ rows: 2 }} />
      </div>
    );
  }

  const car = lookup.data?.car;
  if (!car) return null;

  const isAuthed = authStatus === "authenticated";
  const purchaseError =
    purchase.error instanceof ApiError ? purchase.error.message : null;

  return (
    <Panel title={t("foundTitle")}>
      <dl className="divide-y divide-neutral-100 dark:divide-neutral-800">
        <Row label={t("fields.name")} value={car.name} />
        <Row label={t("fields.vin")} value={car.vin} />
        <Row label={t("fields.company")} value={car.company} />
        <Row label={t("fields.model")} value={car.model} />
        <Row label={t("fields.year")} value={car.year} />
      </dl>

      <div className="mt-6 flex flex-col gap-3 rounded-2xl bg-neutral-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:bg-neutral-900">
        <div>
          <p className="text-[12.5px] text-neutral-500">{t("priceLabel")}</p>
          <p className="text-[22px] font-semibold text-neutral-900 dark:text-neutral-50">
            {price.toLocaleString("mn-MN")}₮
          </p>
        </div>

        {isAuthed ? (
          <Button
            type="primary"
            size="large"
            loading={purchase.isPending}
            onClick={() => purchase.mutate()}
            className="min-h-12! rounded-xl! px-7! font-semibold!"
          >
            {t("buy")}
          </Button>
        ) : (
          <Link
            href={`/auth/login?callbackUrl=${encodeURIComponent(
              `/reports/check?${plate ? `plate=${plate}` : `vin=${vin}`}`,
            )}`}
          >
            <Button
              type="primary"
              size="large"
              className="min-h-12! rounded-xl! px-7! font-semibold!"
            >
              {t("loginToBuy")}
            </Button>
          </Link>
        )}
      </div>

      {purchaseError ? (
        <p role="alert" className="mt-3 text-[12.5px] font-medium text-red">
          {purchaseError}
        </p>
      ) : null}
    </Panel>
  );
}

function Panel({
  title,
  tone = "default",
  children,
}: {
  title: string;
  tone?: "default" | "error";
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto w-full max-w-2xl rounded-3xl border border-neutral-200 bg-white p-6 shadow-[0_24px_55px_-32px_rgba(0,0,0,0.25)] sm:p-8 dark:border-neutral-800 dark:bg-neutral-900">
      <h1
        className={
          tone === "error"
            ? "text-[17px] font-semibold text-red"
            : "text-[17px] font-semibold text-neutral-900 dark:text-neutral-50"
        }
      >
        {title}
      </h1>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="text-[12.5px] text-neutral-500">{label}</dt>
      <dd className="text-right text-[13.5px] font-medium text-neutral-900 dark:text-neutral-100">
        {value || "—"}
      </dd>
    </div>
  );
}
