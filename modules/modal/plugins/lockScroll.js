// modal/plugins/lockScroll.js

import { addGap, getFeatureOptions, isFeatureEnabled, lock, removeGap, unlock } from "../../core/index.js";

export const lockScrollPlugin = {
  name: "lockScroll",

  enabled(settings) {
    return isFeatureEnabled(settings?.features, "lockScroll");
  },

  mount(context) {
    const { api, settings, debug, namespace } = context;

    if (!isFeatureEnabled(settings?.features, "lockScroll")) {
      if (debug.is(namespace)) console.log(`[${namespace}] lockScroll: disabled`);
      return;
    }

    const options = getFeatureOptions(settings?.features, "lockScroll");
    const reserveGap = options.reserveGap === true;

    this.locked = false;
    this.gap = false;
    this.cleanups = [];

    const onOpen = () => {
      if (this.locked) return;

      if (reserveGap && !this.gap) {
        addGap({ inline: true, block: false });
        this.gap = true;
      }

      lock();
      this.locked = true;

      if (debug.is(namespace)) console.log(`[${namespace}] lockScroll: locked`, { reserveGap });
    };

    const onClose = () => {
      if (!this.locked) return;

      unlock();
      this.locked = false;

      if (this.gap) {
        removeGap();
        this.gap = false;
      }

      if (debug.is(namespace)) console.log(`[${namespace}] lockScroll: unlocked`, { reserveGap });
    };

    this.cleanups.push(api.subscribe("before:open", onOpen));
    this.cleanups.push(api.subscribe("close", onClose));

    if (api.isOpen) {
      onOpen();
    }

    if (debug.is(namespace)) console.log(`[${namespace}] lockScroll: ready`, { reserveGap });
  },

  unmount() {
    const cleanups = Array.isArray(this.cleanups) ? this.cleanups : [];
    const locked = this.locked === true;
    const gap = this.gap === true;

    this.cleanups = [];
    this.locked = false;
    this.gap = false;

    for (const cleanup of cleanups) {
      try {
        cleanup?.();
      } catch {}
    }

    if (locked) {
      try {
        unlock();
      } catch {}
    }

    if (gap) {
      try {
        removeGap();
      } catch {}
    }
  },

  update(context) {
    this.unmount();
    this.mount(context);
  },
};
