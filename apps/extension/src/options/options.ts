/**
 * Options page — extension settings.
 */

export function initOptions() {
  // eslint-disable-next-line no-console
  console.log("[extension] Options initialized");
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", initOptions);
}
