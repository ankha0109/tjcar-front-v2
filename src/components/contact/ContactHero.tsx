import { getTranslations } from "next-intl/server";

/**
 * Page hero for the contact page. Shares `TermsHero`'s ruled backdrop on
 * purpose — these are the two static company pages and they should read as a
 * pair. The pill's trailing slot carries the working hours, which is the one
 * fact a visitor checks before deciding whether to call.
 */
export default async function ContactHero() {
  const t = await getTranslations("contact.hero");

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
            <PhoneIcon className="h-3.5 w-3.5 text-primary" />
            {t("eyebrow")}
            <span className="h-3 w-px bg-neutral-200 dark:bg-neutral-700" />
            <span className="normal-case text-neutral-500 dark:text-neutral-400">
              {t("hours")}
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

function PhoneIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
