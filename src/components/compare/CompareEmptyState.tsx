"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/** Dashed empty block, same pattern as the wishlist page's empty state. */
export default function CompareEmptyState() {
  const t = useTranslations("compare");

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-neutral-200 py-20 text-center dark:border-neutral-800">
      <p className="text-base font-medium text-neutral-700 dark:text-neutral-300">
        {t("empty.title")}
      </p>
      <p className="max-w-sm text-sm text-neutral-500 dark:text-neutral-400">
        {t("empty.description")}
      </p>
      <Link
        href="/japan"
        className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
      >
        {t("empty.cta")}
      </Link>
    </div>
  );
}
