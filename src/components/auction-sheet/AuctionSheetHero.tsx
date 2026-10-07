import { getTranslations } from "next-intl/server";

/**
 * Hero band for the auction sheet guide. Its backdrop is a faint form grid —
 * the page is about reading a ruled form, so the ruling is the only ornament —
 * masked out before it reaches the copy.
 */
export default async function AuctionSheetHero() {
  const t = await getTranslations("auctionSheet.hero");

  return (
    <section className="relative overflow-hidden border-b border-neutral-200/70 bg-neutral-50/60 dark:border-neutral-800/70 dark:bg-neutral-900/40">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom_left,black,transparent_60%)] dark:opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(100,116,139,0.16) 1px, transparent 1px), linear-gradient(to bottom, rgba(100,116,139,0.16) 1px, transparent 1px)",
          backgroundSize: "88px 44px",
        }}
      />

      <div className="relative mx-auto w-full max-w-7xl px-4 pb-10 pt-10 md:pb-14 md:pt-14 lg:px-6">
        <h1
          className="hero-reveal max-w-2xl text-balance text-3xl font-semibold leading-[1.12] text-neutral-900 sm:text-4xl md:text-[42px] dark:text-neutral-50"
          style={{ animationDelay: "0ms" }}
        >
          {t("title")}
        </h1>

        <p
          className="hero-reveal mt-5 max-w-2xl text-[15px] leading-relaxed text-neutral-600 md:text-base dark:text-neutral-400"
          style={{ animationDelay: "120ms" }}
        >
          {t("subtitle")}
        </p>
      </div>
    </section>
  );
}
