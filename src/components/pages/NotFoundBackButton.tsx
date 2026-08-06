"use client";

import type { ReactNode } from "react";
import { useRouter } from "@/i18n/navigation";

type Props = {
  className?: string;
  children: ReactNode;
};

/**
 * Steps back in history, but only when the previous entry is ours. A 404 is
 * often the first page in the tab — a mistyped address, a stale link from
 * somewhere else — and `history.back()` there either does nothing or throws the
 * user off the site. The referrer check turns that dead end into the home page.
 */
export default function NotFoundBackButton({ className, children }: Props) {
  const router = useRouter();

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        if (document.referrer.startsWith(`${window.location.origin}/`)) {
          router.back();
        } else {
          router.push("/");
        }
      }}
    >
      {children}
    </button>
  );
}
