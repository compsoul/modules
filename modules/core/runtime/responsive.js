// core/runtime/responsive.js

import { on } from "../events/global.js";
import { resolveSettings } from "../settings/resolve.js";

export function responsive({ defaults, options, onChange, viewport = null } = {}) {
  if (!defaults || typeof defaults !== "object" || Array.isArray(defaults)) {
    throw new TypeError("runtime.responsive({ defaults }): defaults must be an object");
  }

  if (options == null || typeof options !== "object" || Array.isArray(options)) {
    throw new TypeError("runtime.responsive({ options }): options must be an object");
  }

  if (typeof onChange !== "function") {
    throw new TypeError("runtime.responsive({ onChange }): onChange must be a function");
  }

  if (viewport != null && (typeof viewport !== "object" || typeof viewport.match !== "function")) {
    throw new TypeError("runtime.responsive({ viewport }): viewport must be an object with match(query) or null");
  }

  let matcher = null;

  if (viewport && typeof viewport.match === "function") {
    matcher = viewport;
  } else if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
    matcher = {
      match(query) {
        return window.matchMedia(query).matches;
      }
    };
  }

  let lastWidth = -1;
  let lastHeight = -1;

  function compute() {
    return resolveSettings(defaults, options, matcher);
  }

  function commit(width, height) {
    if (width === lastWidth && height === lastHeight) {
      return;
    }

    lastWidth = width;
    lastHeight = height;

    const nextSettings = compute();
    onChange(nextSettings, { width, height });
  }

  const off = on("viewport:change", (payload) => {
    if (!payload || typeof payload !== "object") {
      return;
    }

    const width = payload.width;
    const height = payload.height;

    if (typeof width !== "number" || typeof height !== "number") {
      return;
    }

    commit(width, height);
  });

  commit(
    typeof window !== "undefined" ? window.innerWidth : 0,
    typeof window !== "undefined" ? window.innerHeight : 0
  );

  return function dispose() {
    try {
      off();
    } catch {}
  };
}
