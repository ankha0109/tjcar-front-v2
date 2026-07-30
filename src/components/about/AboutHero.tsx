import { getTranslations } from "next-intl/server";

/** Words the headline cycles through — trust, then speed, then price. */
const ACCENTS = ["reliable", "fast", "fairPrice"] as const;

/**
 * Page hero. Layout is the one the (now removed) /how-it-works page used: copy
 * on the left, the hero artwork bleeding in from the right as a CSS background
 * from `lg` up. The globe that used to live here moved down into
 * `AboutServices` — see the plan note in that file.
 */
export default async function AboutHero() {
  const t = await getTranslations("about.hero");

  return (
    <section className="relative">
      <div className="relative isolate mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 px-4 pb-14 pt-12 md:gap-14 md:pb-20 md:pt-20 lg:grid-cols-12 lg:gap-12 lg:px-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 hidden lg:block lg:bg-[url(/images/hero_bg_white.png)] lg:bg-contain lg:bg-right lg:bg-no-repeat lg:bg-origin-content lg:pl-[30%] dark:lg:bg-[url(/images/hero_bg_black.png)]"
        />

        <div className="relative lg:col-span-6">
          <div className="hero-reveal" style={{ animationDelay: "0ms" }}>
            <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/70 px-3 py-1.5 text-[11px] font-medium uppercase text-neutral-600 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/60 dark:text-neutral-400">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
              {t("eyebrow")}
              <span className="h-3 w-px bg-neutral-200 dark:bg-neutral-700" />
              <span className="normal-case text-neutral-500 dark:text-neutral-400">
                {t("eyebrowSub")}
              </span>
            </span>
          </div>

          {/* The legal name is inside the h1 so the accessible name and the
              SEO title of an "about us" page both carry it. */}
          <h1 className="hero-reveal mt-5" style={{ animationDelay: "120ms" }}>
            <span className="block text-[13px] font-semibold uppercase text-primary md:text-[15px]">
              {t("company")}
            </span>
            <span className="mt-2.5 block text-3xl font-semibold leading-[1.1] text-neutral-900 sm:text-4xl md:text-5xl dark:text-neutral-50">
              <span className="block">{t("titleLine1")}</span>

              {/* The rotating word gets its own line so the swap never reflows
                  the rest of the heading. Only the first word is exposed to
                  assistive tech — the other two are decorative repeats. */}
              <span className="flip-words">
                {ACCENTS.map((key, i) => (
                  <span
                    key={key}
                    className="flip-word whitespace-nowrap"
                    style={{ "--flip-i": i } as React.CSSProperties}
                    aria-hidden={i > 0 || undefined}
                  >
                    <span className="relative z-10 text-primary">
                      {t(`titleAccents.${key}`)}
                    </span>
                    {/* Thin chip rather than the heavier highlighter the old
                        /how-it-works hero used — the accent is red text here,
                        so a red block behind it would flatten the contrast. */}
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 -bottom-1 z-0 block h-2 -skew-x-6 rounded bg-primary/15 dark:bg-primary/25"
                    />
                  </span>
                ))}
              </span>

              <span className="block text-neutral-500 dark:text-neutral-400">
                {t("titleLine2")}
              </span>
            </span>
          </h1>

          <p
            className="hero-reveal mt-5 max-w-xl text-[15px] leading-relaxed text-neutral-600 md:text-base dark:text-neutral-400"
            style={{ animationDelay: "220ms" }}
          >
            {t("subtitle")}
          </p>
        </div>
      </div>
    </section>
  );
}
