// modal/plugins/actionOn.js

import { getFeatureRules, isFeatureEnabled } from "../../core/index.js";

export const actionOnPlugin = {
  name: "actionOn",

  enabled(settings) {
    return isFeatureEnabled(settings?.features, "actionOn");
  },

  mount(context) {
    const { api, refs, settings, delegate, debug, namespace } = context;

    if (!isFeatureEnabled(settings?.features, "actionOn")) {
      if (debug.is(namespace)) console.log(`[${namespace}] actionOn: disabled`);
      return;
    }

    const configs = getFeatureRules(settings?.features, "actionOn");

    if (!Array.isArray(configs) || configs.length === 0) {
      if (debug.is(namespace)) console.log(`[${namespace}] actionOn: disabled (no rules)`);
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
        if (debug.is(namespace)) console.warn(`[${namespace}] actionOn: invalid config`, { config });
        continue;
      }

      const action = config.do;
      const run = actions[action];

      if (typeof run !== "function") {
        if (debug.is(namespace)) console.warn(`[${namespace}] actionOn: invalid do (expected open|close|unmount|destroy)`, { do: action, config });
        continue;
      }

      const triggers = config.on;

      if (!Array.isArray(triggers) || triggers.length === 0) {
        if (debug.is(namespace)) console.warn(`[${namespace}] actionOn: missing config.on`, { config });
        continue;
      }

      for (const trigger of triggers) {
        if (!Array.isArray(trigger)) {
          if (debug.is(namespace)) console.warn(`[${namespace}] actionOn: invalid trigger (expected array)`, { trigger, config });
          continue;
        }

        if (trigger.length !== 2 && trigger.length !== 3) {
          if (debug.is(namespace)) console.warn(`[${namespace}] actionOn: invalid trigger (expected [role, event] or [role, event, selector])`, { trigger, config });
          continue;
        }

        const [role, event, selector = null] = trigger;

        if (!role || typeof role !== "string") {
          if (debug.is(namespace)) console.warn(`[${namespace}] actionOn: invalid role`, { role, trigger });
          continue;
        }

        if (!event || typeof event !== "string") {
          if (debug.is(namespace)) console.warn(`[${namespace}] actionOn: invalid event`, { event, trigger });
          continue;
        }

        if (selector != null && typeof selector !== "string") {
          if (debug.is(namespace)) console.warn(`[${namespace}] actionOn: invalid selector`, { selector, trigger });
          continue;
        }

        const scope = refs[role];
        if (!(scope instanceof EventTarget)) {
          if (debug.is(namespace)) console.warn(`[${namespace}] actionOn: missing ref`, { role, trigger });
          continue;
        }

        const off = delegate(scope, event, selector, () => run());
        this.cleanups.push(off);
        this.bound.push({ do: action, role, event, selector });
      }
    }

    if (this.bound.length === 0) {
      if (debug.is(namespace)) console.warn(`[${namespace}] actionOn: no handlers bound`, { configs });
      return;
    }

    if (debug.is(namespace)) console.log(`[${namespace}] actionOn: ready`, { bound: this.bound });
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
