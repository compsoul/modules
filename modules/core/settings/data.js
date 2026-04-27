// core/settings/data.js

import { isPlainObject } from "../utils/isPlainObject.js";

export function readDataOptions(element, namespace = null) {
  if (!(element instanceof Element)) {
    throw new TypeError("settings.readDataOptions(element, namespace): element must be a DOM Element");
  }

  const raw = element.getAttribute("data-options");
  if (!raw) {
    return {};
  }

  let parsed = null;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('settings.readDataOptions(...): invalid JSON in "data-options"');
  }

  if (!isPlainObject(parsed)) {
    return {};
  }

  if (namespace == null) {
    return parsed;
  }

  if (typeof namespace !== "string" || namespace.trim() === "") {
    throw new TypeError("settings.readDataOptions(element, namespace): namespace must be a non-empty string or null");
  }

  const scoped = parsed[namespace];
  return isPlainObject(scoped) ? scoped : {};
}
