"use client";

import { useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Button, Modal, Skeleton } from "antd";
import { Link, useRouter } from "@/i18n/navigation";
import { ApiError } from "@/services/Api";
import { createReport, searchPlate, searchVin } from "@/services/reports";
import {
  isExistingReport,
  plateChassisNo,
  type VinSearchResult,
} from "@/types/report";

type Props = {
  open: boolean;
  /** Effective price in MNT, resolved server-side from GET /config. */
  price: number;
  /** Exactly one of these arrives from the form that opened the modal. */
  plate?: string;
  vin?: string;
  onClose: () => void;
};

type LookupOutcome =
  | {
      kind: "found";
      car: VinSearchResult;
      /**
       * The exact string the search was run with. The purchase must reuse it
       * rather than JPStat's `car.vin`: the backend re-queries JPStat with the
       * stored `vin` when it builds the PDF, and matches duplicates against it.
       */
      chassis: string;
      plateNo?: string;
    }
  | { kind: "owned"; reportId: string };

/**
 * Runs the plate → VIN → report chain for the `/report` hero and turns it into
 * a buy decision — in a modal, so the landing page stays where it is.
 *
 * Two backend behaviours shape this component:
 *  - `POST /reports/search` answers with EITHER a car OR `{ exists: true }` for
 *    a VIN this customer already bought. The second branch must short-circuit
 *    the purchase or they pay twice for the same report.
 *  - Its 422 "not found" message is authored as HTML (`<br/>` tags) by the API,
 *    so it is rendered as markup rather than plain text.
 */
export default function ReportLookupModal({
  open,
  price,
  plate,
  vin,
  onClose,
}: Props) {
  const t = useTranslations("reportCheck");
  const router = useRouter();
  const { status: authStatus } = useSession();

  const lookup = useQuery<LookupOutcome>({
    queryKey: ["report-lookup", plate ?? "", vin ?? ""],
    // Gated on `open` too: the component stays mounted while closed so the
    // modal can animate out, and a closed modal must not fire a request.
    enabled: open && Boolean(plate || vin),
    retry: false,
    staleTime: 60_000,
    queryFn: async () => {
      let chassis = vin;
      let plateNo: string | undefined;

      // Plate entry resolves to a chassis number first; Autobox is the only
      // thing that knows the mapping, and the report itself is always keyed by
      // that number. `plateChassisNo` reassembles the dashed form JPStat wants.
      if (!chassis && plate) {
        const car = await searchPlate(plate);
        const chassisNo = plateChassisNo(car);
        if (!chassisNo) {
          throw new ApiError(422, t("errors.plateNoVin"));
        }
        chassis = chassisNo;
        plateNo = car.car_plate;
      }

      if (!chassis) throw new ApiError(422, t("errors.missingInput"));

      const res = await searchVin(chassis);

      if (isExistingReport(res)) {
        return { kind: "owned", reportId: res.report_id };
      }

      return { kind: "found", car: res.data, chassis, plateNo };
    },
  });

  // Already purchased → straight to the report, no second charge. `replace` so
  // Back does not bounce the customer into the buy screen again.
  useEffect(() => {
    if (lookup.data?.kind === "owned") {
      router.replace(`/report/${lookup.data.reportId}`);
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
      const { car, chassis, plateNo } = lookup.data;
      return createReport({
        vin: chassis,
        car_data: { ...car },
        ...(plateNo ? { plate_no: plateNo } : {}),
      });
    },
    onSuccess: ({ report_id }) => router.push(`/report/${report_id}`),
  });

  /**
   * Where login sends the customer back to. The value is encoded for the query
   * string and the whole path encoded again for `callbackUrl`, so a Cyrillic
   * plate survives the auth round-trip as plain ASCII.
   */
  const returnTo = plate
    ? `/report?plate=${encodeURIComponent(plate)}`
    : `/report?vin=${encodeURIComponent(vin ?? "")}`;

  /**
   * Heading and body are decided in one pass, so the modal header can never
   * disagree with the panel underneath it.
   */
  function renderView(): {
    title: string;
    tone?: "error";
    body: React.ReactNode;
  } {
    // "owned" holds the skeleton up while the redirect effect above fires.
    if (lookup.isLoading || lookup.data?.kind === "owned") {
      return {
        title: t("title"),
        body: <Skeleton active paragraph={{ rows: 4 }} />,
      };
    }

    if (notFoundHtml) {
      return {
        title: t("notFoundTitle"),
        tone: "error",
        body: (
          <>
            {/* API-authored copy containing <br/>; not user input. */}
            <p
              className="text-[13.5px] leading-relaxed text-neutral-600 dark:text-neutral-300"
              dangerouslySetInnerHTML={{ __html: notFoundHtml }}
            />
            <TryAgain label={t("tryAgain")} onClick={onClose} />
          </>
        ),
      };
    }

    if (lookup.isError) {
      return {
        title: t("errors.generic"),
        tone: "error",
        body: <TryAgain label={t("tryAgain")} onClick={onClose} />,
      };
    }

    if (lookup.data?.kind !== "found") {
      return {
        title: t("title"),
        body: <Skeleton active paragraph={{ rows: 4 }} />,
      };
    }

    const car = lookup.data.car;
    const isAuthed = authStatus === "authenticated";
    const purchaseError =
      purchase.error instanceof ApiError ? purchase.error.message : null;

    return {
      title: t("foundTitle"),
      body: (
        <>
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
                href={`/auth/login?callbackUrl=${encodeURIComponent(returnTo)}`}
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
        </>
      ),
    };
  }

  const view = renderView();

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      // Unmounts the body on close, so reopening with a different plate never
      // flashes the previous car while the new query runs.
      destroyOnHidden
      centered
      width="min(560px, 94vw)"
      title={
        <span
          className={
            view.tone === "error"
              ? "text-red"
              : "text-neutral-900 dark:text-neutral-50"
          }
        >
          {view.title}
        </span>
      }
    >
      {view.body}
    </Modal>
  );
}

/**
 * A plain button, not a link: the modal already sits on `/report`, so "search
 * again" just closes it. (antd's reset paints bare `<a>` blue and beats an
 * inherited text colour, which is another reason not to use one here.)
 */
function TryAgain({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-5 inline-flex text-[13px] font-medium text-primary hover:underline"
    >
      {label}
    </button>
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
