"use client";

import { useTranslations } from "next-intl";
import { useAiChat } from "./AiChatContext";

export default function AiChatSuggestions() {
  const t = useTranslations("aiChat");
  const { sendMessage, isStreaming } = useAiChat();

  let questions: string[] = [];
  try {
    const raw = t.raw("suggestedQuestions");
    if (Array.isArray(raw)) {
      questions = raw.filter((x): x is string => typeof x === "string");
    }
  } catch {
    questions = [];
  }

  if (questions.length === 0) return null;

  return (
    <div className="flex flex-wrap justify-center gap-2 px-2">
      {questions.map((q) => (
        <button
          key={q}
          type="button"
          disabled={isStreaming}
          onClick={() => sendMessage(q)}
          className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs text-neutral-700 transition-colors hover:border-primary hover:text-primary disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300"
        >
          {q}
        </button>
      ))}
    </div>
  );
}
