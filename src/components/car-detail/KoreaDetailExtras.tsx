import { getTranslations } from "next-intl/server";
import type { KoreaInspection, KoreaInsurance } from "@/types/korea";

type Props = {
  inspection?: KoreaInspection | null;
  insurance?: KoreaInsurance | null;
};

const formatKrw = (n: number) => `₩${new Intl.NumberFormat("en-US").format(n)}`;

/**
 * Encar-only condition sections: the government performance inspection
 * (성능점검) summary and the insurance history (보험이력). Inspection text
 * stays in Korean (the source of truth); only the surrounding labels are
 * localized. Rendered in the info column of the Korea car detail page; the
 * grouped options live in KoreaOptionsPanel beneath the gallery.
 */
export default async function KoreaDetailExtras({
  inspection,
  insurance,
}: Props) {
  const t = await getTranslations("carDetail.encar");

  if (!inspection && !insurance) return null;

  const accidentTotal =
    (insurance?.my_accident_count ?? 0) + (insurance?.other_accident_count ?? 0);
  const insuranceClean =
    accidentTotal === 0 &&
    (insurance?.total_loss_count ?? 0) === 0 &&
    (insurance?.theft_count ?? 0) === 0 &&
    (insurance?.flood_count ?? 0) === 0;

  const repairs = inspection?.repair_panels ?? [];
  const paints = inspection?.paint_panels ?? [];
  const serious = inspection?.serious_issues ?? [];
  const hasFindings =
    repairs.length > 0 || paints.length > 0 || serious.length > 0;
  const stateGood = inspection?.state === "양호";

  return (
    <>
      {inspection && (
        <section className="flex flex-col gap-4 rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[14px] font-semibold text-neutral-900 dark:text-neutral-100">
              {t("inspection.title")}
            </h2>
            {inspection.state && (
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
            )}
          </div>

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
      )}

      {insurance && (
        <section className="flex flex-col gap-4 rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[14px] font-semibold text-neutral-900 dark:text-neutral-100">
              {t("insurance.title")}
            </h2>
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
                        {accident.date ?? "—"}
                      </span>
                      {accident.insurance_benefit != null && (
                        <span className="shrink-0 font-semibold tabular-nums text-amber-700 dark:text-amber-400">
                          {formatKrw(accident.insurance_benefit)}
                        </span>
                      )}
                    </div>
                    {(accident.part_cost != null ||
                      accident.labor_cost != null ||
                      accident.painting_cost != null) && (
                      <div className="text-[11px] tabular-nums text-neutral-500 dark:text-neutral-400">
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
      )}

    </>
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
      <span className="text-[10.5px] font-medium uppercase text-neutral-400 dark:text-neutral-500">
        {label}
      </span>
      <span className="text-[13px] font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
        {value}
      </span>
      {sub && (
        <span className="text-[11px] tabular-nums text-neutral-500 dark:text-neutral-400">
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
