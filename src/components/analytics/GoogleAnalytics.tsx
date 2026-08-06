"use client";

import Script from "next/script";
// Deliberately `next/navigation`, not `@/i18n/navigation`: next-intl's
// `usePathname` strips the `/mn`, `/en`, `/ru` prefix, so switching language
// would leave it unchanged and that pageview would never fire.
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

declare global {
  interface Window {
    dataLayer?: IArguments[];
  }
}

type GtagCommand =
  | ["js", Date]
  | ["config", string, { send_page_view: boolean }]
  | ["event", "page_view", { page_location: string; page_title: string }];

/**
 * Queue a gtag command. `gtag.js` drains `window.dataLayer` once it loads, so
 * pushing before the script arrives is not merely safe — it is the whole
 * mechanism, and it is what keeps `config` ahead of the first `page_view`.
 *
 * The pushed value has to be the real `arguments` object: the tag routes an
 * entry as a gtag command only when it looks like one, and a plain array is
 * silently dropped. Hence a `function` rather than an arrow, and hence the
 * parameter list existing purely to type the call sites.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function gtag(...command: GtagCommand) {
  // eslint-disable-next-line prefer-rest-params
  (window.dataLayer = window.dataLayer ?? []).push(arguments);
}

function GaTracker({ gaId }: { gaId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Declared before the pageview effect on purpose — React runs a component's
  // effects in declaration order, which is what puts `config` into the queue
  // ahead of the first event. An event that reaches the tag before its config
  // is thrown away.
  useEffect(() => {
    gtag("js", new Date());
    gtag("config", gaId, { send_page_view: false });
  }, [gaId]);

  // With the automatic pageview off, every one comes from here — including the
  // first. `/japan` and `/japan/brands` keep their filters and paging in the
  // query string, so the search params belong in the key.
  useEffect(() => {
    gtag("event", "page_view", {
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname, searchParams]);

  return null;
}

/**
 * Google Analytics 4, pageviews only. An unset `NEXT_PUBLIC_GA_ID` compiles the
 * whole thing away — that is how local development stays out of the report.
 */
export default function GoogleAnalytics() {
  if (!GA_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      {/* `useSearchParams` opts its subtree out of static rendering, so it needs
          a boundary of its own — without one, `next build` fails on every
          statically rendered route. */}
      <Suspense fallback={null}>
        <GaTracker gaId={GA_ID} />
      </Suspense>
    </>
  );
}
