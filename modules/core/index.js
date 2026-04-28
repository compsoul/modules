// modules/core/index.js

export { attach, detach } from "./dom/attach.js";
export { setAttrs } from "./dom/attrs.js";
export { bind } from "./dom/bind.js";
export { build } from "./dom/build.js";
export { delegate, event } from "./dom/event.js";
export { lock, unlock } from "./dom/scrollLock.js";
export { addGap, removeGap } from "./dom/scrollbarGap.js";
export { walk } from "./dom/walk.js";

export { createEmitter } from "./events/emitter.js";
export { on, off, emit } from "./events/global.js";

export { responsive } from "./runtime/responsive.js";
export { createSync } from "./runtime/sync.js";
export { viewport } from "./runtime/viewport.js";

export { getFeature, getFeatureOptions, getFeatureRules, isFeatureEnabled } from "./settings/features.js";
export { merge } from "./settings/merge.js";
export { normalize } from "./settings/normalize.js";
export { readDataOptions } from "./settings/data.js";
export { resolveSettings } from "./settings/resolve.js";
export { applyResponsive } from "./settings/responsive.js";

export { isPlainObject } from "./utils/isPlainObject.js";
export { createDebug } from "./debug.js";
