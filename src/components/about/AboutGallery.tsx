import Image from "next/image";
import { getTranslations } from "next-intl/server";
import Reveal from "@/components/ui/Reveal";

const S3 = "https://tjcar.s3.ap-southeast-1.amazonaws.com/public/static/v2/landing";

/**
 * Three real operations photos. They have different native orientations
 * (auction 4:3, office 3:2, transport 3:4 portrait) so the desktop layout is a
 * mosaic rather than a uniform grid — the portrait shot gets its own full-height
 * column instead of being centre-cropped into a landscape cell.
 */
const PHOTOS = [
  {
    key: "transport",
    src: `${S3}/tj_transport.webp`,
    // Portrait — spans both rows of the desktop mosaic.
    cell: "lg:col-span-4 lg:row-span-2",
    ratio: "aspect-[3/4] lg:aspect-auto lg:h-full",
    sizes: "(min-width: 1024px) 33vw, 100vw",
  },
  {
    key: "auction",
    src: `${S3}/tj_auction.webp`,
    cell: "lg:col-span-8",
    ratio: "aspect-[16/10]",
    sizes: "(min-width: 1024px) 66vw, 100vw",
  },
  {
    key: "office",
    src: `${S3}/tj_office.webp`,
    cell: "lg:col-span-8",
    ratio: "aspect-[16/10]",
    sizes: "(min-width: 1024px) 66vw, 100vw",
  },
] as const;

export default async function AboutGallery() {
  const t = await getTranslations("about.gallery");

  return (
    <section className="border-t border-neutral-200/70 bg-neutral-50/60 dark:border-neutral-800/70 dark:bg-neutral-900/40">
      <div className="mx-auto w-full max-w-7xl px-4 py-14 md:py-20 lg:px-6">
        <div className="max-w-2xl">
          <p className="mb-3 flex items-center gap-2.5 text-[11px] font-semibold uppercase text-primary">
            <span aria-hidden="true" className="h-px w-6 bg-primary/45" />
            {t("eyebrow")}
          </p>
          <h2 className="text-balance text-[26px] font-semibold leading-[1.15] text-neutral-900 md:text-[34px] dark:text-neutral-50">
            {t("heading")}
          </h2>
        </div>

        <Reveal className="mt-10 grid grid-cols-1 gap-4 md:mt-12 lg:grid-cols-12 lg:grid-rows-2">
          {PHOTOS.map(({ key, src, cell, ratio, sizes }) => {
            const caption = t(`items.${key}`);
            return (
              <figure
                key={key}
                className={`group relative overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-200 dark:border-neutral-800 dark:bg-neutral-800 ${cell}`}
              >
                <div className={`relative w-full ${ratio}`}>
                  <Image
                    src={src}
                    alt={caption}
                    fill
                    sizes={sizes}
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                    unoptimized
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-neutral-950/85 via-neutral-950/35 to-transparent"
                  />
                  <figcaption className="absolute inset-x-0 bottom-0 p-4 text-[13px] font-medium leading-snug text-white md:p-5 md:text-[14px]">
                    {caption}
                  </figcaption>
                </div>
              </figure>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}
