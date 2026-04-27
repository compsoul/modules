// core/dom/attach.js

export function attach(element, target) {
  if (!(element instanceof Element)) {
    throw new TypeError("dom.attach(element, target): element must be a DOM Element");
  }

  if (!(target instanceof Element)) {
    throw new TypeError("dom.attach(element, target): target must be a DOM Element");
  }

  target.appendChild(element);
  return element;
}

export function detach(element) {
  if (!(element instanceof Element)) {
    throw new TypeError("dom.detach(element): element must be a DOM Element");
  }

  element.remove();
  return element;
}
