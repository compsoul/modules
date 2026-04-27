// core/settings/merge.js

import { isPlainObject } from "../utils/isPlainObject.js";

function clone(value) {
  if (Array.isArray(value)) {
    return value.map(clone);
  }

  if (isPlainObject(value)) {
    const out = {};
    for (const [key, nested] of Object.entries(value)) {
      out[key] = clone(nested);
    }
    return out;
  }

  return value;
}

export function merge(base, patch) {
  if (!isPlainObject(base)) {
    throw new TypeError("settings.merge(base, patch): base must be a plain object");
  }

  if (patch == null) {
    return clone(base);
  }

  if (!isPlainObject(patch)) {
    throw new TypeError("settings.merge(base, patch): patch must be a plain object or null");
  }

  const out = clone(base);

  for (const [key, value] of Object.entries(patch)) {
    const prev = out[key];

    if (Array.isArray(value)) {
      out[key] = clone(value);
      continue;
    }

    if (isPlainObject(value)) {
      out[key] = merge(isPlainObject(prev) ? prev : {}, value);
      continue;
    }

    out[key] = value;
  }

  return out;
}