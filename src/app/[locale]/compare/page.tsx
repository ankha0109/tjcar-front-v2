import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import CompareFromStore from "@/components/compare/CompareFromStore";
import CompareView from "@/components/compare/CompareView";
import { getCompare } from "@/services/compare";
import { buildCompareParam, parseCompareParam } from "@/types/compare";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ items?: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "compare" });
  return { title: t("title") };
}

export default async function ComparePage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { items } = await searchParams;
  const t = await getTranslations("compare");

  // Re-canonicalize before fetching so junk params never reach the backend.
  const refs = parseCompareParam(items);

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 md:py-12">
      <h1 className="mb-6 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
        {t("title")}
      </h1>
      {refs.length === 0 ? (
        <CompareFromStore />
      ) : (
        <CompareView entries={await getCompare(buildCompareParam(refs))} />
      )}
    </section>
  );
}
