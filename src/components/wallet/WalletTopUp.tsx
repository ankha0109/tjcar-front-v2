"use client";

import { useEffect, useState } from "react";
import { App, Button } from "antd";
import { useTranslations } from "next-intl";
import BrandButton from "@/components/ui/BrandButton";
import { ApiError } from "@/services/Api";
import { requestBalanceTopUp } from "@/services/wallet";
import BankAccountCard from "./BankAccountCard";
import ContractModal from "./ContractModal";
import { cn } from "@/utils";

/** Remembers the contract acceptance so returning customers skip step 1. */
const AGREED_KEY = "tjcar-wallet-contract-agreed";

/**
 * The three-step top-up flow, ported from v1's `BalanceInfo` modal and shown
 * inside {@link WalletTopUpDrawer}.
 *
 * v1 hid the bank details behind the contract dialog; here the details are
 * always readable (nothing about them is secret) and the acceptance instead
 * gates the *request* — the step that actually tells the office to credit an
 * account. Money never moves through this UI: the customer wires the amount
 * themselves and an admin confirms it by hand.
 */
export default function WalletTopUp() {
  const t = useTranslations("dashboard.wallet");
  const { modal } = App.useApp();

  const [contractOpen, setContractOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Read after mount — localStorage is not available during SSR and reading it
  // in render would desync the first client paint.
  useEffect(() => {
    setAgreed(window.localStorage.getItem(AGREED_KEY) === "1");
  }, []);

  const acceptContract = () => {
    setAgreed(true);
    window.localStorage.setItem(AGREED_KEY, "1");
  };

  const sendRequest = async () => {
    setSending(true);
    try {
      await requestBalanceTopUp();
      setSent(true);
      modal.success({
        title: t("requestSentTitle"),
        content: t("requestSentBody"),
        okText: t("ok"),
        centered: true,
      });
    } catch (err) {
      modal.error({
        title: t("requestErrorTitle"),
        content:
          err instanceof ApiError ? err.message : t("requestErrorBody"),
        okText: t("ok"),
        centered: true,
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-[13px] leading-relaxed text-neutral-500 dark:text-neutral-400">
        {t("howDescription")}
      </p>

      <ol>
        <Step step={1} title={t("step1Title")} body={t("step1Body")} done={agreed}>
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => setContractOpen(true)}>
              {t("viewContract")}
            </Button>
            {agreed && (
              <span className="text-[12.5px] text-emerald-600 dark:text-emerald-400">
                {t("contractAgreed")}
              </span>
            )}
          </div>
        </Step>

        <Step step={2} title={t("step2Title")} body={t("step2Body")}>
          <BankAccountCard />
        </Step>

        <Step step={3} title={t("step3Title")} body={t("step3Body")} last>
          <div className="flex flex-wrap items-center gap-3">
            <BrandButton
              size="large"
              loading={sending}
              disabled={!agreed}
              onClick={sendRequest}
            >
              {sent ? t("requestAgainCta") : t("requestCta")}
            </BrandButton>
            {!agreed && (
              <span className="text-[12.5px] text-neutral-500 dark:text-neutral-400">
                {t("requestNeedsContract")}
              </span>
            )}
            {sent && agreed && (
              <span className="text-[12.5px] text-emerald-600 dark:text-emerald-400">
                {t("requestSentInline")}
              </span>
            )}
          </div>
        </Step>
      </ol>

      <div className="space-y-3">
        <Notice tone="amber" text={t("qpayNotice")} />
        <Notice tone="neutral" text={t("hoursNotice")} />
      </div>

      <ContractModal
        open={contractOpen}
        onClose={() => setContractOpen(false)}
        onAgree={acceptContract}
      />
    </div>
  );
}

function Step({
  step,
  title,
  body,
  done,
  last,
  children,
}: {
  step: number;
  title: string;
  body: string;
  done?: boolean;
  last?: boolean;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-4">
      <div className="flex flex-col items-center">
        <span
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12.5px] font-semibold",
            done
              ? "bg-emerald-500 text-white"
              : "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900",
          )}
        >
          {done ? <CheckIcon /> : step}
        </span>
        {!last && (
          <span
            className="mt-1.5 w-px flex-1 bg-neutral-200 dark:bg-neutral-800"
            aria-hidden
          />
        )}
      </div>

      <div className={cn("min-w-0 flex-1", last ? "pb-0" : "pb-7")}>
        <h3 className="text-[14.5px] font-semibold text-neutral-900 dark:text-neutral-100">
          {title}
        </h3>
        <p className="mt-1 max-w-prose text-[13px] leading-relaxed text-neutral-500 dark:text-neutral-400">
          {body}
        </p>
        <div className="mt-3.5">{children}</div>
      </div>
    </li>
  );
}

function Notice({ tone, text }: { tone: "amber" | "neutral"; text: string }) {
  return (
    <p
      className={cn(
        "rounded-lg border px-4 py-3 text-[12.5px] leading-relaxed",
        tone === "amber"
          ? "border-amber-200 bg-amber-50/70 text-amber-900 dark:border-amber-500/25 dark:bg-amber-500/8 dark:text-amber-200"
          : "border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400",
      )}
    >
      {text}
    </p>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m5 13 4 4L19 7" />
    </svg>
  );
}
