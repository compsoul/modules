// core/settings/responsive.js

import { isPlainObject } from "../utils/isPlainObject.js";
import { merge } from "./merge.js";

export function applyResponsive(settings, env) {
  if (!isPlainObject(settings)) {
    throw new TypeError("settings.applyResponsive(settings, env): settings must be a plain object");
  }

  if (!env || typeof env !== "object") {
    throw new TypeError("settings.applyResponsive(settings, env): env must be an object");
  }

  if (typeof env.match !== "function") {
    throw new TypeError("settings.applyResponsive(settings, env): env.match must be a function");
  }

  const rules = settings.rwd;

  if (!isPlainObject(rules)) {
    return settings;
  }

  let out = settings;

  for (const [query, patch] of Object.entries(rules)) {
    if (!isPlainObject(patch)) {
      continue;
    }

    let ok = false;
    try {
      ok = !!env.match(query);
    } catch {}

    if (!ok) {
      continue;
    }

    out = merge(out, patch);
  }

  return out;
}
