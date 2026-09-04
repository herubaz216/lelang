const FAVORITES_CHANGED = "lelang:favorites-changed";

export function notifyFavoritesChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(FAVORITES_CHANGED));
}

export function onFavoritesChanged(handler: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(FAVORITES_CHANGED, handler);
  return () => window.removeEventListener(FAVORITES_CHANGED, handler);
}
