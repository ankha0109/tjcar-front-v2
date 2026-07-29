import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import WishlistBoard, {
  WishlistSummary,
} from "@/components/wishlist/WishlistBoard";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "wishlist" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

/**
 * Public wishlist page — works for guests (localStorage) and signed-in
 * customers (DB). The list is inherently client state, so it lives in
 * {@link WishlistBoard}; the page itself stays a server component for the
 * metadata, the locale and the heading.
 */
export default async function WishlistPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("wishlist");

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-6 lg:py-10">
      <header className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 lg:text-3xl">
          {t("title")}
        </h1>
        <WishlistSummary />
      </header>

      <WishlistBoard />
    </div>
  );
}
