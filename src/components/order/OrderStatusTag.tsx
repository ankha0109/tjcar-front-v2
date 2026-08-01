"use client";

import { Tag } from "antd";
import { ORDER_STATUS, type OrderStatus } from "@/types/order";

/** Text always comes from the API's `status_label`; only the colour is ours. */
const COLORS: Record<OrderStatus, string> = {
  [ORDER_STATUS.Pending]: "blue",
  [ORDER_STATUS.Done]: "green",
};

type Props = {
  status: OrderStatus;
  label: string;
};

export default function OrderStatusTag({ status, label }: Props) {
  return (
    <Tag color={COLORS[status] ?? "default"} className="m-0!">
      {label}
    </Tag>
  );
}
