/**
 * Side panel — companion UI for the extension.
 */

export function initSidePanel() {
  // eslint-disable-next-line no-console
  console.log("[extension] Side panel initialized");
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", initSidePanel);
}
