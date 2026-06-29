"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import AiChatMessage from "@/components/ai-chat/AiChatMessage";
import AiChatTypingDots from "@/components/ai-chat/AiChatTypingDots";
import type { Message } from "@/components/ai-chat/types";
import { SendIcon, SparkleIcon } from "@/components/ai-chat/icons";
import {
  matchEvaluationQuestion,
  SUGGESTED_ANSWER_KEYS,
  type EvalAnswerKey,
} from "@/lib/evaluationChat";
import { cn } from "@/utils";

type Props = {
  rate: string;
  grade: string;
  equip: string;
};

const MAX_HEIGHT = 120;

/**
 * Static (no-backend) AI assistant for the auction evaluation sheet. It
 * auto-generates an explanation on mount, then answers a small set of canned
 * questions. Built to mirror the global `ai-chat` UX so it can later be wired
 * to the real `/ai/chat` streaming backend (see {@link evaluationChat}).
 */
export default function EvaluationAiChat({ rate, grade, equip }: Props) {
  const t = useTranslations("carDetail.evaluation.ai");
  const vars = { rate, grade, equip };

  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState(true);
  const [value, setValue] = useState("");

  const idRef = useRef(0);
  const initRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const nextId = () => `eval-${idRef.current++}`;
  const suggested = (t.raw("suggested") as string[]) ?? [];

  const answerFor = (key: EvalAnswerKey): string => {
    switch (key) {
      case "rate":
        return t("answers.rate", vars);
      case "interior":
        return t("answers.interior", vars);
      case "equipment":
        return t("answers.equipment", vars);
      case "damage":
        return t("answers.damage", vars);
      default:
        return t("answers.fallback", vars);
    }
  };

  // Auto-explain the sheet on first mount (static demo).
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const timer = setTimeout(() => {
      setMessages([
        {
          id: nextId(),
          role: "assistant",
          content: t("intro", vars),
          createdAt: new Date().toISOString(),
        },
      ]);
      setTyping(false);
    }, 650);
    timers.current.push(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clear pending timers on unmount.
  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  // Keep the latest message in view.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

  // Auto-resize the textarea.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }, [value]);

  const ask = (question: string, key?: EvalAnswerKey) => {
    const q = question.trim();
    if (!q || typing) return;
    const resolved = key ?? matchEvaluationQuestion(q);
    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: "user", content: q, createdAt: new Date().toISOString() },
    ]);
    setValue("");
    setTyping(true);
    const timer = setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: "assistant",
          content: answerFor(resolved),
          createdAt: new Date().toISOString(),
        },
      ]);
      setTyping(false);
    }, 700);
    timers.current.push(timer);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      ask(value);
    }
  };

  const canSend = value.trim().length > 0 && !typing;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
          <SparkleIcon className="h-4 w-4" />
        </span>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <h3 className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {t("title")}
          </h3>
          <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
            {t("badge")}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="max-h-[440px] min-h-[260px] flex-1 space-y-3 overflow-y-auto px-4 py-4"
      >
        {messages.map((m) => (
          <AiChatMessage key={m.id} message={m} />
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-tl-md bg-neutral-100 px-3.5 py-2 shadow-sm dark:bg-neutral-800">
              <AiChatTypingDots />
            </div>
          </div>
        )}
      </div>

      {/* Suggested questions */}
      {suggested.length > 0 && (
        <div className="flex gap-2 overflow-x-auto border-t border-neutral-100 px-4 py-2.5 dark:border-neutral-800/70 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {suggested.map((q, idx) => (
            <button
              key={q}
              type="button"
              disabled={typing}
              onClick={() => ask(q, SUGGESTED_ANSWER_KEYS[idx])}
              className="shrink-0 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-700 transition hover:border-primary/40 hover:text-primary disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(value);
        }}
        className="flex items-end gap-2 border-t border-neutral-200 p-3 dark:border-neutral-800"
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={t("placeholder")}
          aria-label={t("placeholder")}
          rows={1}
          className={cn(
            "max-h-[120px] flex-1 resize-none rounded-2xl bg-neutral-100 px-3.5 py-2.5 text-sm leading-relaxed text-neutral-900",
            "placeholder:text-neutral-400 focus:ring-2 focus:ring-primary/40 focus:outline-none",
            "dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500",
          )}
        />
        <button
          type="submit"
          disabled={!canSend}
          aria-label={t("send")}
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-sm transition-all",
            "hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:hover:opacity-40",
          )}
        >
          <SendIcon className="h-5 w-5" />
        </button>
      </form>
      <p className="px-4 pb-3 text-[11px] leading-snug text-neutral-400 dark:text-neutral-500">
        {t("disclaimer")}
      </p>
    </div>
  );
}
