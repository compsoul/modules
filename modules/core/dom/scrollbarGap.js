// core/dom/scrollbarGap.js

let counter = 0;
let snapshot = null;

function hasDom() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function parsePx(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getBody() {
  if (!hasDom() || !(document.body instanceof HTMLElement)) {
    return null;
  }

  return document.body;
}

export function getGapInline() {
  if (!hasDom()) return 0;

  const viewportWidth = window.innerWidth;
  const documentWidth = document.documentElement?.clientWidth ?? viewportWidth;
  const scrollbarGap = viewportWidth - documentWidth;

  return scrollbarGap > 0 ? scrollbarGap : 0;
}

export function getGapBlock() {
  if (!hasDom()) return 0;

  const viewportHeight = window.innerHeight;
  const documentHeight = document.documentElement?.clientHeight ?? viewportHeight;
  const scrollbarGap = viewportHeight - documentHeight;

  return scrollbarGap > 0 ? scrollbarGap : 0;
}

export function snapshotBodyPadding() {
  const body = getBody();

  if (!body) {
    return { inlineEnd: "", blockEnd: "" };
  }

  return {
    inlineEnd: body.style.paddingInlineEnd || "",
    blockEnd: body.style.paddingBlockEnd || "",
  };
}

export function applyBodyGap(options = {}) {
  const body = getBody();
  if (!body) return;

  const inline = options?.inline !== false;
  const block = options?.block === true;

  if (inline) {
    const inlineGap = getGapInline();

    if (inlineGap > 0) {
      const baseInlinePadding = parsePx(window.getComputedStyle(body).paddingInlineEnd);
      body.style.paddingInlineEnd = `${baseInlinePadding + inlineGap}px`;
    }
  }

  if (block) {
    const blockGap = getGapBlock();

    if (blockGap > 0) {
      const baseBlockPadding = parsePx(window.getComputedStyle(body).paddingBlockEnd);
      body.style.paddingBlockEnd = `${baseBlockPadding + blockGap}px`;
    }
  }
}

export function restoreBodyGap(nextSnapshot) {
  const body = getBody();
  if (!body) return;

  const safeSnapshot = nextSnapshot && typeof nextSnapshot === "object" && !Array.isArray(nextSnapshot) ? nextSnapshot : { inlineEnd: "", blockEnd: "" };

  body.style.paddingInlineEnd = safeSnapshot.inlineEnd ?? "";
  body.style.paddingBlockEnd = safeSnapshot.blockEnd ?? "";
}

export function addGap(options = {}) {
  if (!getBody()) return;

  if (counter === 0) {
    snapshot = snapshotBodyPadding();
    applyBodyGap(options);
  }

  counter++;
}

export function removeGap() {
  if (!getBody()) return;
  if (counter === 0) return;

  counter--;

  if (counter !== 0) {
    return;
  }

  restoreBodyGap(snapshot);
  snapshot = null;
}

export function getGapCount() {
  return counter;
}