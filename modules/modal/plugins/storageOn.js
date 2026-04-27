// modal/plugins/storageOn.js

import { getFeatureRules, isFeatureEnabled } from "../../core/settings/features.js";

export const storageOnPlugin = {
  name: "storageOn",

  enabled(settings) {
    return isFeatureEnabled(settings?.features, "storageOn");
  },

  mount(context) {
    const { refs, settings, delegate, debug, namespace } = context;

    if (!isFeatureEnabled(settings?.features, "storageOn")) {
      if (debug.is(namespace)) console.log(`[${namespace}] storageOn: disabled`);
      return;
    }

    const configs = getFeatureRules(settings?.features, "storageOn");

    if (!Array.isArray(configs) || configs.length === 0) {
      if (debug.is(namespace)) console.log(`[${namespace}] storageOn: disabled (no rules)`);
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
        if (debug.is(namespace)) console.warn(`[${namespace}] storageOn: invalid config`, { config });
        continue;
      }

      const key = config.key;
      if (!key || typeof key !== "string") {
        if (debug.is(namespace)) console.warn(`[${namespace}] storageOn: invalid key`, { key, config });
        continue;
      }

      const action = config.do;
      if (action !== "set" && action !== "remove") {
        if (debug.is(namespace)) console.warn(`[${namespace}] storageOn: invalid do (expected set|remove)`, { do: action, config });
        continue;
      }

      const type = config.storage ?? "local";
      if (type !== "local" && type !== "session") {
        if (debug.is(namespace)) console.warn(`[${namespace}] storageOn: invalid storage`, { type, config });
        continue;
      }

      let store = null;

      try {
        store = storage(type);
      } catch (error) {
        if (debug.is(namespace)) console.warn(`[${namespace}] storageOn: storage unavailable`, { type, error });
        continue;
      }

      if (!store) {
        if (debug.is(namespace)) console.warn(`[${namespace}] storageOn: storage unavailable`, { type });
        continue;
      }

      const value = config.value ?? "1";

      const triggers = config.on;
      if (!Array.isArray(triggers) || triggers.length === 0) {
        if (debug.is(namespace)) console.warn(`[${namespace}] storageOn: missing config.on`, { config });
        continue;
      }

      const commit = (detail) => {
        try {
          if (action === "remove") {
            store.removeItem(key);
            if (debug.is(namespace)) console.log(`[${namespace}] storageOn: removed`, { key, type, detail });
            return;
          }

          store.setItem(key, String(value));
          if (debug.is(namespace)) console.log(`[${namespace}] storageOn: set`, { key, value: String(value), type, detail });
        } catch (error) {
          if (debug.is(namespace)) console.warn(`[${namespace}] storageOn: write failed`, { key, type, do: action, error });
        }
      };

      for (const trigger of triggers) {
        if (!Array.isArray(trigger)) {
          if (debug.is(namespace)) console.warn(`[${namespace}] storageOn: invalid trigger (expected array)`, { trigger, config });
          continue;
        }

        if (trigger.length !== 2 && trigger.length !== 3) {
          if (debug.is(namespace)) console.warn(`[${namespace}] storageOn: invalid trigger (expected [role, event] or [role, event, selector])`, { trigger, config });
          continue;
        }

        const [role, event, selector = null] = trigger;

        if (!role || typeof role !== "string") {
          if (debug.is(namespace)) console.warn(`[${namespace}] storageOn: invalid role`, { role, trigger });
          continue;
        }

        if (!event || typeof event !== "string") {
          if (debug.is(namespace)) console.warn(`[${namespace}] storageOn: invalid event`, { event, trigger });
          continue;
        }

        if (selector != null && typeof selector !== "string") {
          if (debug.is(namespace)) console.warn(`[${namespace}] storageOn: invalid selector`, { selector, trigger });
          continue;
        }

        const scope = refs[role];
        if (!(scope instanceof EventTarget)) {
          if (debug.is(namespace)) console.warn(`[${namespace}] storageOn: missing ref`, { role, trigger });
          continue;
        }

        const off = delegate(scope, event, selector, () =>
          commit({ role, event, selector, key, do: action, storage: type })
        );

        this.cleanups.push(off);
        this.bound.push({ do: action, role, event, selector, key, type });
      }
    }

    if (this.bound.length === 0) {
      if (debug.is(namespace)) console.warn(`[${namespace}] storageOn: no handlers bound`, { configs });
      return;
    }

    if (debug.is(namespace)) console.log(`[${namespace}] storageOn: ready`, { bound: this.bound });
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
