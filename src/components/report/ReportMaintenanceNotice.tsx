"use client";

import { useTranslations } from "next-intl";
import { Alert } from "antd";
import { FACEBOOK_URL } from "@/lib/contact";

/**
 * Shown in place of the report lookup while the API's `report-maintenance`
 * flag is on. The API also answers the purchase endpoints with 503 then, so
 * the lookup modal falls back to this same notice when the hour-cached
 * `/config` has not caught up with the flag yet.
 */
export default function ReportMaintenanceNotice({
  className,
}: {
  className?: string;
}) {
  const t = useTranslations("reportMaintenance");

  return (
    <Alert
      type="warning"
      showIcon
      className={className}
      title={t("title")}
      description={t.rich("body", {
        link: (chunks) => (
          <a
            href={FACEBOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline"
          >
            {chunks}
          </a>
        ),
      })}
    />
  );
}
