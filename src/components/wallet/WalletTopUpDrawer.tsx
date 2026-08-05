"use client";

import { Drawer } from "antd";
import { useTranslations } from "next-intl";
import WalletTopUp from "./WalletTopUp";

type Props = {
  open: boolean;
  onClose: () => void;
};

/**
 * Side panel holding the top-up flow.
 *
 * Topping up is a task, not something to read at a glance, so it stays off the
 * dashboard body and opens on demand — the balance itself is what the overview
 * shows. `/dashboard?topup=1` opens it directly, which is where the bid gate
 * and the Premium modal send people.
 */
export default function WalletTopUpDrawer({ open, onClose }: Props) {
  const t = useTranslations("dashboard.wallet");

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={t("howHeading")}
      placement="right"
      // antd v6 renamed `width` → `size`, which still takes a CSS length.
      size="min(560px, 100vw)"
      destroyOnHidden
    >
      <WalletTopUp />
    </Drawer>
  );
}
