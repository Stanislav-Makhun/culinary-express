// One global state object, persisted to localStorage. Every read and write is guarded,
// and the app falls back to seed data when storage is empty or unavailable.
import { makeSeed } from './data.js';

const KEY = 'cx-prototype-state';
const VERSION = 3;

function load() {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && parsed.version === VERSION ? parsed : null;
  } catch (e) {
    return null;
  }
}

function save(s) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch (e) {
    /* storage unavailable: the demo keeps working in memory */
  }
}

let state = load() || makeSeed();
const listeners = new Set();
const notify = () => listeners.forEach((l) => l());

export const getState = () => state;

export function update(fn) {
  const next = structuredClone(state);
  fn(next);
  state = next;
  save(state);
  notify();
}

export function resetDemo() {
  state = makeSeed();
  save(state);
  notify();
}

const subscribe = (l) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useStore = () => React.useSyncExternalStore(subscribe, getState);

// Small toast bus
let toastId = 0;
const toastListeners = new Set();
export function toast(text, tone = 'default') {
  const t = { id: ++toastId, text, tone };
  toastListeners.forEach((l) => l(t));
}
export const onToast = (l) => {
  toastListeners.add(l);
  return () => toastListeners.delete(l);
};
