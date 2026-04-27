// core/events/emitter.js

export function createEmitter() {
  const map = new Map();

  function subscribe(type, listener) {
    if (!type || typeof type !== "string") {
      throw new TypeError("events.subscribe(type, listener): type must be a non-empty string");
    }

    if (typeof listener !== "function") {
      throw new TypeError("events.subscribe(type, listener): listener must be a function");
    }

    let set = map.get(type);

    if (!set) {
      set = new Set();
      map.set(type, set);
    }

    set.add(listener);

    return function unsubscribeListener() {
      unsubscribe(type, listener);
    };
  }

  function once(type, listener) {
    if (!type || typeof type !== "string") {
      throw new TypeError("events.once(type, listener): type must be a non-empty string");
    }

    if (typeof listener !== "function") {
      throw new TypeError("events.once(type, listener): listener must be a function");
    }

    let off = null;

    function onceListener(detail) {
      if (off) off();
      listener(detail);
    }

    off = subscribe(type, onceListener);

    return off;
  }

  function unsubscribe(type, listener) {
    if (!type || typeof type !== "string") {
      throw new TypeError("events.unsubscribe(type, listener): type must be a non-empty string");
    }

    if (typeof listener !== "function") {
      throw new TypeError("events.unsubscribe(type, listener): listener must be a function");
    }

    const set = map.get(type);
    if (!set) return;

    set.delete(listener);

    if (set.size === 0) {
      map.delete(type);
    }
  }

  function notify(type, detail) {
    if (!type || typeof type !== "string") {
      throw new TypeError("events.notify(type, detail): type must be a non-empty string");
    }

    const set = map.get(type);
    if (!set) return;

    const listeners = Array.from(set);

    for (const listener of listeners) {
      try {
        listener(detail);
      } catch {}
    }
  }

  async function pipeline(type, detail) {
    if (!type || typeof type !== "string") {
      throw new TypeError("events.pipeline(type, detail): type must be a non-empty string");
    }

    const set = map.get(type);
    if (!set) return;

    const listeners = Array.from(set);

    for (const listener of listeners) {
      try {
        await listener(detail);
      } catch {}
    }
  }

  function guard(type, detail) {
    if (!type || typeof type !== "string") {
      throw new TypeError("events.guard(type, detail): type must be a non-empty string");
    }

    const set = map.get(type);
    if (!set) return true;

    const listeners = Array.from(set);

    for (const listener of listeners) {
      try {
        const result = listener(detail);
        if (result === false) return false;
      } catch {
        return false;
      }
    }

    return true;
  }

  function snapshot() {
    const out = Object.create(null);

    for (const [type, set] of map.entries()) {
      out[type] = set.size;
    }

    return out;
  }

  return {
    subscribe,
    once,
    unsubscribe,
    notify,
    guard,
    pipeline,
    snapshot,
  };
}
