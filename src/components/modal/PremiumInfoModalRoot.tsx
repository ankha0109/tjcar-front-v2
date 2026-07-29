"use client";

import React from "react";
import { Modal } from "antd";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { MINIMUM_BALANCE, formatMnt } from "@/lib/bidConfig";
import BrandButton from "@/components/ui/BrandButton";
import { PREMIUM_INFO_CHANNEL } from "./premiumInfoBus";

const BENEFIT_KEYS = ["benefit1", "benefit2", "benefit3", "benefit4"] as const;

/**
 * What "Premium" means, opened from `PremiumBadge` via {@link openPremiumInfo}.
 * Mounted once in `AntdProvider` — see `premiumInfoBus` for why it cannot live
 * inside the badge.
 *
 * The threshold comes from {@link MINIMUM_BALANCE} rather than the copy, so the
 * bid form, the locked gallery and this modal can never quote different numbers.
 */
export default function PremiumInfoModalRoot() {
  const t = useTranslations("car.premiumInfo");
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener(PREMIUM_INFO_CHANNEL, handler);
    return () => window.removeEventListener(PREMIUM_INFO_CHANNEL, handler);
  }, []);

  return (
    <Modal
      open={open}
      onCancel={() => setOpen(false)}
      footer={null}
      centered
      destroyOnHidden
      width="min(460px, 92vw)"
    >
      <div className="flex flex-col items-center gap-4 pt-2 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/12 text-yellow-600 ring-1 ring-yellow-500/25 dark:text-yellow-400">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 9.9-1" />
          </svg>
        </span>

        <div className="flex flex-col gap-1.5">
          <h2 className="text-[17px] font-semibold text-neutral-900 dark:text-neutral-100">
            {t("title")}
          </h2>
          <p className="text-[13px] leading-relaxed text-neutral-500 dark:text-neutral-400">
            {t("lede", { amount: formatMnt(MINIMUM_BALANCE) })}
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-yellow-500/25 bg-yellow-500/6 p-4">
        <p className="text-[12px] font-semibold uppercase text-yellow-700 dark:text-yellow-500">
          {t("benefitsTitle")}
        </p>
        <ul className="mt-3 flex flex-col gap-2.5">
          {BENEFIT_KEYS.map((key) => (
            <li key={key} className="flex items-start gap-2.5">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mt-0.5 shrink-0 text-yellow-600 dark:text-yellow-500"
                aria-hidden
              >
                <path d="m5 13 4 4L19 7" />
              </svg>
              <span className="text-[13px] leading-snug text-neutral-700 dark:text-neutral-300">
                {t(key)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <Link
        href="/dashboard/wallet"
        onClick={() => setOpen(false)}
        className="mt-5 block"
      >
        <BrandButton size="large" block>
          {t("cta")}
        </BrandButton>
      </Link>
    </Modal>
  );
}
