// core/events/global.js

const map = new Map();

export function on(type, listener) {
  if (!type || typeof type !== "string") {
    throw new TypeError("events.global.on(type, listener): type must be a non-empty string");
  }

  if (typeof listener !== "function") {
    throw new TypeError("events.global.on(type, listener): listener must be a function");
  }

  let set = map.get(type);

  if (!set) {
    set = new Set();
    map.set(type, set);
  }

  set.add(listener);

  return function unsubscribe() {
    off(type, listener);
  };
}

export function off(type, listener) {
  if (!type || typeof type !== "string") {
    throw new TypeError("events.global.off(type, listener): type must be a non-empty string");
  }

  if (typeof listener !== "function") {
    throw new TypeError("events.global.off(type, listener): listener must be a function");
  }

  const set = map.get(type);
  if (!set) return;

  set.delete(listener);

  if (set.size === 0) {
    map.delete(type);
  }
}

export function emit(type, payload) {
  if (!type || typeof type !== "string") {
    throw new TypeError("events.global.emit(type, payload): type must be a non-empty string");
  }

  const set = map.get(type);
  if (!set) return;

  for (const listener of Array.from(set)) {
    try {
      listener(payload);
    } catch (error) {
      console.error("[events.global.emit] listener error", { type, error });
    }
  }
}
