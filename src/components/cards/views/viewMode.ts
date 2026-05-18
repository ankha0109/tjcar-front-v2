export type ViewMode = "grid" | "list" | "table";

export const VIEW_MODE_COOKIE = "tjcar_featured_view_mode";
export const VIEW_MODE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
export const VIEW_MODES: readonly ViewMode[] = ["grid", "list", "table"];

export function isViewMode(value: unknown): value is ViewMode {
  return (
    typeof value === "string" &&
    (VIEW_MODES as readonly string[]).includes(value)
  );
}
