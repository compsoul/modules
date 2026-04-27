// core/debug.js

function parseDebugHash(hash) {
  if (!hash || typeof hash !== "string") {
    return { debug: false, modal: false };
  }

  const raw = hash.startsWith("#") ? hash.slice(1) : hash;

  if (!raw) {
    return { debug: false, modal: false };
  }

  return {
    debug: raw === "debug",
    modal: raw === "modal",
  };
}

export function createDebug() {
  const hash = typeof window !== "undefined" ? window.location.hash : "";
  const flags = parseDebugHash(hash);

  function is(namespace) {
    if (!namespace || typeof namespace !== "string") {
      return false;
    }

    if (flags.debug) {
      return true;
    }

    if (flags.modal) {
      return namespace === "modal";
    }

    return false;
  }

  return {
    is,
  };
}
