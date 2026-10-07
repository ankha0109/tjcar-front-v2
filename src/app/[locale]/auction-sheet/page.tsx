import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import AuctionSheetHero from "@/components/auction-sheet/AuctionSheetHero";
import GradeScale from "@/components/auction-sheet/GradeScale";
import GuideCta from "@/components/auction-sheet/GuideCta";
import MarkLegend from "@/components/auction-sheet/MarkLegend";
import SheetExplorer from "@/components/auction-sheet/SheetExplorer";
import { getHouse } from "@/lib/auctionSheet";
import { getFieldText } from "@/lib/auctionSheet/text";
import { getGlossary } from "@/lib/auctionSheet/text/glossary";
import { getDevice } from "@/lib/device";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ auction?: string | string[] }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "auctionSheet.metadata",
  });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function AuctionSheetPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [{ auction }, device] = await Promise.all([searchParams, getDevice()]);
  // Resolved here so the first paint is already the sheet the link asked for.
  // `getHouse` answers anything it does not know with USS, so a mistyped or
  // stale `?auction=` still gets a page rather than a 404.
  const house = getHouse(Array.isArray(auction) ? auction[0] : auction);

  return (
    <>
      <AuctionSheetHero />
      <SheetExplorer
        initialHouse={house.id}
        // Only this locale's dictionary crosses to the client — the reason the
        // field text lives in `src/lib` and not in the global message file.
        text={getFieldText(locale)}
        glossary={getGlossary(locale)}
        device={device}
      />
      <div className="border-t border-neutral-200 dark:border-neutral-800">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12 lg:px-6 lg:py-14">
          <GradeScale />
          <MarkLegend />
        </div>
      </div>
      <GuideCta />
    </>
  );
}
