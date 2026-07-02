"use client";

import Image from "next/image";
import { Badge, Button, Dropdown } from "antd";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useCompare } from "@/hooks/useCompare";
import { formatMnt } from "@/lib/bidConfig";
import { buildCompareParam, compareKey } from "@/types/compare";

const CompareIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M3 7h13l-3-3" />
    <path d="M21 17H8l3 3" />
  </svg>
);

/**
 * Header compare tray: live count badge + a click dropdown listing the picked
 * cars with per-item remove and a CTA that carries the ids into the URL
 * (`/compare?items=japan:1,korea:x`) — the page owns the comparison from there.
 */
export default function CompareDropdown() {
  const t = useTranslations("compare");
  const th = useTranslations("header");
  const router = useRouter();
  const { items, count, remove, clear } = useCompare();

  const trigger = (
    <Badge count={count} size="small">
      <Button type="text" shape="circle" aria-label={th("compare")}>
        <CompareIcon className="h-5 w-5 text-neutral-600 dark:text-neutral-300" />
      </Button>
    </Badge>
  );

  if (count === 0) {
    return (
      <Link
        href="/compare"
        aria-label={th("compare")}
        title={th("compare")}
        className="inline-flex shrink-0"
      >
        {trigger}
      </Link>
    );
  }

  return (
    <Dropdown
      trigger={["click"]}
      placement="bottomRight"
      // popupRender-only dropdown; empty menu silences the antd dev warning.
      menu={{ items: [] }}
      popupRender={() => (
        <div className="w-80 rounded-xl border border-neutral-200 bg-white p-3 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
          <ul className="max-h-72 space-y-2 overflow-y-auto">
            {items.map((item) => (
              <li
                key={compareKey(item.source, item.id)}
                className="flex items-center gap-2.5"
              >
                {item.thumbnail ? (
                  <Image
                    src={item.thumbnail}
                    alt=""
                    width={56}
                    height={40}
                    unoptimized
                    className="h-10 w-14 shrink-0 rounded-md object-cover"
                  />
                ) : (
                  <div className="h-10 w-14 shrink-0 rounded-md bg-neutral-100 dark:bg-neutral-800" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                    {item.marka} {item.model}
                    {item.year ? ` · ${item.year}` : ""}
                  </p>
                  {item.priceMnt > 0 && (
                    <p className="text-[12px] tabular-nums text-neutral-500 dark:text-neutral-400">
                      {formatMnt(item.priceMnt)}
                    </p>
                  )}
                </div>
                <Button
                  type="text"
                  size="small"
                  shape="circle"
                  aria-label={t("dropdown.remove")}
                  onClick={() => remove(item.source, item.id)}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" x2="6" y1="6" y2="18" />
                    <line x1="6" x2="18" y1="6" y2="18" />
                  </svg>
                </Button>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2 border-t border-neutral-100 pt-3 dark:border-neutral-800">
            <Button
              block
              type="primary"
              disabled={count < 2}
              onClick={() =>
                router.push(`/compare?items=${buildCompareParam(items)}`)
              }
            >
              {t("dropdown.compareCta")}
            </Button>
            <Button type="text" onClick={clear}>
              {t("dropdown.clearAll")}
            </Button>
          </div>
          {count < 2 && (
            <p className="mt-2 text-[11.5px] text-neutral-400 dark:text-neutral-500">
              {t("dropdown.minHint")}
            </p>
          )}
        </div>
      )}
    >
      <span className="inline-flex shrink-0 cursor-pointer" title={th("compare")}>
        {trigger}
      </span>
    </Dropdown>
  );
}
