"use client";

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Alert, Button, Skeleton, Spin } from "antd";
import { Link } from "@/i18n/navigation";
import { useReportProgress, type ReportPhase } from "@/hooks/useReportProgress";
import { reportDownloadUrl } from "@/services/reports";
import type { QpayInvoice } from "@/types/report";

/**
 * Post-purchase screen: pay the QPay invoice, then wait for the PDF.
 *
 * The two waits are distinct and the copy says so — QPay confirming the money
 * does NOT mean the report exists yet, because only the webhook starts the
 * render job. See `useReportProgress`.
 */
export default function ReportStatus({ uuid }: { uuid: string }) {
  const t = useTranslations("reportStatus");
  const { status: authStatus } = useSession();
  const isAuthed = authStatus === "authenticated";

  const { report, phase, isStalled, isLoading, error } = useReportProgress(
    uuid,
    isAuthed,
  );

  if (authStatus === "loading") {
    return <Skeleton active paragraph={{ rows: 5 }} />;
  }

  if (!isAuthed) {
    return (
      <Card title={t("loginTitle")}>
        <p className="text-[13.5px] text-neutral-600 dark:text-neutral-300">
          {t("loginBody")}
        </p>
        <Link
          href={`/auth/login?callbackUrl=${encodeURIComponent(`/reports/${uuid}`)}`}
          className="mt-5 inline-block"
        >
          <Button type="primary" size="large" className="min-h-11! rounded-xl!">
            {t("login")}
          </Button>
        </Link>
      </Card>
    );
  }

  if (isLoading) return <Skeleton active paragraph={{ rows: 5 }} />;

  if (error || !report) {
    return (
      <Card title={t("notFoundTitle")}>
        <p className="text-[13.5px] text-neutral-600 dark:text-neutral-300">
          {t("notFoundBody")}
        </p>
        <Link
          href="/dashboard/reports"
          className="mt-5 inline-flex text-[13px] font-medium text-primary hover:underline"
        >
          {t("backToList")}
        </Link>
      </Card>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <Card title={t(`phase.${phase}.title`)}>
        <dl className="divide-y divide-neutral-100 dark:divide-neutral-800">
          <Row label={t("fields.vin")} value={report.vin} />
          <Row
            label={t("fields.price")}
            value={`${Number(report.price).toLocaleString("mn-MN")}₮`}
          />
          <Row label={t("fields.status")} value={report.status_label} />
          <Row label={t("fields.createdAt")} value={report.created_at} />
        </dl>

        <p className="mt-5 text-[13.5px] leading-relaxed text-neutral-600 dark:text-neutral-300">
          {t(`phase.${phase}.body`)}
        </p>

        {phase === "awaiting-payment" ? (
          <QpayPanel invoice={report.invoice} unavailable={t("qrUnavailable")} />
        ) : null}

        {phase === "payment-detected" || phase === "generating" ? (
          <div className="mt-6 flex items-center gap-3 rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-900">
            <Spin size="small" />
            <span className="text-[13px] text-neutral-600 dark:text-neutral-300">
              {t("working")}
            </span>
          </div>
        ) : null}

        {phase === "ready" ? <ReadyActions uuid={uuid} pdf={report.pdf} /> : null}
      </Card>

      {isStalled ? (
        <Alert
          type="warning"
          showIcon
          message={t("stalledTitle")}
          description={t("stalledBody")}
        />
      ) : null}
    </div>
  );
}

/**
 * QPay QR + bank deep links. `qr_image` is base64 PNG without a data: prefix.
 * The deep links only resolve on a device with the bank app installed, so they
 * sit under the QR rather than replacing it.
 */
function QpayPanel({
  invoice: data,
  unavailable,
}: {
  invoice: QpayInvoice | null | undefined;
  unavailable: string;
}) {
  if (!data?.qr_image) {
    return (
      <p className="mt-6 rounded-2xl bg-neutral-50 p-4 text-[13px] text-neutral-500 dark:bg-neutral-900">
        {unavailable}
      </p>
    );
  }

  return (
    <div className="mt-6 rounded-2xl bg-neutral-50 p-5 text-center dark:bg-neutral-900">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`data:image/png;base64,${data.qr_image}`}
        alt="QPay QR"
        width={200}
        height={200}
        className="mx-auto h-50 w-50 rounded-xl bg-white p-2"
      />
      {data.urls?.length ? (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {data.urls.map((u) => (
            <a
              key={u.name}
              href={u.link}
              className="rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 text-[12.5px] font-medium text-neutral-700 transition-colors hover:border-primary hover:text-primary dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200"
            >
              {u.name}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ReadyActions({ uuid, pdf }: { uuid: string; pdf: string | null }) {
  const t = useTranslations("reportStatus");

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap gap-3">
        {/* Direct link on purpose: the /api/v1 proxy JSON-decodes every reply
            and would corrupt the PDF stream. */}
        <a href={reportDownloadUrl(uuid)} download>
          <Button type="primary" size="large" className="min-h-11! rounded-xl!">
            {t("download")}
          </Button>
        </a>
        {pdf ? (
          <a href={pdf} target="_blank" rel="noopener noreferrer">
            <Button size="large" className="min-h-11! rounded-xl!">
              {t("openInTab")}
            </Button>
          </a>
        ) : null}
      </div>

      {pdf ? (
        <iframe
          src={pdf}
          title={t("previewTitle")}
          className="h-[70vh] w-full rounded-2xl border border-neutral-200 dark:border-neutral-800"
        />
      ) : null}
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto w-full max-w-2xl rounded-3xl border border-neutral-200 bg-white p-6 shadow-[0_24px_55px_-32px_rgba(0,0,0,0.25)] sm:p-8 dark:border-neutral-800 dark:bg-neutral-900">
      <h1 className="text-[17px] font-semibold text-neutral-900 dark:text-neutral-50">
        {title}
      </h1>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="text-[12.5px] text-neutral-500">{label}</dt>
      <dd className="text-right text-[13.5px] font-medium text-neutral-900 dark:text-neutral-100">
        {value}
      </dd>
    </div>
  );
}

export type { ReportPhase };
