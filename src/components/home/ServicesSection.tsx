import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { HOME_SERVICES, type ServiceKey } from "./servicesData";

// Every render is framed differently, so both knobs are per service rather
// than one set of classes shared by all four cards. Tuned for THIS section's
// `aspect-4/5` frame only — the mobile tiles crop square and don't use them,
// which is why they live here and not in `servicesData`.
const DEFAULT_IMAGE_TOP = "0%";
const DEFAULT_FADE_HEIGHT = "20%";

type Frame = {
  /** Where the render sits in the frame. Negative lifts it, so the card's own
      white shows under the artwork; positive drops it. Percent of the frame. */
  imageTop?: string;
  /** How far up the bottom dissolve reaches. Renders whose subject sits low
      need more of it, full-bleed artwork needs less. */
  fadeHeight?: string;
};

const DESKTOP_FRAME: Record<ServiceKey, Frame> = {
  // Podium renders: the cars end low, so lift them clear of the text block.
  japan: { imageTop: "-7%", fadeHeight: "22%" },
  korea: { imageTop: "-7%", fadeHeight: "22%" },
  report: { imageTop: "-3%", fadeHeight: "90%" },
  garage: { imageTop: "-10%", fadeHeight: "50%" },
};

function ChevronIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polyline points="9 6 15 12 9 18" />
    </svg>
  );
}

export default async function ServicesSection() {
  const t = await getTranslations("homeServices");

  return (
    <section
      aria-labelledby="home-services-heading"
      className="mx-auto w-full max-w-7xl px-4 pb-12 pt-6 md:pb-16 md:pt-10 lg:px-6"
    >
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/80">
          {t("eyebrow")}
        </span>
        <h2
          id="home-services-heading"
          className="text-[22px] font-semibold tracking-tight text-neutral-900 md:text-[26px] dark:text-neutral-50"
        >
          {t("heading")}
        </h2>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {HOME_SERVICES.map(({ key, href, image }) => {
          const { imageTop, fadeHeight } = DESKTOP_FRAME[key];
          const title = t(`items.${key}.title`);

          return (
            <article
              key={key}
              className="group relative isolate flex flex-col overflow-hidden rounded-[22px] bg-white ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_14px_30px_-16px_rgba(0,0,0,0.18)] transition-[transform,box-shadow] duration-300 ease-out hover:shadow-[0_1px_2px_rgba(0,0,0,0.06),0_24px_44px_-18px_rgba(0,0,0,0.28)] motion-safe:hover:-translate-y-1 has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-neutral-900 dark:ring-white/15"
            >
              <div className="relative aspect-4/5 w-full overflow-hidden">
                {/* `top` overrides the inset next/image sets for `fill`, which
                    shifts the render inside the frame and leaves the card's
                    white at the opposite edge. Inline, not a class: Tailwind
                    cannot generate arbitrary values it never sees in source. */}
                <Image
                  src={image}
                  alt=""
                  fill
                  quality={78}
                  placeholder="blur"
                  sizes="(min-width: 1024px) 300px, (min-width: 640px) 48vw, 92vw"
                  style={{ top: imageTop ?? DEFAULT_IMAGE_TOP }}
                  className="object-cover object-top transition-transform duration-700 ease-out motion-safe:group-hover:scale-[1.05]"
                />
                {/* Photo dissolves downwards into the card's own background.
                    The final stop is white at alpha 0, never `transparent`:
                    `transparent` is rgba(0,0,0,0) and smears a grey band. */}
                <div
                  aria-hidden
                  style={{ height: fadeHeight ?? DEFAULT_FADE_HEIGHT }}
                  className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-white from-18% via-white/55 via-55% to-white/0"
                />
                {/* Very light vignette — the renders already carry white edges,
                    so anything stronger just washes the subject out. */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_22%,rgba(255,255,255,0)_64%,#ffffff_100%)]"
                />
              </div>

              {/* Static positioning on purpose: as a flex item z-10 still applies,
                  which keeps the link's stretched ::after anchored to the article. */}
              {/* The card stays a light "product tile" in both themes: the
                  renders are white-based, so fading them into a dark surface
                  would only ever look muddy. */}
              <div className="z-10 -mt-24 flex flex-1 flex-col gap-2 px-5 pb-5">
                <h3 className="text-[16px] font-bold leading-snug text-neutral-900 md:text-[17px]">
                  {title}
                </h3>
                <p className="line-clamp-2 text-[13px] leading-relaxed text-neutral-600">
                  {t(`items.${key}.description`)}
                </p>
                <Link
                  href={href}
                  aria-label={t("ctaAria", { service: title })}
                  className="mt-auto inline-flex w-fit items-center gap-1.5 rounded-full bg-neutral-900 px-4 py-2 text-[12.5px] font-semibold text-white transition-[background-color,gap] duration-200 after:absolute after:inset-0 after:rounded-[22px] after:content-[''] group-hover:gap-2.5 group-hover:bg-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                >
                  {t("cta")}
                  <ChevronIcon aria-hidden className="h-3.5 w-3.5" />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
