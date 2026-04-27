// modal/create.js

import { createDebug } from "../core/debug.js";
import { attach, detach } from "../core/dom/attach.js";
import { bind } from "../core/dom/bind.js";
import { build } from "../core/dom/build.js";
import { delegate, event } from "../core/dom/event.js";
import { createEmitter } from "../core/events/emitter.js";
import { merge } from "../core/settings/merge.js";
import { readDataOverrides } from "./data.js";
import { defaults as modalDefaults } from "./defaults.js";
import { loadPlugins } from "./plugins/load.js";
import { createPluginRuntime } from "./plugins/runtime.js";
import { startRuntime } from "./runtime.js";
import { settings as getSettings } from "./settings.js";

export async function create(options = {}) {
  const debug = createDebug();
  const namespace = "modal";

  const overrides = readDataOverrides(options, { namespace, debug });
  const merged = merge(options, overrides);

  const resolved = getSettings(merged);
  const schema = resolved.schema;

  let currentSettings = resolved.settings;

  const isBound = currentSettings.config && currentSettings.config.bind === true;
  const dom = isBound ? bind(schema, currentSettings.features) : build(schema, currentSettings.features);

  const refs = dom.refs;
  const root = refs.root;

  const state = {
    mounted: false,
    open: false,
    destroyed: false,
    target: null,
    transitioning: false,
  };

  const events = createEmitter();

  root.hidden = true;

  const abortController = new AbortController();
  const signal = abortController.signal;

  function on(target, type, handler, options = {}) {
    return event(target, type, handler, { ...options, signal });
  }

  function deleg(rootTarget, type, selector, handler, options = {}) {
    return delegate(rootTarget, type, selector, handler, { ...options, signal });
  }

  function assertNotDestroyed(methodName) {
    if (!state.destroyed) return;
    console.error(`modal.${methodName}: instance is destroyed`);
    throw new Error(`${methodName}: instance is destroyed`);
  }

  if (isBound) {
    state.mounted = true;
    state.target = root.parentElement || null;
  }

  async function mount(target) {
    assertNotDestroyed("mount()");

    if (isBound) {
      throw new Error("modal.mount(): cannot mount a bound instance (config.bind=true)");
    }

    if (!(target instanceof Element)) {
      throw new TypeError("modal.mount(target): target must be a DOM Element");
    }

    if (state.mounted) {
      await unmount();
    }

    attach(root, target);

    state.mounted = true;
    state.target = target;

    events.notify("mount", { target });

    if (debug.is(namespace)) console.log("modal: mount", { target });

    return api;
  }

  async function unmount() {
    if (state.destroyed) {
      if (debug.is(namespace)) console.warn("modal.unmount(): called after destroy(); ignoring (no-op)");
      return api;
    }

    if (isBound) {
      throw new Error("modal.unmount(): cannot unmount a bound instance (config.bind=true)");
    }

    if (!state.mounted) return api;

    if (state.open) {
      await close();
    }

    detach(root);

    state.mounted = false;
    state.target = null;

    events.notify("unmount");

    if (debug.is(namespace)) console.log("modal: unmount");

    return api;
  }

  function resolveMountTarget(target) {
    if (target instanceof Element) return target;

    const configuredTarget = currentSettings.config ? currentSettings.config.target : null;

    if (configuredTarget instanceof Element) return configuredTarget;

    if (typeof configuredTarget === "function") {
      const resolvedTarget = configuredTarget();
      if (resolvedTarget instanceof Element) return resolvedTarget;
    }

    return null;
  }

  async function open(target) {
    assertNotDestroyed("open()");

    if (state.open || state.transitioning) return api;

    const mountTarget = !isBound && !state.mounted ? resolveMountTarget(target) : state.target;

    const allowed = events.guard("guard:open", { target: mountTarget ?? null });
    if (!allowed) {
      events.notify("open:blocked", { target: mountTarget ?? null });
      if (debug.is(namespace)) console.log("modal: open blocked", { target: mountTarget ?? null });
      return api;
    }

    if (!isBound && !state.mounted) {
      if (!(mountTarget instanceof Element)) {
        console.error("modal.open(): missing mount target", { target });
        throw new TypeError("modal.open(target): target must be a DOM Element when modal is not mounted (or provide config.target)");
      }

      await mount(mountTarget);
    }

    state.transitioning = true;

    try {
      root.hidden = false;

      events.notify("before:open", { target: mountTarget ?? null });
      await events.pipeline("open:transition", { target: mountTarget ?? null });

      state.open = true;

      events.notify("open", { target: mountTarget ?? null });
      events.notify("after:open", { target: mountTarget ?? null });

      if (debug.is(namespace)) console.log("modal: open");

      return api;
    } finally {
      state.transitioning = false;
    }
  }

  async function close() {
    assertNotDestroyed("close()");

    if (!state.open || state.transitioning) return api;

    const allowed = events.guard("guard:close", { target: state.target ?? null });
    if (!allowed) {
      events.notify("close:blocked", { target: state.target ?? null });
      if (debug.is(namespace)) console.log("modal: close blocked", { target: state.target ?? null });
      return api;
    }

    state.transitioning = true;

    try {
      events.notify("before:close", { target: state.target ?? null });
      await events.pipeline("close:transition", { target: state.target ?? null });

      state.open = false;
      root.hidden = true;

      events.notify("close", { target: state.target ?? null });
      events.notify("after:close", { target: state.target ?? null });

      if (debug.is(namespace)) console.log("modal: close");

      return api;
    } finally {
      state.transitioning = false;
    }
  }

  function setContent(content) {
    assertNotDestroyed("setContent()");

    const host = refs.content;
    host.replaceChildren();

    if (content == null) {
      events.notify("content:change", { content: null });
      if (debug.is(namespace)) console.log("modal: content change", { content: null });
      return api;
    }

    if (typeof content === "string") {
      host.innerHTML = content;
      events.notify("content:change", { content });
      if (debug.is(namespace)) console.log("modal: content change", { type: "string" });
      return api;
    }

    if (content instanceof Node) {
      host.appendChild(content);
      events.notify("content:change", { content });
      if (debug.is(namespace)) console.log("modal: content change", { type: "node" });
      return api;
    }

    throw new TypeError("modal.setContent(content): content must be string | Node | null");
  }

  function destroy() {
    if (state.destroyed) {
      if (debug.is(namespace)) console.warn("modal.destroy(): called more than once; ignoring (no-op)");
      return;
    }

    const allowed = events.guard("guard:destroy");
    if (!allowed) {
      events.notify("destroy:blocked");
      if (debug.is(namespace)) console.log("modal: destroy blocked");
      return;
    }

    abortController.abort();

    try {
      disposeRuntime?.();
    } catch {}

    try {
      pluginRuntime.dispose();
    } catch (error) {
      if (debug.is(namespace)) console.warn("modal: plugins dispose failed", { error });
    }

    if (!isBound) {
      try {
        if (state.mounted) detach(root);
      } catch (error) {
        if (debug.is(namespace)) console.warn("modal: detach(root) failed", { error });
      }
    }

    state.transitioning = false;
    state.mounted = false;
    state.open = false;
    state.target = null;
    state.destroyed = true;
    root.hidden = true;

    events.notify("destroy");

    if (debug.is(namespace)) console.log("modal: destroy");
  }

  const api = {
    refs,

    get settings() {
      return currentSettings;
    },
    set settings(next) {
      currentSettings = next;
    },

    mount,
    unmount,
    open,
    close,
    destroy,
    setContent,

    subscribe: events.subscribe,
    once: events.once,
    unsubscribe: events.unsubscribe,

    notify: events.notify,
    guard: events.guard,
    pipeline: events.pipeline,

    get mounted() {
      return state.mounted;
    },
    get isOpen() {
      return state.open;
    },
    get destroyed() {
      return state.destroyed;
    },
  };

  const context = {
    api,
    refs,

    get settings() {
      return currentSettings;
    },
    set settings(next) {
      currentSettings = next;
    },

    on,
    delegate: deleg,
    signal,
    debug,
    namespace,
  };

  const pluginRuntime = createPluginRuntime({
    loadPlugins,
    context,
    debug,
    namespace,
  });

  const disposeRuntime = startRuntime({
    defaults: modalDefaults,
    options: merged,
    api,
    context,
    events,
    pluginRuntime,
    debug,
    namespace,
  });

  await pluginRuntime.apply(currentSettings);

  if (debug.is(namespace)) console.log("modal: create");

  return api;
}
