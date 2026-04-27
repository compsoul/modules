// core/dom/attrs.js

export function setAttrs(element, attributes) {
  if (!(element instanceof Element)) {
    throw new TypeError("dom.setAttrs(element, attributes): element must be a DOM Element");
  }

  if (attributes == null) {
    return;
  }

  if (typeof attributes !== "object" || Array.isArray(attributes)) {
    throw new TypeError("dom.setAttrs(element, attributes): attributes must be an object");
  }

  for (const [name, value] of Object.entries(attributes)) {
    if (value === undefined) {
      continue;
    }

    if (value === true) {
      element.setAttribute(name, "");
      continue;
    }

    if (value === false || value === null) {
      element.removeAttribute(name);
      continue;
    }

    element.setAttribute(name, String(value));
  }
}
