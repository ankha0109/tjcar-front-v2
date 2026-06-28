import { setRequestLocale } from "next-intl/server";
import DesktopHome from "@/components/home/DesktopHome";
import MobileHome from "@/components/home/MobileHome";
import { getDevice } from "@/lib/device";
import { getFilterOptions } from "@/services/filters";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function Home({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [device, filterOptions] = await Promise.all([
    getDevice(),
    getFilterOptions().catch((reason) => {
      console.error("[Home] /filters fetch failed:", reason);
      return undefined;
    }),
  ]);

  if (device === "mobile") {
    return <MobileHome />;
  }

  return (
    <DesktopHome
      filterOptions={filterOptions}
      japanBrands={filterOptions?.markas}
    />
  );
}
