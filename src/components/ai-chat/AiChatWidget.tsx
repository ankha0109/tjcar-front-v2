"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useAiChat } from "./AiChatContext";
import AiChatPanel from "./AiChatPanel";
import { ChatBubbleIcon, SparkleIcon } from "./icons";
import { cn } from "@/utils";

// Returns true once mounted on the client (false during SSR). Avoids setState-in-effect.
const subscribe = () => () => {};
const useIsClient = () =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

export default function AiChatWidget() {
  const t = useTranslations("aiChat");
  const { isOpen, open, close, messages } = useAiChat();
  const isClient = useIsClient();
  const [panelMounted, setPanelMounted] = useState(false);

  // Drive the "open" data-state on the next frame so the slide-in animation plays.
  useEffect(() => {
    if (!isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPanelMounted(false);
      return;
    }
    const raf = requestAnimationFrame(() => setPanelMounted(true));
    return () => cancelAnimationFrame(raf);
  }, [isOpen]);

  // Escape key closes the panel.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, close]);

  if (!isClient) return null;

  return createPortal(
    <>
      {!isOpen && (
        <button
          type="button"
          onClick={open}
          aria-label={t("openButton")}
          title={t("openButton")}
          className={cn(
            "group fixed right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg",
            "transition-all duration-200 ease-out hover:scale-105 hover:shadow-xl active:scale-95",
            // Sit above the mobile bottom nav (h-16 = 64px). Desktop uses bottom-6.
            "bottom-20 md:right-6 md:bottom-6",
            messages.length === 0 && "animate-[pulse_2.5s_ease-out_2]",
          )}
        >
          <ChatBubbleIcon className="h-6 w-6" />
          <span
            aria-hidden
            className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-primary shadow"
          >
            <SparkleIcon className="h-2.5 w-2.5" />
          </span>
        </button>
      )}

      {isOpen && <AiChatPanel mounted={panelMounted} />}
    </>,
    document.body,
  );
}
