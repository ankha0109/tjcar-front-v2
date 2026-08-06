import Script from "next/script";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

/**
 * Google Analytics 4, pageviews only.
 *
 * Route changes are NOT tracked from React. GA4's Enhanced Measurement watches
 * browser history events itself, and gtag.js sends its own `page_view` on every
 * client-side navigation — measured against this app, not assumed. Sending one
 * from an effect as well produced exactly two hits per navigation, and
 * `send_page_view: false` does not suppress the history-driven one; it only
 * suppresses the very first.
 *
 * The cost of leaving it to gtag is that a route change reports the title of
 * the page being left, because the tag fires before Next commits the new one.
 * `page_location` is always right, so anything keyed on the path is unaffected.
 * Turning "Page changes based on browser history events" off in the GA4 data
 * stream would break tracking entirely — this file depends on it being on.
 *
 * An unset `NEXT_PUBLIC_GA_ID` compiles the whole thing away, which is how local
 * development stays out of the report.
 */
export default function GoogleAnalytics() {
  if (!GA_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
      </Script>
    </>
  );
}
