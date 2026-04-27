// core/settings/features.js

import { isPlainObject } from "../utils/isPlainObject.js";

function asObject(value) {
  return isPlainObject(value) ? value : {};
}

export function getFeature(features, name) {
  if (!name || typeof name !== "string") {
    throw new TypeError("settings.getFeature(features, name): name must be a non-empty string");
  }

  const map = asObject(features);
  const config = map[name];
  return asObject(config);
}

export function isFeatureEnabled(features, name) {
  if (!name || typeof name !== "string") {
    throw new TypeError("settings.isFeatureEnabled(features, name): name must be a non-empty string");
  }

  const config = getFeature(features, name);
  return config.enabled === true;
}

export function getFeatureOptions(features, name) {
  if (!name || typeof name !== "string") {
    throw new TypeError("settings.getFeatureOptions(features, name): name must be a non-empty string");
  }

  const config = getFeature(features, name);
  return asObject(config.options);
}

export function getFeatureRules(features, name) {
  if (!name || typeof name !== "string") {
    throw new TypeError("settings.getFeatureRules(features, name): name must be a non-empty string");
  }

  const config = getFeature(features, name);
  return Array.isArray(config.rules) ? config.rules : [];
}
