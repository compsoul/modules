// core/dom/build.js

import { setAttrs } from "./attrs.js";
import { walk } from "./walk.js";

export function build(schema, features = {}) {
  if (typeof document === "undefined") {
    throw new Error("dom.build(schema, features): document is not available");
  }

  function resolveElement(role, node) {
    const element = document.createElement(node.tag || "div");

    if (node.class) {
      element.className = node.class;
    }

    if (node.attr) {
      setAttrs(element, node.attr);
    }

    if (node.text != null && node.html != null) {
      throw new Error(`dom.build(schema, features): role "${role}" cannot define both "text" and "html"`);
    }

    if (node.text != null) {
      element.textContent = String(node.text);
    }

    if (node.html != null) {
      element.innerHTML = String(node.html);
    }

    return element;
  }

  function onChild(parentRole, childRole, parentElement, childElement) {
    if (!parentElement) {
      return;
    }

    if (!childElement) {
      return;
    }

    parentElement.appendChild(childElement);
  }

  return walk(schema, features, resolveElement, onChild);
}
