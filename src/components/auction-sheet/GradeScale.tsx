import { getTranslations } from "next-intl/server";
import {
  LEGEND_BADGE,
  RATE_GRADES,
  getGradeInfo,
} from "@/utils/auctionGrade";
import { cn } from "@/utils";

const SIDE_GRADES = ["A", "B", "C", "D", "E"] as const;

/**
 * The two grade scales a sheet carries: the overall score, and the letters for
 * the interior and the bodywork. The overall rows are the same ones `RateCard`
 * shows on a lot — same list, same copy, same colours — so a grade means one
 * thing wherever the site prints it.
 */
export default async function GradeScale() {
  const t = await getTranslations("auctionSheet.grades");
  const tRate = await getTranslations("carDetail.rateInfo");
  const grades = tRate.raw("grades") as Record<string, string>;

  return (
    <section>
      <h2 className="text-[17px] font-semibold text-neutral-900 lg:text-[20px] dark:text-neutral-100">
        {t("heading")}
      </h2>
      <p className="mt-1 text-[13px] leading-relaxed text-neutral-500 dark:text-neutral-400">
        {t("subtitle")}
      </p>

      <h3 className="mt-6 text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
        {t("overallHeading")}
      </h3>
      <ul className="mt-2 flex flex-col gap-1.5">
        {RATE_GRADES.map(({ code, key }) => (
          <li key={key} className="flex items-start gap-2.5">
            <span
              className={cn(
                "mt-px inline-flex min-w-9 shrink-0 justify-center rounded-md px-1.5 py-0.5 text-[12px] font-bold text-white",
                LEGEND_BADGE[getGradeInfo(code)?.tier ?? "unknown"],
              )}
            >
              {code}
            </span>
            <span className="text-[13px] leading-snug text-neutral-600 dark:text-neutral-300">
              {grades[key]}
            </span>
          </li>
        ))}
      </ul>

      <h3 className="mt-7 text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
        {t("sideHeading")}
      </h3>
      <ul className="mt-2 flex flex-col gap-1.5">
        {SIDE_GRADES.map((letter) => (
          <li key={letter} className="flex items-start gap-2.5">
            <span className="mt-px inline-flex min-w-9 shrink-0 justify-center rounded-md bg-neutral-900 px-1.5 py-0.5 text-[12px] font-bold text-white dark:bg-neutral-700">
              {letter}
            </span>
            <span className="text-[13px] leading-snug text-neutral-600 dark:text-neutral-300">
              {t(`side.${letter}`)}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-5 text-[12px] leading-relaxed text-neutral-400 dark:text-neutral-500">
        {tRate("note")}
      </p>
    </section>
  );
}
