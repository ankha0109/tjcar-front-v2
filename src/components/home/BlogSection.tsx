import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

type PostKey = "post1" | "post2" | "post3" | "post4" | "post5";

type Post = {
  key: PostKey;
  href: string;
  image: string;
  imageAlt: string;
};

// First entry is the featured (latest) story; the rest fill the side list.
const POSTS: Post[] = [
  {
    key: "post1",
    href: "#",
    image:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=70",
    imageAlt: "Car keys on a contract",
  },
  {
    key: "post2",
    href: "#",
    image:
      "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=800&q=70",
    imageAlt: "Electric car charging",
  },
  {
    key: "post3",
    href: "#",
    image:
      "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=800&q=70",
    imageAlt: "Toyota dealership in Japan",
  },
  {
    key: "post4",
    href: "#",
    image:
      "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=70",
    imageAlt: "Car at a port terminal",
  },
  {
    key: "post5",
    href: "#",
    image:
      "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=800&q=70",
    imageAlt: "Sports car on the road",
  },
];

function ArrowIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

export default async function BlogSection() {
  const t = await getTranslations("homeBlog");

  const posts = POSTS.slice(0, 4);

  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-12 pt-6 md:pb-16 md:pt-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/80">
            {t("eyebrow")}
          </span>
          <h2 className="text-[22px] font-semibold tracking-tight text-neutral-900 md:text-[26px] dark:text-neutral-50">
            {t("heading")}
          </h2>
          <p className="max-w-2xl text-[13.5px] leading-relaxed text-neutral-600 md:text-[14px] dark:text-neutral-400">
            {t("subheading")}
          </p>
        </div>
        <Link
          href="#"
          className="inline-flex shrink-0 items-center gap-1 self-start rounded-full border border-neutral-200 px-4 py-2 text-[13px] font-semibold text-neutral-900 transition-all hover:gap-2 hover:border-neutral-300 hover:bg-neutral-50 sm:self-auto dark:border-neutral-800 dark:text-neutral-100 dark:hover:border-neutral-700 dark:hover:bg-neutral-900"
        >
          {t("viewAll")}
          <ArrowIcon className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {posts.map((post) => (
          <Link
            key={post.key}
            href={post.href}
            className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-shadow duration-300 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900 dark:hover:shadow-black/40"
          >
            <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800/60 dark:to-neutral-900">
              <Image
                src={post.image}
                alt={post.imageAlt}
                fill
                sizes="(min-width: 1024px) 23vw, (min-width: 640px) 48vw, 100vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
              />
            </div>
            <div className="flex flex-1 flex-col gap-2 p-4 md:p-5">
              <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-neutral-900 transition-colors group-hover:text-primary dark:text-neutral-100">
                {t(`posts.${post.key}.title`)}
              </h3>
              <p className="line-clamp-2 text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-400">
                {t(`posts.${post.key}.excerpt`)}
              </p>
              <span className="mt-auto inline-flex items-center gap-1 pt-2 text-[12.5px] font-medium text-neutral-900 transition-all duration-300 group-hover:gap-2 dark:text-neutral-100">
                {t("readMore")}
                <ArrowIcon className="h-3.5 w-3.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
