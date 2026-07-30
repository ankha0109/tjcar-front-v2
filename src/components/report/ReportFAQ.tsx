"use client";

import { useTranslations } from "next-intl";
import { Collapse } from "antd";
import SectionHeading from "@/components/ui/SectionHeading";
import { REPORT_FAQ_KEYS } from "./reportFaqKeys";

export default function ReportFAQ() {
  const t = useTranslations("reportLanding.faq");

  const items = REPORT_FAQ_KEYS.map((k) => ({
    key: k,
    label: (
      <span className="text-[15px] font-medium text-neutral-900 dark:text-neutral-100">
        {t(`items.${k}.q`)}
      </span>
    ),
    children: (
      <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
        {t(`items.${k}.a`)}
      </p>
    ),
  }));

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-14 md:py-20 lg:px-6">
      <SectionHeading
        heading={t("heading")}
      />

      <Collapse
        accordion
        ghost
        items={items}
        defaultActiveKey={["q1"]}
        className="mt-8 [&_.ant-collapse-item]:border-b [&_.ant-collapse-item]:border-neutral-200 dark:[&_.ant-collapse-item]:border-neutral-800"
      />
    </section>
  );
}
