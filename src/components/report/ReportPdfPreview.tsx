"use client";

import { useCallback, useEffect, useState } from "react";
import Image, { type StaticImageData } from "next/image";
import { useTranslations } from "next-intl";
import useEmblaCarousel from "embla-carousel-react";
import { cn } from "@/utils";
import ReportHeading from "./ReportHeading";
import SampleReportModal from "./SampleReportModal";

type PageKey = "summary" | "history" | "sheet" | "verify";

type PdfPage = {
  key: PageKey;
  /** Drop real page screenshots into public/report/ and reference them here —
   *  the styled mock below is replaced without any structural change. */
  image?: StaticImageData | string;
};

const PAGES: PdfPage[] = [
  { key: "summary", image: "/report/tjcar-report-illustration-1.svg" },
  { key: "history", image: "/report/tjcar-report-illustration-2.svg" },
  { key: "sheet", image: "/report/tjcar-report-illustration-3.svg" },
  { key: "verify", image: "/report/tjcar-report-illustration-4.svg" },
];

const QR_ROWS = ["1110101", "1010010", "1110110", "0001011", "1100101", "0011010", "1110010"];

function Bar({ w, strong = false }: { w: string; strong?: boolean }) {
  return (
    <div
      className={cn(
        "h-1.5 rounded-full",
        strong ? "bg-neutral-300 dark:bg-neutral-600" : "bg-neutral-200 dark:bg-neutral-700",
      )}
      style={{ width: w }}
    />
  );
}

function MockHeader({ page }: { page: number }) {
  return (
    <div className="flex items-center justify-between border-b border-neutral-200 pb-2 dark:border-neutral-700">
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-primary" />
        <span className=" text-[8px] font-semibold text-neutral-900 dark:text-neutral-100">
          TJ&nbsp;CAR&nbsp;REPORT
        </span>
      </span>
      <span className=" text-[8px] tabular-nums text-neutral-400">
        {String(page).padStart(2, "0")}&nbsp;/&nbsp;10
      </span>
    </div>
  );
}

