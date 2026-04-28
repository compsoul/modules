// modal/plugins/animateWaapi.js

import { getFeatureOptions, isFeatureEnabled } from "../../core/index.js";

function canAnimate() {
  return typeof Element !== "undefined" && typeof Element.prototype?.animate === "function";
}

export const animateWaapiPlugin = {
  name: "animateWaapi",

  enabled(settings) {
    return isFeatureEnabled(settings?.features, "animateWaapi");
  },

  mount(context) {
    const { api, refs, settings, debug, namespace } = context;

    if (!isFeatureEnabled(settings?.features, "animateWaapi")) {
      if (debug.is(namespace)) console.log(`[${namespace}] animateWaapi: disabled`);
      return;
    }

    if (!canAnimate()) {
      if (debug.is(namespace)) console.warn(`[${namespace}] animateWaapi: WAAPI not available`);
      return;
    }

    const options = getFeatureOptions(settings?.features, "animateWaapi");

    const events = {
      open: "open:transition",
      close: "close:transition",
    };

    this.cleanups = [];
    this.ticket = 0;
    this.running = [];

    const clearRunning = () => {
      const running = Array.isArray(this.running) ? this.running : [];
      this.running = [];

      for (const animation of running) {
        try {
          animation.cancel();
        } catch {}
      }
    };

    const runSteps = async (phase, steps) => {
      this.ticket++;
      const runTicket = this.ticket;

      clearRunning();

      for (const step of steps) {
        if (this.ticket !== runTicket) return;
        if (!step || typeof step !== "object" || Array.isArray(step)) continue;

        const targetName = step.target;
        if (!targetName || typeof targetName !== "string") {
          throw new TypeError(`[${namespace}] animateWaapi: step.target must be a non-empty string`);
        }

        const element = refs[targetName];
        if (!(element instanceof Element)) {
          throw new Error(`[${namespace}] animateWaapi: missing target "${targetName}" (${phase})`);
        }

        const action = step.do;
        if (action !== "animate" && action !== "style") {
          throw new TypeError(`[${namespace}] animateWaapi: step.do must be "animate" or "style" for target "${targetName}" (${phase})`);
        }

        if (debug.is(namespace)) {
          const payload = { phase, target: targetName, do: action };
          if (action === "animate") payload.wait = step.wait === true;
          console.log(`[${namespace}] animateWaapi: step`, payload);
        }

        if (action === "style") {
          const styles = step.styles;
          if (!styles || typeof styles !== "object" || Array.isArray(styles)) {
            throw new TypeError(`[${namespace}] animateWaapi: step.styles must be an object for target "${targetName}" (${phase})`);
          }

          try {
            Object.assign(element.style, styles);
          } catch {}
          continue;
        }

        const keyframes = Array.isArray(step.keyframes) ? step.keyframes : null;
        if (!keyframes || keyframes.length === 0) {
          throw new TypeError(`[${namespace}] animateWaapi: step.keyframes must be a non-empty array for target "${targetName}" (${phase})`);
        }

        const timing = step.timing;
        if (!timing || typeof timing !== "object" || Array.isArray(timing)) {
          throw new TypeError(`[${namespace}] animateWaapi: step.timing must be an object for target "${targetName}" (${phase})`);
        }

        let animation = null;

        try {
          animation = element.animate(keyframes, timing);
          this.running.push(animation);

          if (step.wait === true) {
            await animation.finished.catch(() => {});
          }
        } catch (error) {
          if (debug.is(namespace)) {
            console.warn(`[${namespace}] animateWaapi: animation failed`, {
              phase,
              target: targetName,
              error,
            });
          }
        } finally {
          if (animation) {
            this.running = this.running.filter((item) => item !== animation);
          }
        }
      }
    };

    for (const [phase, eventName] of Object.entries(events)) {
      const steps = Array.isArray(options[phase]) ? options[phase] : [];
      if (steps.length === 0) continue;

      this.cleanups.push(api.subscribe(eventName, () => runSteps(phase, steps)));
    }

    this.cleanups.push(() => clearRunning());

    if (this.cleanups.length === 1) {
      if (debug.is(namespace)) console.log(`[${namespace}] animateWaapi: disabled (no valid config)`);
      return;
    }

    if (debug.is(namespace)) {
      console.log(`[${namespace}] animateWaapi: ready`, { phases: this.cleanups.length - 1 });
    }
  },

  unmount() {
    const cleanups = Array.isArray(this.cleanups) ? this.cleanups : [];
    this.cleanups = [];
    this.ticket = 0;

    for (const cleanup of cleanups) {
      try {
        cleanup?.();
      } catch {}
    }

    const running = Array.isArray(this.running) ? this.running : [];
    this.running = [];

    for (const animation of running) {
      try {
        animation.cancel();
      } catch {}
    }
  },

  update(context) {
    this.unmount();
    this.mount(context);
  },
};
