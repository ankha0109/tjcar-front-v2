export type Role = "user" | "assistant" | "error";

export type Message = {
  id: string;
  role: Role;
  content: string;
  createdAt: string;
  pending?: boolean;
};

export type ChatContextValue = {
  messages: Message[];
  conversationId: string | null;
  isOpen: boolean;
  isFullscreen: boolean;
  isStreaming: boolean;
  lastError: string | null;
  confirmingClear: boolean;
  hasHydrated: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  toggleFullscreen: () => void;
  sendMessage: (text: string) => void;
  retryLast: () => void;
  requestClear: () => void;
  confirmClear: () => void;
  cancelClear: () => void;
};
