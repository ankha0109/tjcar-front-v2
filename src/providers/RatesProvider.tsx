"use client";

import { createContext, useContext, type ReactNode } from "react";

/** Foreign currency → MNT, as served by `GET /config`. 0 means "unavailable". */
export type Rates = {
  USD: number;
  JPY: number;
  KRW: number;
};

const EMPTY_RATES: Rates = { USD: 0, JPY: 0, KRW: 0 };

const RatesContext = createContext<Rates>(EMPTY_RATES);

/**
 * Carries the live rates from the locale layout to every client component that
 * prints them — the desktop footer, the desktop menu card and the mobile
 * drawer.
 *
 * A context rather than props because `MobileDrawer` sits inside
 * `MobileHeader`, which is rendered from every file under the `@mobileHeader`
 * parallel route; passing rates down would mean touching all of them.
 */
export default function RatesProvider({
  rates,
  children,
}: {
  rates: Rates;
  children: ReactNode;
}) {
  return (
    <RatesContext.Provider value={rates}>{children}</RatesContext.Provider>
  );
}

/** Defaults to zeroes outside a provider, which renders as "no rates". */
export function useRates(): Rates {
  return useContext(RatesContext);
}
