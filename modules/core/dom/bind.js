// core/dom/bind.js

import { walk } from "./walk.js";

export function bind(schema, features = {}) {
  if (typeof document === "undefined") {
    throw new Error("dom.bind(schema): document is not available");
  }

  function getSelector(role, node) {
    const selector = node && node.bind;

    if (!selector || typeof selector !== "string") {
      throw new Error(`dom.bind(schema): role "${role}" is missing "bind" selector`);
    }

    return selector;
  }

  function resolveRootElement() {
    const rootNode = schema.root;

    if (!rootNode || typeof rootNode !== "object") {
      throw new Error('dom.bind(schema): missing required role "root" in schema');
    }

    const rootSelector = getSelector("root", rootNode);
    const rootElements = document.querySelectorAll(rootSelector);

    if (rootElements.length === 0) {
      throw new Error(`dom.bind(schema): cannot resolve root (selector "${rootSelector}")`);
    }

    if (rootElements.length > 1) {
      throw new Error(`dom.bind(schema): root selector "${rootSelector}" resolves ${rootElements.length} elements`);
    }

    const rootElement = rootElements[0];

    if (!(rootElement instanceof Element)) {
      throw new Error(`dom.bind(schema): resolved root is not a DOM Element (selector "${rootSelector}")`);
    }

    return rootElement;
  }

  const resolvedRootElement = resolveRootElement();

  function resolveElement(role, node, parentElement) {
    if (role === "root") {
      return resolvedRootElement;
    }

    if (!(parentElement instanceof Element)) {
      throw new Error(`dom.bind(schema): cannot resolve role "${role}" without parent element`);
    }

    const selector = getSelector(role, node);
    const element = parentElement.querySelector(selector);

    if (!element) {
      throw new Error(`dom.bind(schema): cannot resolve role "${role}" (selector "${selector}")`);
    }

    if (!(element instanceof Element)) {
      throw new Error(`dom.bind(schema): resolved role "${role}" is not a DOM Element`);
    }

    return element;
  }

  return walk(schema, features, resolveElement);
}
