import { getTranslations } from "next-intl/server";

type Props = {
  /** `CarResource.description` — Tiptap HTML written in the admin editor. */
  html: string | null;
};

/**
 * The seller's own write-up of an in-stock car: equipment, service history, the
 * things the nine hand-typed `car_data` keys have no room for.
 *
 * The HTML comes from the admin's Tiptap editor and renders unsanitized, the
 * same trust model as a blog post's body — both are written by staff, never by
 * a visitor. `.post-body` supplies the typography; `.car-description` trims it
 * to the narrower info column.
 */
export default async function CarDescription({ html }: Props) {
  // An emptied editor still POSTs markup ("<p></p>"), so a non-null field is not
  // yet a reason to print a heading — look for actual text.
  if (!html || !hasText(html)) return null;

  const t = await getTranslations("garage.description");

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <h2 className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-100">
        {t("title")}
      </h2>
      <div
        className="post-body car-description mt-2.5"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </section>
  );
}

function hasText(html: string): boolean {
  return (
    html
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .trim().length > 0
  );
}
