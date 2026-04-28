// modal/plugins/animateCss.js

import { getFeatureOptions, isFeatureEnabled } from "../../core/index.js";

function waitForAnimationEnd(element, timeout = 1200) {
  return new Promise((resolve) => {
    if (!(element instanceof Element)) {
      resolve();
      return;
    }

    let done = false;
    let timerId = null;

    const finish = () => {
      if (done) return;
      done = true;

      try {
        element.removeEventListener("animationend", onEnd);
      } catch {}

      try {
        element.removeEventListener("animationcancel", onCancel);
      } catch {}

      if (timerId != null) clearTimeout(timerId);
      resolve();
    };

    const onEnd = (event) => {
      if (event.target !== element) return;
      finish();
    };

    const onCancel = (event) => {
      if (event.target !== element) return;
      finish();
    };

    try {
      element.addEventListener("animationend", onEnd);
      element.addEventListener("animationcancel", onCancel);
    } catch {
      resolve();
      return;
    }

    timerId = setTimeout(finish, timeout);
  });
}

export const animateCssPlugin = {
  name: "animateCss",

  enabled(settings) {
    return isFeatureEnabled(settings?.features, "animateCss");
  },

  mount(context) {
    const { api, refs, settings, debug, namespace } = context;

    if (!isFeatureEnabled(settings?.features, "animateCss")) {
      if (debug.is(namespace)) console.log(`[${namespace}] animateCss: disabled`);
      return;
    }

    const options = getFeatureOptions(settings?.features, "animateCss");

    const events = {
      open: "open:transition",
      close: "close:transition",
    };

    this.cleanups = [];
    this.ticket = 0;

    const runSteps = async (phase, steps) => {
      this.ticket++;
      const runTicket = this.ticket;

      for (const step of steps) {
        if (this.ticket !== runTicket) return;
        if (!step || typeof step !== "object" || Array.isArray(step)) continue;

        const targetName = step.target;
        if (!targetName || typeof targetName !== "string") {
          throw new TypeError(`[${namespace}] animateCss: step.target must be a non-empty string`);
        }

        const element = refs[targetName];
        if (!(element instanceof Element)) {
          throw new Error(`[${namespace}] animateCss: missing target "${targetName}" (${phase})`);
        }

        const action = step.do;
        if (action !== "add" && action !== "remove") {
          throw new TypeError(`[${namespace}] animateCss: step.do must be "add" or "remove" for target "${targetName}" (${phase})`);// w jednej linii takie errory
        }

        const classes = Array.isArray(step.classes) ? step.classes : null;
        if (!classes) {
          throw new TypeError(`[${namespace}] animateCss: step.classes must be an array of class names for target "${targetName}" (${phase})`);
        }

        if (debug.is(namespace)) {
          console.log(`[${namespace}] animateCss: step`, { phase, target: targetName, do: action, classes });
        }

        for (const className of classes) {
          if (typeof className !== "string" || className.length === 0) {
            throw new TypeError(`[${namespace}] animateCss: step.classes must contain non-empty strings for target "${targetName}" (${phase})`);
          }

          try {
            if (action === "remove") {
              element.classList.remove(className);
            } else {
              element.classList.add(className);
            }
          } catch {}
        }

        if (step.wait === true) {
          let timeout = 1200;
          if (typeof step.timeout === "number" && Number.isFinite(step.timeout) && step.timeout >= 0) {
            timeout = step.timeout;
          }

          await waitForAnimationEnd(element, timeout);
        }
      }
    };

    for (const [phase, eventName] of Object.entries(events)) {
      const steps = Array.isArray(options[phase]) ? options[phase] : [];
      if (steps.length === 0) continue;

      this.cleanups.push(api.subscribe(eventName, () => runSteps(phase, steps)));
    }

    if (this.cleanups.length === 0) {
      if (debug.is(namespace)) console.log(`[${namespace}] animateCss: disabled (no valid config)`);
      return;
    }

    if (debug.is(namespace)) {
      console.log(`[${namespace}] animateCss: ready`, { phases: this.cleanups.length });
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
  },

  update(context) {
    this.unmount();
    this.mount(context);
  },
};
