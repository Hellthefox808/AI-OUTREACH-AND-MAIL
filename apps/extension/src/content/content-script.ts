/**
 * Content script — captures user-initiated data from supported pages.
 *
 * Only captures information the user deliberately selects or requests.
 * Does not perform unrestricted background scraping.
 */

export function captureSelection() {
  const selection = window.getSelection()?.toString().trim();
  if (!selection) {
    return null;
  }
  return {
    type: "SELECTION",
    text: selection,
    url: window.location.href,
    timestamp: Date.now(),
  };
}

export function capturePageMetadata() {
  return {
    type: "PAGE_METADATA",
    url: window.location.href,
    title: document.title,
    domain: window.location.hostname,
    timestamp: Date.now(),
  };
}
