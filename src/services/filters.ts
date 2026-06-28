import "server-only";
import { cache } from "react";
import ServerApi from "@/services/ServerApi";
import type { ResourceObject } from "@/types/api";
import type {
  CarModel,
  Chassis,
  Color,
  FilterOptions,
  FiltersData,
} from "@/types/filters";

// The catalog refreshes hourly from the AJES feed, so cache for an hour (ISR).
// See docs/frontend/auction-filters-integration.md (backend).
const cacheOpts = { next: { revalidate: 3600 } } as const;

/** GET /filters — auction houses + brands (the cascade root). */
export const getFilters = cache(
  (): Promise<FiltersData> =>
    ServerApi.get<ResourceObject<FiltersData>>("/filters", {}, cacheOpts).then(
      (r) => r.data,
    ),
);

/** GET /filters/models — every model tagged with its brand id. */
export const getModels = cache(
  (): Promise<CarModel[]> =>
    ServerApi.get<ResourceObject<CarModel[]>>(
      "/filters/models",
      {},
      cacheOpts,
    ).then((r) => r.data),
);

/** GET /filters/chassis — every chassis with its model name + live car count. */
export const getChassis = cache(
  (): Promise<Chassis[]> =>
    ServerApi.get<ResourceObject<Chassis[]>>(
      "/filters/chassis",
      {},
      cacheOpts,
    ).then((r) => r.data),
);

/** GET /filters/colors — distinct COLOR values from the live AJES feed. */
export const getColors = cache(
  (): Promise<Color[]> =>
    ServerApi.get<ResourceObject<Color[]>>(
      "/filters/colors",
      {},
      cacheOpts,
    ).then((r) => r.data),
);

/**
 * UI-ready cascade options assembled from all three endpoints in one shot:
 * models gain their resolved brand name, chassis are flattened to `{ code,
 * model, count }`. Fetched once per request (React `cache`) and shared by the
 * home, japan and korea pages.
 */
export const getFilterOptions = cache(async (): Promise<FilterOptions> => {
  const [filters, models, chassis, colors] = await Promise.all([
    getFilters(),
    getModels(),
    getChassis(),
    getColors(),
  ]);

  const brandNameById = new Map(
    filters.brands.map((b) => [b.manuf_id, b.manuf_name]),
  );

  return {
    markas: filters.brands
      .map((b) => b.manuf_name)
      .sort((a, b) => a.localeCompare(b)),
    models: models.map((m) => ({
      name: m.model_name,
      marka: brandNameById.get(m.manuf_id) ?? "",
    })),
    chassis: chassis.map((c) => ({
      code: c.chassis,
      model: c.model_name,
      count: c.car_count,
    })),
    colors: colors.map((c) => c.color).filter(Boolean),
    auctions: [...filters.auctions].sort((a, b) => a.localeCompare(b)),
  };
});
