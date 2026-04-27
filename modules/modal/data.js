// modal/data.js

import { readDataOptions } from "../core/settings/data.js";
import { defaults as modalDefaults } from "./defaults.js";

export function readDataOverrides(options = {}, { namespace = "modal", debug = null } = {}) {
  if (typeof document === "undefined") return {};
  if (options?.config?.bind !== true) return {};

  const selector = options?.schema?.root?.bind || modalDefaults?.schema?.root?.bind;

  if (!selector || typeof selector !== "string") {
    if (debug?.is?.(namespace)) console.warn(`[${namespace}] data-options: missing bind selector`);
    return {};
  }

  const nodes = document.querySelectorAll(selector);

  if (nodes.length !== 1) {
    if (debug?.is?.(namespace)) {
      console.warn(`[${namespace}] data-options: selector must resolve exactly one element`, {
        selector,
        count: nodes.length,
      });
    }
    return {};
  }

  try {
    return readDataOptions(nodes[0], namespace);
  } catch (error) {
    if (debug?.is?.(namespace)) console.warn(`[${namespace}] data-options: invalid JSON`, { error });
    return {};
  }
}
