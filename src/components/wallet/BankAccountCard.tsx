"use client";

import Image from "next/image";
import { App } from "antd";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { BANK_ACCOUNT, transferNote } from "@/lib/wallet";
import { cn } from "@/utils";

/**
 * The company bank account, with every field one tap away from the clipboard.
 *
 * The transfer note is the row that matters: accounting matches an incoming
 * payment to a customer by that string, so a wrong note is what turns a 10
 * minute confirmation into a next-day one. It is pre-filled from the session
 * (name + phone, as v1 did) and called out separately from the plain fields.
 */
export default function BankAccountCard() {
  const t = useTranslations("dashboard.wallet");
  const { message } = App.useApp();
  const { data: session } = useSession();

  const user = session?.user as
    | { firstname?: string; phone?: string }
    | undefined;
  const note = transferNote(user);

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      message.success(t("copied"));
    } catch {
      message.error(t("copyFailed"));
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center justify-between gap-4 border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
        <Image
          src="/images/khanbank_logo.svg"
          alt={BANK_ACCOUNT.bank}
          width={212}
          height={40}
          className="h-6 w-auto"
        />
        {/* Hidden on phones: wrapped onto two lines it crowds the logo. */}
        <span className="hidden text-[12px] text-neutral-500 sm:inline dark:text-neutral-400">
          {t("mntOnly")}
        </span>
      </div>

      <dl className="divide-y divide-neutral-100 dark:divide-neutral-800">
        <Row label={t("bank")} value={BANK_ACCOUNT.bank} />
        <Row label={t("iban")} value={BANK_ACCOUNT.iban} onCopy={copy} />
        <Row
          label={t("accountNumber")}
          value={BANK_ACCOUNT.number}
          onCopy={copy}
          strong
        />
        <Row label={t("accountHolder")} value={BANK_ACCOUNT.holder} onCopy={copy} />
        <Row
          label={t("transferNote")}
          value={note || t("transferNoteFallback")}
          onCopy={note ? copy : undefined}
          highlight
          hint={t("transferNoteHint")}
        />
      </dl>
    </div>
  );
}

function Row({
  label,
  value,
  onCopy,
  strong,
  highlight,
  hint,
}: {
  label: string;
  value: string;
  onCopy?: (value: string) => void;
  strong?: boolean;
  highlight?: boolean;
  hint?: string;
}) {
  const t = useTranslations("dashboard.wallet");

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-x-6 gap-y-1 px-5 py-3",
        highlight && "bg-amber-50/70 dark:bg-amber-500/8",
      )}
    >
      <dt className="text-[13px] text-neutral-500 dark:text-neutral-400">
        {label}
        {hint && (
          <span className="mt-0.5 block max-w-xs text-[11.5px] text-neutral-400 dark:text-neutral-500">
            {hint}
          </span>
        )}
      </dt>
      <dd className="flex items-center gap-2">
        <span
          className={cn(
            "text-right tabular-nums text-neutral-900 dark:text-neutral-100",
            strong ? "text-[15px] font-semibold" : "text-[13.5px] font-medium",
          )}
        >
          {value}
        </span>
        {onCopy && (
          <button
            type="button"
            onClick={() => onCopy(value)}
            aria-label={`${label} — ${t("copy")}`}
            title={t("copy")}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-neutral-200 text-neutral-500 transition-colors hover:border-neutral-300 hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-100"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <rect width="13" height="13" x="9" y="9" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </button>
        )}
      </dd>
    </div>
  );
}
