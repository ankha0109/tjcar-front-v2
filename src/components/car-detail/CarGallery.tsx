"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/utils";

type Props = {
  images: string[];
  alt: string;
};

export default function CarGallery({ images, alt }: Props) {
  const [active, setActive] = useState(0);
  const slideRefs = useRef<Array<HTMLLIElement | null>>([]);

  useEffect(() => {
    const els = slideRefs.current.filter(Boolean) as HTMLLIElement[];
    if (els.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const idx = Number((visible.target as HTMLElement).dataset.idx);
        if (!Number.isNaN(idx)) setActive(idx);
      },
      { threshold: [0.6] },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [images.length]);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400 dark:bg-neutral-900">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-5-5L5 21" />
        </svg>
      </div>
    );
  }

  return (
    <>
      {/* Mobile: horizontal snap scroll */}
      <div className="lg:hidden">
        <ul
          className="flex aspect-[4/3] w-full snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label={alt}
        >
          {images.map((src, idx) => (
            <li
              key={src}
              data-idx={idx}
              ref={(el) => {
                slideRefs.current[idx] = el;
              }}
              className="relative w-full shrink-0 snap-center bg-neutral-100 dark:bg-neutral-900"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`${alt} ${idx + 1}`}
                loading={idx === 0 ? "eager" : "lazy"}
                className="h-full w-full object-cover"
              />
            </li>
          ))}
        </ul>
        {images.length > 1 && (
          <div className="mt-2 flex items-center justify-center gap-1.5">
            {images.map((_, idx) => (
              <span
                key={idx}
                aria-hidden="true"
                className={cn(
                  "h-1.5 rounded-full transition-all duration-200",
                  idx === active
                    ? "w-5 bg-neutral-900 dark:bg-neutral-100"
                    : "w-1.5 bg-neutral-300 dark:bg-neutral-700",
                )}
              />
            ))}
          </div>
        )}
        <div className="mt-1 text-center text-[11px] tabular-nums text-neutral-400">
          {active + 1} / {images.length}
        </div>
      </div>

      {/* Desktop: main + thumbnail grid */}
      <div className="hidden lg:block">
        <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[active]}
            alt={`${alt} ${active + 1}`}
            className="h-full w-full object-cover transition-opacity"
          />
        </div>
        <ul className="mt-3 grid grid-cols-5 gap-2">
          {images.map((src, idx) => (
            <li key={src}>
              <button
                type="button"
                onClick={() => setActive(idx)}
                aria-label={`${alt} ${idx + 1}`}
                aria-current={idx === active ? "true" : undefined}
                className={cn(
                  "block aspect-[4/3] w-full overflow-hidden rounded-lg border-2 transition",
                  idx === active
                    ? "border-neutral-900 dark:border-neutral-100"
                    : "border-transparent opacity-70 hover:opacity-100",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
