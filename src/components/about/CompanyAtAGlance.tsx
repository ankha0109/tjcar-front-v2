import { getTranslations } from "next-intl/server";

type RoleKey =
  | "founder"
  | "operations"
  | "japan"
  | "korea"
  | "logistics"
  | "support";

const TEAM: { role: RoleKey; monogram: string }[] = [
  { role: "founder", monogram: "FN" },
  { role: "operations", monogram: "OP" },
  { role: "japan", monogram: "JP" },
  { role: "korea", monogram: "KR" },
  { role: "logistics", monogram: "LG" },
  { role: "support", monogram: "CS" },
];

type GalleryKey = "auction" | "transport" | "office";

// Drop real photos at /public/about/{auction,transport,office}.jpg|webp and
// update these src paths to switch from the SVG placeholders to real images.
const GALLERY: { key: GalleryKey; src: string; aspect: string }[] = [
  { key: "auction", src: "/about/auction.svg", aspect: "aspect-[4/3]" },
  { key: "transport", src: "/about/transport.svg", aspect: "aspect-[4/3]" },
  { key: "office", src: "/about/office.svg", aspect: "aspect-[4/3]" },
];

export default async function CompanyAtAGlance() {
  const tTeam = await getTranslations("about.team");
  const tGallery = await getTranslations("about.gallery");

  return (
    <section className="border-b border-neutral-100 dark:border-neutral-900">
      <div className="mx-auto w-full max-w-7xl px-4 py-14 md:py-20">
        {/* Team */}
        <div>
          <div className="max-w-2xl">
            <span className="text-xs font-medium uppercase text-neutral-500 dark:text-neutral-400">
              {tTeam("eyebrow")}
            </span>
            <h2 className="mt-2 text-2xl font-semibold text-neutral-900 md:text-3xl dark:text-neutral-100">
              {tTeam("heading")}
            </h2>
            <p className="mt-3 text-sm text-neutral-600 md:text-base dark:text-neutral-400">
              {tTeam("subheading")}
            </p>
          </div>

          <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {TEAM.map(({ role, monogram }) => (
              <li
                key={role}
                className="flex flex-col items-center rounded-xl border border-neutral-200 bg-white px-3 py-5 text-center dark:border-neutral-800 dark:bg-neutral-950"
              >
                <span
                  aria-hidden="true"
                  className="flex h-16 w-16 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-[15px] font-medium text-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-500"
                >
                  {monogram}
                </span>
                <span className="mt-3 text-[11px] font-medium uppercase text-neutral-500 dark:text-neutral-400">
                  {tTeam(`roles.${role}`)}
                </span>
                <span className="mt-1 text-[13px] italic text-neutral-400 dark:text-neutral-500">
                  {tTeam("placeholderName")}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Gallery */}
        <div className="mt-14 md:mt-20">
          <div className="max-w-2xl">
            <span className="text-xs font-medium uppercase text-neutral-500 dark:text-neutral-400">
              {tGallery("eyebrow")}
            </span>
            <h3 className="mt-2 text-xl font-semibold text-neutral-900 md:text-2xl dark:text-neutral-100">
              {tGallery("heading")}
            </h3>
          </div>

          <ul className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {GALLERY.map(({ key, src, aspect }) => (
              <li
                key={key}
                className="group overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div className={`relative ${aspect} w-full overflow-hidden`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={tGallery(`items.${key}`)}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="border-t border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950">
                  <p className="text-[13px] text-neutral-700 dark:text-neutral-300">
                    {tGallery(`items.${key}`)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
