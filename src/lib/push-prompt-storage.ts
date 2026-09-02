const STORAGE_KEY = "elang_push_state_v1";

type PushPromptState = {
  prompted: string[];
  subscribed: string[];
};

function readState(): PushPromptState {
  if (typeof window === "undefined") {
    return { prompted: [], subscribed: [] };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { prompted: [], subscribed: [] };
    const parsed = JSON.parse(raw) as Partial<PushPromptState>;
    return {
      prompted: Array.isArray(parsed.prompted) ? parsed.prompted : [],
      subscribed: Array.isArray(parsed.subscribed) ? parsed.subscribed : [],
    };
  } catch {
    return { prompted: [], subscribed: [] };
  }
}

function writeState(state: PushPromptState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function notifyPushStateChange() {
  window.dispatchEvent(new CustomEvent("elang-push-state-change"));
}

export function hasSeenPushPrompt(companyCode: string) {
  const code = companyCode.toLowerCase();
  return readState().prompted.includes(code);
}

export function markPushPromptSeen(companyCode: string) {
  const code = companyCode.toLowerCase();
  const state = readState();
  if (!state.prompted.includes(code)) {
    state.prompted.push(code);
    writeState(state);
    notifyPushStateChange();
  }
}

export function isCompanyPushSubscribed(companyCode: string) {
  const code = companyCode.toLowerCase();
  return readState().subscribed.includes(code);
}

export function markCompanyPushSubscribed(companyCode: string) {
  const code = companyCode.toLowerCase();
  const state = readState();
  if (!state.subscribed.includes(code)) {
    state.subscribed.push(code);
  }
  if (!state.prompted.includes(code)) {
    state.prompted.push(code);
  }
  writeState(state);
  notifyPushStateChange();
}

export function clearCompanyPushSubscribed(companyCode: string) {
  const code = companyCode.toLowerCase();
  const state = readState();
  state.subscribed = state.subscribed.filter((item) => item !== code);
  writeState(state);
  notifyPushStateChange();
}

export function shouldAutoPromptPush(companyCode: string) {
  const code = companyCode.toLowerCase();
  if (isCompanyPushSubscribed(code) || hasSeenPushPrompt(code)) {
    return false;
  }
  return true;
}
