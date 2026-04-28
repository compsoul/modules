// modal/plugins/focusTrap.js

import { getFeatureOptions, isFeatureEnabled } from "../../core/index.js";

function getFocusable(container) {
  if (!(container instanceof Element)) return [];

  const selector = [
    "a[href]",
    "area[href]",
    "button:not([disabled])",
    "input:not([disabled]):not([type='hidden'])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "iframe",
    "object",
    "embed",
    "[contenteditable='true']",
    "[tabindex]:not([tabindex='-1'])",
  ].join(",");

  return Array.from(container.querySelectorAll(selector)).filter((el) => {
    if (!(el instanceof HTMLElement)) return false;
    if (el.hidden) return false;
    return el.offsetParent !== null || el === document.activeElement;
  });
}

export const focusTrapPlugin = {
  name: "focusTrap",

  enabled(settings) {
    return isFeatureEnabled(settings?.features, "focusTrap");
  },

  mount(context) {
    const { api, refs, on, settings, debug, namespace } = context;

    if (!isFeatureEnabled(settings?.features, "focusTrap")) {
      if (debug.is(namespace)) console.log(`[${namespace}] focusTrap: disabled`);
      return;
    }

    const options = getFeatureOptions(settings?.features, "focusTrap");
    const autoFocus = options.autoFocus !== false;
    const restoreFocus = options.restoreFocus !== false;

    this.cleanups = [];
    this.bound = [];
    this.lastActive = null;

    const trapRoot = refs.panel || refs.root;
    if (!(trapRoot instanceof Element)) {
      if (debug.is(namespace)) console.warn(`[${namespace}] focusTrap: missing trap root`);
      return;
    }

    const ensureFocusableRoot = () => {
      if (!(trapRoot instanceof HTMLElement)) return;
      if (trapRoot.hasAttribute("tabindex")) return;
      trapRoot.setAttribute("tabindex", "-1");
    };

    const focusInitial = () => {
      const list = getFocusable(trapRoot);
      if (list.length > 0) {
        list[0].focus();
        return;
      }

      ensureFocusableRoot();
      if (trapRoot instanceof HTMLElement) {
        trapRoot.focus();
      }
    };

    const handleKeydown = (event) => {
      if (!api.isOpen) return;
      if (event.key !== "Tab") return;

      const list = getFocusable(trapRoot);

      if (list.length === 0) {
        event.preventDefault();
        ensureFocusableRoot();
        if (trapRoot instanceof HTMLElement) {
          trapRoot.focus();
        }
        return;
      }

      const first = list[0];
      const last = list[list.length - 1];
      const active = document.activeElement;

      if (event.shiftKey) {
        if (active === first || !trapRoot.contains(active)) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (active === last || !trapRoot.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    };

    const onOpen = () => {
      this.lastActive = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      if (autoFocus) focusInitial();
      if (debug.is(namespace)) console.log(`[${namespace}] focusTrap: active`);
    };

    const onClose = () => {
      if (!restoreFocus) return;
      if (!(this.lastActive instanceof HTMLElement)) return;

      try {
        this.lastActive.focus();
      } catch {}
    };

    this.cleanups.push(api.subscribe("open", onOpen));
    this.cleanups.push(api.subscribe("close", onClose));
    this.cleanups.push(api.subscribe("destroy", onClose));
    this.cleanups.push(on(document, "keydown", handleKeydown));

    this.bound.push({ autoFocus, restoreFocus });
    if (debug.is(namespace)) console.log(`[${namespace}] focusTrap: ready`, { autoFocus, restoreFocus });
  },

  unmount() {
    const cleanups = Array.isArray(this.cleanups) ? this.cleanups : [];
    this.cleanups = [];
    this.bound = [];
    this.lastActive = null;

    for (const cleanup of cleanups) {
      try {
        cleanup?.();
      } catch {}
    }
  },

  update(context) {
    this.unmount();
    this.mount(context);
  },
};
