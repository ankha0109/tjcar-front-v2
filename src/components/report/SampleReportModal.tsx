"use client";

import { useTranslations } from "next-intl";
import { Modal } from "antd";

export const SAMPLE_PDF_URL =
  "https://cdn.tjcar.mn/public/reports/tjcar-report-ce8778d5-725e-41b2-8816-f328aff0ad83.pdf";
// Google's viewer renders the PDF inline without the browser plugin — the
// heavy iframe is only mounted while the modal is open.
const SAMPLE_VIEWER_URL = `https://docs.google.com/viewer?url=${encodeURIComponent(
  SAMPLE_PDF_URL,
)}&embedded=true`;

type SampleReportModalProps = {
  open: boolean;
  onClose: () => void;
};

/** Shared sample-PDF viewer, triggered from the hero and the PDF preview. */
export default function SampleReportModal({
  open,
  onClose,
}: SampleReportModalProps) {
  const t = useTranslations("reportLanding.pdfPreview");

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      centered
      width="min(920px, 94vw)"
      title={t("viewerTitle")}
    >
      <iframe
        src={SAMPLE_VIEWER_URL}
        title={t("viewerTitle")}
        className="h-[72vh] w-full rounded-lg border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900"
      />
      <a
        href={SAMPLE_PDF_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-neutral-600 transition-colors hover:text-primary dark:text-neutral-300"
      >
        {t("openInNewTab")}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3.5 w-3.5"
        >
          <path d="M7 17 17 7" />
          <path d="M8 7h9v9" />
        </svg>
      </a>
    </Modal>
  );
}
