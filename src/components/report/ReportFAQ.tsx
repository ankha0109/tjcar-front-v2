"use client";

import { useTranslations } from "next-intl";
import { Collapse } from "antd";
import ReportHeading from "./ReportHeading";

const FAQ_KEYS = ["q1", "q2", "q3", "q4", "q5"] as const;

export default function ReportFAQ() {
  const t = useTranslations("reportLanding.faq");

  const items = FAQ_KEYS.map((k) => ({
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
    <section className="mx-auto w-full max-w-3xl px-4 py-12 md:px-8 md:py-16">
      <ReportHeading
        eyebrow={t("eyebrow")}
        heading={t("heading")}
        align="center"
      />

      <Collapse
        accordion
        ghost
        items={items}
        defaultActiveKey={["q1"]}
        className="mt-6 [&_.ant-collapse-item]:border-b [&_.ant-collapse-item]:border-neutral-200 dark:[&_.ant-collapse-item]:border-neutral-800"
      />
    </section>
  );
}
