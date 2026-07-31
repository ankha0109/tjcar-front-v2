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
    // `authStatus` is part of the key on purpose: the duplicate check inside
    // `queryFn` (via `searchVin`) is auth-gated backend-side, so a logged-out
    // "found" answer and a logged-in "owned" answer are genuinely different
    // results for the same plate/vin. Without the session in the key, the
    // `QueryClient` (which survives the client-side nav back from
    // `/auth/login`, see `AntdProvider`) would replay the logged-out result
    // — Buy button included — for up to `staleTime` after login.
    queryKey: ["report-lookup", authStatus, plate ?? "", vin ?? ""],
    // Gated on `open` too: the component stays mounted while closed so the
    // modal can animate out, and a closed modal must not fire a request.
    // Also gated on the session having settled: `authStatus` passes through
    // "loading" before "authenticated"/"unauthenticated", and each value is
    // its own cache entry now, so firing while "loading" would just mean a
    // second, wasted fetch a moment later under the real status.
    enabled: open && authStatus !== "loading" && Boolean(plate || vin),
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
  //
  // Gated on `open`: `enabled` above only stops *future* fetches, it does not
  // cancel one already in flight. If the customer presses Esc while
  // `POST /reports/search` is still running, the promise still resolves,
  // `{kind:"owned"}` still lands in the query cache, and this effect would
  // otherwise still fire — navigating them away from the landing page they
  // just chose to close the modal and stay on.
  useEffect(() => {
    if (open && lookup.data?.kind === "owned") {
      router.replace(`/report/${lookup.data.reportId}`);
    }
  }, [open, lookup.data, router]);

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
    // Not gated on `open`: unlike the "owned" redirect above, this fires only
    // for a purchase the customer actually initiated by clicking Buy. Money
    // already moved (or a QPay invoice already opened) by the time this
    // resolves, so it should still land them on the report even if they
    // closed the modal in the meantime — the alternative is a successful
    // purchase with no visible confirmation.
    onSuccess: ({ report_id }) => router.push(`/report/${report_id}`),
  });

  /**
   * Every way of dismissing the modal — Esc, the X, or "Дахин оролдох" —
   * routes through here. `ReportHero` renders this modal unconditionally, so
   * the mutation above stays mounted (and its state un-reset) for the life of
   * the page; nothing else clears a stale purchase error between searches.
   * Reset it on every close, not just when the search term changes, so
   * reopening with the *same* plate/vin after a failed purchase doesn't still
   * show the old failure.
   */
  function handleClose() {
    purchase.reset();
    onClose();
  }

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
            <TryAgain label={t("tryAgain")} onClick={handleClose} />
          </>
        ),
      };
    }

    if (lookup.isError) {
      return {
        title: t("errors.generic"),
        tone: "error",
        body: <TryAgain label={t("tryAgain")} onClick={handleClose} />,
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
      onCancel={handleClose}
      footer={null}
      // While a purchase is in flight, block every way `onCancel` can fire —
      // Esc, the X, and the mask click. `POST /reports` has already been
      // sent at that point (possibly with a QPay invoice opening
      // server-side), and antd's Button already refuses a second click while
      // `loading` — but that guard lives only in the Button, and
      // `handleClose`'s unconditional `purchase.reset()` would otherwise
      // detach the observer, drop `isPending` back to idle, and silently
      // re-arm Buy for a resubmit that fires a second, concurrent
      // `createReport` for the same car. Making the modal undismissable here
      // is what keeps that unconditional reset correct: `handleClose` can no
      // longer run while a purchase is pending, so it never needs to guard
      // against resetting one.
      closable={!purchase.isPending}
      mask={{ closable: !purchase.isPending }}
      keyboard={!purchase.isPending}
      // Unmounts the modal's body while closed. That is DOM hygiene, not what
      // keeps searches from bleeding into each other: this component and its
      // query/mutation hooks stay mounted the whole time (`ReportHero` renders
      // it unconditionally), so it is the query key changing with plate/vin
      // that stops a previous car flashing on reopen, and `handleClose`
      // resetting `purchase` that stops a previous purchase error surviving.
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
