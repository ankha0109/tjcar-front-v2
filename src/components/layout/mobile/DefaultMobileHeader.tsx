import { getDevice } from "@/lib/device";
import MobileHeader from "./MobileHeader";

/**
 * The bar every route gets unless it ships its own: logo, compare tray, menu.
 *
 * Three slot files render this, and all three are load-bearing. Next keeps an
 * unmatched parallel-route slot's previous subtree across a *soft* navigation —
 * the behaviour that lets intercepted routes hold a modal open — and only falls
 * back to `default.tsx` on a hard one. So a gap in `@mobileHeader`'s routing
 * does not mean "show the default bar", it means "keep the last page's title":
 * leaving `/japan/[id]` or `/dashboard` by tapping a link used to strand that
 * page's heading on top of the next screen. Covering every path closes it.
 *
 * - `default.tsx` — hard navigations
 * - `page.tsx` — the locale root (`/mn`), which `[...rest]` cannot match
 * - `[...rest]/page.tsx` — everything below it that has no slot of its own
 */
export default async function DefaultMobileHeader() {
  const device = await getDevice();
  if (device !== "mobile") return null;

  return <MobileHeader menuButton />;
}
