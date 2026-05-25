"use client";

import Image, { type StaticImageData } from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import japanImg from "../../../public/bento/japan.webp";
import koreaImg from "../../../public/bento/korea.webp";
import readyImg from "../../../public/bento/ready.webp";
import reportImg from "../../../public/bento/report.webp";

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

function handleMouseMove(e: React.MouseEvent<HTMLElement>) {
  const rect = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty(
    "--mouse-x",
    `${e.clientX - rect.left}px`,
  );
  e.currentTarget.style.setProperty(
    "--mouse-y",
    `${e.clientY - rect.top}px`,
  );
}

type BentoCardProps = {
  href: string;
  image: StaticImageData;
  imageAlt: string;
  imagePriority?: boolean;
  floatDelayMs?: number;
  title: string;
  description: string;
  cta: string;
  badge?: string;
  className?: string;
};

function BentoCard({
  href,
  image,
  imageAlt,
  imagePriority,
  floatDelayMs = 0,
  title,
  description,
  cta,
  badge,
  className = "",
}: BentoCardProps) {
  return (
    <Link
      href={href}
      onMouseMove={handleMouseMove}
      className={`spotlight-card group relative flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-shadow duration-300 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900 dark:hover:shadow-black/40 ${className}`}
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800/60 dark:to-neutral-900">
        <div
          className="absolute inset-0 bento-float"
          style={{ animationDelay: `${floatDelayMs}ms` }}
        >
          <Image
            src={image}
            alt={imageAlt}
            fill
            priority={imagePriority}
            sizes="(min-width: 1024px) 40vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        </div>
        {badge ? (
          <span className="absolute right-3 top-3 z-10 inline-flex items-center rounded-full bg-neutral-900/90 px-3 py-1 text-xs font-medium text-white shadow-sm backdrop-blur dark:bg-neutral-100/90 dark:text-neutral-900">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-6">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 md:text-xl">
          {title}
        </h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {description}
        </p>
        <span className="mt-auto inline-flex items-center gap-1 pt-3 text-sm font-medium text-neutral-900 transition-all duration-300 group-hover:gap-2 dark:text-neutral-100">
          {cta}
          <ArrowIcon className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}

export default function BentoGrid() {
  const t = useTranslations("homeBento");

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
      {/* Top row */}
      <BentoCard
        href="/japan"
        image={japanImg}
        imageAlt={t("japan.title")}
        imagePriority
        floatDelayMs={0}
        title={t("japan.title")}
        description={t("japan.description")}
        cta={t("japan.cta")}
        className="md:col-span-3"
      />
      <BentoCard
        href="/korea"
        image={koreaImg}
        imageAlt={t("korea.title")}
        floatDelayMs={1500}
        title={t("korea.title")}
        description={t("korea.description")}
        cta={t("korea.cta")}
        className="md:col-span-2"
      />

      {/* Bottom row */}
      <BentoCard
        href="#"
        image={readyImg}
        imageAlt={t("ready.title")}
        floatDelayMs={3000}
        title={t("ready.title")}
        description={t("ready.description")}
        cta={t("ready.cta")}
        className="md:col-span-2"
      />
      <BentoCard
        href="#"
        image={reportImg}
        imageAlt={t("report.title")}
        floatDelayMs={4500}
        title={t("report.title")}
        description={t("report.description")}
        cta={t("report.cta")}
        badge={t("report.priceBadge")}
        className="md:col-span-3"
      />
    </div>
  );
}
