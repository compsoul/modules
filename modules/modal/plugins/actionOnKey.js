// modal/plugins/actionOnKey.js

import { getFeatureRules, isFeatureEnabled } from "../../core/index.js";

export const actionOnKeyPlugin = {
  name: "actionOnKey",

  enabled(settings) {
    return isFeatureEnabled(settings?.features, "actionOnKey");
  },

  mount(context) {
    const { api, settings, on, debug, namespace } = context;

    if (!isFeatureEnabled(settings?.features, "actionOnKey")) {
      if (debug.is(namespace)) console.log(`[${namespace}] actionOnKey: disabled`);
      return;
    }

    const configs = getFeatureRules(settings?.features, "actionOnKey");

    if (!Array.isArray(configs) || configs.length === 0) {
      if (debug.is(namespace)) console.log(`[${namespace}] actionOnKey: disabled (no rules)`);
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
        if (debug.is(namespace)) console.warn(`[${namespace}] actionOnKey: invalid config`, { config });
        continue;
      }

      const action = config.do;
      const run = actions[action];

      if (typeof run !== "function") {
        if (debug.is(namespace)) console.warn(`[${namespace}] actionOnKey: invalid do (expected open|close|destroy)`, { do: action, config });
        continue;
      }

      const keys = config.keys;

      if (!Array.isArray(keys) || keys.length === 0) {
        if (debug.is(namespace)) console.warn(`[${namespace}] actionOnKey: invalid keys (expected array of strings)`, { keys, config });
        continue;
      }

      const allow = keys.filter((key) => typeof key === "string" && key.length > 0);

      if (allow.length === 0) {
        if (debug.is(namespace)) console.warn(`[${namespace}] actionOnKey: invalid keys (no valid entries)`, { keys, config });
        continue;
      }

      const when = config.when === "open" || config.when === "closed" ? config.when : null;

      const allowed = () => {
        if (when === "open") return api.isOpen;
        if (when === "closed") return !api.isOpen;
        return true;
      };

      const off = on(document, "keydown", (event) => {
        if (!allowed()) return;
        if (!allow.includes(event.key)) return;

        run();

        if (debug.is(namespace)) {
          console.log(`[${namespace}] actionOnKey: triggered`, { do: action, key: event.key, when });
        }
      });

      this.cleanups.push(off);
      this.bound.push({ do: action, keys: allow, when });
    }

    if (this.bound.length === 0) {
      if (debug.is(namespace)) console.warn(`[${namespace}] actionOnKey: no handlers bound`, { configs });
      return;
    }

    if (debug.is(namespace)) console.log(`[${namespace}] actionOnKey: ready`, { bound: this.bound });
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
