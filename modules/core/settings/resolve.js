// core/settings/resolve.js

import { isPlainObject } from "../utils/isPlainObject.js";
import { merge } from "./merge.js";
import { normalize } from "./normalize.js";
import { applyResponsive } from "./responsive.js";

export function resolveSettings(defaults, options = {}, viewport = null) {
  if (!isPlainObject(defaults)) {
    throw new TypeError("settings.resolveSettings(defaults, options, viewport): defaults must be a plain object");
  }

  if (!isPlainObject(options)) {
    throw new TypeError("settings.resolveSettings(defaults, options, viewport): options must be a plain object");
  }

  if (viewport != null && (typeof viewport !== "object" || typeof viewport.match !== "function")) {
    throw new TypeError("settings.resolveSettings(defaults, options, viewport): viewport must be an object with match(query) or null");
  }

  const merged = merge(defaults, options);
  const responsive = viewport ? applyResponsive(merged, viewport) : merged;

  return normalize(responsive);
}
