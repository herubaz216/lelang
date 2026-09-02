const STORAGE_KEY = "elang_push_state_v2";

type PushPromptState = {
  subscribed: boolean;
};

function readState(): PushPromptState {
  if (typeof window === "undefined") {
    return { subscribed: false };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { subscribed: false };
    const parsed = JSON.parse(raw) as Partial<PushPromptState>;
    return {
      subscribed: Boolean(parsed.subscribed),
    };
  } catch {
    return { subscribed: false };
  }
}

function writeState(state: PushPromptState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function notifyPushStateChange() {
  window.dispatchEvent(new CustomEvent("elang-push-state-change"));
}

export function isPushSubscribed() {
  return readState().subscribed;
}

export function markPushSubscribed() {
  writeState({ subscribed: true });
  notifyPushStateChange();
}

export function clearPushSubscribed() {
  writeState({ subscribed: false });
  notifyPushStateChange();
}

export function shouldAutoPromptPush() {
  return !isPushSubscribed();
}
