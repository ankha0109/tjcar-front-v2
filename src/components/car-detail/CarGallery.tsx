"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Counter from "yet-another-react-lightbox/plugins/counter";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import "yet-another-react-lightbox/plugins/counter.css";
import { useTranslations } from "next-intl";
import { withImageSize } from "@/utils/auctionImage";
import { cn } from "@/utils";

type Props = {
  images: string[];
  alt: string;
};

/**
 * Car photo gallery: an Embla carousel (full-bleed on mobile) with a synced
 * thumbnail strip, and a yet-another-react-lightbox overlay for full-size
 * pinch/scroll zoom. Inline images and the lightbox thumbnails use the `&w=320`
 * (card) variant; the main lightbox slide / zoom loads the original (no size
 * param) via {@link withImageSize}.
 */
export default function CarGallery({ images, alt }: Props) {
  const t = useTranslations("carDetail.gallery");
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start" });
  const [selectedIndex, setSelectedIndex] = useState(0);
  // Which main slides have been viewed. Only these load the full-size original;
  // the rest stay on the light `card` (w=320) variant until navigated to, so we
  // never fetch every full-size image at once (the image host rate-limits that).
  // Seeded with the first slide + its neighbour so the first "next" is instant.
  const [visited, setVisited] = useState<Set<number>>(
    () => new Set(images.length > 1 ? [0, 1] : [0]),
  );
  // -1 = closed; any >= 0 index opens the lightbox at that slide.
  const [openIndex, setOpenIndex] = useState(-1);
  // The lightbox tracks its own current slide in a ref so navigating inside it
  // never re-renders this component (a stale `slides` identity on every "next"
  // is what made it stutter). Read on close to sync the carousel.
  const viewIndexRef = useRef(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    const idx = emblaApi.selectedScrollSnap();
    setSelectedIndex(idx);
    // Mark this slide (and preload its neighbour) as full-size on demand.
    setVisited((prev) => {
      if (prev.has(idx) && (idx + 1 >= images.length || prev.has(idx + 1))) {
        return prev;
      }
      const next = new Set(prev);
      next.add(idx);
      if (idx + 1 < images.length) next.add(idx + 1);
      return next;
    });
  }, [emblaApi, images.length]);

  useEffect(() => {
    if (!emblaApi) return;
    // selectedIndex defaults to 0, which matches Embla's initial snap, so we
    // only need to subscribe — no synchronous initial setState in the effect.
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollTo = useCallback(
    (idx: number) => emblaApi?.scrollTo(idx),
    [emblaApi],
  );
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const openLightbox = useCallback((idx: number) => {
    viewIndexRef.current = idx;
    setOpenIndex(idx);
  }, []);

  // Stable slide list: small (card) image for thumbnails, original for the main
  // view + zoom. Memoised so the lightbox isn't handed a fresh array each render.
  const slides = useMemo(
    () =>
      images.map((src) => {
        const original = withImageSize(src, "original");
        return {
          src: original,
          srcSet: [
            { src: withImageSize(src, "card"), width: 320, height: 240 },
            { src: original, width: 1600, height: 1200 },
          ],
        };
      }),
    [images],
  );

  if (images.length === 0) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center bg-neutral-100 text-neutral-400 lg:rounded-2xl dark:bg-neutral-900">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-5-5L5 21" />
        </svg>
      </div>
    );
  }

  const hasMany = images.length > 1;

  return (
    <div className="flex flex-col gap-3">
      {/* Main carousel — full-bleed on mobile, rounded on desktop */}
      <div className="relative">
        <div className="overflow-hidden lg:rounded-2xl" ref={emblaRef}>
          <div className="flex">
            {images.map((src, idx) => (
              <div key={src} className="relative min-w-0 flex-[0_0_100%]">
                <button
                  type="button"
                  onClick={() => openLightbox(idx)}
                  aria-label={t("viewFull")}
                  className="block aspect-[4/3] w-full cursor-zoom-in bg-neutral-100 dark:bg-neutral-900"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={withImageSize(src, visited.has(idx) ? "original" : "card")}
                    alt={`${alt} ${idx + 1}`}
                    loading={idx === 0 ? "eager" : "lazy"}
                    className="h-full w-full object-cover"
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop prev / next arrows */}
        {hasMany && (
          <>
            <button
              type="button"
              onClick={scrollPrev}
              disabled={selectedIndex === 0}
              aria-label="Previous"
              className="absolute left-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-neutral-800 shadow-md backdrop-blur transition hover:bg-white disabled:pointer-events-none disabled:opacity-0 lg:flex dark:bg-neutral-900/80 dark:text-neutral-100 dark:hover:bg-neutral-900"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={scrollNext}
              disabled={selectedIndex === images.length - 1}
              aria-label="Next"
              className="absolute right-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-neutral-800 shadow-md backdrop-blur transition hover:bg-white disabled:pointer-events-none disabled:opacity-0 lg:flex dark:bg-neutral-900/80 dark:text-neutral-100 dark:hover:bg-neutral-900"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </>
        )}

        {/* Zoom affordance */}
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3M11 8v6M8 11h6" />
          </svg>
        </span>

        {/* Counter */}
        {hasMany && (
          <span className="pointer-events-none absolute right-2.5 top-2.5 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-medium tabular-nums text-white backdrop-blur-sm">
            {selectedIndex + 1} / {images.length}
          </span>
        )}
      </div>

      {/* Thumbnail strip — scrollable row on mobile, grid on desktop */}
      {hasMany && (
        <ul className="flex gap-2 overflow-x-auto px-3 pb-1 lg:grid lg:grid-cols-6 lg:overflow-visible lg:px-0 lg:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {images.map((src, idx) => (
            <li key={src} className="shrink-0">
              <button
                type="button"
                onClick={() => scrollTo(idx)}
                aria-label={`${alt} ${idx + 1}`}
                aria-current={idx === selectedIndex ? "true" : undefined}
                className={cn(
                  "block aspect-[4/3] w-16 overflow-hidden rounded-lg border-2 transition lg:w-full",
                  idx === selectedIndex
                    ? "border-neutral-900 dark:border-neutral-100"
                    : "border-transparent opacity-60 hover:opacity-100",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={withImageSize(src, "card")}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Full-size zoom lightbox */}
      <Lightbox
        open={openIndex >= 0}
        close={() => {
          scrollTo(viewIndexRef.current);
          setOpenIndex(-1);
        }}
        index={openIndex < 0 ? 0 : openIndex}
        slides={slides}
        plugins={[Zoom, Thumbnails, Counter]}
        on={{
          view: ({ index }) => {
            viewIndexRef.current = index;
          },
        }}
        zoom={{ maxZoomPixelRatio: 3, scrollToZoom: true }}
        carousel={{ finite: true, preload: 1 }}
        thumbnails={{ width: 96, height: 64, border: 0, gap: 8 }}
        styles={{ container: { backgroundColor: "rgba(0,0,0,0.92)" } }}
      />
    </div>
  );
}
