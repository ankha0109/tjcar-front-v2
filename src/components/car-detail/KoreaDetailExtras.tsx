"use client";

import { useState, type ReactNode } from "react";
import { Modal } from "antd";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/Skeleton";
import { useKoreaInspection, useKoreaInsurance } from "@/hooks/useKoreaReport";
import type { KoreaInspection, KoreaInsurance } from "@/types/korea";

type Props = {
  /** Encar listing id — the reports are fetched per id, on open. */
  listingId: string;
};

const formatKrw = (n: number) => `₩${new Intl.NumberFormat("en-US").format(n)}`;

/**
 * Encar-only condition reports: the government performance inspection (성능점검)
 * and the insurance history (보험이력). Each one costs Encar an upstream call,
 * so neither travels with the detail payload — the buyer opens the one they
 * care about and it is fetched then, keeping a page view down to a single call.
 *
 * Report text stays in Korean (the source of truth); only the surrounding
 * labels are localized. Rendered in the info column of the Korea car detail
 * page; the grouped options live in KoreaOptionsPanel beneath the gallery.
 */
export default function KoreaDetailExtras({ listingId }: Props) {
  const t = useTranslations("carDetail.encar");
  const [openReport, setOpenReport] = useState<
    "inspection" | "insurance" | null
  >(null);

  // `enabled` is what keeps this off the wire until the modal opens. It stays
  // true once opened so closing and reopening reads the react-query cache
  // instead of paying for the call twice.
  const [inspectionAsked, setInspectionAsked] = useState(false);
  const [insuranceAsked, setInsuranceAsked] = useState(false);

  const inspection = useKoreaInspection(listingId, inspectionAsked);
  const insurance = useKoreaInsurance(listingId, insuranceAsked);

  return (
    <>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <ReportButton
          label={t("inspection.title")}
          onClick={() => {
            setInspectionAsked(true);
            setOpenReport("inspection");
          }}
        />
        <ReportButton
          label={t("insurance.title")}
          onClick={() => {
            setInsuranceAsked(true);
            setOpenReport("insurance");
          }}
        />
      </div>

      <Modal
        open={openReport === "inspection"}
        onCancel={() => setOpenReport(null)}
        footer={null}
        centered
        width="min(680px, 94vw)"
        title={t("inspection.title")}
      >
        <ReportBody
          isLoading={inspection.isFetching}
          isError={inspection.isError}
          isEmpty={!inspection.data}
          emptyLabel={t("reportEmpty")}
          errorLabel={t("reportError")}
          onRetry={() => void inspection.refetch()}
          retryLabel={t("reportRetry")}
        >
          {inspection.data && <InspectionReport inspection={inspection.data} />}
        </ReportBody>
      </Modal>

      <Modal
        open={openReport === "insurance"}
        onCancel={() => setOpenReport(null)}
        footer={null}
        centered
        width="min(680px, 94vw)"
        title={t("insurance.title")}
      >
        <ReportBody
          isLoading={insurance.isFetching}
          isError={insurance.isError}
          isEmpty={!insurance.data}
          emptyLabel={t("reportEmpty")}
          errorLabel={t("reportError")}
          onRetry={() => void insurance.refetch()}
          retryLabel={t("reportRetry")}
        >
          {insurance.data && <InsuranceReport insurance={insurance.data} />}
        </ReportBody>
      </Modal>
    </>
  );
}

function ReportButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-neutral-200 text-[13px] font-semibold text-neutral-900 transition hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-900"
    >
      {label}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-3.5 w-3.5"
        aria-hidden
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </svg>
    </button>
  );
}

/**
 * The three states a report modal can be in. "No report on file" and "the
 * upstream could not be reached" are separate messages: only the second one is
 * worth retrying, and the backend answers `null` for the first. `isLoading`
 * reads the fetching flag rather than the pending one so a retry shows the
 * skeleton again instead of sitting on the stale error.
 */
