"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
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
export default function ReportStatus({
  uuid,
  isMobile,
}: {
  uuid: string;
  /** From the `tjcar-device` cookie — bank deep links are phone-only. */
  isMobile: boolean;
}) {
  const t = useTranslations("reportStatus");
  const { status: authStatus } = useSession();
  const isAuthed = authStatus === "authenticated";

  const {
    report,
    phase,
    isStalled,
    isLoading,
    error,
    checkPayment,
    isCheckingPayment,
    paymentNotSeen,
    paymentCheckFailed,
  } = useReportProgress(uuid, {
    enabled: isAuthed,
    // Only a phone leaves the browser to pay, so only a phone can learn
    // anything from coming back to it.
    checkOnFocus: isMobile,
  });

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
          {phase === "awaiting-payment" && isMobile
            ? t("phase.awaiting-payment.bodyApp")
            : t(`phase.${phase}.body`)}
        </p>

        {phase === "awaiting-payment" ? (
          <QpayPanel
            invoice={report.invoice}
            isMobile={isMobile}
            onCheck={checkPayment}
            checking={isCheckingPayment}
            notSeen={paymentNotSeen}
            checkFailed={paymentCheckFailed}
          />
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

/** How many bank apps to show before the "all banks" toggle. */
const BANK_PREVIEW = 6;

/**
 * QPay payment panel. `qr_image` is base64 PNG without a data: prefix.
 *
 * The two halves are deliberately split by device:
 *
 *  - **Mobile** leads with the bank app list. `invoice.urls` are custom-scheme
 *    deep links (`khanbank://q?qPay_QRcode=…`) that only ever resolve on a
 *    phone with that app installed, and a phone cannot scan its own screen —
 *    so the apps are the primary action and the QR sits behind a toggle (for
 *    scanning from a second device).
 *  - **Desktop** gets the QR only. Listing the deep links there would render a
 *    wall of buttons that all do nothing.
 */
function QpayPanel({
  invoice: data,
  isMobile,
  onCheck,
  checking,
  notSeen,
  checkFailed,
}: {
  invoice: QpayInvoice | null | undefined;
  isMobile: boolean;
  onCheck: () => void;
  checking: boolean;
  notSeen: boolean;
  checkFailed: boolean;
}) {
  const t = useTranslations("reportStatus");
  const locale = useLocale();
  const banks = isMobile ? (data?.urls ?? []) : [];
  // Only fold the QR away when there is a bank list to fold it behind.
  const [qrOpen, setQrOpen] = useState(banks.length === 0);
  const [allBanks, setAllBanks] = useState(false);

  if (!data?.qr_image) {
    return (
      <p className="mt-6 rounded-2xl bg-neutral-50 p-4 text-[13px] text-neutral-500 dark:bg-neutral-900">
        {t("qrUnavailable")}
      </p>
    );
  }

  const visible = allBanks ? banks : banks.slice(0, BANK_PREVIEW);
  const hidden = banks.length - visible.length;

  return (
    <div className="mt-6 rounded-2xl bg-neutral-50 p-4 sm:p-5 dark:bg-neutral-900">
      {banks.length ? (
        <>
          <p className="px-1 text-[12.5px] font-medium text-neutral-500">
            {t("payWithApp")}
          </p>

          <ul className="mt-2.5 divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-950">
            {visible.map((u) => (
              <li key={u.name}>
                <a
                  href={u.link}
                  className="flex min-h-14 items-center gap-3 px-3 py-2.5 transition-colors active:bg-neutral-50 dark:active:bg-neutral-900"
                >
                  <BankLogo logo={u.logo} name={u.name} />
                  <span className="min-w-0 flex-1 text-[13.5px] leading-tight font-medium text-neutral-800 dark:text-neutral-100">
                    {/* `description` is the Mongolian bank name, `name` the
                        English one — pick whichever the reader can read. */}
                    {locale === "mn"
                      ? u.description || u.name
                      : u.name || u.description}
                  </span>
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden
                    className="size-4 shrink-0 text-neutral-300 dark:text-neutral-600"
                  >
                    <path
                      d="m9 6 6 6-6 6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
              </li>
            ))}
          </ul>

          {hidden > 0 || allBanks ? (
            <button
              type="button"
              onClick={() => setAllBanks((v) => !v)}
              className="mt-2.5 w-full rounded-xl py-2 text-[12.5px] font-medium text-primary"
            >
              {allBanks ? t("banksLess") : t("banksMore", { count: hidden })}
            </button>
          ) : null}
        </>
      ) : null}

      {qrOpen ? (
        <div
          className={
            banks.length
              ? "mt-4 border-t border-neutral-200 pt-4 text-center dark:border-neutral-800"
              : "text-center"
          }
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`data:image/png;base64,${data.qr_image}`}
            alt="QPay QR"
            width={200}
            height={200}
            className="mx-auto h-50 w-50 rounded-xl bg-white p-2"
          />
          <p className="mx-auto mt-3 max-w-xs text-[12.5px] leading-relaxed text-neutral-500">
            {t("scanQr")}
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setQrOpen(true)}
          className="mt-3 w-full rounded-xl border border-neutral-200 bg-white py-2.5 text-[12.5px] font-medium text-neutral-600 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300"
        >
          {t("showQr")}
        </button>
      )}

      {/* Nothing on this screen asks QPay on its own — this button is it (plus
          one silent check per return from the bank app on a phone). */}
      <div className="mt-4 border-t border-neutral-200 pt-4 dark:border-neutral-800">
        <Button
          type="primary"
          size="large"
          block
          loading={checking}
          onClick={onCheck}
          className="min-h-11! rounded-xl!"
        >
          {t("checkPayment")}
        </Button>
        {!checking && (notSeen || checkFailed) ? (
          <p className="mt-2.5 text-center text-[12px] leading-relaxed text-neutral-500">
            {checkFailed ? t("paymentCheckFailed") : t("paymentNotSeen")}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Bank icons come from qpay.mn at whatever size and ratio they please, and they
 * are a third-party host we do not control — fall back to an initial rather
 * than leaving a broken-image glyph in the middle of a payment screen.
 */
function BankLogo({ logo, name }: { logo?: string; name: string }) {
  const [failed, setFailed] = useState(false);

  if (!logo || failed) {
    return (
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-[13px] font-semibold text-neutral-500 dark:bg-neutral-800">
        {name.charAt(0).toUpperCase()}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logo}
      alt=""
      width={36}
      height={36}
      loading="lazy"
      onError={() => setFailed(true)}
      className="size-9 shrink-0 rounded-xl border border-neutral-100 bg-white object-contain dark:border-neutral-800"
    />
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
