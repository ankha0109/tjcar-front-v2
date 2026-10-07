import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

/** Closes the guide by sending the reader to real sheets — the Japan catalogue. */
export default async function GuideCta() {
  const t = await getTranslations("auctionSheet.cta");

  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-12 lg:px-6 lg:pb-16">
      <div className="flex flex-col items-start gap-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-6 md:flex-row md:items-center md:justify-between md:gap-8 md:p-8 dark:border-neutral-800 dark:bg-neutral-900/60">
        <div className="min-w-0">
          <h2 className="text-[17px] font-semibold text-neutral-900 lg:text-[20px] dark:text-neutral-100">
            {t("title")}
          </h2>
          <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-neutral-600 dark:text-neutral-400">
            {t("body")}
          </p>
        </div>
        <Link
          href="/japan"
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[14px] font-semibold text-white transition hover:bg-primary/90"
        >
          {t("button")}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
      </div>
    </section>
  );
}
