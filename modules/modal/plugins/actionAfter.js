// modal/plugins/actionAfter.js

import { getFeatureRules, isFeatureEnabled } from "../../core/settings/features.js";

export const actionAfterPlugin = {
  name: "actionAfter",

  enabled(settings) {
    return isFeatureEnabled(settings?.features, "actionAfter");
  },

  mount(context) {
    const { api, settings, debug, namespace } = context;

    if (!isFeatureEnabled(settings?.features, "actionAfter")) {
      if (debug.is(namespace)) console.log(`[${namespace}] actionAfter: disabled`);
      return;
    }

    const configs = getFeatureRules(settings?.features, "actionAfter");

    if (!Array.isArray(configs) || configs.length === 0) {
      if (debug.is(namespace)) console.log(`[${namespace}] actionAfter: disabled (no rules)`);
      return;
    }

    const actions = {
      open: () => api.open(),
      close: () => api.close(),
      destroy: () => api.destroy(),
    };

    this.cleanups = [];
    this.bound = [];

    for (const config of configs) {
      if (!config || typeof config !== "object" || Array.isArray(config)) {
        if (debug.is(namespace)) console.warn(`[${namespace}] actionAfter: invalid config`, { config });
        continue;
      }

      const action = config.do;
      const run = actions[action];

      if (typeof run !== "function") {
        if (debug.is(namespace)) console.warn(`[${namespace}] actionAfter: invalid do (expected open|close|destroy)`, { do: action, config });
        continue;
      }

      const delay = config.delay ?? 0;

      if (typeof delay !== "number" || !Number.isFinite(delay) || delay < 0) {
        if (debug.is(namespace)) console.warn(`[${namespace}] actionAfter: invalid delay`, { delay, config });
        continue;
      }

      const when = config.when === "open" || config.when === "closed" ? config.when : null;

      const allowed = () => {
        if (when === "open") return api.isOpen;
        if (when === "closed") return !api.isOpen;
        return true;
      };

      let timerId = null;

      const clearTimer = () => {
        if (timerId == null) return;
        clearTimeout(timerId);
        timerId = null;
      };

      const schedule = () => {
        if (timerId != null) return;

        timerId = setTimeout(() => {
          timerId = null;

          if (!allowed()) return;

          Promise.resolve(run())
            .then(() => {
              if (debug.is(namespace)) {
                console.log(`[${namespace}] actionAfter: done`, { do: action, delay, when });
              }
            })
            .catch((error) => {
              console.error(`[${namespace}] actionAfter: failed`, { do: action, delay, when, error });
            });
        }, delay);
      };

      schedule();

      this.cleanups.push(api.subscribe("open", clearTimer));
      this.cleanups.push(api.subscribe("close", clearTimer));
      this.cleanups.push(api.subscribe("destroy", clearTimer));
      this.cleanups.push(clearTimer);

      this.bound.push({ do: action, delay, when });
    }

    if (this.bound.length === 0) {
      if (debug.is(namespace)) console.warn(`[${namespace}] actionAfter: no timers scheduled`, { configs });
      return;
    }

    if (debug.is(namespace)) console.log(`[${namespace}] actionAfter: ready`, { bound: this.bound });
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
