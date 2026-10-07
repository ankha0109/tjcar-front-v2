import { getTranslations } from "next-intl/server";
import { MARK_CODES } from "@/lib/auctionMarks";

/**
 * The damage marks an inspector writes on the car diagram — the same list and
 * copy as the `EvaluationGuide` modal on a lot page, laid out for reading
 * rather than for a quick look-up.
 */
export default async function MarkLegend() {
  const t = await getTranslations("auctionSheet.marks");
  const tGuide = await getTranslations("carDetail.evaluationGuide");

  return (
    <section>
      <h2 className="text-[17px] font-semibold text-neutral-900 lg:text-[20px] dark:text-neutral-100">
        {t("heading")}
      </h2>
      <p className="mt-1 text-[13px] leading-relaxed text-neutral-500 dark:text-neutral-400">
        {t("subtitle")}
      </p>

      <ul className="mt-6 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
        {MARK_CODES.map((code) => (
          <li key={code} className="flex items-start gap-2.5">
            <span className="inline-flex min-w-9 shrink-0 justify-center rounded-md bg-neutral-900 px-1.5 py-1 text-[14px] font-bold text-white dark:bg-neutral-700">
              {code}
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
                {tGuide(`marks.${code}.title`)}
              </span>
              <span className="mt-0.5 block text-[12px] leading-snug text-neutral-500 dark:text-neutral-400">
                {tGuide(`marks.${code}.description`)}
              </span>
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-5 rounded-lg bg-amber-50 px-3 py-2 text-[12px] leading-relaxed text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
        <span className="font-semibold">{tGuide("noteLabel")}</span>{" "}
        {tGuide("note")}
      </p>
    </section>
  );
}
