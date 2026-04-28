// modal/plugins/storageGate.js

import { getFeatureRules, isFeatureEnabled } from "../../core/index.js";

export const storageGatePlugin = {
  name: "storageGate",

  enabled(settings) {
    return isFeatureEnabled(settings?.features, "storageGate");
  },

  mount(context) {
    const { api, settings, debug, namespace } = context;

    if (!isFeatureEnabled(settings?.features, "storageGate")) {
      if (debug.is(namespace)) console.log(`[${namespace}] storageGate: disabled`);
      return;
    }

    const configs = getFeatureRules(settings?.features, "storageGate");

    if (!Array.isArray(configs) || configs.length === 0) {
      if (debug.is(namespace)) console.log(`[${namespace}] storageGate: disabled (no rules)`);
      return;
    }

    this.cleanups = [];
    this.bound = [];

    const storage = (type) => {
      if (type === "session") return window.sessionStorage;
      if (type === "local") return window.localStorage;
      return null;
    };

    for (const config of configs) {
      if (!config || typeof config !== "object" || Array.isArray(config)) {
        if (debug.is(namespace)) console.warn(`[${namespace}] storageGate: invalid config`, { config });
        continue;
      }

      const key = config.key;
      if (!key || typeof key !== "string") {
        if (debug.is(namespace)) console.warn(`[${namespace}] storageGate: invalid key`, { key, config });
        continue;
      }

      const type = config.storage ?? "local";
      if (type !== "local" && type !== "session") {
        if (debug.is(namespace)) console.warn(`[${namespace}] storageGate: invalid storage`, { type, config });
        continue;
      }

      let store = null;

      try {
        store = storage(type);
      } catch (error) {
        if (debug.is(namespace)) console.warn(`[${namespace}] storageGate: storage unavailable`, { type, error });
        continue;
      }

      if (!store) {
        if (debug.is(namespace)) console.warn(`[${namespace}] storageGate: storage unavailable`, { type });
        continue;
      }

      const allowWhen = config.allowWhen === "present" ? "present" : "missing";

      const events = Array.isArray(config.event) ? config.event : [config.event];
      const allow = events.filter((name) => typeof name === "string" && name.length > 0);

      if (allow.length === 0) {
        if (debug.is(namespace)) console.warn(`[${namespace}] storageGate: invalid event`, { event: config.event, config });
        continue;
      }

      for (const event of allow) {
        const off = api.subscribe(event, () => {
          let present = false;

          try {
            present = store.getItem(key) !== null;
          } catch (error) {
            if (debug.is(namespace)) console.warn(`[${namespace}] storageGate: getItem failed`, { key, type, event, error });
            return false;
          }

          if (allowWhen === "present") return present;
          return !present;
        });

        this.cleanups.push(off);
        this.bound.push({ event, allowWhen, key, type });
      }
    }

    if (this.bound.length === 0) {
      if (debug.is(namespace)) console.warn(`[${namespace}] storageGate: no gates bound`, { configs });
      return;
    }

    if (debug.is(namespace)) console.log(`[${namespace}] storageGate: ready`, { bound: this.bound });
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
