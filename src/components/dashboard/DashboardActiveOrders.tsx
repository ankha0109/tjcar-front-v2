"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import OrderRow from "@/components/order/OrderRow";
import { useOrderList } from "@/hooks/useOrders";
import { ORDER_STATUS } from "@/types/order";
import SectionMast from "./SectionMast";

const PREVIEW_COUNT = 2;

/**
 * Cars still on their way, with the shipping stage each one has reached.
 *
 * Renders nothing at all when there is no undelivered order — including while
 * the request is in flight. A customer who has never won a car should not meet
 * a skeleton that resolves into emptiness; the bid section above already owns
 * the "you have nothing yet" message.
 */
export default function DashboardActiveOrders() {
  const t = useTranslations("dashboard.home.activeOrders");
  const query = useOrderList(1);

  const active = (query.data?.data ?? []).filter(
    (order) => order.status !== ORDER_STATUS.Done,
  );
  const preview = active.slice(0, PREVIEW_COUNT);

  if (preview.length === 0) return null;

  return (
    <section className="space-y-4">
      <SectionMast
        title={t("title")}
        action={
          active.length > preview.length ? (
            <Link
              href="/dashboard/orders"
              className="inline-flex items-center gap-1 text-[13px] font-medium text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
            >
              {t("viewAll")}
              <ArrowIcon />
            </Link>
          ) : undefined
        }
      />

      <ul className="space-y-2">
        {preview.map((order) => (
          <OrderRow key={order.id} order={order} />
        ))}
      </ul>
    </section>
  );
}

function ArrowIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
