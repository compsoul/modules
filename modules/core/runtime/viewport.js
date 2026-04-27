// core/runtime/viewport.js

import { emit } from "../events/global.js";

let started = false;
let consumers = 0;

let animationFrameId = null;
let lastWidth = -1;
let lastHeight = -1;

function commit() {
  animationFrameId = null;

  const width = window.innerWidth;
  const height = window.innerHeight;

  if (width === lastWidth && height === lastHeight) {
    return;
  }

  lastWidth = width;
  lastHeight = height;

  emit("viewport:change", { width, height });
}

function schedule() {
  if (animationFrameId != null) {
    return;
  }

  animationFrameId = requestAnimationFrame(commit);
}

export function viewport({ initial = true } = {}) {
  if (typeof window === "undefined") {
    throw new Error("runtime.viewport(...): window is not available");
  }

  if (!started) {
    started = true;
    window.addEventListener("resize", schedule, { passive: true });
    window.addEventListener("orientationchange", schedule, { passive: true });
  }

  consumers++;

  if (initial) {
    commit();
  }

  let released = false;

  return function dispose() {
    if (released) {
      return;
    }

    released = true;

    if (consumers > 0) {
      consumers--;
    }

    if (!started || consumers > 0) {
      return;
    }

    started = false;

    window.removeEventListener("resize", schedule);
    window.removeEventListener("orientationchange", schedule);

    if (animationFrameId != null) {
      try {
        cancelAnimationFrame(animationFrameId);
      } catch {}

      animationFrameId = null;
    }
  };
}
