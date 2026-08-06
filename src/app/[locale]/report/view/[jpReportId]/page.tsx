import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

const BUTTON_BASE =
  "inline-flex h-11 items-center justify-center rounded-md px-6 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "reportView" });

  return {
    title: t("metaTitle"),
    // One URL per sold report, and nothing on it worth ranking yet — the same
    // rule `report/[uuid]` follows.
    robots: { index: false, follow: false },
  };
}

/**
 * The page the QR code on every generated report PDF points at:
 * `https://tjcar.mn/report/view/{jp_report_id}`, printed — along with the URL
 * in readable text — by `resources/views/pdf/report.blade.php` in the API repo.
 *
 * The real verification screen does not exist yet, so this admits it. A 200
 * that says "coming soon" beats the 404 a scanned QR used to land on when the
 * caption under it promises the reader they can check the report is genuine.
 *
 * `jpReportId` is matched but never read: nothing is fetched, so there is
 * nothing to validate it against, and guessing the backend's id format would
 * 404 legitimate scans. `GET /reports/public/{jpReportId}` (already live, and
 * typed here as `PublicReport`) is what replaces this body.
 */
export default async function ReportVerifySoonPage({
  params,
}: {
  params: Promise<{ locale: string; jpReportId: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("reportView");

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center px-4 py-20 text-center lg:px-6 lg:py-28">
      <div className="relative isolate flex w-full flex-col items-center">
        {/* The only ornament on the page — the same brand bloom the 404 screen
            uses, so the two "nothing here yet" pages read as one family. */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-1/2 -z-10 size-[20rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary opacity-[0.10] blur-[110px] sm:size-[34rem] dark:opacity-[0.18]"
        />

        <h1 className="text-2xl font-semibold lg:text-3xl">{t("title")}</h1>

        <p className="mt-3 max-w-md text-base text-secondary dark:text-neutral-400">
          {t("description")}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/report"
            className={`${BUTTON_BASE} bg-primary text-white hover:bg-[#d63a21]`}
          >
            {t("ctaReport")}
          </Link>
          <Link
            href="/"
            className={`${BUTTON_BASE} border border-black/10 text-neutral-800 hover:bg-black/[0.04] dark:border-white/15 dark:text-neutral-200 dark:hover:bg-white/[0.06]`}
          >
            {t("ctaHome")}
          </Link>
        </div>
      </div>
    </section>
  );
}
