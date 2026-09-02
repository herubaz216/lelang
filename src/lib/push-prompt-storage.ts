const STORAGE_KEY = "elang_push_state_v2";

type PushPromptState = {
  prompted: boolean;
  subscribed: boolean;
};

function readState(): PushPromptState {
  if (typeof window === "undefined") {
    return { prompted: false, subscribed: false };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { prompted: false, subscribed: false };
    const parsed = JSON.parse(raw) as Partial<PushPromptState>;
    return {
      prompted: Boolean(parsed.prompted),
      subscribed: Boolean(parsed.subscribed),
    };
  } catch {
    return { prompted: false, subscribed: false };
  }
}

function writeState(state: PushPromptState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function notifyPushStateChange() {
  window.dispatchEvent(new CustomEvent("elang-push-state-change"));
}

export function hasSeenPushPrompt() {
  return readState().prompted;
}

export function markPushPromptSeen() {
  const state = readState();
  if (!state.prompted) {
    writeState({ ...state, prompted: true });
    notifyPushStateChange();
  }
}

export function isPushSubscribed() {
  return readState().subscribed;
}

export function markPushSubscribed() {
  writeState({ prompted: true, subscribed: true });
  notifyPushStateChange();
}

export function clearPushSubscribed() {
  const state = readState();
  writeState({ ...state, subscribed: false });
  notifyPushStateChange();
}

export function shouldAutoPromptPush() {
  const state = readState();
  return !state.subscribed && !state.prompted;
}
