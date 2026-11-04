/**
 * Popup — extension entry point for quick actions.
 */

export function initPopup() {
  // eslint-disable-next-line no-console
  console.log("[extension] Popup initialized");
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", initPopup);
}