function MockPage({ page }: { page: PdfPage }) {
  switch (page.key) {
    case "summary":
      return (
        <>
          <MockHeader page={1} />
          <div className="mt-3 flex gap-3">
            <div className="grid h-16 w-24 shrink-0 place-items-center rounded-md bg-neutral-100 dark:bg-neutral-800">
              <svg viewBox="0 0 48 20" className="h-7 w-16 text-neutral-300 dark:text-neutral-600" fill="currentColor">
                <path d="M8 14c1-4 4-7 9-8l10-1c5 0 8 3 10 5l6 2a2 2 0 0 1-1 4H9a2 2 0 0 1-1-2Z" />
                <circle cx="14" cy="16" r="3" className="text-neutral-400 dark:text-neutral-500" />
                <circle cx="36" cy="16" r="3" className="text-neutral-400 dark:text-neutral-500" />
              </svg>
            </div>
            <div className="flex flex-1 flex-col justify-center gap-2">
              <Bar w="90%" strong />
              <Bar w="65%" />
              <Bar w="75%" />
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {["100%", "92%", "96%", "88%"].map((w, i) => (
              <div key={i} className="flex items-center gap-2">
                <Bar w="26%" strong />
                <Bar w={`calc(${w} - 30%)`} />
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-md border border-primary/25 bg-primary/5 p-2">
            <div className="flex items-end gap-1.5">
              {[35, 48, 58, 72, 66, 84].map((h, i) => (
                <span
                  key={i}
                  className={cn("w-full rounded-sm", i === 4 ? "bg-primary" : "bg-primary/30")}
                  style={{ height: `${h / 3}px` }}
                />
              ))}
            </div>
          </div>
        </>
      );
    case "history":
      return (
        <>
          <MockHeader page={4} />
          {[0, 1, 2].map((i) => (
            <div key={i} className="mt-2.5 rounded-md border border-neutral-200 p-2 dark:border-neutral-700">
              <div className="flex items-center justify-between">
                <Bar w="34%" strong />
                <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-[7px] text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                  LOT&nbsp;{4210 + i * 618}
                </span>
              </div>
              <div className="mt-2 flex gap-1.5">
                <span className="h-8 w-10 rounded-sm bg-neutral-100 dark:bg-neutral-800" />
                <span className="h-8 w-10 rounded-sm bg-neutral-100 dark:bg-neutral-800" />
                <span className="h-8 w-10 rounded-sm bg-neutral-100 dark:bg-neutral-800" />
                <div className="flex flex-1 flex-col justify-center gap-1.5">
                  <Bar w="80%" />
                  <Bar w="55%" />
                </div>
              </div>
            </div>
          ))}
        </>
      );
    case "sheet":
      return (
        <>
          <MockHeader page={7} />
          <div className="mt-3 rounded-md border border-neutral-200 p-2.5 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <Bar w="40%" strong />
              <span className="grid h-5 w-5 place-items-center rounded-full border border-primary/40 text-[8px] font-bold text-primary">
                4
              </span>
            </div>
            <svg viewBox="0 0 120 44" className="mt-2 w-full text-neutral-300 dark:text-neutral-600" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M18 34c2-10 10-16 22-18l26-2c12 0 20 6 26 12l14 4c3 1 3 6-1 6H20c-3 0-3-1-2-2Z" />
              <circle cx="34" cy="36" r="6" />
              <circle cx="90" cy="36" r="6" />
              <path d="M46 16l14-1M64 15l16 1" strokeWidth="1" />
              <circle cx="100" cy="20" r="4" className="text-primary" strokeWidth="1.6" />
              <path d="M24 24l6 6M30 24l-6 6" className="text-primary" strokeWidth="1.4" />
            </svg>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {["88%", "72%", "94%"].map((w, i) => (
              <div key={i} className="flex items-center gap-2">
                <Bar w="22%" strong />
                <Bar w={`calc(${w} - 26%)`} />
              </div>
            ))}
          </div>
        </>
      );
    case "verify":
      return (
        <>
          <MockHeader page={10} />
          <div className="mx-auto mt-4 grid w-20 grid-cols-7 gap-[2px]">
            {QR_ROWS.flatMap((row, y) =>
              row.split("").map((cell, x) => (
                <span
                  key={`${y}-${x}`}
                  className={cn(
                    "aspect-square w-full rounded-[1px]",
                    cell === "1"
                      ? "bg-neutral-900 dark:bg-neutral-100"
                      : "bg-neutral-100 dark:bg-neutral-800",
                  )}
                />
              )),
            )}
          </div>
          <p className="mt-2.5 text-center text-[8px] tabular-nums text-neutral-500 dark:text-neutral-400">
            TJ-2607-0042
          </p>
          <div className="mx-auto mt-3 flex w-fit items-center gap-1.5 rounded-full bg-green/10 px-2.5 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-green" />
            <span className=" text-[7.5px] text-green">VERIFIED</span>
          </div>
          <div className="mt-3 flex flex-col items-center gap-2">
            <Bar w="70%" />
            <Bar w="50%" />
          </div>
        </>
      );
  }
}

function PdfCard({ page, t }: { page: PdfPage; t: ReturnType<typeof useTranslations> }) {
  return (
    <figure className="flex h-full flex-col">
      <div className="relative aspect-[210/260] overflow-hidden rounded-xl border border-neutral-200 bg-white p-3.5 shadow-[0_24px_50px_-30px_rgba(0,0,0,0.35)] transition-transform duration-300 hover:-translate-y-1 dark:border-neutral-700 dark:bg-neutral-900">
        {page.image ? (
          <Image
            src={page.image}
            alt=""
            fill
            sizes="(min-width: 768px) 25vw, 75vw"
            // SVGs are not run through the image optimizer (no dangerouslyAllowSVG)
            unoptimized={typeof page.image === "string" && page.image.endsWith(".svg")}
            className="object-top"
          />
        ) : (
          <div aria-hidden="true">
            <MockPage page={page} />
          </div>
        )}
      </div>
      <figcaption className="mt-3.5">
        <p className="text-[14px] font-semibold text-neutral-900 dark:text-neutral-50">
          {t(`pages.${page.key}.title`)}
        </p>
        <p className="mt-1 text-[12.5px] leading-relaxed text-neutral-600 dark:text-neutral-400">
          {t(`pages.${page.key}.caption`)}
        </p>
      </figcaption>
    </figure>
  );
}

export default function ReportPdfPreview() {
  const t = useTranslations("reportLanding.pdfPreview");
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start" });
  const [selected, setSelected] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);

  const onSelect = useCallback(() => {
    if (emblaApi) setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <section
      id="report-pdf-preview"
      className="scroll-mt-20 border-y border-neutral-200/70 bg-neutral-50/60 dark:border-neutral-800/70 dark:bg-neutral-900/40"
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-14 md:py-20 lg:px-6">
        <ReportHeading
          heading={t("heading")}
          subheading={t("subheading")}
        />

        {/* desktop grid */}
        <div className="mt-10 hidden gap-6 md:grid md:grid-cols-4 md:mt-12">
          {PAGES.map((page) => (
            <PdfCard key={page.key} page={page} t={t} />
          ))}
        </div>

        {/* mobile carousel */}
        <div className="mt-8 md:hidden">
          <div ref={emblaRef} className="overflow-hidden">
            <div className="-ml-4 flex touch-pan-y">
              {PAGES.map((page) => (
                <div key={page.key} className="min-w-0 flex-[0_0_74%] pl-4">
                  <PdfCard page={page} t={t} />
                </div>
              ))}
            </div>
          </div>
          <div className="mt-5 flex justify-center gap-1.5">
            {PAGES.map((page, i) => (
              <button
                key={page.key}
                type="button"
                aria-label={t(`pages.${page.key}.title`)}
                onClick={() => emblaApi?.scrollTo(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  selected === i
                    ? "w-5 bg-primary"
                    : "w-1.5 bg-neutral-300 dark:bg-neutral-700",
                )}
              />
            ))}
          </div>
        </div>

        <p className="mt-8 text-[12.5px] leading-relaxed text-neutral-500 dark:text-neutral-400">
          {t("note")}
        </p>
        <button
          type="button"
          onClick={() => setViewerOpen(true)}
          className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-full border border-neutral-200 px-6 py-3 text-[13.5px] font-medium text-neutral-700 transition-colors hover:border-primary hover:text-primary dark:border-neutral-800 dark:text-neutral-200"
        >
          {t("cta")}
        </button>

        <SampleReportModal
          open={viewerOpen}
          onClose={() => setViewerOpen(false)}
        />
      </div>
    </section>
  );
}
