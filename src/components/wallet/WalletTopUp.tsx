"use client";

import { useEffect, useRef, useState } from "react";
import { App, Button } from "antd";
import { useTranslations } from "next-intl";
import BrandButton from "@/components/ui/BrandButton";
import { ApiError } from "@/services/Api";
import { requestBalanceTopUp } from "@/services/wallet";
import BankAccountCard from "./BankAccountCard";
import ContractModal from "./ContractModal";
import { cn } from "@/utils";

type StepNumber = 1 | 2 | 3;
type StepStatus = "done" | "active" | "locked";

/**
 * The three-step top-up flow, ported from v1's `BalanceInfo` modal and shown
 * inside {@link WalletTopUpDrawer}.
 *
 * The steps unlock strictly in order: the bank details appear only once the
 * contract is accepted, and the request only once the customer says the money
 * is wired. Nothing is remembered — the drawer unmounts on close
 * (`destroyOnHidden`), so every top-up starts again at the contract. Money
 * never moves through this UI: the customer wires the amount themselves and an
 * admin confirms it by hand.
 */
export default function WalletTopUp() {
  const t = useTranslations("dashboard.wallet");
  const { modal } = App.useApp();

  const [step, setStep] = useState<StepNumber>(1);
  const [contractOpen, setContractOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const listRef = useRef<HTMLOListElement>(null);

  // Bring the step that just unlocked into view — on a phone the bank card
  // pushes it below the drawer's fold. Step 1 is where the drawer opens, so the
  // first render has nothing to scroll to.
  useEffect(() => {
    if (step === 1) return;
    listRef.current
      ?.querySelector(`[data-step="${step}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [step]);

  const statusOf = (n: StepNumber): StepStatus =>
    n < step ? "done" : n === step ? "active" : "locked";

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

      <ol ref={listRef}>
        <Step
          step={1}
          status={statusOf(1)}
          title={t("step1Title")}
          body={t("step1Body")}
        >
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => setContractOpen(true)}>
              {t("viewContract")}
            </Button>
            {step > 1 && (
              <span className="text-[12.5px] text-emerald-600 dark:text-emerald-400">
                {t("contractAgreed")}
              </span>
            )}
          </div>
        </Step>

        <Step
          step={2}
          status={statusOf(2)}
          title={t("step2Title")}
          body={t("step2Body")}
        >
          <BankAccountCard />
          {step === 2 && (
            <div className="mt-4">
              <BrandButton size="large" onClick={() => setStep(3)}>
                {t("transferDone")}
              </BrandButton>
            </div>
          )}
        </Step>

        <Step
          step={3}
          status={sent ? "done" : statusOf(3)}
          title={t("step3Title")}
          body={t("step3Body")}
          last
        >
          <div className="flex flex-wrap items-center gap-3">
            <BrandButton size="large" loading={sending} onClick={sendRequest}>
              {sent ? t("requestAgainCta") : t("requestCta")}
            </BrandButton>
            {sent && (
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
        // Once accepted, the button reopens the contract read-only.
        onAgree={step === 1 ? () => setStep(2) : undefined}
      />
    </div>
  );
}

/**
 * One row of the vertical stepper. A locked step shows only its number and
 * title, so the customer sees how far the flow goes without anything to act on
 * before its turn.
 */
function Step({
  step,
  status,
  title,
  body,
  last,
  children,
}: {
  step: StepNumber;
  status: StepStatus;
  title: string;
  body: string;
  last?: boolean;
  children: React.ReactNode;
}) {
  const locked = status === "locked";

  return (
    <li
      data-step={step}
      aria-current={status === "active" ? "step" : undefined}
      className="flex gap-4"
    >
      <div className="flex flex-col items-center">
        <span
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12.5px] font-semibold",
            status === "done" && "bg-emerald-500 text-white",
            status === "active" &&
              "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900",
            locked &&
              "bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500",
          )}
        >
          {status === "done" ? <CheckIcon /> : step}
        </span>
        {!last && (
          <span
            className="mt-1.5 w-px flex-1 bg-neutral-200 dark:bg-neutral-800"
            aria-hidden
          />
        )}
      </div>

      <div className={cn("min-w-0 flex-1", last ? "pb-0" : "pb-7")}>
        <h3
          className={cn(
            "text-[14.5px] font-semibold",
            locked
              ? "text-neutral-400 dark:text-neutral-500"
              : "text-neutral-900 dark:text-neutral-100",
          )}
        >
          {title}
        </h3>
        {!locked && (
          <>
            <p className="mt-1 max-w-prose text-[13px] leading-relaxed text-neutral-500 dark:text-neutral-400">
              {body}
            </p>
            <div className="mt-3.5">{children}</div>
          </>
        )}
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
