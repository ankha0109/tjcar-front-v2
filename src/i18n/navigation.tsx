import type { ComponentProps } from "react";
import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

const {
  Link: BaseLink,
  redirect,
  usePathname,
  useRouter,
  getPathname,
} = createNavigation(routing);

export { redirect, usePathname, useRouter, getPathname };

type LinkProps = ComponentProps<typeof BaseLink>;

/**
 * The locale-aware `<Link>`, with prefetching **off by default**.
 *
 * Next prefetches every link that scrolls into view, and each prefetch is a
 * real request to this server: it stops at the nearest `loading.tsx`, so the
 * page body never renders, but `generateMetadata` still runs. On a lot detail
 * route that means one `GET /japan/{id}` per card a reader scrolls past — 40
 * per page of results — and AJES bills a daily quota of 20,000 upstream calls,
 * of which the API's 4-hour lot cache only absorbs the repeats. Browsing a few
 * hundred lots used to be worth a few hundred quota units before the reader
 * opened a single car.
 *
 * The cost is a server round trip on tap instead of an instant commit. Every
 * route in this app is dynamic, so nothing here was ever prefetched as a
 * complete page anyway — the prefetch only bought the skeleton that
 * `loading.tsx` already renders on demand.
 *
 * Pass `prefetch` explicitly to opt a link back in — worth it only where the
 * destination costs the API nothing.
 */
export function Link({ prefetch = false, ...rest }: LinkProps) {
  return <BaseLink prefetch={prefetch} {...rest} />;
}
