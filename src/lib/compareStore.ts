import type { CarSource } from "@/types/car";
import { MAX_COMPARE, type CompareItem } from "@/types/compare";

/**
 * Compare tray persisted in localStorage — a near-copy of `wishlistStore` (see
 * that file for the `useSyncExternalStore` contract notes). Differences: the
 * list is capped at MAX_COMPARE, `add` reports success, `toggle` reports what
 * happened (so the UI can warn on a full tray), and items are APPENDED so the
 * selection order becomes the `/compare?items=` column order.
 */
const STORAGE_KEY = "tjcar:compare:v1";
const CHANGE_EVENT = "tjcar:compare:change";
const EMPTY: CompareItem[] = [];

let cache: CompareItem[] = EMPTY;
let hydrated = false;

export type CompareToggleResult = "added" | "removed" | "full";

function isItem(value: unknown): value is CompareItem {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as { id?: unknown }).id === "string" &&
    typeof (value as { source?: unknown }).source === "string"
  );
}

function read(): CompareItem[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    // Slice defends the cap against hand-edited storage.
    return Array.isArray(parsed)
      ? parsed.filter(isItem).slice(0, MAX_COMPARE)
      : EMPTY;
  } catch {
    return EMPTY;
  }
}

function ensureHydrated(): void {
  if (hydrated || typeof window === "undefined") return;
  cache = read();
  hydrated = true;
}

function write(items: CompareItem[]): void {
  cache = items;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Quota / disabled storage is non-fatal — the in-memory cache still works.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function matches(item: CompareItem, source: CarSource, id: string): boolean {
  return item.source === source && item.id === id;
}

export const compareStore = {
  getSnapshot(): CompareItem[] {
    ensureHydrated();
    return cache;
  },

  getServerSnapshot(): CompareItem[] {
    return EMPTY;
  },

  subscribe(onStoreChange: () => void): () => void {
    if (typeof window === "undefined") return () => {};
    // Cross-tab writes: re-read before notifying so this tab's cache catches up.
    const onStorage = () => {
      cache = read();
      onStoreChange();
    };
    window.addEventListener(CHANGE_EVENT, onStoreChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(CHANGE_EVENT, onStoreChange);
      window.removeEventListener("storage", onStorage);
    };
  },

  has(source: CarSource, id: string): boolean {
    ensureHydrated();
    return cache.some((item) => matches(item, source, id));
  },

  isFull(): boolean {
    ensureHydrated();
    return cache.length >= MAX_COMPARE;
  },

  /** False (no write) when the tray is already full. */
  add(item: CompareItem): boolean {
    ensureHydrated();
    if (cache.some((existing) => matches(existing, item.source, item.id))) {
      return true;
    }
    if (cache.length >= MAX_COMPARE) return false;
    write([...cache, { ...item, savedAt: new Date().toISOString() }]);
    return true;
  },

  remove(source: CarSource, id: string): void {
    ensureHydrated();
    write(cache.filter((item) => !matches(item, source, id)));
  },

  toggle(item: CompareItem): CompareToggleResult {
    if (this.has(item.source, item.id)) {
      this.remove(item.source, item.id);
      return "removed";
    }
    return this.add(item) ? "added" : "full";
  },

  clear(): void {
    write(EMPTY);
  },

  getAll(): CompareItem[] {
    ensureHydrated();
    return cache;
  },
};
