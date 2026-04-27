// modal/plugins/actionOnLeave.js

import { getFeatureRules, isFeatureEnabled } from "../../core/settings/features.js";

export const actionOnLeavePlugin = {
  name: "actionOnLeave",

  enabled(settings) {
    return isFeatureEnabled(settings?.features, "actionOnLeave");
  },

  mount(context) {
    const { api, settings, on, debug, namespace } = context;

    if (!isFeatureEnabled(settings?.features, "actionOnLeave")) {
      if (debug.is(namespace)) console.log(`[${namespace}] actionOnLeave: disabled`);
      return;
    }

    const configs = getFeatureRules(settings?.features, "actionOnLeave");

    if (!Array.isArray(configs) || configs.length === 0) {
      if (debug.is(namespace)) console.log(`[${namespace}] actionOnLeave: disabled (no rules)`);
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
        if (debug.is(namespace)) console.warn(`[${namespace}] actionOnLeave: invalid config`, { config });
        continue;
      }

      const action = config.do;
      const run = actions[action];

      if (typeof run !== "function") {
        if (debug.is(namespace)) console.warn(`[${namespace}] actionOnLeave: invalid do (expected open|close|destroy)`, { do: action, config });
        continue;
      }

      const delay = config.delay ?? 0;

      if (typeof delay !== "number" || !Number.isFinite(delay) || delay < 0) {
        if (debug.is(namespace)) console.warn(`[${namespace}] actionOnLeave: invalid delay`, { delay, config });
        continue;
      }

      const once = config.once !== false;
      const when = config.when === "open" || config.when === "closed" ? config.when : null;

      const allowed = () => {
        if (when === "open") return api.isOpen;
        if (when === "closed") return !api.isOpen;
        return true;
      };

      let armed = false;
      let fired = false;
      let armId = null;

      const clearArm = () => {
        if (armId == null) {
          armed = false;
          return;
        }

        clearTimeout(armId);
        armId = null;
        armed = false;
      };

      const scheduleArm = () => {
        if (armed) return;
        if (armId != null) return;

        if (delay === 0) {
          armed = true;
          return;
        }

        armId = setTimeout(() => {
          armId = null;
          armed = true;
        }, delay);
      };

      const trigger = () => {
        if (!armed) return;
        if (!allowed()) return;
        if (once && fired) return;

        Promise.resolve(run())
          .then(() => {
            fired = true;

            if (action !== "close" || once) {
              clearArm();
            }

            if (debug.is(namespace)) {
              console.log(`[${namespace}] actionOnLeave: triggered`, { do: action, delay, once, when });
            }
          })
          .catch((error) => {
            console.error(`[${namespace}] actionOnLeave: failed`, { do: action, delay, once, when, error });
          });
      };

      const onMouseOut = (event) => {
        if (event.relatedTarget instanceof Node) return;
        trigger();
      };

      scheduleArm();

      this.cleanups.push(on(document, "mouseout", onMouseOut));
      this.cleanups.push(
        api.subscribe("open", () => {
          if (action === "open") clearArm();
        })
      );
      this.cleanups.push(
        api.subscribe("close", () => {
          clearArm();
          if (!once) scheduleArm();
        })
      );
      this.cleanups.push(api.subscribe("destroy", clearArm));
      this.cleanups.push(clearArm);

      this.bound.push({ do: action, delay, once, when });
    }

    if (this.bound.length === 0) {
      if (debug.is(namespace)) console.warn(`[${namespace}] actionOnLeave: no handlers bound`, { configs });
      return;
    }

    if (debug.is(namespace)) console.log(`[${namespace}] actionOnLeave: ready`, { bound: this.bound });
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
