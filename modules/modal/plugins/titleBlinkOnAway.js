// modal/plugins/titleBlinkOnAway.js

import { getFeatureOptions, isFeatureEnabled } from "../../core/index.js";

export const titleBlinkOnAwayPlugin = {
  name: "titleBlinkOnAway",

  enabled(settings) {
    return isFeatureEnabled(settings?.features, "titleBlinkOnAway");
  },

  mount(context) {
    const { api, settings, on, debug, namespace } = context;

    if (!isFeatureEnabled(settings?.features, "titleBlinkOnAway")) {
      if (debug.is(namespace)) console.log(`[${namespace}] titleBlinkOnAway: disabled`);
      return;
    }

    const options = getFeatureOptions(settings?.features, "titleBlinkOnAway");

    const title = options.title ?? "";
    if (typeof title !== "string") {
      if (debug.is(namespace)) console.warn(`[${namespace}] titleBlinkOnAway: invalid title`, { title, options });
      return;
    }

    const interval = options.interval ?? 1200;
    if (typeof interval !== "number" || !Number.isFinite(interval) || interval < 200) {
      if (debug.is(namespace)) console.warn(`[${namespace}] titleBlinkOnAway: invalid interval`, { interval, options });
      return;
    }

    this.cleanups = [];
    this.bound = [];

    let timerId = null;
    let baseTitle = document.title;
    let flip = false;

    const isAway = () => {
      const hidden = !!document.hidden;
      const focused = typeof document.hasFocus === "function" ? document.hasFocus() : true;
      return hidden || !focused;
    };

    const clearTimer = () => {
      if (timerId == null) return;
      clearInterval(timerId);
      timerId = null;
    };

    const restoreTitle = () => {
      document.title = baseTitle;
    };

    const stop = () => {
      if (timerId == null) return;
      clearTimer();
      restoreTitle();
      if (debug.is(namespace)) console.log(`[${namespace}] titleBlinkOnAway: stopped`);
    };

    const tick = () => {
      if (!api.isOpen) return stop();
      if (!isAway()) return stop();

      document.title = flip ? baseTitle : title;
      flip = !flip;
    };

    const start = () => {
      if (!api.isOpen) return;
      if (!isAway()) return;
      if (timerId != null) return;

      baseTitle = document.title;
      flip = false;

      tick();
      timerId = setInterval(tick, interval);

      if (debug.is(namespace)) console.log(`[${namespace}] titleBlinkOnAway: started`, { interval });
    };

    this.cleanups.push(api.subscribe("open", start));
    this.cleanups.push(api.subscribe("close", stop));
    this.cleanups.push(api.subscribe("destroy", stop));
    this.cleanups.push(on(document, "visibilitychange", () => (isAway() ? start() : stop())));
    this.cleanups.push(on(window, "blur", start));
    this.cleanups.push(on(window, "focus", stop));

    this.bound.push({ interval });

    if (debug.is(namespace)) console.log(`[${namespace}] titleBlinkOnAway: ready`, { interval });
  },

  unmount() {
    const cleanups = Array.isArray(this.cleanups) ? this.cleanups : [];
    this.cleanups = [];
    this.bound = [];

    for (const cleanup of cleanups) {
      try {
        cleanup?.();
      } catch {}
    }
  },

  update(context) {
    this.unmount();
    this.mount(context);
  },
};
