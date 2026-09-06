import type { ItemWithPhotos } from "@/lib/items";

export type CatalogViewState = {
  companyId: string;
  periodId: string | null;
  category: string;
  items: ItemWithPhotos[];
  hasMore: boolean;
  offset: number;
  scrollY: number;
  anchorItemId?: string | null;
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
    const key = catalogViewKey(state.companyId, state.periodId);
    const existing = loadCatalogView(state.companyId, state.periodId);

    // Jangan timpa posisi bagus dengan scrollY=0 saat unmount/navigasi.
    const nextScrollY =
      state.scrollY <= 0 && existing && existing.scrollY > 0
        ? existing.scrollY
        : state.scrollY;

    const nextAnchor =
      state.anchorItemId ?? existing?.anchorItemId ?? null;

    sessionStorage.setItem(
      key,
      JSON.stringify({
        ...state,
        scrollY: nextScrollY,
        anchorItemId: nextAnchor,
        savedAt: Date.now(),
      } satisfies CatalogViewState)
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
    if (scrollY <= 0) {
      const existing = loadScrollPosition(key);
      if (existing != null && existing > 0) return;
    }
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

export function restoreWindowScroll(
  scrollY: number,
  options?: { anchorId?: string | null }
) {
  if (typeof window === "undefined") return;

  const html = document.documentElement;
  const previous = html.style.scrollBehavior;
  html.style.scrollBehavior = "auto";

  const apply = () => {
    if (options?.anchorId) {
      const el = document.getElementById(options.anchorId);
      if (el) {
        el.scrollIntoView({ block: "center", behavior: "auto" });
        return true;
      }
    }

    window.scrollTo({ top: scrollY, left: 0, behavior: "auto" });
    return Math.abs(window.scrollY - scrollY) < 80 || scrollY <= 0;
  };

  apply();
  requestAnimationFrame(() => {
    apply();
    html.style.scrollBehavior = previous;
  });
}

/** Retry restore until layout height catches up (images / infinite list). */
export function restoreCatalogScroll(
  scrollY: number,
  options?: { anchorId?: string | null }
) {
  if (typeof window === "undefined") return () => {};

  const delays = [0, 50, 100, 200, 400, 700, 1200];
  const timers = delays.map((delay) =>
    window.setTimeout(() => restoreWindowScroll(scrollY, options), delay)
  );

  return () => {
    for (const timer of timers) window.clearTimeout(timer);
  };
}
