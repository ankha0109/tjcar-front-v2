"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import BrandsExplorer, {
  type BrandItem,
  type ModelItem,
} from "@/components/brands/BrandsExplorer";
import { useKoreaModels } from "@/hooks/useKoreaModels";
import { FEATURED_KOREA_BRANDS, KOREA_BRANDS } from "@/types/korea";

type Props = {
  /** Server-resolved `KOREA_BRANDS` slug selected on first render. */
  initialBrand: string;
};

// `KOREA_BRANDS` is static, so the brand rail needs no fetch — only the
// selected brand's models do, and `/korea/models` is per-brand.
const BRANDS: BrandItem[] = KOREA_BRANDS.map((b) => ({
  key: b.slug,
  label: b.label,
  logo: b.logo,
}));

const FEATURED = [...FEATURED_KOREA_BRANDS];

export default function KoreaBrandsExplorer({ initialBrand }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  // Selection follows `?brand=` (shareable / reload-safe); an unknown slug
  // falls back to the server-resolved default rather than 422-ing later.
  const selected = useMemo(() => {
    const q = params.get("brand");
    return q && KOREA_BRANDS.some((b) => b.slug === q) ? q : initialBrand;
  }, [params, initialBrand]);

  const { data, isLoading } = useKoreaModels(selected);

  // Encar's own name is the filter value; the English translation is display
  // only and is null for model lines that have none.
  const models = useMemo<ModelItem[]>(
    () =>
      (data ?? []).map((m) => ({
        value: m.name,
        label: m.english ?? m.name,
        count: m.count,
      })),
    [data],
  );

  return (
    <BrandsExplorer
      brands={BRANDS}
      featuredKeys={FEATURED}
      selected={selected}
      onSelect={(key) =>
        router.replace(`${pathname}?brand=${encodeURIComponent(key)}`, {
          scroll: false,
        })
      }
      models={models}
      modelsLoading={isLoading}
      brandHref={(key) => `/korea?brand=${encodeURIComponent(key)}`}
      modelHref={(brand, model) =>
        `/korea?brand=${encodeURIComponent(brand)}&model=${encodeURIComponent(model)}`
      }
      namespace="koreaBrands"
    />
  );
}
