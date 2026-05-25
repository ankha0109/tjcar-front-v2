export default function AiChatTypingDots() {
  return (
    <div className="flex items-center gap-1 py-1" aria-hidden>
      {[0, 120, 240].map((delay) => (
        <span
          key={delay}
          className="h-1.5 w-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500 animate-bounce"
          style={{ animationDelay: `${delay}ms`, animationDuration: "900ms" }}
        />
      ))}
    </div>
  );
}
