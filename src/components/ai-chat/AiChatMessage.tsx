"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/utils";
import type { Message } from "./types";

type Props = {
  message: Message;
};

const markdownComponents: Components = {
  p: ({ children }) => (
    <p className="mb-2 leading-relaxed last:mb-0">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary underline underline-offset-2 hover:opacity-80"
    >
      {children}
    </a>
  ),
  code: ({ children, className }) => {
    const isBlock = className?.startsWith("language-");
    if (isBlock) {
      return <code className={className}>{children}</code>;
    }
    return (
      <code className="rounded bg-black/5 px-1 py-0.5 font-mono text-[0.85em] dark:bg-white/10">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="mb-2 overflow-x-auto rounded-lg bg-neutral-900 p-3 text-sm text-neutral-100 last:mb-0 dark:bg-black">
      {children}
    </pre>
  ),
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  h1: ({ children }) => (
    <h1 className="mt-2 mb-1 text-base font-semibold">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-2 mb-1 text-sm font-semibold">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-2 mb-1 text-sm font-semibold">{children}</h3>
  ),
  table: ({ children }) => (
    <div className="mb-2 overflow-x-auto">
      <table className="w-full border-collapse text-xs">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-neutral-200 px-2 py-1 text-left font-semibold dark:border-neutral-700">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-neutral-200 px-2 py-1 dark:border-neutral-700">
      {children}
    </td>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mb-2 border-l-2 border-neutral-300 pl-3 text-neutral-600 italic dark:border-neutral-600 dark:text-neutral-400">
      {children}
    </blockquote>
  ),
};

export default function AiChatMessage({ message }: Props) {
  const isUser = message.role === "user";
  const isError = message.role === "error";

  return (
    <div
      className={cn(
        "flex w-full",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "px-3.5 py-2 text-sm shadow-sm",
          isUser &&
            "max-w-[80%] rounded-2xl rounded-tr-md bg-primary text-white",
          !isUser &&
            !isError &&
            "max-w-[85%] rounded-2xl rounded-tl-md bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100",
          isError &&
            "max-w-[85%] rounded-2xl rounded-tl-md border border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300",
        )}
      >
        {isUser || isError ? (
          <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
        ) : (
          <>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {message.content}
            </ReactMarkdown>
            {message.pending && (
              <span
                aria-hidden
                className="ml-0.5 inline-block h-3.5 w-1.5 -mb-0.5 animate-pulse bg-neutral-500 dark:bg-neutral-300"
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
