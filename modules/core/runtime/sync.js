// core/runtime/sync.js

export function createSync({ initial = null, equals = Object.is, onChange } = {}) {
  if (typeof equals !== "function") {
    throw new TypeError("runtime.createSync(...): equals must be a function");
  }

  if (typeof onChange !== "function") {
    throw new TypeError("runtime.createSync(...): onChange must be a function");
  }

  let current = initial;
  let active = true;

  function commit(next, meta = null) {
    if (!active) return false;
    if (equals(current, next)) return false;

    const prev = current;
    current = next;

    onChange({ prev, next, meta });
    return true;
  }

  function getCurrent() {
    return current;
  }

  function dispose() {
    active = false;
  }

  return { commit, getCurrent, dispose };
}
