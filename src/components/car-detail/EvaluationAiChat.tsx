"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import AiChatMessage from "@/components/ai-chat/AiChatMessage";
import AiChatTypingDots from "@/components/ai-chat/AiChatTypingDots";
import type { Message } from "@/components/ai-chat/types";
import { SendIcon, SparkleIcon } from "@/components/ai-chat/icons";
import Api, { ApiError } from "@/services/Api";
import { useEvaluationStream } from "@/hooks/useEvaluationStream";
import { cn } from "@/utils";

type Props = {
  carId: string;
  /** Full-size URL of the auction evaluation sheet image. */
  image: string;
  marka: string;
  model: string;
  year: string;
  rate: string;
  grade: string;
  equip: string;
};

type IntroResponse = { analysis?: string; cached?: boolean; channel?: string };
type ChatResponse = { channel?: string };

const MAX_HEIGHT = 120;
const HISTORY_LIMIT = 6;

/**
 * AI assistant for the auction evaluation sheet, backed by the real vision
 * chat endpoints (`/ai/evaluation/intro` + `/ai/evaluation/chat`). The intro
 * analysis is cached per car on the backend; answers stream in over the same
 * Echo protocol as the global ai-chat. Falls back to a static translated
 * explanation when the intro request fails.
 */
export default function EvaluationAiChat({
  carId,
  image,
  marka,
  model,
  year,
  rate,
  grade,
  equip,
}: Props) {
  const t = useTranslations("carDetail.evaluation.ai");
  const { subscribe } = useEvaluationStream();

  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(true);
  const [value, setValue] = useState("");

  const idRef = useRef(0);
  const initRef = useRef(false);
  const lastQuestionRef = useRef<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const nextId = () => `eval-${idRef.current++}`;
  const suggested = (t.raw("suggested") as string[]) ?? [];
  const dash = (v: string) => (v && v.trim() ? v : "—");

  const carPayload = {
    car_id: carId,
    image_url: image,
    marka,
    model,
    year,
    rate,
    grade,
    equip,
  };

  const appendMessage = (message: Message) =>
    setMessages((prev) => [...prev, message]);

  const patchMessage = (id: string, patch: Partial<Message>) =>
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    );

  const appendDelta = (id: string, delta: string) =>
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, content: m.content + delta } : m)),
    );

  const streamInto = (channel: string, assistantId: string) => {
    subscribe(channel, {
      onDelta: (delta) => appendDelta(assistantId, delta),
      onEnd: () => {
        patchMessage(assistantId, { pending: false });
        setStreaming(false);
      },
      onError: () => {
        patchMessage(assistantId, {
          role: "error",
          content: t("error"),
          pending: false,
        });
        setStreaming(false);
      },
    });
  };

  const failWith = (assistantId: string, err: unknown) => {
    const rateLimited = err instanceof ApiError && err.status === 429;
    patchMessage(assistantId, {
      role: "error",
      content: rateLimited ? t("errorRateLimit") : t("error"),
      pending: false,
    });
    setStreaming(false);
  };

  // Request the (backend-cached) intro analysis on first mount; fall back to
  // the static translated explanation when the backend is unavailable.
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const assistantId = nextId();
    appendMessage({
      id: assistantId,
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
      pending: true,
    });

    const fallback = () => {
      patchMessage(assistantId, {
        content: t("intro", {
          rate: dash(rate),
          grade: dash(grade),
          equip: dash(equip),
        }),
        pending: false,
      });
      setStreaming(false);
    };

    Api.post<IntroResponse>("/ai/evaluation/intro", carPayload)
      .then((res) => {
        if (res.analysis) {
          patchMessage(assistantId, { content: res.analysis, pending: false });
          setStreaming(false);
        } else if (res.channel) {
          streamInto(res.channel, assistantId);
        } else {
          fallback();
        }
      })
      .catch(fallback);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the latest message in view.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, streaming]);

  // Auto-resize the textarea.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }, [value]);

  /** Trailing conversation snippet the stateless backend needs for context. */
  const historySnippet = () =>
    messages
      .filter((m) => !m.pending && m.role !== "error" && m.content)
      .slice(-HISTORY_LIMIT)
      .map((m) => ({ role: m.role, content: m.content }));

  const sendQuestion = (q: string, assistantId: string) => {
    setStreaming(true);
    Api.post<ChatResponse>("/ai/evaluation/chat", {
      ...carPayload,
      question: q,
      history: historySnippet(),
    })
      .then((res) => {
        if (res.channel) streamInto(res.channel, assistantId);
        else failWith(assistantId, null);
      })
      .catch((err) => failWith(assistantId, err));
  };

  const ask = (question: string) => {
    const q = question.trim();
    if (!q || streaming) return;

    lastQuestionRef.current = q;

    const assistantId = nextId();
    const now = new Date().toISOString();
    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: "user", content: q, createdAt: now },
      { id: assistantId, role: "assistant", content: "", createdAt: now, pending: true },
    ]);
    setValue("");
    sendQuestion(q, assistantId);
  };

  const retry = () => {
    const q = lastQuestionRef.current;
    if (!q || streaming) return;

    // Drop the trailing error bubble; the user's question bubble stays.
    setMessages((prev) => {
      const tail = prev[prev.length - 1];
      return tail?.role === "error" ? prev.slice(0, -1) : prev;
    });

    const assistantId = nextId();
    appendMessage({
      id: assistantId,
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
      pending: true,
    });
    sendQuestion(q, assistantId);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      ask(value);
    }
  };

  const canSend = value.trim().length > 0 && !streaming;
  const canRetry =
    !streaming &&
    messages[messages.length - 1]?.role === "error" &&
    !!lastQuestionRef.current;

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
        {messages.map((m) =>
          m.pending && !m.content ? (
            <div key={m.id} className="flex justify-start">
              <div className="rounded-2xl rounded-tl-md bg-neutral-100 px-3.5 py-2 shadow-sm dark:bg-neutral-800">
                <AiChatTypingDots />
              </div>
            </div>
          ) : (
            <AiChatMessage key={m.id} message={m} />
          ),
        )}
        {canRetry && (
          <button
            type="button"
            onClick={retry}
            className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-700 transition hover:border-primary/40 hover:text-primary dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
          >
            {t("retry")}
          </button>
        )}
      </div>

      {/* Suggested questions */}
      {suggested.length > 0 && (
        <div className="flex gap-2 overflow-x-auto border-t border-neutral-100 px-4 py-2.5 dark:border-neutral-800/70 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {suggested.map((q) => (
            <button
              key={q}
              type="button"
              disabled={streaming}
              onClick={() => ask(q)}
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
