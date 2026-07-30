import Image from "next/image";
import { getTranslations } from "next-intl/server";
import SectionHeading from "@/components/ui/SectionHeading";
import Reveal from "@/components/ui/Reveal";

/**
 * Studio headshots, 512px wide, light-grey backdrop. `cdn.tjcar.mn` is not in
 * `next.config.ts` `remotePatterns`, hence `unoptimized` on the images below —
 * same trick as `PostCard`.
 */
const TEAM = [
  {
    key: "ceo",
    photo: "https://cdn.tjcar.mn/public/static/v2/employees/tuvshinjargal.webp",
  },
  {
    key: "sales",
    photo: "https://cdn.tjcar.mn/public/static/v2/employees/tulga.webp",
  },
  {
    key: "it",
    photo: "https://cdn.tjcar.mn/public/static/v2/employees/ankhbayar.webp",
  },
] as const;

export default async function AboutTeam() {
  const t = await getTranslations("about.team");

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-14 md:py-20 lg:px-6">
      <SectionHeading heading={t("heading")} subheading={t("subheading")} />

      <Reveal>
        <ul className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-5 sm:grid-cols-3 md:mt-12">
          {TEAM.map(({ key, photo }) => {
            const name = t(`members.${key}.name`);
            return (
              <li
                key={key}
                className="group relative mx-auto w-full max-w-[320px] overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 sm:max-w-none dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div className="relative aspect-[4/5]">
                  <Image
                    src={photo}
                    alt={name}
                    fill
                    sizes="(min-width: 640px) 33vw, 320px"
                    className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    unoptimized
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-neutral-950/90 via-neutral-950/45 to-transparent"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-4 transition-transform duration-300 group-hover:-translate-y-0.5">
                    <p className="flex items-center gap-2 text-[11px] font-semibold uppercase text-white/75">
                      <span aria-hidden="true" className="h-px w-4 bg-primary" />
                      {t(`members.${key}.role`)}
                    </p>
                    <p className="mt-1 text-[17px] font-semibold text-white">
                      {name}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Reveal>
    </section>
  );
}
