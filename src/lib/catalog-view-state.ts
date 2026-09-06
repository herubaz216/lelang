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
const PENDING_FLAG = `${PREFIX}pending-restore`;
const MAX_AGE_MS = 30 * 60 * 1000;

export function catalogViewKey(companyId: string, periodId: string | null) {
  return `${PREFIX}${companyId}:${periodId ?? "none"}`;
}

/** iOS Safari sering beda antara scrollY / pageYOffset / scrollTop. */
export function getWindowScrollY(): number {
  if (typeof window === "undefined") return 0;
  return (
    window.scrollY ||
    window.pageYOffset ||
    document.documentElement.scrollTop ||
    document.body.scrollTop ||
    0
  );
}

export function setWindowScrollY(scrollY: number) {
  if (typeof window === "undefined") return;
  const y = Math.max(0, scrollY);
  // Legacy 2-arg form paling andal di iOS Safari.
  window.scrollTo(0, y);
  document.documentElement.scrollTop = y;
  document.body.scrollTop = y;
}

export function markCatalogRestorePending() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(PENDING_FLAG, "1");
  } catch {
    // ignore
  }
}

export function consumeCatalogRestorePending(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const value = sessionStorage.getItem(PENDING_FLAG);
    if (value) sessionStorage.removeItem(PENDING_FLAG);
    return value === "1";
  } catch {
    return false;
  }
}

export function peekCatalogRestorePending(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(PENDING_FLAG) === "1";
  } catch {
    return false;
  }
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
  if (typeof window === "undefined") return false;

  const html = document.documentElement;
  const previousBehavior = html.style.scrollBehavior;
  html.style.scrollBehavior = "auto";
  html.classList.add("scroll-restore-lock");

  let ok = false;

  if (options?.anchorId) {
    const el = document.getElementById(options.anchorId);
    if (el) {
      const top =
        el.getBoundingClientRect().top + getWindowScrollY() - 96;
      setWindowScrollY(top);
      // Fallback tambahan untuk WebKit.
      el.scrollIntoView(true);
      ok = true;
    }
  }

  if (!ok) {
    setWindowScrollY(scrollY);
    ok = Math.abs(getWindowScrollY() - scrollY) < 120 || scrollY <= 0;
  }

  requestAnimationFrame(() => {
    if (options?.anchorId) {
      const el = document.getElementById(options.anchorId);
      if (el) {
        const top =
          el.getBoundingClientRect().top + getWindowScrollY() - 96;
        setWindowScrollY(top);
      } else {
        setWindowScrollY(scrollY);
      }
    } else {
      setWindowScrollY(scrollY);
    }
    html.style.scrollBehavior = previousBehavior;
    html.classList.remove("scroll-restore-lock");
  });

  return ok;
}

/** Retry restore — delay lebih panjang untuk iOS Safari / bfcache. */
export function restoreCatalogScroll(
  scrollY: number,
  options?: { anchorId?: string | null }
) {
  if (typeof window === "undefined") return () => {};

  const delays = [0, 16, 50, 100, 200, 350, 500, 800, 1200, 1800, 2500];
  const timers = delays.map((delay) =>
    window.setTimeout(() => {
      restoreWindowScroll(scrollY, options);
    }, delay)
  );

  return () => {
    for (const timer of timers) window.clearTimeout(timer);
  };
}
