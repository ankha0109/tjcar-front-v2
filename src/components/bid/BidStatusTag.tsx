"use client";

import { Tag } from "antd";
import { BID_STATUS, type BidStatus } from "@/types/bid";

/** Text always comes from the API's `status_label`; only the colour is ours. */
const COLORS: Record<BidStatus, string> = {
  [BID_STATUS.Pending]: "orange",
  [BID_STATUS.Processing]: "blue",
  [BID_STATUS.Win]: "green",
  [BID_STATUS.Lose]: "red",
  [BID_STATUS.Canceled]: "default",
  [BID_STATUS.Unsold]: "default",
};

type Props = {
  status: BidStatus;
  label: string;
};

export default function BidStatusTag({ status, label }: Props) {
  return (
    <Tag color={COLORS[status] ?? "default"} className="m-0!">
      {label}
    </Tag>
  );
}
