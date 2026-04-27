// modal/settings.js

import { merge } from "../core/settings/merge.js";
import { resolveSettings } from "../core/settings/resolve.js";
import { defaults } from "./defaults.js";

export function settings(options = {}, viewport = null, overrides = null) {
  let matcher = null;

  if (viewport && typeof viewport.match === "function") {
    matcher = viewport;
  } else if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
    matcher = {
      match(query) {
        return window.matchMedia(query).matches;
      }
    };
  }

  const merged = merge(options, overrides);
  const resolved = resolveSettings(defaults, merged, matcher);
  const schema = resolved.schema;

  if (!schema.root || schema.root.remove === true) {
    throw new Error('modal.settings(options, viewport, overrides): missing required role "root" in schema');
  }

  if (!schema.panel || schema.panel.remove === true) {
    throw new Error('modal.settings(options, viewport, overrides): missing required role "panel" in schema');
  }

  if (!schema.content || schema.content.remove === true) {
    throw new Error('modal.settings(options, viewport, overrides): missing required role "content" in schema');
  }

  return {
    settings: resolved,
    schema
  };
}
