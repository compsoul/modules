// core/dom/scrollLock.js

let counter = 0;
let snapshot = null;

export function lock() {
  if (typeof document === "undefined" || !(document.body instanceof HTMLElement)) {
    throw new Error("dom.lock(): document.body is not available");
  }

  if (counter === 0) {
    snapshot = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }

  counter++;
}

export function unlock() {
  if (typeof document === "undefined" || !(document.body instanceof HTMLElement)) {
    throw new Error("dom.unlock(): document.body is not available");
  }

  if (counter === 0) {
    return;
  }

  counter--;

  if (counter !== 0) {
    return;
  }

  document.body.style.overflow = snapshot;
  snapshot = null;
}

export function getLockCount() {
  return counter;
}
