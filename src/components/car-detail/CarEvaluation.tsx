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
 * Full-width section that splits the auction evaluation sheet out of the photo
 * gallery: the sheet image (zoomable to full size) beside an AI assistant that
 * analyzes and explains it.
 */
export default function CarEvaluation({ image, car }: Props) {
  const t = useTranslations("carDetail.evaluation");
  const [open, setOpen] = useState(false);

  return (
    <section className="mt-6 px-4 lg:px-0">
      <div className="mb-3">
        <h2 className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-100">
          {t("title")}
        </h2>
        <p className="mt-0.5 text-[12px] text-neutral-500 dark:text-neutral-400">
          {t("subtitle")}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 lg:items-stretch">
        {/* Evaluation sheet image */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t("viewFull")}
          className="group relative block w-full cursor-zoom-in overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900"
        >
          {/* Full-size sheet — the marks must stay legible, so no w=320 here. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={withImageSize(image, "original")}
            alt={t("title")}
            loading="lazy"
            className="max-h-[520px] w-full object-contain"
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

      {/* Legend explaining the inspector's shorthand marks on the sheet. */}
      <EvaluationGuide />

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
