"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import BrandsExplorer, {
  type BrandItem,
  type ModelItem,
} from "@/components/brands/BrandsExplorer";
import { TOP_JAPAN_MAKES, norm } from "@/lib/brand";
import type { BrandsCatalog } from "@/services/filters";

type Props = {
  catalog?: BrandsCatalog;
  /** Server-resolved brand name to show selected on first render ("TOYOTA"). */
  initialMake: string;
};

/**
 * `/japan/brands` adapter — the AJES catalogue arrives complete from the
 * server, so every model is already in hand and nothing loads lazily.
 */
export default function JapanBrandsExplorer({ catalog, initialMake }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const names = useMemo(() => catalog?.brands ?? [], [catalog]);

  const brands = useMemo<BrandItem[]>(
    () => names.map((name) => ({ key: name, label: name })),
    [names],
  );

  // Selection follows `?make=` (shareable / reload-safe), with the
  // server-resolved `initialMake` as the fallback.
  const selected = useMemo(() => {
    const q = params.get("make");
    if (q) {
      const match = names.find((b) => norm(b) === norm(q));
      if (match) return match;
    }
    return initialMake;
  }, [params, names, initialMake]);

  // Curated names are title-case ("Mercedes-Benz"), `/filters` names are upper
  // ("MERCEDES-BENZ") — resolve to the real value the shell keys on.
  const featuredKeys = useMemo(() => {
    const byNorm = new Map(names.map((b) => [norm(b), b]));
    return TOP_JAPAN_MAKES.map((n) => byNorm.get(norm(n))).filter(
      (b): b is string => Boolean(b),
    );
  }, [names]);

  const models = useMemo<ModelItem[]>(
    () =>
      (catalog?.modelsByBrand[selected] ?? []).map((m) => ({
        value: m,
        label: m,
      })),
    [catalog, selected],
  );

  return (
    <BrandsExplorer
      brands={brands}
      featuredKeys={featuredKeys}
      selected={selected}
      onSelect={(key) =>
        router.replace(`${pathname}?make=${encodeURIComponent(key)}`, {
          scroll: false,
        })
      }
      models={models}
      brandHref={(key) => `/japan?marka=${encodeURIComponent(key)}`}
      modelHref={(brand, model) =>
        `/japan?marka=${encodeURIComponent(brand)}&model=${encodeURIComponent(model)}`
      }
      namespace="japanBrands"
    />
  );
}
