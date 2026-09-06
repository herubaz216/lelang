import type { ItemWithPhotos } from "@/lib/items";

export type CatalogViewState = {
  companyId: string;
  periodId: string | null;
  category: string;
  items: ItemWithPhotos[];
  hasMore: boolean;
  offset: number;
  scrollY: number;
  savedAt: number;
};

const PREFIX = "lelang:catalog-view:";
const MAX_AGE_MS = 30 * 60 * 1000;

export function catalogViewKey(companyId: string, periodId: string | null) {
  return `${PREFIX}${companyId}:${periodId ?? "none"}`;
}

export function saveCatalogView(state: CatalogViewState) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      catalogViewKey(state.companyId, state.periodId),
      JSON.stringify(state)
    );
  } catch {
    // Ignore quota / private mode errors.
  }
}

export function loadCatalogView(
  companyId: string,
  periodId: string | null
): CatalogViewState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(catalogViewKey(companyId, periodId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CatalogViewState;
    if (!parsed || parsed.companyId !== companyId) return null;
    if ((parsed.periodId ?? null) !== (periodId ?? null)) return null;
    if (Date.now() - (parsed.savedAt ?? 0) > MAX_AGE_MS) return null;
    if (!Array.isArray(parsed.items)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveScrollPosition(key: string, scrollY: number) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      `${PREFIX}scroll:${key}`,
      JSON.stringify({ scrollY, savedAt: Date.now() })
    );
  } catch {
    // ignore
  }
}

export function loadScrollPosition(key: string): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`${PREFIX}scroll:${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { scrollY?: number; savedAt?: number };
    if (Date.now() - (parsed.savedAt ?? 0) > MAX_AGE_MS) return null;
    return typeof parsed.scrollY === "number" ? parsed.scrollY : null;
  } catch {
    return null;
  }
}

export function restoreWindowScroll(scrollY: number) {
  if (typeof window === "undefined") return;
  const html = document.documentElement;
  const previous = html.style.scrollBehavior;
  html.style.scrollBehavior = "auto";
  window.scrollTo(0, scrollY);
  requestAnimationFrame(() => {
    window.scrollTo(0, scrollY);
    html.style.scrollBehavior = previous;
  });
}
