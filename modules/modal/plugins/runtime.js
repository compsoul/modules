// modal/plugins/runtime.js

export function createPluginRuntime({ loadPlugins, context, debug, namespace }) {
  if (typeof loadPlugins !== "function") {
    throw new TypeError("modal.plugins.createPluginRuntime(...): loadPlugins must be a function");
  }

  if (!context || typeof context !== "object") {
    throw new TypeError("modal.plugins.createPluginRuntime(...): context must be an object");
  }

  if (!debug || typeof debug !== "object") {
    throw new TypeError("modal.plugins.createPluginRuntime(...): debug must be an object");
  }

  if (!namespace || typeof namespace !== "string") {
    throw new TypeError("modal.plugins.createPluginRuntime(...): namespace must be a non-empty string");
  }

  const active = new Map();

  function isEnabled(definition, settings) {
    if (typeof definition.enabled !== "function") {
      return true;
    }

    try {
      return definition.enabled(settings) !== false;
    } catch (error) {
      if (debug.is(namespace)) console.warn(`[${namespace}] plugin enabled() failed`, { name: definition.name, error });
      return false;
    }
  }

  async function mount(definition) {
    const name = definition.name;
    const instance = Object.create(definition);
    let cleanup = null;

    if (typeof instance.mount === "function") {
      try {
        const maybeCleanup = await instance.mount(context);
        cleanup = typeof maybeCleanup === "function" ? maybeCleanup : null;
      } catch (error) {
        if (debug.is(namespace)) console.warn(`[${namespace}] plugin mount failed`, { name, error });
      }
    }

    active.set(name, { definition, instance, cleanup });
  }

  async function update(name, entry) {
    if (typeof entry.instance.update === "function") {
      try {
        await entry.instance.update(context);
        return;
      } catch (error) {
        if (debug.is(namespace)) console.warn(`[${namespace}] plugin update failed`, { name, error });
      }
    }

    teardown(name, entry);
    await mount(entry.definition);
  }

  function teardown(name, entry) {
    try {
      entry.cleanup?.();
    } catch (error) {
      if (debug.is(namespace)) console.warn(`[${namespace}] plugin cleanup failed`, { name, error });
    }

    try {
      entry.instance.unmount?.();
    } catch (error) {
      if (debug.is(namespace)) console.warn(`[${namespace}] plugin unmount failed`, { name, error });
    }

    active.delete(name);
  }

  async function apply(settings) {
    const loaded = await loadPlugins(settings?.features);
    const next = new Map();

    for (const definition of loaded) {
      if (!definition || typeof definition !== "object" || Array.isArray(definition)) {
        if (debug.is(namespace)) console.warn(`[${namespace}] plugin contract: definition must be an object`, { definition });
        continue;
      }

      const name = definition.name;

      if (!name || typeof name !== "string") {
        if (debug.is(namespace)) console.warn(`[${namespace}] plugin contract: missing plugin.name`, { definition });
        continue;
      }

      if (definition.enabled != null && typeof definition.enabled !== "function") {
        if (debug.is(namespace)) console.warn(`[${namespace}] plugin contract: plugin.enabled must be a function`, { name });
        continue;
      }

      if (definition.mount != null && typeof definition.mount !== "function") {
        if (debug.is(namespace)) console.warn(`[${namespace}] plugin contract: plugin.mount must be a function`, { name });
        continue;
      }

      if (definition.update != null && typeof definition.update !== "function") {
        if (debug.is(namespace)) console.warn(`[${namespace}] plugin contract: plugin.update must be a function`, { name });
        continue;
      }

      if (definition.unmount != null && typeof definition.unmount !== "function") {
        if (debug.is(namespace)) console.warn(`[${namespace}] plugin contract: plugin.unmount must be a function`, { name });
        continue;
      }

      if (next.has(name)) {
        if (debug.is(namespace)) console.warn(`[${namespace}] plugin contract: duplicated plugin name; keeping first`, { name });
        continue;
      }

      next.set(name, definition);
    }

    for (const [name, entry] of active.entries()) {
      const definition = next.get(name);
      if (!definition || !isEnabled(definition, settings)) {
        teardown(name, entry);
      }
    }

    for (const [name, definition] of next.entries()) {
      if (!isEnabled(definition, settings)) {
        continue;
      }

      const existing = active.get(name);

      if (!existing) {
        await mount(definition);
        continue;
      }

      existing.definition = definition;
      await update(name, existing);
    }

    if (debug.is(namespace)) console.log(`[${namespace}] plugins:active`, { names: Array.from(active.keys()) });
  }

  function dispose() {
    for (const [name, entry] of Array.from(active.entries())) {
      teardown(name, entry);
    }
  }

  return {
    apply,
    dispose,
  };
}
