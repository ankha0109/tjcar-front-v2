"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { getEcho } from "@/lib/echo";
import {
  clearState,
  loadState,
  saveState,
} from "./storage";
import type { ChatContextValue, Message } from "./types";

const AiChatContext = createContext<ChatContextValue | null>(null);

type StreamStartResponse = {
  conversation_id: string;
  channel: string;
};

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function getApiBase(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
}

export function AiChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);

  const lastUserTextRef = useRef<string | null>(null);
  const subscribedChannelRef = useRef<string | null>(null);
  const subscribedIsPrivateRef = useRef<boolean>(false);
  const t = useTranslations("aiChat");

  const { data: session, status: sessionStatus } = useSession();
  const accessToken = session?.accessToken ?? null;
  const isAuthenticated = !!accessToken;

  // Hydrate from localStorage after mount. Must run after first paint so the
  // server-rendered HTML (empty) matches the client's first render — only then
  // can we safely populate from a browser-only API.
  useEffect(() => {
    const stored = loadState();
    setMessages(stored.messages);
    setConversationId(stored.conversationId);
    setHasHydrated(true);
  }, []);

  // Persist messages + conversationId on change.
  useEffect(() => {
    if (!hasHydrated) return;
    saveState({ messages, conversationId });
  }, [messages, conversationId, hasHydrated]);

  // Cleanup any subscription on unmount.
  useEffect(() => {
    return () => {
      const ch = subscribedChannelRef.current;
      if (ch) {
        try {
          getEcho(accessToken).leave(ch);
        } catch {
          // ignore
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const leaveCurrentChannel = useCallback(() => {
    const ch = subscribedChannelRef.current;
    if (!ch) return;
    try {
      getEcho(accessToken).leave(ch);
    } catch {
      // ignore
    }
    subscribedChannelRef.current = null;
    subscribedIsPrivateRef.current = false;
  }, [accessToken]);

  const updateAssistantMessage = useCallback(
    (
      assistantId: string,
      updater: (msg: Message) => Message,
    ) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? updater(m) : m)),
      );
    },
    [],
  );

  const failAssistant = useCallback(
    (assistantId: string, errorText: string) => {
      updateAssistantMessage(assistantId, (m) => ({
        ...m,
        role: "error",
        content: m.content ? `${m.content}\n\n${errorText}` : errorText,
        pending: false,
      }));
      setLastError(errorText);
      setIsStreaming(false);
      leaveCurrentChannel();
    },
    [leaveCurrentChannel, updateAssistantMessage],
  );

  const runStream = useCallback(
    async (question: string, assistantId: string) => {
      const endpoint = isAuthenticated ? "/ai/chat/auth" : "/ai/chat";
      const url = `${getApiBase()}${endpoint}`;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };
      if (isAuthenticated && accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      let res: Response;
      try {
        res = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify({
            question,
            conversation_id: conversationId,
          }),
        });
      } catch {
        failAssistant(assistantId, t("errorMessage"));
        return;
      }

      if (!res.ok) {
        const text =
          res.status === 429
            ? t("errorRateLimit")
            : res.status === 401
              ? t("errorAuth")
              : t("errorMessage");
        failAssistant(assistantId, text);
        return;
      }

      let body: StreamStartResponse;
      try {
        body = (await res.json()) as StreamStartResponse;
      } catch {
        failAssistant(assistantId, t("errorMessage"));
        return;
      }

      setConversationId(body.conversation_id);

      const echo = getEcho(accessToken);
      const isPrivate = body.channel.startsWith("private-");
      const channelName = isPrivate
        ? body.channel.replace(/^private-/, "")
        : body.channel;

      // If somehow already subscribed (e.g. stale state), leave first.
      leaveCurrentChannel();

      const ch = isPrivate
        ? echo.private(channelName)
        : echo.channel(channelName);
      subscribedChannelRef.current = channelName;
      subscribedIsPrivateRef.current = isPrivate;

      // Dev-only: log every event delivered on this channel so we can see what
      // the backend is actually broadcasting (event name + payload shape).
      if (process.env.NODE_ENV !== "production") {
        const withListenAll = ch as unknown as {
          listenToAll?: (cb: (eventName: string, data: unknown) => void) => void;
        };
        withListenAll.listenToAll?.((eventName, data) => {
          // eslint-disable-next-line no-console
          console.log("[ai-chat] event:", eventName, data);
        });
      }

      ch.listen(".text_delta", (data: { delta?: string }) => {
        if (!data?.delta) return;
        updateAssistantMessage(assistantId, (m) => ({
          ...m,
          content: m.content + data.delta,
        }));
      });

      ch.listen(".stream_end", () => {
        updateAssistantMessage(assistantId, (m) => ({
          ...m,
          pending: false,
        }));
        setIsStreaming(false);
        leaveCurrentChannel();
      });

      ch.listen(".error", (data: { message?: string }) => {
        failAssistant(assistantId, data?.message || t("errorMessage"));
      });
    },
    [
      accessToken,
      conversationId,
      failAssistant,
      isAuthenticated,
      leaveCurrentChannel,
      t,
      updateAssistantMessage,
    ],
  );

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;
      // Wait for session resolution before firing — picking the right endpoint depends on it.
      if (sessionStatus === "loading") return;

      lastUserTextRef.current = trimmed;
      setLastError(null);

      const now = new Date().toISOString();
      const assistantId = makeId();
      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          role: "user",
          content: trimmed,
          createdAt: now,
        },
        {
          id: assistantId,
          role: "assistant",
          content: "",
          createdAt: now,
          pending: true,
        },
      ]);
      setIsStreaming(true);
      void runStream(trimmed, assistantId);
    },
    [isStreaming, runStream, sessionStatus],
  );

  const retryLast = useCallback(() => {
    const last = lastUserTextRef.current;
    if (!last || isStreaming) return;
    // Drop the previous failed assistant/error bubble if it's the tail of the list.
    setMessages((prev) => {
      const tail = prev[prev.length - 1];
      if (tail && (tail.role === "error" || tail.role === "assistant")) {
        return prev.slice(0, -1);
      }
      return prev;
    });
    setLastError(null);

    const now = new Date().toISOString();
    const assistantId = makeId();
    setMessages((prev) => [
      ...prev,
      {
        id: assistantId,
        role: "assistant",
        content: "",
        createdAt: now,
        pending: true,
      },
    ]);
    setIsStreaming(true);
    void runStream(last, assistantId);
  }, [isStreaming, runStream]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => {
    setIsOpen(false);
    setConfirmingClear(false);
  }, []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);
  const toggleFullscreen = useCallback(() => setIsFullscreen((v) => !v), []);

  const requestClear = useCallback(() => {
    if (messages.length === 0) return;
    setConfirmingClear(true);
  }, [messages.length]);

  const confirmClear = useCallback(() => {
    leaveCurrentChannel();
    setMessages([]);
    setConversationId(null);
    clearState();
    setLastError(null);
    setConfirmingClear(false);
    setIsStreaming(false);
    lastUserTextRef.current = null;
  }, [leaveCurrentChannel]);

  const cancelClear = useCallback(() => setConfirmingClear(false), []);

  const value = useMemo<ChatContextValue>(
    () => ({
      messages,
      conversationId,
      isOpen,
      isFullscreen,
      isStreaming,
      lastError,
      confirmingClear,
      hasHydrated,
      open,
      close,
      toggle,
      toggleFullscreen,
      sendMessage,
      retryLast,
      requestClear,
      confirmClear,
      cancelClear,
    }),
    [
      messages,
      conversationId,
      isOpen,
      isFullscreen,
      isStreaming,
      lastError,
      confirmingClear,
      hasHydrated,
      open,
      close,
      toggle,
      toggleFullscreen,
      sendMessage,
      retryLast,
      requestClear,
      confirmClear,
      cancelClear,
    ],
  );

  return (
    <AiChatContext.Provider value={value}>{children}</AiChatContext.Provider>
  );
}

export function useAiChat(): ChatContextValue {
  const ctx = useContext(AiChatContext);
  if (!ctx) {
    throw new Error("useAiChat must be used within an <AiChatProvider>");
  }
  return ctx;
}
