// modal/runtime.js

import { createSync, responsive, viewport } from "../core/index.js";

function areSettingsEqual(left, right) {
  if (left === right) return true;

  try {
    return JSON.stringify(left) === JSON.stringify(right);
  } catch {
    return false;
  }
}

export function startRuntime({ defaults, options, api, context, events, pluginRuntime, debug, namespace }) {
  const settingsSync = createSync({
    initial: api.settings,
    equals: areSettingsEqual,
    onChange({ prev, next, meta }) {
      api.settings = next;
      context.settings = next;

      events.notify("settings:change", { prev, next, meta });

      Promise.resolve()
        .then(() => pluginRuntime.apply(next))
        .catch((error) => {
          if (debug.is(namespace)) console.warn("runtime.startRuntime(...): plugins apply failed", { error });
        });
    },
  });

  const disposeViewport = viewport({ initial: true });

  const disposeResponsive = responsive({
    defaults,
    options,
    onChange(nextSettings, meta) {
      settingsSync.commit(nextSettings, meta);
    },
  });

  return function disposeRuntime() {
    try {
      disposeResponsive?.();
    } catch {}

    try {
      disposeViewport?.();
    } catch {}

    try {
      settingsSync.dispose();
    } catch {}
  };
}
