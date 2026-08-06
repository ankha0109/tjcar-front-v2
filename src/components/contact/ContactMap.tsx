import { getTranslations } from "next-intl/server";
import { MAP_EMBED_URL, MAP_PLACE_URL } from "@/lib/contact";

/**
 * Google's place embed for the office. `loading="lazy"` keeps the third-party
 * frame out of the initial load; the `title` is what a screen reader announces,
 * which v1's raw HTML injection never provided.
 */
export default async function ContactMap() {
  const t = await getTranslations("contact.map");

  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <h2 className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-100">
          {t("heading")}
        </h2>
        <a
          href={MAP_PLACE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-[13px] font-medium text-primary underline-offset-4 pointer-fine:hover:underline"
        >
          {t("directions")}
        </a>
      </div>

      <iframe
        src={MAP_EMBED_URL}
        title={t("title")}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
        className="block h-80 w-full border-0 lg:h-115"
      />
    </section>
  );
}
