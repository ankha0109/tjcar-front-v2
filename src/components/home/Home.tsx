import DesktopHome from "@/components/home/DesktopHome";
import MobileHome from "@/components/home/MobileHome";
import { getDevice } from "@/lib/device";
import { getFilterOptions } from "@/services/filters";

/**
 * Home splits on the `tjcar-device` cookie (phone UA only), NOT on a breakpoint
 * — same rule as `AppShell`, so a narrow desktop window keeps the desktop tree.
 *
 * The gate sits above `getFilterOptions()` on purpose: those options feed
 * `CarSearchSection` alone and the mobile tree carries no search form, so the
 * mobile branch must not pay for the request. Same ordering as the
 * `@mobileHeader/*` routes.
 */
export default async function Home() {
  const device = await getDevice();

  if (device === "mobile") return <MobileHome />;

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
