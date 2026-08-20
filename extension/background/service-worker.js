// StudyLens AI for YouTube - Background Service Worker (Manifest V3)
console.log("[StudyLens BG] Service worker started");

if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((err) => console.warn("[StudyLens BG] setPanelBehavior error:", err));
}

// Keep service worker responsive
chrome.runtime?.onMessage?.addListener((message, sender, sendResponse) => {
  if (message?.type === "PING_BACKGROUND") {
    sendResponse({ status: "active", version: "2.1.0" });
    return true;
  }
  return true;
});