function ReportBody({
  isLoading,
  isError,
  isEmpty,
  emptyLabel,
  errorLabel,
  retryLabel,
  onRetry,
  children,
}: {
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  emptyLabel: string;
  errorLabel: string;
  retryLabel: string;
  onRetry: () => void;
  children: ReactNode;
}) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 py-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <p className="text-[13px] text-neutral-500 dark:text-neutral-400">
          {errorLabel}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg border border-neutral-200 px-3 py-1.5 text-[12.5px] font-medium text-neutral-900 transition hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-900"
        >
          {retryLabel}
        </button>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <p className="py-8 text-center text-[13px] text-neutral-500 dark:text-neutral-400">
        {emptyLabel}
      </p>
    );
  }

  return <>{children}</>;
}

function InspectionReport({ inspection }: { inspection: KoreaInspection }) {
  const t = useTranslations("carDetail.encar");

  const repairs = inspection.repair_panels;
  const paints = inspection.paint_panels;
  const serious = inspection.serious_issues;
  const hasFindings =
    repairs.length > 0 || paints.length > 0 || serious.length > 0;
  const stateGood = inspection.state === "양호";

  return (
    <section className="flex flex-col gap-4 pt-1">
      {inspection.state && (
        <div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              stateGood
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${stateGood ? "bg-emerald-500" : "bg-amber-500"}`}
              aria-hidden
            />
            {inspection.state}
          </span>
        </div>
      )}

      {/* Flag row — flood / tuning are the buyer's red flags */}
      {(inspection.flood || inspection.tuning) && (
        <div className="flex flex-wrap gap-2">
          {inspection.flood && (
            <Flag tone="danger" label={t("inspection.flood")} />
          )}
          {inspection.tuning && (
            <Flag tone="warn" label={t("inspection.tuning")} />
          )}
        </div>
      )}

      {/* Accident signal — repainted / repaired / replaced panels */}
      {hasFindings ? (
        <div className="flex flex-col gap-3 rounded-xl bg-amber-50/60 p-3 dark:bg-amber-500/5">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
            {t("inspection.panelsTitle")}
          </div>
          <ul className="flex flex-col gap-1.5">
            {repairs.map((p) => (
              <li
                key={`r-${p.part}`}
                className="flex items-center justify-between gap-3 text-[12.5px]"
              >
                <span className="text-neutral-700 dark:text-neutral-300">
                  {p.part}
                </span>
                <span className="shrink-0 font-medium text-amber-700 dark:text-amber-400">
                  {p.status}
                </span>
              </li>
            ))}
            {paints.map((part) => (
              <li
                key={`p-${part}`}
                className="flex items-center justify-between gap-3 text-[12.5px]"
              >
                <span className="text-neutral-700 dark:text-neutral-300">
                  {part}
                </span>
                <span className="shrink-0 font-medium text-amber-700 dark:text-amber-400">
                  {t("inspection.painted")}
                </span>
              </li>
            ))}
            {serious.map((issue) => (
              <li
                key={`s-${issue}`}
                className="text-[12.5px] font-medium text-red-600 dark:text-red-400"
              >
                {issue}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50/60 px-3 py-2.5 text-[12.5px] text-emerald-700 dark:bg-emerald-500/5 dark:text-emerald-400">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 shrink-0"
            aria-hidden
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
          {t("inspection.clean")}
        </div>
      )}

      {/* Secondary facts */}
      <dl className="grid grid-cols-1 gap-2 text-[13px] sm:grid-cols-2">
        {inspection.guaranty && (
          <InfoRow
            label={t("inspection.guaranty")}
            value={inspection.guaranty}
          />
        )}
        {inspection.vin && (
          <InfoRow label={t("inspection.vin")} value={inspection.vin} />
        )}
      </dl>
    </section>
  );
}

function InsuranceReport({ insurance }: { insurance: KoreaInsurance }) {
  const t = useTranslations("carDetail.encar");

  const accidentTotal =
    insurance.my_accident_count + insurance.other_accident_count;
  const insuranceClean =
    accidentTotal === 0 &&
    insurance.total_loss_count === 0 &&
    insurance.theft_count === 0 &&
    insurance.flood_count === 0;

  return (
    <section className="flex flex-col gap-4 pt-1">
      <div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            insuranceClean
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
              : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${insuranceClean ? "bg-emerald-500" : "bg-amber-500"}`}
            aria-hidden
          />
          {insuranceClean
            ? t("insurance.clean")
            : t("insurance.accidentBadge", { count: accidentTotal })}
        </span>
      </div>

      {/* Hard red flags — write-off / theft / flood / fleet history */}
      {(insurance.total_loss_count > 0 ||
        insurance.theft_count > 0 ||
        insurance.flood_count > 0 ||
        insurance.government_use ||
        insurance.business_use) && (
        <div className="flex flex-wrap gap-2">
          {insurance.total_loss_count > 0 && (
            <Flag tone="danger" label={t("insurance.totalLoss")} />
          )}
          {insurance.theft_count > 0 && (
            <Flag tone="danger" label={t("insurance.theft")} />
          )}
          {insurance.flood_count > 0 && (
            <Flag tone="danger" label={t("insurance.flood")} />
          )}
          {insurance.government_use && (
            <Flag tone="warn" label={t("insurance.governmentUse")} />
          )}
          {insurance.business_use && (
            <Flag tone="warn" label={t("insurance.businessUse")} />
          )}
        </div>
      )}

      {/* History-at-a-glance */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <StatCell
          label={t("insurance.myAccidents")}
          value={String(insurance.my_accident_count)}
          sub={
            insurance.my_accident_cost > 0
              ? formatKrw(insurance.my_accident_cost)
              : undefined
          }
        />
        <StatCell
          label={t("insurance.otherAccidents")}
          value={String(insurance.other_accident_count)}
          sub={
            insurance.other_accident_cost > 0
              ? formatKrw(insurance.other_accident_cost)
              : undefined
          }
        />
        <StatCell
          label={t("insurance.ownerChanges")}
          value={String(insurance.owner_change_count)}
        />
        <StatCell
          label={t("insurance.plateChanges")}
          value={String(insurance.plate_change_count)}
        />
        {insurance.first_registered && (
          <StatCell
            label={t("insurance.firstRegistered")}
            value={insurance.first_registered}
          />
        )}
      </div>

      {/* Individual claims (damage to this car) */}
      {insurance.accidents.length > 0 && (
        <div className="flex flex-col gap-3 rounded-xl bg-amber-50/60 p-3 dark:bg-amber-500/5">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
            {t("insurance.claimsTitle")}
          </div>
          <ul className="flex flex-col gap-2.5">
            {insurance.accidents.map((accident, idx) => (
              <li
                key={`${accident.date ?? "?"}-${idx}`}
                className="flex flex-col gap-0.5"
              >
                <div className="flex items-center justify-between gap-3 text-[12.5px]">
                  <span className="text-neutral-700 dark:text-neutral-300">
                    {accident.date ?? "-"}
                  </span>
                  {accident.insurance_benefit != null && (
                    <span className="shrink-0 font-semibold text-amber-700 dark:text-amber-400">
                      {formatKrw(accident.insurance_benefit)}
                    </span>
                  )}
                </div>
                {(accident.part_cost != null ||
                  accident.labor_cost != null ||
                  accident.painting_cost != null) && (
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    {[
                      accident.part_cost != null
                        ? `${t("insurance.parts")} ${formatKrw(accident.part_cost)}`
                        : null,
                      accident.labor_cost != null
                        ? `${t("insurance.labor")} ${formatKrw(accident.labor_cost)}`
                        : null,
                      accident.painting_cost != null
                        ? `${t("insurance.painting")} ${formatKrw(accident.painting_cost)}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function Flag({ tone, label }: { tone: "danger" | "warn"; label: string }) {
  const styles =
    tone === "danger"
      ? "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
      : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12px] font-medium ${styles}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-3.5 w-3.5"
        aria-hidden
      >
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      {label}
    </span>
  );
}

function StatCell({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl border border-neutral-200/80 bg-white px-3 py-2.5 dark:border-neutral-800 dark:bg-neutral-900">
      <span className="text-[11px] font-medium uppercase text-neutral-400 dark:text-neutral-500">
        {label}
      </span>
      <span className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
        {value}
      </span>
      {sub && (
        <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
          {sub}
        </span>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <dt className="w-24 shrink-0 text-neutral-500 dark:text-neutral-400">
        {label}
      </dt>
      <dd className="flex-1 break-all font-medium text-neutral-900 dark:text-neutral-100">
        {value}
      </dd>
    </div>
  );
}
