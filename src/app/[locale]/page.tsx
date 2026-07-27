import { setRequestLocale } from "next-intl/server";
import DesktopHome from "@/components/home/DesktopHome";
import { getFilterOptions } from "@/services/filters";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function Home({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  // One tree for every width: the home sections are Tailwind-responsive
  // (grid-cols-1 → sm: → lg:), so the `tjcar-device` cookie split is off here.
  const filterOptions = await getFilterOptions().catch((reason) => {
    console.error("[Home] /filters fetch failed here:", reason);
    return undefined;
  });

  return (
    <DesktopHome
      filterOptions={filterOptions}
      japanBrands={filterOptions?.markas}
    />
  );
}
