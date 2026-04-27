// core/utils/isPlainObject.js

export function isPlainObject(value) {
  if (value == null || typeof value !== "object") {
    return false;
  }

  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}
