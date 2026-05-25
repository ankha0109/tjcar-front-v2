import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "howItWorks.metadata" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function HowItWorksPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("homeHero");

  return (
    <section className="relative">
      <div className="relative isolate mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 px-4 pb-14 pt-12 md:gap-14 md:pb-20 md:pt-20 lg:grid-cols-12 lg:gap-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 hidden lg:block lg:bg-[url(/images/hero_bg_white.png)] dark:lg:bg-[url(/images/hero_bg_black.png)] lg:bg-contain lg:bg-right lg:bg-no-repeat lg:bg-origin-content lg:pl-[30%]"
        />
        <div className="relative lg:col-span-6">
          <div className="hero-reveal" style={{ animationDelay: "0ms" }}>
            <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/70 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-600 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/60 dark:text-neutral-400">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
              {t("eyebrow")}
              <span className="h-3 w-px bg-neutral-200 dark:bg-neutral-700" />
              <span className="normal-case tracking-normal text-neutral-500 dark:text-neutral-400">
                {t("eyebrowSub")}
              </span>
            </span>
          </div>

          <h1
            className="hero-reveal mt-5 text-3xl font-semibold leading-[1.1] tracking-tight text-neutral-900 sm:text-4xl md:text-5xl dark:text-neutral-50"
            style={{ animationDelay: "120ms" }}
          >
            {t("headingLine1")}{" "}
            <span className="relative whitespace-nowrap">
              <span className="relative z-10">{t("headingAccent")}</span>
              <span
                aria-hidden="true"
                className="absolute inset-x-0 bottom-[0.08em] z-0 block h-[0.32em] -skew-x-6 bg-primary/25 dark:bg-primary/40"
              />
            </span>{" "}
            <span className="text-neutral-500 dark:text-neutral-400">
              {t("headingLine2")}
            </span>
          </h1>

          <p
            className="hero-reveal mt-5 max-w-xl text-[15px] leading-relaxed text-neutral-600 md:text-base dark:text-neutral-400"
            style={{ animationDelay: "220ms" }}
          >
            {t("subheading")}
          </p>
        </div>
      </div>
    </section>
  );
}
