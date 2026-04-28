// modal/plugins/actionOnScroll.js

import { getFeatureRules, isFeatureEnabled } from "../../core/index.js";

export const actionOnScrollPlugin = {
  name: "actionOnScroll",

  enabled(settings) {
    return isFeatureEnabled(settings?.features, "actionOnScroll");
  },

  mount(context) {
    const { api, settings, on, debug, namespace } = context;

    if (!isFeatureEnabled(settings?.features, "actionOnScroll")) {
      if (debug.is(namespace)) console.log(`[${namespace}] actionOnScroll: disabled`);
      return;
    }

    const configs = getFeatureRules(settings?.features, "actionOnScroll");

    if (!Array.isArray(configs) || configs.length === 0) {
      if (debug.is(namespace)) console.log(`[${namespace}] actionOnScroll: disabled (no rules)`);
      return;
    }

    const actions = {
      open: () => api.open(),
      close: () => api.close(),
      destroy: () => api.destroy(),
    };

    this.cleanups = [];
    this.bound = [];

    const getScrollY = () => window.scrollY || document.documentElement.scrollTop || 0;

    for (const config of configs) {
      if (!config || typeof config !== "object" || Array.isArray(config)) {
        if (debug.is(namespace)) console.warn(`[${namespace}] actionOnScroll: invalid config`, { config });
        continue;
      }

      const action = config.do;
      const run = actions[action];

      if (typeof run !== "function") {
        if (debug.is(namespace)) console.warn(`[${namespace}] actionOnScroll: invalid do (expected open|close|destroy)`, { do: action, config });
        continue;
      }

      const amount = config.amount ?? 300;

      if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
        if (debug.is(namespace)) console.warn(`[${namespace}] actionOnScroll: invalid amount`, { amount, config });
        continue;
      }

      const once = config.once !== false;
      const when = config.when === "open" || config.when === "closed" ? config.when : null;

      const allowed = () => {
        if (when === "open") return api.isOpen;
        if (when === "closed") return !api.isOpen;
        return true;
      };

      let armedFrom = getScrollY();
      let fired = false;
      let requestId = null;

      const rearm = () => {
        armedFrom = getScrollY();
      };

      const clearRequest = () => {
        if (requestId == null) return;

        try {
          cancelAnimationFrame(requestId);
        } catch {}
        requestId = null;
      };

      const reset = () => {
        clearRequest();
        rearm();
      };

      const check = () => {
        requestId = null;

        if (!allowed()) return;
        if (once && fired) return;

        const scrollY = getScrollY();
        const delta = scrollY - armedFrom;

        if (delta < amount) return;

        Promise.resolve(run())
          .then(() => {
            fired = true;

            if (debug.is(namespace)) {
              console.log(`[${namespace}] actionOnScroll: triggered`, { do: action, amount, once, when });
            }
          })
          .catch((error) => {
            console.error(`[${namespace}] actionOnScroll: failed`, { do: action, amount, once, when, error });
          });
      };

      const onScroll = () => {
        if (requestId != null) return;
        requestId = requestAnimationFrame(check);
      };

      rearm();

      const offScroll = on(window, "scroll", onScroll, { passive: true });
      this.cleanups.push(offScroll);

      const offOpen = api.subscribe("open", reset);
      const offClose = api.subscribe("close", reset);
      const offDestroy = api.subscribe("destroy", clearRequest);

      this.cleanups.push(() => {
        try {
          offOpen();
        } catch {}
        try {
          offClose();
        } catch {}
        try {
          offDestroy();
        } catch {}
        try {
          clearRequest();
        } catch {}
      });

      this.bound.push({ do: action, amount, once, when });
    }

    if (this.bound.length === 0) {
      if (debug.is(namespace)) console.warn(`[${namespace}] actionOnScroll: no handlers bound`, { configs });
      return;
    }

    if (debug.is(namespace)) console.log(`[${namespace}] actionOnScroll: ready`, { bound: this.bound });
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
