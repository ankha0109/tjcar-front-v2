"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useAiChat } from "./AiChatContext";
import AiChatMessage from "./AiChatMessage";
import AiChatInput, { type AiChatInputHandle } from "./AiChatInput";
import AiChatSuggestions from "./AiChatSuggestions";
import AiChatTypingDots from "./AiChatTypingDots";
import {
  CloseIcon,
  CollapseIcon,
  ExpandIcon,
  RefreshIcon,
  SparkleIcon,
  TrashIcon,
} from "./icons";
import { cn } from "@/utils";

type Props = {
  mounted: boolean;
};

export default function AiChatPanel({ mounted }: Props) {
  const t = useTranslations("aiChat");
  const {
    messages,
    isFullscreen,
    isStreaming,
    lastError,
    confirmingClear,
    hasHydrated,
    close,
    toggleFullscreen,
    requestClear,
    confirmClear,
    cancelClear,
    retryLast,
  } = useAiChat();

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<AiChatInputHandle | null>(null);

  // Focus input on first open.
  useEffect(() => {
    if (mounted) {
      const t = window.setTimeout(() => inputRef.current?.focus(), 80);
      return () => window.clearTimeout(t);
    }
  }, [mounted]);

  // Auto-scroll to bottom whenever the streaming bubble grows, the count
  // changes, or the streaming state flips.
  const lastMsgLen =
    messages.length > 0 ? messages[messages.length - 1].content.length : 0;
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length, lastMsgLen, isStreaming, lastError]);

  const showEmpty =
    hasHydrated && messages.length === 0 && !isStreaming && !lastError;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label={t("title")}
      data-state={mounted ? "open" : "closed"}
      data-mode={isFullscreen ? "full" : "window"}
      className={cn(
        "fixed z-50 flex flex-col overflow-hidden bg-white shadow-2xl dark:bg-neutral-900",
        "transition-all duration-300 ease-out",
        "data-[state=closed]:translate-y-4 data-[state=closed]:opacity-0",
        "data-[state=open]:translate-y-0 data-[state=open]:opacity-100",
        // Mobile: always full-screen drawer
        "inset-0 w-screen h-screen rounded-none border-0",
        // Desktop windowed
        "md:data-[mode=window]:right-6 md:data-[mode=window]:bottom-6 md:data-[mode=window]:top-auto md:data-[mode=window]:left-auto",
        "md:data-[mode=window]:h-[640px] md:data-[mode=window]:w-[400px] md:data-[mode=window]:max-h-[calc(100vh-3rem)]",
        "md:data-[mode=window]:rounded-2xl md:data-[mode=window]:border md:data-[mode=window]:border-neutral-200 dark:md:data-[mode=window]:border-neutral-800",
        // Desktop fullscreen (right half)
        "md:data-[mode=full]:top-0 md:data-[mode=full]:right-0 md:data-[mode=full]:bottom-0 md:data-[mode=full]:left-auto",
        "md:data-[mode=full]:h-screen md:data-[mode=full]:w-[50vw] md:data-[mode=full]:max-w-[720px] md:data-[mode=full]:min-w-[420px]",
        "md:data-[mode=full]:rounded-l-2xl md:data-[mode=full]:rounded-r-none",
        "md:data-[mode=full]:border-l md:data-[mode=full]:border-neutral-200 dark:md:data-[mode=full]:border-neutral-800",
      )}
    >
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 px-3 dark:border-neutral-800">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white">
            <SparkleIcon className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {t("title")}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
              {t("subtitle")}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <HeaderButton
            onClick={requestClear}
            label={t("clearHistory")}
            disabled={messages.length === 0}
          >
            <TrashIcon className="h-4 w-4" />
          </HeaderButton>
          <HeaderButton
            onClick={toggleFullscreen}
            label={isFullscreen ? t("collapse") : t("expand")}
            className="hidden md:inline-flex"
          >
            {isFullscreen ? (
              <CollapseIcon className="h-4 w-4" />
            ) : (
              <ExpandIcon className="h-4 w-4" />
            )}
          </HeaderButton>
          <HeaderButton onClick={close} label={t("close")}>
            <CloseIcon className="h-4 w-4" />
          </HeaderButton>
        </div>
      </div>

      {/* Inline clear-confirm band */}
      {confirmingClear && (
        <div className="flex items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
          <span className="truncate">{t("clearConfirm")}</span>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={confirmClear}
              className="rounded-md bg-red-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-red-700"
            >
              {t("clearYes")}
            </button>
            <button
              type="button"
              onClick={cancelClear}
              className="rounded-md bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-700 ring-1 ring-neutral-200 hover:bg-neutral-50 dark:bg-neutral-800 dark:text-neutral-200 dark:ring-neutral-700 dark:hover:bg-neutral-700"
            >
              {t("clearNo")}
            </button>
          </div>
        </div>
      )}

      {/* Message list */}
      <div
        ref={scrollRef}
        aria-live="polite"
        className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
      >
        {showEmpty && (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <SparkleIcon className="h-7 w-7" />
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              {t("emptyGreeting")}
            </p>
            <AiChatSuggestions />
          </div>
        )}

        {messages.map((m) => {
          // While streaming a brand-new assistant bubble that has no tokens yet,
          // render the typing dots inside the bubble shell instead of an empty box.
          if (m.role === "assistant" && m.pending && m.content === "") {
            return (
              <div key={m.id} className="flex w-full justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-neutral-100 px-3.5 py-2.5 text-sm shadow-sm dark:bg-neutral-800">
                  <AiChatTypingDots />
                </div>
              </div>
            );
          }
          return <AiChatMessage key={m.id} message={m} />;
        })}

        {lastError && !isStreaming && (
          <div className="flex w-full justify-start">
            <button
              type="button"
              onClick={retryLast}
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:border-primary hover:text-primary dark:border-neutral-700 dark:text-neutral-300"
            >
              <RefreshIcon className="h-3.5 w-3.5" />
              {t("errorRetry")}
            </button>
          </div>
        )}
      </div>

      <AiChatInput ref={inputRef} />
    </div>
  );
}

type HeaderButtonProps = {
  onClick: () => void;
  label: string;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
};

function HeaderButton({
  onClick,
  label,
  disabled,
  className,
  children,
}: HeaderButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      disabled={disabled}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 transition-colors",
        "hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-40 disabled:hover:bg-transparent",
        "dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
        className,
      )}
    >
      {children}
    </button>
  );
}
