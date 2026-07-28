import { getTranslations } from "next-intl/server";
import ReportCtaButton from "./ReportCtaButton";
import Reveal from "./Reveal";

/** §5.10 final CTA banner + the §11 footer disclaimer small print. */
export default async function ReportFinalCta() {
  const t = await getTranslations("reportLanding.finalCta");
  const tf = await getTranslations("reportLanding.footerNote");
  const tb = await getTranslations("reportLanding.hero.badges");

  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-14 pt-4 md:pb-20 lg:px-6">
      <Reveal>
        <div className="relative overflow-hidden rounded-[28px] border border-neutral-800 bg-neutral-950 px-6 py-14 text-center md:px-12 md:py-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 60% 80% at 50% 0%, rgba(241,71,44,0.26), transparent 70%)",
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.06)_1px,transparent_0)] [background-size:22px_22px]"
          />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[11.5px] font-medium tabular-nums text-white/85 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {tb("price")}
            </span>
            <h2 className="mx-auto mt-5 max-w-2xl text-balance text-[26px] font-semibold leading-tight text-white md:text-[36px]">
              {t("heading")}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[13.5px] leading-relaxed text-white/70 md:text-[15px]">
              {t("subheading")}
            </p>
            <div className="mt-8 flex justify-center">
              <ReportCtaButton targetId="report-check">{t("cta")}</ReportCtaButton>
            </div>
            <p className="mx-auto mt-5 max-w-md text-[12px] leading-relaxed text-white/45">
              {t("priceNote")}
            </p>
          </div>
        </div>
      </Reveal>

      {/* footer disclaimer */}
      <p className="mx-auto mt-8 max-w-3xl text-center text-[12px] leading-relaxed text-neutral-500 dark:text-neutral-400">
        {tf("text")}
      </p>
    </section>
  );
}
