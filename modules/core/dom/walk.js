// core/dom/walk.js

export function walk(schema, features = {}, resolveElement, onChild) {
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
    throw new TypeError("dom.walk(schema): schema must be an object");
  }

  if (features === null || typeof features !== "object" || Array.isArray(features)) {
    throw new TypeError("dom.walk(schema, features): features must be an object");
  }

  if (typeof resolveElement !== "function") {
    throw new TypeError("dom.walk(schema, features, resolveElement): resolveElement must be a function");
  }

  if (onChild != null && typeof onChild !== "function") {
    throw new TypeError("dom.walk(schema, features, resolveElement, onChild): onChild must be a function");
  }

  const rootNode = schema.root;

  if (!rootNode || typeof rootNode !== "object") {
    throw new Error('dom.walk(schema): missing required role "root" in schema');
  }

  const refs = Object.create(null);
  const visiting = new Set();

  function isEnabled(node) {
    const gate = node && node.when;

    if (!gate) {
      return true;
    }

    const gateConfig = features[gate];

    if (!gateConfig || typeof gateConfig !== "object" || Array.isArray(gateConfig)) {
      throw new TypeError(`dom.walk(schema): feature "${gate}" must be an object with { enabled: boolean }`);
    }

    return gateConfig.enabled === true;
  }

  function step(role, parentElement) {
    if (!role || typeof role !== "string") {
      throw new Error("dom.walk(schema): role must be a string");
    }

    if (visiting.has(role)) {
      throw new Error(`dom.walk(schema): cycle detected at role "${role}"`);
    }

    const node = schema[role];

    if (!node || typeof node !== "object") {
      throw new Error(`dom.walk(schema): missing node for role "${role}"`);
    }

    if (node.remove === true) {
      return null;
    }

    if (!isEnabled(node)) {
      return null;
    }

    visiting.add(role);

    try {
      const element = resolveElement(role, node, parentElement);

      if (element != null && !(element instanceof Element)) {
        throw new TypeError(`dom.walk(schema): resolveElement must return Element | null for role "${role}"`);
      }

      if (element) {
        refs[role] = element;
      }

      const children = node.children;

      if (children == null) {
        return element;
      }

      if (!Array.isArray(children)) {
        throw new TypeError(`dom.walk(schema): role "${role}" children must be an array`);
      }

      for (const childRole of children) {
        const childElement = step(childRole, element);

        if (!onChild) {
          continue;
        }

        onChild(role, childRole, element, childElement);
      }

      return element;
    } finally {
      visiting.delete(role);
    }
  }

  const root = step("root", null);

  if (!root) {
    throw new Error('dom.walk(schema): role "root" is gated off (root must always be present)');
  }

  return { root, refs };
}
