import type { Message } from "./types";

export const STORAGE_KEY = "tjcar:ai-chat:v2";
const MAX_MESSAGES = 50;

export type StoredState = {
  messages: Message[];
  conversationId: string | null;
};

const EMPTY: StoredState = { messages: [], conversationId: null };

export function loadState(): StoredState {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<StoredState>;
    if (!parsed || typeof parsed !== "object") return EMPTY;
    const messages = Array.isArray(parsed.messages)
      ? parsed.messages.filter(isMessage)
      : [];
    const conversationId =
      typeof parsed.conversationId === "string" ? parsed.conversationId : null;
    return { messages, conversationId };
  } catch {
    return EMPTY;
  }
}

export function saveState(state: StoredState): void {
  if (typeof window === "undefined") return;
  try {
    const messages = state.messages
      .slice(-MAX_MESSAGES)
      // Don't persist mid-stream pending state — on reload we have no socket to resume it.
      .map((m) => (m.pending ? { ...m, pending: false } : m));
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ messages, conversationId: state.conversationId }),
    );
  } catch {
    // Quota or serialization errors are non-fatal — the chat keeps working in memory.
  }
}

export function clearState(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

function isMessage(value: unknown): value is Message {
  if (!value || typeof value !== "object") return false;
  const m = value as Record<string, unknown>;
  return (
    typeof m.id === "string" &&
    (m.role === "user" || m.role === "assistant" || m.role === "error") &&
    typeof m.content === "string" &&
    typeof m.createdAt === "string"
  );
}
