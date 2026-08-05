"use client";

import { useState } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import WalletBalanceCard from "./WalletBalanceCard";
import WalletTopUpDrawer from "./WalletTopUpDrawer";

type Props = {
  /** From `?topup=1` — deep links land straight in the flow. */
  openTopUp?: boolean;
};

/**
 * The wallet block at the top of the dashboard: the balance, and the top-up
 * flow one click behind it.
 *
 * The initial open state is resolved on the server from the query string
 * (rather than `useSearchParams`) so this stays a plain client island with no
 * Suspense boundary. Closing drops the `topup` param, otherwise a refresh —
 * or the browser back button — would reopen the drawer.
 */
export default function WalletSection({ openTopUp = false }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(openTopUp);

  const close = () => {
    setOpen(false);
    if (openTopUp) router.replace(pathname);
  };

  return (
    <>
      <WalletBalanceCard onTopUp={() => setOpen(true)} />
      <WalletTopUpDrawer open={open} onClose={close} />
    </>
  );
}
