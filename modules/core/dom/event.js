// core/dom/event.js

export function event(target, type, handler, options = {}) {
  if (!(target instanceof EventTarget)) {
    throw new TypeError("dom.event(target, type, handler): target must be an EventTarget");
  }

  if (!type || typeof type !== "string") {
    throw new TypeError("dom.event(target, type, handler): type must be a non-empty string");
  }

  if (typeof handler !== "function") {
    throw new TypeError("dom.event(target, type, handler): handler must be a function");
  }

  if (options == null || typeof options !== "object") {
    throw new TypeError("dom.event(target, type, handler, options): options must be an object");
  }

  target.addEventListener(type, handler, options);

  let removed = false;

  return function off() {
    if (removed) return;
    removed = true;

    try {
      target.removeEventListener(type, handler, options);
    } catch {}
  };
}

export function delegate(root, type, selector, handler, options = {}) {
  if (!(root instanceof EventTarget)) {
    throw new TypeError("dom.delegate(root, type, selector, handler): root must be an EventTarget");
  }

  if (!type || typeof type !== "string") {
    throw new TypeError("dom.delegate(root, type, selector, handler): type must be a non-empty string");
  }

  if (selector != null && (!selector || typeof selector !== "string")) {
    throw new TypeError("dom.delegate(root, type, selector, handler): selector must be a non-empty string or null");
  }

  if (typeof handler !== "function") {
    throw new TypeError("dom.delegate(root, type, selector, handler): handler must be a function");
  }

  if (options == null || typeof options !== "object") {
    throw new TypeError("dom.delegate(root, type, selector, handler, options): options must be an object");
  }

  function handle(evt) {
    const target = evt?.target;
    if (!(target instanceof Element)) return;

    if (selector == null) {
      handler(evt, root);
      return;
    }

    const matched = target.closest(selector);
    if (!matched) return;

    handler(evt, matched);
  }

  return event(root, type, handle, options);
}
