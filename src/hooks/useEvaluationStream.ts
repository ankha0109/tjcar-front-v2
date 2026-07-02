"use client";

import { useCallback, useEffect, useRef } from "react";
import { getEcho } from "@/lib/echo";

export type StreamHandlers = {
  onDelta: (delta: string) => void;
  onEnd: () => void;
  onError: (message?: string) => void;
};

/**
 * Subscribes to a public `eval.*` broadcast channel and relays the backend's
 * `text_delta` / `stream_end` / `error` events (same protocol as the global
 * ai-chat). One active channel at a time; unsubscribes on stream end, on a
 * new subscribe and on unmount.
 */
export function useEvaluationStream() {
  const channelRef = useRef<string | null>(null);

  const leave = useCallback(() => {
    const ch = channelRef.current;
    if (!ch) return;
    channelRef.current = null;
    try {
      getEcho().leave(ch);
    } catch {
      // ignore — echo may already be disconnected
    }
  }, []);

  const subscribe = useCallback(
    (channelName: string, handlers: StreamHandlers) => {
      leave();
      const ch = getEcho().channel(channelName);
      channelRef.current = channelName;

      ch.listen(".text_delta", (data: { delta?: string }) => {
        if (data?.delta) handlers.onDelta(data.delta);
      });

      ch.listen(".stream_end", () => {
        handlers.onEnd();
        leave();
      });

      ch.listen(".error", (data: { message?: string }) => {
        handlers.onError(data?.message);
        leave();
      });
    },
    [leave],
  );

  useEffect(() => leave, [leave]);

  return { subscribe, leave };
}
