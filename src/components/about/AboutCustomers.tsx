import Image from "next/image";
import { getTranslations } from "next-intl/server";
import Reveal from "@/components/ui/Reveal";

const S3 =
  "https://tjcar.s3.ap-southeast-1.amazonaws.com/public/static/v2/landing";

/** Handover photos from the customs container yard. All 1000×1000. */
const PHOTOS = [1, 2, 3, 4, 5].map((n) => `${S3}/customer_${n}.jpg`);

/**
 * How many times the list is repeated to make ONE half of the marquee track.
 * The `translateX(-50%)` loop only looks seamless while a half is at least as
 * wide as the clipping box — below that a gap opens on the right. The strip is
 * full bleed, so that box is the viewport: a half is `PHOTOS.length * REPEAT`
 * tiles at 340px + 16px gap, and 2 repeats covers 10 × 356 = 3560px. Bump this
 * if the photo list ever shrinks or the tiles get smaller.
 */
const REPEAT = 2;
const HALF = Array.from({ length: REPEAT }, () => PHOTOS).flat();

/**
 * Social proof: a single full-bleed row of customer handover photos scrolling
 * forever. Pure CSS (`.marquee` in globals.css) — no client JS beyond the
 * shared `Reveal`. Deliberately not a lightbox; these are atmosphere, not
 * something to inspect.
 */
export default async function AboutCustomers() {
  const t = await getTranslations("about.customers");
  const alt = t("imageAlt");

  return (
    <section className="overflow-hidden py-14 md:py-20">
      <div className="mx-auto w-full max-w-7xl px-4 lg:px-6">
        <p className="mb-3 flex items-center gap-2.5 text-[11px] font-semibold uppercase text-primary">
          <span aria-hidden="true" className="h-px w-6 bg-primary/45" />
          {t("eyebrow")}
        </p>
        <h2 className="text-balance text-[26px] font-semibold leading-[1.15] text-neutral-900 md:text-[34px] dark:text-neutral-50">
          {t("heading")}
        </h2>
        <p className="mt-3 max-w-2xl text-[13.5px] leading-relaxed text-neutral-600 md:text-[14.5px] dark:text-neutral-400">
          {t("subheading")}
        </p>
      </div>

      {/* Full bleed on purpose — the strip runs past the 7xl container so the
          fade masks land on the viewport edge, not on a gutter. */}
      <Reveal className="mt-10 md:mt-12">
        <div className="marquee">
          <div className="marquee-track gap-4">
            {/* Two identical halves; only the first is announced. */}
            {[0, 1].map((half) => (
              <div key={half} className="flex gap-4" aria-hidden={half === 1}>
                {HALF.map((src, i) => (
                  <figure
                    key={`${half}-${i}`}
                    className="relative aspect-square w-65 shrink-0 overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 md:w-85 dark:border-neutral-800 dark:bg-neutral-900"
                  >
                    <Image
                      src={src}
                      alt={half === 0 && i < PHOTOS.length ? alt : ""}
                      fill
                      sizes="(min-width: 768px) 340px, 260px"
                      className="object-cover"
                      unoptimized
                    />
                  </figure>
                ))}
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
