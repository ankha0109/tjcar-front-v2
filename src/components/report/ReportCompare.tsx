import { getTranslations } from "next-intl/server";
import ReportHeading from "./ReportHeading";
import CompareSlider from "./CompareSlider";
import Reveal from "./Reveal";
import compareClean from "../../../public/report/compare-clean2.png";
import compareDamaged from "../../../public/report/compare-damaged2.png";

/** §5.4 interactive before/after compare — the page's visual proof. */
export default async function ReportCompare() {
  const t = await getTranslations("reportLanding.compare");

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-14 md:py-20 lg:px-6">
      <ReportHeading
        heading={t("heading")}
        subheading={t("subheading")}
      />

      <Reveal className="mx-auto mt-10 w-full max-w-[1000px] md:mt-12">
        <CompareSlider
          left={compareClean}
          right={compareDamaged}
          altLeft={t("altBefore")}
          altRight={t("altAfter")}
          labelLeft={t("labelBefore")}
          labelRight={t("labelAfter")}
          hint={t("hint")}
          ariaLabel={t("sliderAria")}
        />
      </Reveal>
    </section>
  );
}
