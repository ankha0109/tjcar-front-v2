import NotFoundView from "@/components/pages/NotFoundView";

/**
 * The 404 inside the app shell — header, footer, theme, translations. Reached
 * both by unmatched URLs (via `[...rest]/page.tsx`) and by any page that calls
 * `notFound()` itself.
 *
 * Next serves this tree client-side: a thrown `notFound()` aborts the flight
 * render, so the SSR document is Next's own `<html id="__next_error__">` seed
 * and React fills the real page in on hydration. The 404 status and the
 * `noindex` meta are still set server-side, which is what crawlers act on.
 */
export default function LocaleNotFound() {
  return <NotFoundView />;
}
