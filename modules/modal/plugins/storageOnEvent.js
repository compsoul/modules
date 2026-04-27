// modal/plugins/storageOnEvent.js

import { getFeatureRules, isFeatureEnabled } from "../../core/settings/features.js";

export const storageOnEventPlugin = {
  name: "storageOnEvent",

  enabled(settings) {
    return isFeatureEnabled(settings?.features, "storageOnEvent");
  },

  mount(context) {
    const { api, settings, debug, namespace } = context;

    if (!isFeatureEnabled(settings?.features, "storageOnEvent")) {
      if (debug.is(namespace)) console.log(`[${namespace}] storageOnEvent: disabled`);
      return;
    }

    const configs = getFeatureRules(settings?.features, "storageOnEvent");

    if (!Array.isArray(configs) || configs.length === 0) {
      if (debug.is(namespace)) console.log(`[${namespace}] storageOnEvent: disabled (no rules)`);
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
        if (debug.is(namespace)) console.warn(`[${namespace}] storageOnEvent: invalid config`, { config });
        continue;
      }

      const key = config.key;
      if (!key || typeof key !== "string") {
        if (debug.is(namespace)) console.warn(`[${namespace}] storageOnEvent: invalid key`, { key, config });
        continue;
      }

      const action = config.do;
      if (action !== "set" && action !== "remove") {
        if (debug.is(namespace)) console.warn(`[${namespace}] storageOnEvent: invalid do (expected set|remove)`, { do: action, config });
        continue;
      }

      const type = config.storage ?? "local";
      if (type !== "local" && type !== "session") {
        if (debug.is(namespace)) console.warn(`[${namespace}] storageOnEvent: invalid storage`, { type, config });
        continue;
      }

      let store = null;

      try {
        store = storage(type);
      } catch (error) {
        if (debug.is(namespace)) console.warn(`[${namespace}] storageOnEvent: storage unavailable`, { type, error });
        continue;
      }

      if (!store) {
        if (debug.is(namespace)) console.warn(`[${namespace}] storageOnEvent: storage unavailable`, { type });
        continue;
      }

      const value = config.value ?? "1";

      const triggers = Array.isArray(config.event) ? config.event : [config.event];
      const allow = triggers.filter((name) => typeof name === "string" && name.length > 0);

      if (allow.length === 0) {
        if (debug.is(namespace)) console.warn(`[${namespace}] storageOnEvent: invalid event`, { event: config.event, config });
        continue;
      }

      const commit = (eventName, detail) => {
        try {
          if (action === "remove") {
            store.removeItem(key);
            if (debug.is(namespace)) console.log(`[${namespace}] storageOnEvent: removed`, { key, type, event: eventName, detail });
            return;
          }

          store.setItem(key, String(value));
          if (debug.is(namespace)) console.log(`[${namespace}] storageOnEvent: set`, { key, value: String(value), type, event: eventName, detail });
        } catch (error) {
          if (debug.is(namespace)) console.warn(`[${namespace}] storageOnEvent: write failed`, { key, type, do: action, error });
        }
      };

      for (const eventName of allow) {
        const off = api.subscribe(eventName, (detail) => commit(eventName, detail));
        this.cleanups.push(off);
        this.bound.push({
          event: eventName,
          do: action,
          key,
          type,
          value: action === "set" ? String(value) : null,
        });
      }
    }

    if (this.bound.length === 0) {
      if (debug.is(namespace)) console.warn(`[${namespace}] storageOnEvent: no handlers bound`, { configs });
      return;
    }

    if (debug.is(namespace)) console.log(`[${namespace}] storageOnEvent: ready`, { bound: this.bound });
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
