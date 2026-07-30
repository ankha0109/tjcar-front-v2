"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/utils";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Extra transition delay in ms (staggering siblings). */
  delay?: number;
};

/**
 * One-shot scroll reveal. The hidden state is applied by JS only, so
 * server HTML (bots, no-JS) is always fully visible — see `.reveal` in
 * globals.css. Elements already inside the viewport on mount never hide.
 */
export default function Reveal({ children, className, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight) return;

    el.setAttribute("data-hidden", "");
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.removeAttribute("data-hidden");
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn("reveal", className)}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
