import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import NewBadge from "@/components/ui/NewBadge";
import ServicesReveal from "./ServicesReveal";
import { HOME_SERVICES, type ServiceKey } from "./servicesData";

// Every render is framed differently, so both knobs are per service rather
// than one set of classes shared by all five cards. Tuned for THIS section's
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
  china: { imageTop: "-7%", fadeHeight: "22%" },
  report: { imageTop: "-3%", fadeHeight: "90%" },
  garage: { imageTop: "-10%", fadeHeight: "50%" },
};

export default async function ServicesSection() {
  const [t, tHeader] = await Promise.all([
    getTranslations("homeServices"),
    getTranslations("header"),
  ]);

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

      {/* One row of five from xl. At lg a row of five leaves each card under
          180px — too narrow for a three-line description — so it wraps 3 + 2. */}
      <ServicesReveal className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 xl:gap-4">
        {HOME_SERVICES.map(({ key, href, image, isNew, delivery }, index) => {
          const { imageTop, fadeHeight } = DESKTOP_FRAME[key];
          const title = t(`items.${key}.title`);

          return (
            // `svc-card` (globals.css) owns the transitions: the fade-up in,
            // staggered by `--i`, and the hover lift and shadow.
            <article
              key={key}
              style={{ "--i": index } as React.CSSProperties}
              className="svc-card group relative isolate flex flex-col overflow-hidden rounded-[22px] bg-white ring-1 ring-neutral-200 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_14px_30px_-16px_rgba(0,0,0,0.18)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.06),0_30px_54px_-20px_rgba(0,0,0,0.34)] hover:ring-neutral-300 motion-safe:hover:-translate-y-1.5 has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-neutral-900 dark:ring-white/15"
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
                  sizes="(min-width: 1280px) 240px, (min-width: 1024px) 320px, (min-width: 640px) 48vw, 92vw"
                  style={{ top: imageTop ?? DEFAULT_IMAGE_TOP }}
                  className="object-cover object-top transition-transform duration-700 ease-out motion-safe:group-hover:scale-[1.06]"
                />
                {/* A band of light crosses the render once as the pointer
                    enters (`svc-shine` in globals.css); parked off the left
                    edge otherwise. */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 left-0 w-1/2 -translate-x-full -skew-x-12 bg-linear-to-r from-white/0 via-white/45 to-white/0 motion-safe:group-hover:animate-[svc-shine_1s_cubic-bezier(0.22,1,0.36,1)]"
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
                {/* The card is light in both themes, so the badge keeps its
                    light-surface colours in dark mode too. */}
                {isNew ? (
                  <NewBadge className="absolute left-4 top-4 h-5 px-2 text-[10.5px]/none dark:bg-primary/10 dark:text-red-700">
                    {tHeader("nav2.new")}
                  </NewBadge>
                ) : null}
              </div>

              {/* Static positioning on purpose: as a flex item z-10 still applies,
                  which keeps the link's stretched ::after anchored to the article. */}
              {/* The card stays a light "product tile" in both themes: the
                  renders are white-based, so fading them into a dark surface
                  would only ever look muddy. */}
              <div className="z-10 -mt-24 flex flex-1 flex-col gap-2 px-5 pb-5 xl:px-4">
                {/* Kicker over a short title: the source or format first, then
                    the service in two or three words, so all five fit one line
                    in the five-across row. The title is the card's one link:
                    its stretched ::after makes the whole card the hit area, and
                    the article draws the focus ring. Colour on the anchor
                    itself — antd's reset paints a bare `<a>` blue over an
                    inherited colour. */}
                <div className="flex flex-col gap-0.5">
                  <p className="text-[12px] font-semibold text-primary-strong">
                    {t(`items.${key}.kicker`)}
                  </p>
                  <h3 className="text-[18px] font-bold leading-snug md:text-[19px]">
                    <Link
                      href={href}
                      className="text-neutral-900 after:absolute after:inset-0 after:rounded-[22px] after:content-[''] hover:text-neutral-900 focus-visible:outline-none"
                    >
                      {title}
                    </Link>
                  </h3>
                </div>
                {/* Three lines, not two: the copy runs to a full sentence and
                    mn/ru both wrap to three at this column width — the report's
                    to four in the five-across row. The clamp still guards a
                    longer one. */}
                <p className="line-clamp-3 text-[13px] leading-relaxed text-neutral-600 xl:line-clamp-4">
                  {t(`items.${key}.description`)}
                </p>
                {/* The delivery window, on its own at the card's foot rather
                    than at the end of the sentence, where it was easy to miss.
                    Just the days; the label is for screen readers only. */}
                {delivery ? (
                  <p className="mt-auto w-fit rounded-full bg-neutral-100 px-3 py-1 text-[13px] font-bold text-neutral-900">
                    <span className="sr-only">{t("deliveryLabel")}: </span>
                    {t("deliveryDays", { range: delivery })}
                  </p>
                ) : null}
              </div>
            </article>
          );
        })}
      </ServicesReveal>
    </section>
  );
}
