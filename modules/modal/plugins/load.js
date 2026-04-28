// modal/plugins/load.js

import { isFeatureEnabled } from "../../core/index.js";

export async function loadPlugins(features = {}) {
  const plugins = [];

  if (isFeatureEnabled(features, "actionAfter")) {
    const module = await import("./actionAfter.js");
    plugins.push(module.actionAfterPlugin);
  }

  if (isFeatureEnabled(features, "actionOn")) {
    const module = await import("./actionOn.js");
    plugins.push(module.actionOnPlugin);
  }

  if (isFeatureEnabled(features, "actionOnEvent")) {
    const module = await import("./actionOnEvent.js");
    plugins.push(module.actionOnEventPlugin);
  }

  if (isFeatureEnabled(features, "actionOnKey")) {
    const module = await import("./actionOnKey.js");
    plugins.push(module.actionOnKeyPlugin);
  }

  if (isFeatureEnabled(features, "actionOnLeave")) {
    const module = await import("./actionOnLeave.js");
    plugins.push(module.actionOnLeavePlugin);
  }

  if (isFeatureEnabled(features, "actionOnScroll")) {
    const module = await import("./actionOnScroll.js");
    plugins.push(module.actionOnScrollPlugin);
  }

  if (isFeatureEnabled(features, "animateCss")) {
    const module = await import("./animateCss.js");
    plugins.push(module.animateCssPlugin);
  }

  if (isFeatureEnabled(features, "animateWaapi")) {
    const module = await import("./animateWaapi.js");
    plugins.push(module.animateWaapiPlugin);
  }

  if (isFeatureEnabled(features, "focusTrap")) {
    const module = await import("./focusTrap.js");
    plugins.push(module.focusTrapPlugin);
  }

  if (isFeatureEnabled(features, "lockScroll")) {
    const module = await import("./lockScroll.js");
    plugins.push(module.lockScrollPlugin);
  }

  if (isFeatureEnabled(features, "storageGate")) {
    const module = await import("./storageGate.js");
    plugins.push(module.storageGatePlugin);
  }

  if (isFeatureEnabled(features, "storageOn")) {
    const module = await import("./storageOn.js");
    plugins.push(module.storageOnPlugin);
  }

  if (isFeatureEnabled(features, "storageOnEvent")) {
    const module = await import("./storageOnEvent.js");
    plugins.push(module.storageOnEventPlugin);
  }

  if (isFeatureEnabled(features, "titleBlinkOnAway")) {
    const module = await import("./titleBlinkOnAway.js");
    plugins.push(module.titleBlinkOnAwayPlugin);
  }

  return plugins;
}
