"use client";

import { useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import { useTranslations } from "next-intl";
import type { CarFixture } from "@/lib/carFixtures";
import { withImageSize } from "@/utils/auctionImage";
import EvaluationAiChat from "./EvaluationAiChat";
import EvaluationGuide from "./EvaluationGuide";

type Props = {
  /** The auction evaluation sheet (the last image of the gallery). */
  image: string;
  car: CarFixture;
};

/**
 * Standalone full-width section closing the lot page: the auction evaluation
 * sheet (zoomable to full size) beside an AI assistant that analyzes and
 * explains it. Split out of the photo gallery — buyers lean on this sheet more
 * than on any photo, so it gets the whole page width and a two-column layout
 * where the sheet stays legible while the assistant reads alongside it.
 */
export default function CarEvaluation({ image, car }: Props) {
  const t = useTranslations("carDetail.evaluation");
  const [open, setOpen] = useState(false);

  return (
    <section className="mt-8 border-t border-neutral-200 px-4 pt-8 lg:mt-12 lg:px-0 lg:pt-10 dark:border-neutral-800">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-2 lg:mb-5">
        <div className="min-w-0">
          <h2 className="text-[17px] font-semibold tracking-tight text-neutral-900 lg:text-[20px] dark:text-neutral-100">
            {t("title")}
          </h2>
          <p className="mt-1 text-[13px] text-neutral-500 dark:text-neutral-400">
            {t("subtitle")}
          </p>
        </div>
        {/* Mark legend — opens in a modal so it never crowds the sheet + AI chat. */}
        <EvaluationGuide />
      </div>

      {/* Two columns on desktop: the sheet takes the wider share so its marks
          stay readable, the assistant stretches to the same height beside it. */}
      <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr] lg:items-stretch lg:gap-6">
        {/* Evaluation sheet image */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t("viewFull")}
          className="group relative flex w-full cursor-zoom-in items-center justify-center overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900"
        >
          {/* Full-size sheet — the marks must stay legible, so no w=320 here. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={withImageSize(image, "original")}
            alt={t("title")}
            loading="lazy"
            className="max-h-130 w-full object-contain lg:max-h-160"
          />
          <span className="absolute right-2.5 bottom-2.5 rounded-full bg-black/45 px-3 py-1 text-[11px] font-medium text-white backdrop-blur-sm transition group-hover:bg-black/60">
            {t("viewFull")}
          </span>
        </button>

        {/* AI assistant backed by the vision evaluation endpoints */}
        <EvaluationAiChat
          carId={car.ID}
          image={withImageSize(image, "original")}
          marka={car.MARKA_NAME}
          model={car.MODEL_NAME}
          year={car.YEAR}
          rate={car.RATE}
          grade={car.GRADE}
          equip={car.EQUIP}
        />
      </div>

      <Lightbox
        open={open}
        close={() => setOpen(false)}
        slides={[{ src: withImageSize(image, "original") }]}
        plugins={[Zoom]}
        zoom={{ maxZoomPixelRatio: 4, scrollToZoom: true }}
        carousel={{ finite: true }}
        render={{ buttonPrev: () => null, buttonNext: () => null }}
        styles={{ container: { backgroundColor: "rgba(0,0,0,0.92)" } }}
      />
    </section>
  );
}
