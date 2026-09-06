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

export type CatalogRestorePointer = {
  companyId: string;
  periodId: string | null;
  category: string;
  anchorItemId: string;
  scrollY: number;
  savedAt: number;
};

const PREFIX = "lelang:catalog-view:";
const PENDING_FLAG = `${PREFIX}pending-restore`;
const POINTER_KEY = `${PREFIX}pointer`;
const MAX_AGE_MS = 30 * 60 * 1000;

export function catalogViewKey(companyId: string, periodId: string | null) {
  return `${PREFIX}${companyId}:${periodId ?? "none"}`;
}

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
  const y = Math.max(0, Math.round(scrollY));
  window.scrollTo(0, y);
  document.documentElement.scrollTop = y;
  document.body.scrollTop = y;
}

export function markCatalogRestorePending() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(PENDING_FLAG, "1");
    localStorage.setItem(PENDING_FLAG, "1");
  } catch {
    // ignore
  }
}

export function consumeCatalogRestorePending(): boolean {
  if (typeof window === "undefined") return false;
  let found = false;
  try {
    if (sessionStorage.getItem(PENDING_FLAG) === "1") {
      sessionStorage.removeItem(PENDING_FLAG);
      found = true;
    }
  } catch {
    // ignore
  }
  try {
    if (localStorage.getItem(PENDING_FLAG) === "1") {
      localStorage.removeItem(PENDING_FLAG);
      found = true;
    }
  } catch {
    // ignore
  }
  return found;
}

export function peekCatalogRestorePending(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (sessionStorage.getItem(PENDING_FLAG) === "1") return true;
  } catch {
    // ignore
  }
  try {
    return localStorage.getItem(PENDING_FLAG) === "1";
  } catch {
    return false;
  }
}

export function saveCatalogRestorePointer(pointer: CatalogRestorePointer) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(POINTER_KEY, JSON.stringify(pointer));
    sessionStorage.setItem(POINTER_KEY, JSON.stringify(pointer));
  } catch {
    // ignore
  }
}

export function loadCatalogRestorePointer(): CatalogRestorePointer | null {
  if (typeof window === "undefined") return null;
  for (const store of [sessionStorage, localStorage]) {
    try {
      const raw = store.getItem(POINTER_KEY);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as CatalogRestorePointer;
      if (!parsed?.anchorItemId) continue;
      if (Date.now() - (parsed.savedAt ?? 0) > MAX_AGE_MS) continue;
      return parsed;
    } catch {
      // try next
    }
  }
  return null;
}

export function buildCatalogReturnHref({
  companyCode,
  focusItemId,
}: {
  companyCode?: string | null;
  focusItemId: string;
}) {
  const params = new URLSearchParams();
  if (companyCode) params.set("company", companyCode);
  params.set("focus", focusItemId);
  return `/?${params.toString()}`;
}

export function saveCatalogView(state: CatalogViewState) {
  if (typeof window === "undefined") return;
  try {
    const key = catalogViewKey(state.companyId, state.periodId);
    const existing = loadCatalogView(state.companyId, state.periodId);

    const nextScrollY =
      state.scrollY <= 0 && existing && existing.scrollY > 0
        ? existing.scrollY
        : state.scrollY;

    const nextAnchor =
      state.anchorItemId ?? existing?.anchorItemId ?? null;

    const payload: CatalogViewState = {
      ...state,
      scrollY: nextScrollY,
      anchorItemId: nextAnchor,
      savedAt: Date.now(),
    };

    sessionStorage.setItem(key, JSON.stringify(payload));

    if (nextAnchor) {
      saveCatalogRestorePointer({
        companyId: state.companyId,
        periodId: state.periodId,
        category: state.category,
        anchorItemId: nextAnchor,
        scrollY: nextScrollY,
        savedAt: Date.now(),
      });
    }
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

function scrollToAnchor(anchorId: string): boolean {
  const el = document.getElementById(anchorId);
  if (!el) return false;

  const top = el.getBoundingClientRect().top + getWindowScrollY() - 96;
  setWindowScrollY(top);

  // iOS Safari kadang perlu offset sync kedua kali.
  const top2 = el.getBoundingClientRect().top + getWindowScrollY() - 96;
  if (Math.abs(top2 - getWindowScrollY()) > 40) {
    setWindowScrollY(top2);
  }
  return true;
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
    ok = scrollToAnchor(options.anchorId);
  }
  if (!ok) {
    setWindowScrollY(scrollY);
    ok = Math.abs(getWindowScrollY() - scrollY) < 120 || scrollY <= 0;
  }

  requestAnimationFrame(() => {
    if (options?.anchorId) {
      scrollToAnchor(options.anchorId);
    } else {
      setWindowScrollY(scrollY);
    }
    html.style.scrollBehavior = previousBehavior;
    html.classList.remove("scroll-restore-lock");
  });

  return ok;
}

/**
 * Restore agresif untuk Safari:
 * - retry berkala
 * - guard 4 detik melawan Next.js/Safari yang me-reset ke atas
 */
export function restoreCatalogScroll(
  scrollY: number,
  options?: { anchorId?: string | null }
) {
  if (typeof window === "undefined") return () => {};

  let stopped = false;
  const anchorId = options?.anchorId ?? null;

  const apply = () => {
    if (stopped) return;
    restoreWindowScroll(scrollY, { anchorId });
  };

  const delays = [0, 16, 50, 100, 200, 350, 500, 800, 1200, 1800, 2500, 3500];
  const timers = delays.map((delay) => window.setTimeout(apply, delay));

  const guard = window.setInterval(() => {
    if (stopped) return;

    if (anchorId) {
      const el = document.getElementById(anchorId);
      if (!el) {
        apply();
        return;
      }
      const rect = el.getBoundingClientRect();
      const inView =
        rect.top < window.innerHeight * 0.75 && rect.bottom > window.innerHeight * 0.15;
      if (!inView) apply();
      return;
    }

    if (scrollY > 120 && getWindowScrollY() < 80) {
      apply();
    }
  }, 120);

  const stopTimer = window.setTimeout(() => {
    stopped = true;
    window.clearInterval(guard);
  }, 4500);

  return () => {
    stopped = true;
    for (const timer of timers) window.clearTimeout(timer);
    window.clearInterval(guard);
    window.clearTimeout(stopTimer);
  };
}
