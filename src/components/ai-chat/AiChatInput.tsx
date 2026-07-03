"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useTranslations } from "next-intl";
import { useAiChat } from "./AiChatContext";
import { SendIcon } from "./icons";
import { cn } from "@/utils";

export type AiChatInputHandle = {
  focus: () => void;
};

const MAX_HEIGHT = 120;

const AiChatInput = forwardRef<AiChatInputHandle>(function AiChatInput(_, ref) {
  const t = useTranslations("aiChat");
  const { sendMessage, isStreaming } = useAiChat();
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus(),
  }));

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const next = Math.min(el.scrollHeight, MAX_HEIGHT);
    el.style.height = `${next}px`;
  }, [value]);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming) return;
    sendMessage(trimmed);
    setValue("");
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (el) {
        el.style.height = "auto";
      }
    });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  const canSend = value.trim().length > 0 && !isStreaming;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex items-end gap-2 border-t border-neutral-200 bg-white px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] dark:border-neutral-800 dark:bg-neutral-900"
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={t("placeholder")}
        aria-label={t("placeholder")}
        rows={1}
        disabled={isStreaming}
        className={cn(
          "max-h-[120px] flex-1 resize-none rounded-2xl bg-neutral-100 px-3.5 py-2.5 text-sm leading-relaxed text-neutral-900",
          "placeholder:text-neutral-400 focus:ring-2 focus:ring-primary/40 focus:outline-none",
          "disabled:opacity-60 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500",
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
  );
});

export default AiChatInput;
