// modal/plugins/actionOnEvent.js

import { getFeatureRules, isFeatureEnabled } from "../../core/index.js";

export const actionOnEventPlugin = {
  name: "actionOnEvent",

  enabled(settings) {
    return isFeatureEnabled(settings?.features, "actionOnEvent");
  },

  mount(context) {
    const { api, settings, debug, namespace } = context;

    if (!isFeatureEnabled(settings?.features, "actionOnEvent")) {
      if (debug.is(namespace)) console.log(`[${namespace}] actionOnEvent: disabled`);
      return;
    }

    const configs = getFeatureRules(settings?.features, "actionOnEvent");

    if (!Array.isArray(configs) || configs.length === 0) {
      if (debug.is(namespace)) console.log(`[${namespace}] actionOnEvent: disabled (no rules)`);
      return;
    }

    const actions = {
      open: () => api.open(),
      close: () => api.close(),
      unmount: () => api.unmount(),
      destroy: () => api.destroy(),
    };

    this.cleanups = [];
    this.bound = [];

    for (const config of configs) {
      if (!config || typeof config !== "object" || Array.isArray(config)) {
        if (debug.is(namespace)) console.warn(`[${namespace}] actionOnEvent: invalid config`, { config });
        continue;
      }

      const action = config.do;
      const run = actions[action];

      if (typeof run !== "function") {
        if (debug.is(namespace)) console.warn(`[${namespace}] actionOnEvent: invalid do (expected open|close|unmount|destroy)`, { do: action, config });
        continue;
      }

      const triggers = Array.isArray(config.event) ? config.event : [config.event];
      const events = triggers.filter((name) => typeof name === "string" && name.length > 0);

      if (events.length === 0) {
        if (debug.is(namespace)) console.warn(`[${namespace}] actionOnEvent: invalid event`, { event: config.event, config });
        continue;
      }

      const when = config.when === "open" || config.when === "closed" ? config.when : null;
      const microtask = config.microtask !== false;

      const allowed = () => {
        if (when === "open") return api.isOpen;
        if (when === "closed") return !api.isOpen;
        return true;
      };

      function commit(eventName) {
        if (!allowed()) return;

        if (!microtask) {
          run();
          if (debug.is(namespace)) console.log(`[${namespace}] actionOnEvent: done`, { event: eventName, do: action, when });
          return;
        }

        queueMicrotask(() => {
          if (!allowed()) return;
          run();
          if (debug.is(namespace)) console.log(`[${namespace}] actionOnEvent: done`, { event: eventName, do: action, when });
        });
      }

      for (const eventName of events) {
        const off = api.subscribe(eventName, () => commit(eventName));
        this.cleanups.push(off);
        this.bound.push({ event: eventName, do: action, when });
      }
    }

    if (this.bound.length === 0) {
      if (debug.is(namespace)) console.warn(`[${namespace}] actionOnEvent: no handlers bound`, { configs });
      return;
    }

    if (debug.is(namespace)) console.log(`[${namespace}] actionOnEvent: ready`, { bound: this.bound });
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
