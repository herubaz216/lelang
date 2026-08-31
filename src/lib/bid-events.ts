type Listener = () => void;

const listeners = new Map<string, Set<Listener>>();

export function subscribeItemBidUpdates(itemId: string, listener: Listener) {
  if (!listeners.has(itemId)) {
    listeners.set(itemId, new Set());
  }
  listeners.get(itemId)!.add(listener);

  return () => {
    listeners.get(itemId)?.delete(listener);
  };
}

export function notifyItemBidUpdate(itemId: string) {
  listeners.get(itemId)?.forEach((listener) => listener());
}
