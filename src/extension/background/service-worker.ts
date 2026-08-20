/**
 * StudyLens AI for YouTube - Background Service Worker (Manifest V3)
 */

// Enable Side Panel to automatically open when user clicks the extension icon in YouTube
if (typeof chrome !== "undefined" && chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((err: any) => {
    console.warn("[StudyLens Background] sidePanel behavior warning:", err);
  });
}

// Listen for tab updates to enable side panel specifically on YouTube
if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.onUpdated) {
  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (!tab.url) return;

    const isYouTube = tab.url.includes("youtube.com/watch") || tab.url.includes("youtu.be/");

    if (chrome.sidePanel && chrome.sidePanel.setOptions) {
      if (isYouTube) {
        await chrome.sidePanel.setOptions({
          tabId,
          path: "index.html",
          enabled: true,
        });
      } else {
        // Disable on non-YouTube pages
        await chrome.sidePanel.setOptions({
          tabId,
          enabled: false,
        });
      }
    }
  });
}

// Background runtime message listener
if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "PING_BACKGROUND") {
      sendResponse({ status: "active", version: "2.0.0" });
    }
    return true;
  });
}
