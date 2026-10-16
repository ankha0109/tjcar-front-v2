"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/utils";

/**
 * Staggered fade-up for the home services cards (`.svc-reveal` in globals.css).
 *
 * Not `Reveal`: that one hides an element from JS only, and never one already
 * on screen at mount, so server HTML can't flash. These cards start ~700px down
 * the page — inside the first screen on every common desktop — so under
 * `Reveal`'s rule they would never animate. Here the hidden state is CSS's,
 * painted from the first frame, but only under `@media (scripting: enabled)`
 * and without reduced motion. This component then marks the grid ready (which
 * cancels the CSS failsafe that shows the cards after 3s if JS never runs) and
 * shows each card as it scrolls in; its `--i` staggers the ones in one row.
 */
export default function ServicesReveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = ref.current;
    if (!grid) return;
    const cards = Array.from(grid.children);
    const show = (card: Element) => card.setAttribute("data-shown", "");

    // Nothing is hidden (reduced motion, no `scripting` media support), or a
    // slow hydration let the failsafe show them already: keep them shown, so
    // dropping the failsafe below cannot hide them again.
    if (cards[0] && getComputedStyle(cards[0]).opacity === "1") {
      cards.forEach(show);
    }
    grid.setAttribute("data-ready", "");

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          show(entry.target);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.2 },
    );
    cards.forEach((card) => {
      if (!card.hasAttribute("data-shown")) observer.observe(card);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={cn("svc-reveal", className)}>
      {children}
    </div>
  );
}
