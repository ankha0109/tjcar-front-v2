"use client";

import { Timeline } from "antd";
import type { BidLog } from "@/types/bid";

/**
 * Status history. Logs arrive oldest-first from the API and each carries its
 * operator automatically (CustomerBidLog declares `$with = ['user']`).
 */
export default function BidTimeline({ logs }: { logs: BidLog[] }) {
  return (
    <Timeline
      items={logs.map((log) => ({
        key: log.id,
        children: (
          <div>
            <p className="text-[13.5px] font-medium text-neutral-900 dark:text-neutral-100">
              {log.status_label}
            </p>
            <p className="mt-0.5 text-[12px] text-neutral-500">
              {log.created_at}
              {log.user ? ` · ${log.user.name}` : ""}
            </p>
            {log.comment ? (
              <p className="mt-1 text-[13px] text-neutral-600 dark:text-neutral-300">
                {log.comment}
              </p>
            ) : null}
          </div>
        ),
      }))}
    />
  );
}
