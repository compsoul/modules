// core/settings/normalize.js

import { isPlainObject } from "../utils/isPlainObject.js";

export function normalize(settings) {
  if (!isPlainObject(settings)) {
    return settings;
  }

  const out = { ...settings };

  out.config = isPlainObject(out.config) ? { ...out.config } : {};
  out.schema = isPlainObject(out.schema) ? { ...out.schema } : {};
  out.state = isPlainObject(out.state) ? { ...out.state } : {};
  out.state.class = isPlainObject(out.state.class) ? { ...out.state.class } : {};

  out.features = isPlainObject(out.features) ? { ...out.features } : {};

  if (out.rwd != null && !isPlainObject(out.rwd)) {
    out.rwd = {};
  } else if (isPlainObject(out.rwd)) {
    out.rwd = { ...out.rwd };
  }

  return out;
}
