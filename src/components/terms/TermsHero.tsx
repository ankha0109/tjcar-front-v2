import { getTranslations } from "next-intl/server";

/**
 * Page hero for the terms of service. Quieter than `AboutHero` on purpose — a
 * legal page wants to read as a document, so the only decoration is the ruled
 * backdrop, which fades out before the copy starts.
 */
export default async function TermsHero() {
  const t = await getTranslations("terms.hero");

  return (
    <section className="relative overflow-hidden border-b border-neutral-200/70 bg-neutral-50/60 dark:border-neutral-800/70 dark:bg-neutral-900/40">
      {/* Ruled-paper lines, masked to nothing by the bottom of the band. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_85%)] dark:opacity-40"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, rgba(100,116,139,0.14) 0 1px, transparent 1px 30px)",
        }}
      />

      <div className="relative mx-auto w-full max-w-7xl px-4 pb-12 pt-10 md:pb-16 md:pt-16 lg:px-6">
        <div className="hero-reveal" style={{ animationDelay: "0ms" }}>
          <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/70 px-3 py-1.5 text-[11px] font-medium uppercase text-neutral-600 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/60 dark:text-neutral-400">
            <DocumentIcon className="h-3.5 w-3.5 text-primary" />
            {t("eyebrow")}
            <span className="h-3 w-px bg-neutral-200 dark:bg-neutral-700" />
            <span className="normal-case text-neutral-500 dark:text-neutral-400">
              {t("company")}
            </span>
          </span>
        </div>

        <h1
          className="hero-reveal mt-5 max-w-2xl text-balance text-3xl font-semibold leading-[1.12] text-neutral-900 sm:text-4xl md:text-[42px] dark:text-neutral-50"
          style={{ animationDelay: "120ms" }}
        >
          {t("title")}
        </h1>

        <p
          className="hero-reveal mt-5 max-w-2xl text-[15px] leading-relaxed text-neutral-600 md:text-base dark:text-neutral-400"
          style={{ animationDelay: "220ms" }}
        >
          {t("subtitle")}
        </p>
      </div>
    </section>
  );
}

function DocumentIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M9 13h6M9 17h4" />
    </svg>
  );
}
