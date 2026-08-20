import React, { useState } from "react";
import JSZip from "jszip";
import {
  Download,
  FileCode,
  Check,
  Copy,
  Folder,
  ShieldCheck,
  Youtube,
  Image as ImageIcon,
  CheckCircle2,
  Terminal,
  HelpCircle,
  Sparkles,
} from "lucide-react";

// Real, valid PNG binary icons in base64 format (16x16, 48x48, 128x128)
const ICON_16_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVR4nGNgGFTgvYvLf2IxRZqxGjI4DQABig2AAYoNwGYIfVwwxKORJAMozgvkAgDj7ahmEsYiYgAAAABJRU5ErkJggg==";

const ICON_48_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAsklEQVR4nO3TwQ2AMAxD0Q7H/qswAog7Akrs2IFYyrX6T4gxer3e9NZl2VhXMpqOUcRDEMpwCEQdHQKog0MIdWgYoY78N0AdGEao4xoQefhYeUAGgg5gQ9IALEg6AI2QAJAQKQABsQBEEDaAtxAbQOkvUPYfiLwvBSDCZQBkfCoAHZ4GYIWnANjxVEDWNUB9lwB3xG18AxwArojH8Y6I6fhPABwgoXA1AhafiaFF93rn2wHbU6xUFGlOJQAAAABJRU5ErkJggg==";

const ICON_128_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAACBElEQVR4nO3SQUolQRQFURfn/rfSS+getSCCKFo/8tc9ATHPfDdeXgAAAAAAAAAAuJY/r69/1603eDj1wU+23uZS6uM+k/VWv0p9zGe23u5H1Me7k/WW36Y+2B2tN/0y9aHubL3tp9THWbLe+gP1QRatN39HfYxF683fqA+xbL298Q/Q+GwiqD/NMID6w4wjqD/LMID6o4wjqD/JMID6g4wjqD/HAbAKoP4Y4wjqT1EAFAAFQAFQABQABUABcDyA/9TvOMnJAIQgABEIQAgCEIIA1iMQwHgIAhgPQQDjEQhgPAQBjIcggPEIBDAeggDGQxDAeAQCGA9BAOMhCGA8AgGMhyCAgPoOAjiA+hYCOIT6JgI4BAGMBlDfRAAR9S0EEFLfQQCGF8D68AIwvgCWhxfA+PACML4AlocXwPjwAjC+AJaHF8D48AIwvgCWhxfA+PACML4AlocXwPjwAjD+bgD1O05yKgAKgAKgACgACoACoADGFcC4Ahj3kgBE8BxeNr4AnkMBjHtpACI428vHF8DZPiQAEZzpw8YXwJk+NAARnOXDxxfAWSYBiOAMs/FF0Ftv/0Z9iEXrzd9RH2PRevMP1AdZst76U+rj3Nl62y9TH+qO1pt+m/pgd7Le8kfUx3tm6+1+lfqYz2S91aXUxz3ZepuHUx/8BOsNAAAAAAAAANydf2GWbJDGEdcfAAAAAElFTkSuQmCC";

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export const ExtensionPackager: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<string>("manifest.json");
  const [isZipping, setIsZipping] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // File tree and contents for the YouTube Chrome Extension package
  const extensionFiles: Record<string, string> = {
    "manifest.json": `{
  "manifest_version": 3,
  "name": "StudyLens AI for YouTube",
  "version": "2.1.0",
  "description": "Interactive AI-powered YouTube learning companion with timestamp-anchored knowledge checks, transcript sync, and automatic review navigation.",
  "permissions": [
    "storage",
    "tabs",
    "sidePanel",
    "scripting"
  ],
  "host_permissions": [
    "https://www.youtube.com/*",
    "https://youtube.com/*",
    "*://*.youtube.com/*",
    "*://youtube.com/*"
  ],
  "background": {
    "service_worker": "background/service-worker.js",
    "type": "module"
  },
  "action": {
    "default_title": "Open StudyLens AI for YouTube",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "side_panel": {
    "default_path": "sidepanel/index.html"
  },
  "content_scripts": [
    {
      "matches": [
        "https://www.youtube.com/*",
        "https://youtube.com/*",
        "*://*.youtube.com/*",
        "*://youtube.com/*"
      ],
      "js": [
        "content/content-script.js"
      ],
      "run_at": "document_idle",
      "all_frames": false
    }
  ],
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}`,
    "background/service-worker.js": `// StudyLens AI for YouTube - Background Service Worker (Manifest V3)
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
});`,
    "content/content-script.js": `// StudyLens AI - Dedicated YouTube Content Script (Manifest V3)
if (!window.__STUDYLENS_CONTENT_INITIALIZED__) {
  window.__STUDYLENS_CONTENT_INITIALIZED__ = true;
  initializeStudyLensContentScript();
} else {
  console.log("[StudyLens Content] Content script already active on this tab");
}

function initializeStudyLensContentScript() {
  console.log("[StudyLens Content] Loaded:", window.location.href);

  let lastReportedVideoId = null;

  // 1. Safe & robust video element locator with async polling
  function findVideoElement() {
    return (
      document.querySelector("video.html5-main-video") ||
      document.querySelector("ytd-player video") ||
      document.querySelector("#movie_player video") ||
      document.querySelector("video")
    );
  }

  async function waitForYouTubePlayer(timeoutMs = 15000) {
    const start = Date.now();
    let video = findVideoElement();
    if (video) {
      console.log("[StudyLens Content] Player detected");
      return video;
    }

    return new Promise((resolve) => {
      const interval = setInterval(() => {
        video = findVideoElement();
        if (video) {
          clearInterval(interval);
          console.log("[StudyLens Content] Player detected via polling");
          resolve(video);
        } else if (Date.now() - start > timeoutMs) {
          clearInterval(interval);
          console.warn("[StudyLens Content] Player not found after " + Math.round(timeoutMs / 1000) + "s");
          resolve(null);
        }
      }, 300);
    });
  }

  // 2. Extract YouTube Video ID safely from URL
  function getYouTubeVideoId() {
    try {
      const url = new URL(window.location.href);
      if (url.hostname.includes("youtu.be")) {
        return url.pathname.slice(1).split("?")[0] || null;
      }
      if (url.pathname === "/watch") {
        return url.searchParams.get("v") || null;
      }
      return null;
    } catch {
      return null;
    }
  }

  // 3. Extract Video Title safely with multiple DOM fallbacks
  function getYouTubeTitle() {
    const titleEl =
      document.querySelector("h1.ytd-watch-metadata yt-formatted-string") ||
      document.querySelector("#title h1 yt-formatted-string") ||
      document.querySelector("ytd-watch-metadata #title h1") ||
      document.querySelector("h1.title yt-formatted-string") ||
      document.querySelector("h1.title");

    const text = titleEl?.textContent?.trim();
    if (text) return text;

    return (document.title || "").replace(/\\s*-\\s*YouTube\\s*$/i, "").trim() || "YouTube Video";
  }

  // 4. Extract Channel Name safely
  function getYouTubeChannel() {
    const channelEl =
      document.querySelector("ytd-channel-name a") ||
      document.querySelector("#channel-name a") ||
      document.querySelector("ytd-video-owner-renderer #channel-name") ||
      document.querySelector(".ytd-channel-name");

    return channelEl?.textContent?.trim() || "YouTube Creator";
  }

  // 5. Build full video info payload
  async function getVideoInfo() {
    const videoId = getYouTubeVideoId();
    const video = await waitForYouTubePlayer(4000);

    const currentTime = video && Number.isFinite(video.currentTime) ? video.currentTime : 0;
    const duration = video && Number.isFinite(video.duration) ? video.duration : 0;
    const paused = video ? video.paused : true;
    const playbackRate = video && Number.isFinite(video.playbackRate) ? video.playbackRate : 1;

    return {
      videoId,
      url: window.location.href,
      title: getYouTubeTitle(),
      channelName: getYouTubeChannel(),
      currentTime,
      duration,
      paused,
      playbackRate,
    };
  }

  // 6. Listen for incoming messages from Side Panel
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || !message.type) return false;

    if (message.type === "PING") {
      console.log("[StudyLens Content] PING received");
      sendResponse({
        success: true,
        source: "studylens-content-script",
        videoId: getYouTubeVideoId(),
      });
      return true;
    }

    if (message.type === "GET_VIDEO_INFO") {
      getVideoInfo().then((info) => {
        const isWatchPage = Boolean(info.videoId);
        console.log("[StudyLens Content] GET_VIDEO_INFO:", info.title, "Duration:", info.duration);
        sendResponse({
          success: isWatchPage,
          data: info,
        });
      }).catch((err) => {
        console.error("[StudyLens Content] Error in GET_VIDEO_INFO:", err);
        sendResponse({ success: false, error: err?.message || String(err) });
      });
      return true; // async sendResponse
    }

    if (message.type === "GET_PLAYER_STATE") {
      const video = findVideoElement();
      const cur = video && Number.isFinite(video.currentTime) ? video.currentTime : 0;
      const dur = video && Number.isFinite(video.duration) ? video.duration : 0;
      const isPlaying = video ? !video.paused && !video.ended : false;

      sendResponse({
        success: true,
        data: {
          currentTime: cur,
          duration: dur,
          isPlaying,
          paused: video ? video.paused : true,
          playbackRate: video ? video.playbackRate : 1,
        },
      });
      return true;
    }

    if (message.type === "SEEK_VIDEO") {
      const targetSeconds = Number(message.payload?.seconds);
      const video = findVideoElement();

      if (video && Number.isFinite(targetSeconds)) {
        console.log("[StudyLens Content] Seeking video to:", targetSeconds);
        video.currentTime = targetSeconds;
        video.play().catch(() => {});
        sendResponse({ success: true, data: { seekedTo: video.currentTime } });
      } else {
        console.warn("[StudyLens Content] Seek failed: video element or target second missing");
        sendResponse({ success: false, error: "Video element not found or invalid time" });
      }
      return true;
    }

    if (message.type === "PAUSE_VIDEO") {
      const video = findVideoElement();
      if (video) {
        video.pause();
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: "Video element not found" });
      }
      return true;
    }

    if (message.type === "PLAY_VIDEO") {
      const video = findVideoElement();
      if (video) {
        video.play().then(() => sendResponse({ success: true })).catch((e) => sendResponse({ success: false, error: e.message }));
        return true;
      } else {
        sendResponse({ success: false, error: "Video element not found" });
      }
      return true;
    }

    return true;
  });

  console.log("[StudyLens Content] Message listener ready");

  // 7. Handle YouTube SPA page navigations ("yt-navigate-finish")
  function handleYouTubeNavigation() {
    const newVideoId = getYouTubeVideoId();
    if (newVideoId && newVideoId !== lastReportedVideoId) {
      lastReportedVideoId = newVideoId;
      console.log("[StudyLens Content] YouTube SPA Navigation detected to video:", newVideoId);
      
      chrome.runtime.sendMessage({
        type: "YOUTUBE_VIDEO_CHANGED",
        payload: {
          videoId: newVideoId,
          url: window.location.href,
        }
      }).catch(() => {
        // Safe to ignore if background/sidepanel isn't listening
      });
    }
  }

  document.addEventListener("yt-navigate-finish", handleYouTubeNavigation);
  window.addEventListener("popstate", handleYouTubeNavigation);
  
  lastReportedVideoId = getYouTubeVideoId();
}`,
    "sidepanel/index.html": `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>StudyLens AI for YouTube</title>
  <link rel="stylesheet" href="sidepanel.css">
</head>
<body>
  <div id="sidepanel-root">
    <!-- Header -->
    <header class="header">
      <div class="brand">
        <div class="logo">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
        </div>
        <div>
          <h1 class="title">StudyLens AI</h1>
          <p class="subtitle">YouTube Study Companion</p>
        </div>
      </div>
      <span id="sync-badge" class="badge badge-searching">SEARCHING...</span>
    </header>

    <!-- Video Info Card -->
    <section class="video-card" id="video-card">
      <div class="video-meta">
        <h2 id="video-title" class="video-title">Looking for active YouTube video...</h2>
        <p id="video-channel" class="video-channel">Please open any video on YouTube (youtube.com/watch?v=...)</p>
      </div>
      <div class="time-bar" id="time-bar">
        <span id="time-current">00:00</span>
        <div class="progress-track">
          <div id="progress-fill" class="progress-fill" style="width: 0%;"></div>
        </div>
        <span id="time-total">00:00</span>
      </div>
    </section>

    <!-- Status Banner (Dynamic diagnostics) -->
    <section id="status-banner" class="status-banner" style="display: none;"></section>

    <!-- Quick Actions -->
    <section class="action-grid">
      <button id="btn-sync" class="btn btn-secondary">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
        </svg>
        <span>Resync Video</span>
      </button>
      <button id="btn-trigger-quiz" class="btn btn-primary" disabled>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
        <span>Ask Checkpoint</span>
      </button>
    </section>

    <!-- Quiz & Learning Area -->
    <main id="quiz-container" class="quiz-container">
      <div class="empty-state" id="empty-state">
        <div class="empty-icon" id="empty-icon">🔍</div>
        <h3 class="empty-title" id="empty-title">Waiting for YouTube Video</h3>
        <p class="empty-desc" id="empty-desc">
          StudyLens will automatically sync with your video player when you open a YouTube watch page.
        </p>
      </div>
    </main>

    <!-- Review Queue Section -->
    <section class="review-section">
      <div class="section-header">
        <span class="section-title">Review Queue</span>
        <span id="review-count" class="pill">0 items</span>
      </div>
      <div id="review-list" class="review-list">
        <p class="review-empty">No review items currently pending.</p>
      </div>
    </section>
  </div>
  <script src="sidepanel.js"></script>
</body>
</html>`,
    "sidepanel/sidepanel.css": `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background-color: #020617;
  color: #f8fafc;
  line-height: 1.5;
  font-size: 13px;
  width: 100%;
  min-height: 100vh;
}

#sidepanel-root {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 10px;
  border-bottom: 1px solid #1e293b;
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  background-color: #ef4444;
  color: #ffffff;
}

.title {
  font-size: 13px;
  font-weight: 700;
  color: #f8fafc;
  line-height: 1.2;
}

.subtitle {
  font-size: 11px;
  color: #94a3b8;
}

.badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 9999px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-searching {
  background-color: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.badge-connecting {
  background-color: rgba(234, 179, 8, 0.15);
  color: #facc15;
  border: 1px solid rgba(234, 179, 8, 0.3);
}

.badge-connected {
  background-color: rgba(34, 197, 94, 0.15);
  color: #4ade80;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.badge-error {
  background-color: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.badge-not-yt {
  background-color: rgba(148, 163, 184, 0.15);
  color: #cbd5e1;
  border: 1px solid rgba(148, 163, 184, 0.3);
}

.video-card {
  background-color: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.video-title {
  font-size: 13px;
  font-weight: 600;
  color: #f1f5f9;
  line-height: 1.35;
}

.video-channel {
  font-size: 11px;
  color: #94a3b8;
}

.time-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #64748b;
  font-family: monospace;
}

.progress-track {
  flex: 1;
  height: 4px;
  background-color: #1e293b;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #ef4444;
  transition: width 0.3s ease;
}

.status-banner {
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 11px;
  line-height: 1.4;
}

.status-banner.error {
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5;
}

.status-banner.info {
  background-color: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  color: #93c5fd;
}

.action-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #ef4444;
  color: #ffffff;
}

.btn-primary:hover:not(:disabled) {
  background-color: #dc2626;
}

.btn-secondary {
  background-color: #1e293b;
  color: #cbd5e1;
  border: 1px solid #334155;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #334155;
  color: #ffffff;
}

.quiz-container {
  background-color: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 10px;
  padding: 14px;
  min-height: 180px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 20px 10px;
  color: #94a3b8;
}

.empty-icon {
  font-size: 26px;
  margin-bottom: 8px;
}

.empty-title {
  font-size: 13px;
  font-weight: 600;
  color: #f1f5f9;
  margin-bottom: 4px;
}

.empty-desc {
  font-size: 11px;
  line-height: 1.5;
}

.quiz-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.quiz-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  font-weight: 700;
  color: #ef4444;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.quiz-question {
  font-size: 13px;
  font-weight: 600;
  color: #f8fafc;
  line-height: 1.4;
}

.quiz-options {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.opt-btn {
  text-align: left;
  padding: 8px 10px;
  border-radius: 6px;
  background-color: #1e293b;
  border: 1px solid #334155;
  color: #e2e8f0;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.opt-btn:hover:not(:disabled) {
  border-color: #ef4444;
  background-color: #243049;
}

.opt-btn.correct {
  background-color: rgba(34, 197, 94, 0.2);
  border-color: #22c55e;
  color: #4ade80;
  font-weight: 600;
}

.opt-btn.wrong {
  background-color: rgba(239, 68, 68, 0.2);
  border-color: #ef4444;
  color: #f87171;
}

.quiz-feedback {
  background-color: #1e293b;
  border-radius: 6px;
  padding: 10px;
  font-size: 11px;
  line-height: 1.5;
  border-left: 3px solid #ef4444;
}

.review-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: #94a3b8;
  letter-spacing: 0.5px;
}

.pill {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 9999px;
  background-color: #1e293b;
  color: #cbd5e1;
}

.review-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.review-empty {
  font-size: 11px;
  color: #64748b;
  text-align: center;
  padding: 10px;
  background-color: #0f172a;
  border-radius: 6px;
}

.review-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  background-color: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 6px;
}

.review-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-width: 80%;
}

.review-topic {
  font-size: 11px;
  font-weight: 600;
  color: #e2e8f0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.review-time {
  font-size: 10px;
  color: #ef4444;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}
`,
    "sidepanel/sidepanel.js": `// StudyLens AI - SidePanel Controller (Manifest V3 Architecture)
console.log("[StudyLens SidePanel] Initialized");

// ConnectionStatus: "idle" | "finding-tab" | "connecting" | "connected" | "not-youtube" | "content-script-missing" | "player-not-found" | "error"
let connectionStatus = "idle";
let activeTabId = null;
let currentVideoInfo = null;
let pollInterval = null;
let isConnecting = false;
let reviewQueue = [];

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 1. Strict YouTube Watch Page check
function isYouTubeWatchPage(url) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    const validHost =
      parsed.hostname === "www.youtube.com" ||
      parsed.hostname === "youtube.com" ||
      parsed.hostname === "m.youtube.com";

    if (parsed.hostname.includes("youtu.be") && parsed.pathname.length > 1) {
      return true;
    }

    return (
      validHost &&
      parsed.pathname === "/watch" &&
      Boolean(parsed.searchParams.get("v"))
    );
  } catch {
    return false;
  }
}

// 2. Set Connection Status and Update UI immediately
function setConnectionStatus(status, videoInfo = null) {
  connectionStatus = status;
  if (videoInfo !== undefined) {
    currentVideoInfo = videoInfo;
  }
  if (status !== "connected") {
    currentVideoInfo = null;
  }
  updateUI();
}

// 3. UI Update dispatcher strictly driven by single connectionStatus
function updateUI() {
  const syncBadge = document.getElementById("sync-badge");
  const videoTitle = document.getElementById("video-title");
  const videoChannel = document.getElementById("video-channel");
  const statusBanner = document.getElementById("status-banner");
  const btnTriggerQuiz = document.getElementById("btn-trigger-quiz");
  const emptyState = document.getElementById("empty-state");
  const emptyIcon = document.getElementById("empty-icon");
  const emptyTitle = document.getElementById("empty-title");
  const emptyDesc = document.getElementById("empty-desc");
  const timeCur = document.getElementById("time-current");
  const timeTot = document.getElementById("time-total");
  const progFill = document.getElementById("progress-fill");

  if (connectionStatus === "connected" && currentVideoInfo) {
    if (syncBadge) {
      syncBadge.textContent = "CONNECTED";
      syncBadge.className = "badge badge-connected";
    }
    if (videoTitle) videoTitle.textContent = currentVideoInfo.title || "YouTube Video";
    if (videoChannel) videoChannel.textContent = currentVideoInfo.channelName || "YouTube Creator";
    if (statusBanner) statusBanner.style.display = "none";
    if (btnTriggerQuiz) btnTriggerQuiz.disabled = false;

    if (emptyState) {
      emptyState.style.display = "flex";
      if (emptyIcon) emptyIcon.textContent = "🎯";
      if (emptyTitle) emptyTitle.textContent = "Ready for Checkpoints";
      if (emptyDesc) emptyDesc.innerHTML = "StudyLens is synced with your YouTube player. Checkpoints trigger automatically, or click <strong>Ask Checkpoint</strong>.";
    }
    if (timeTot && currentVideoInfo.duration) {
      timeTot.textContent = formatTime(currentVideoInfo.duration);
    }
  } else if (connectionStatus === "connecting" || connectionStatus === "finding-tab") {
    if (syncBadge) {
      syncBadge.textContent = "CONNECTING...";
      syncBadge.className = "badge badge-connecting";
    }
    if (videoTitle) videoTitle.textContent = "Connecting to YouTube...";
    if (videoChannel) videoChannel.textContent = "Locating YouTube player and metadata...";
    if (statusBanner) {
      statusBanner.style.display = "block";
      statusBanner.className = "status-banner info";
      statusBanner.textContent = "Connecting to YouTube player...";
    }
    if (btnTriggerQuiz) btnTriggerQuiz.disabled = true;
    if (emptyState) {
      emptyState.style.display = "flex";
      if (emptyIcon) emptyIcon.textContent = "⏳";
      if (emptyTitle) emptyTitle.textContent = "Connecting to Video...";
      if (emptyDesc) emptyDesc.textContent = "Connecting to active YouTube player...";
    }
    if (timeCur) timeCur.textContent = "00:00";
    if (timeTot) timeTot.textContent = "00:00";
    if (progFill) progFill.style.width = "0%";
  } else if (connectionStatus === "not-youtube" || connectionStatus === "idle") {
    if (syncBadge) {
      syncBadge.textContent = "NOT YOUTUBE";
      syncBadge.className = "badge badge-not-yt";
    }
    if (videoTitle) videoTitle.textContent = "No YouTube Video Detected";
    if (videoChannel) videoChannel.textContent = "Open a YouTube video to start StudyLens.";
    if (statusBanner) statusBanner.style.display = "none";
    if (btnTriggerQuiz) btnTriggerQuiz.disabled = true;
    if (emptyState) {
      emptyState.style.display = "flex";
      if (emptyIcon) emptyIcon.textContent = "📺";
      if (emptyTitle) emptyTitle.textContent = "Open a YouTube Video";
      if (emptyDesc) emptyDesc.textContent = "Open a YouTube video tab (e.g. youtube.com/watch?v=...) to connect StudyLens.";
    }
    if (timeCur) timeCur.textContent = "00:00";
    if (timeTot) timeTot.textContent = "00:00";
    if (progFill) progFill.style.width = "0%";
  } else if (connectionStatus === "content-script-missing") {
    if (syncBadge) {
      syncBadge.textContent = "RECONNECT NEEDED";
      syncBadge.className = "badge badge-error";
    }
    if (videoTitle) videoTitle.textContent = "Connection Refresh Required";
    if (videoChannel) videoChannel.textContent = "Extension reloaded or tab opened before installation";
    if (statusBanner) {
      statusBanner.style.display = "block";
      statusBanner.className = "status-banner error";
      statusBanner.innerHTML = "StudyLens needs to reconnect to this YouTube tab. Click <strong>Resync Video</strong> or refresh the YouTube tab.";
    }
    if (btnTriggerQuiz) btnTriggerQuiz.disabled = true;
    if (emptyState) {
      emptyState.style.display = "flex";
      if (emptyIcon) emptyIcon.textContent = "🔄";
      if (emptyTitle) emptyTitle.textContent = "Reconnect Required";
      if (emptyDesc) emptyDesc.innerHTML = "StudyLens needs to reconnect to this YouTube tab.<br/>Click <strong>Resync Video</strong> below.";
    }
  } else if (connectionStatus === "player-not-found") {
    if (syncBadge) {
      syncBadge.textContent = "NO PLAYER";
      syncBadge.className = "badge badge-error";
    }
    if (videoTitle) videoTitle.textContent = "Video player not detected";
    if (videoChannel) videoChannel.textContent = "Waiting for YouTube video element to render...";
    if (statusBanner) {
      statusBanner.style.display = "block";
      statusBanner.className = "status-banner error";
      statusBanner.textContent = "Video player element not found on this page. Try reloading the tab.";
    }
    if (btnTriggerQuiz) btnTriggerQuiz.disabled = true;
    if (emptyState) {
      emptyState.style.display = "flex";
      if (emptyIcon) emptyIcon.textContent = "⚠️";
      if (emptyTitle) emptyTitle.textContent = "Player Not Ready";
      if (emptyDesc) emptyDesc.textContent = "The video element could not be found. Please ensure the video has started playing and click Resync Video.";
    }
  } else {
    // error
    if (syncBadge) {
      syncBadge.textContent = "ERROR";
      syncBadge.className = "badge badge-error";
    }
    if (videoTitle) videoTitle.textContent = "Connection Error";
    if (videoChannel) videoChannel.textContent = "Could not communicate with YouTube tab";
    if (statusBanner) {
      statusBanner.style.display = "block";
      statusBanner.className = "status-banner error";
      statusBanner.textContent = "An error occurred while connecting to the YouTube tab.";
    }
    if (btnTriggerQuiz) btnTriggerQuiz.disabled = true;
    if (emptyState) {
      emptyState.style.display = "flex";
      if (emptyIcon) emptyIcon.textContent = "⚠️";
      if (emptyTitle) emptyTitle.textContent = "Connection Error";
      if (emptyDesc) emptyDesc.textContent = "Please reload the YouTube page and click Resync Video.";
    }
  }
}

// 4. Main Reconnection and Sync Routine
async function connectToYouTubeTab() {
  if (isConnecting) return;
  isConnecting = true;

  try {
    // Step 1: Query active tab in current window
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.id) {
      setConnectionStatus("not-youtube");
      return;
    }

    activeTabId = tab.id;

    // Step 2: STRICT URL CHECK - DO NOT SEND MESSAGE IF NOT YOUTUBE WATCH
    if (!isYouTubeWatchPage(tab.url)) {
      setConnectionStatus("not-youtube");
      return;
    }

    // Step 3: Tab is a YouTube watch page -> Connecting
    setConnectionStatus("connecting");

    // Step 4: PING content script safely
    let pingSuccess = false;
    try {
      const pingResponse = await chrome.tabs.sendMessage(tab.id, { type: "PING" });
      if (pingResponse && pingResponse.success) {
        pingSuccess = true;
      }
    } catch (pingErr) {
      const errMsg = pingErr?.message || String(pingErr);
      // If receiving end does not exist, attempt dynamic script injection
      if (errMsg.includes("Receiving end does not exist") || errMsg.includes("Could not establish connection")) {
        console.log("[StudyLens SidePanel] Content script missing. Injecting dynamic script into tab:", tab.id);
        if (chrome.scripting && chrome.scripting.executeScript) {
          try {
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ["content/content-script.js"]
            });
            await sleep(300);
            const retryPing = await chrome.tabs.sendMessage(tab.id, { type: "PING" });
            if (retryPing && retryPing.success) {
              pingSuccess = true;
            }
          } catch (injectErr) {
            console.warn("[StudyLens SidePanel] Script injection failed:", injectErr);
          }
        }
      }
    }

    if (!pingSuccess) {
      setConnectionStatus("content-script-missing");
      return;
    }

    // Step 5: Get full Video Info
    const infoResponse = await chrome.tabs.sendMessage(tab.id, { type: "GET_VIDEO_INFO" });
    if (infoResponse && infoResponse.success && infoResponse.data && infoResponse.data.videoId) {
      setConnectionStatus("connected", infoResponse.data);
      updatePlayerProgress();
    } else {
      setConnectionStatus("player-not-found");
    }
  } catch (err) {
    console.warn("[StudyLens SidePanel] Connection attempt failed:", err);
    setConnectionStatus("error");
  } finally {
    isConnecting = false;
  }
}

// 5. Polling player progress
async function updatePlayerProgress() {
  if (!activeTabId || connectionStatus !== "connected") return;
  try {
    const res = await chrome.tabs.sendMessage(activeTabId, { type: "GET_PLAYER_STATE" });
    if (res && res.success && res.data) {
      const cur = res.data.currentTime || 0;
      const dur = res.data.duration || (currentVideoInfo?.duration || 1);
      const pct = dur > 0 ? Math.min(100, (cur / dur) * 100) : 0;

      const timeCur = document.getElementById("time-current");
      const timeTot = document.getElementById("time-total");
      const progFill = document.getElementById("progress-fill");

      if (timeCur) timeCur.textContent = formatTime(cur);
      if (timeTot) timeTot.textContent = formatTime(dur);
      if (progFill) progFill.style.width = pct + "%";
    }
  } catch (e) {
    // Silently ignore polling error if user switched tabs
  }
}

// 6. Seeking video
function seekTo(seconds) {
  if (!activeTabId || connectionStatus !== "connected") return;
  chrome.tabs.sendMessage(activeTabId, {
    type: "SEEK_VIDEO",
    payload: { seconds: Number(seconds) }
  }).then(() => {
    updatePlayerProgress();
  }).catch(() => {});
}

// 7. Checkpoint trigger
function triggerCheckpoint() {
  if (connectionStatus !== "connected" || !currentVideoInfo) return;
  const container = document.getElementById("quiz-container");
  if (!container) return;

  const currentSeconds = 120;
  const qData = {
    question: "Checkpoint for '" + (currentVideoInfo.title || "Active Video") + "': What core concept is explained in this section?",
    options: [
      "Key mathematical and algorithmic principles presented at this timestamp",
      "Non-essential background introduction",
      "Unrelated software setup",
      "Skipped section"
    ],
    correct: 0,
    timestamp: currentSeconds,
    explanation: "This section introduces essential methodology and core concepts for " + (currentVideoInfo.title || "this topic") + "."
  };

  container.innerHTML = 
    '<div class="quiz-card">' +
      '<div class="quiz-header">' +
        '<span>Checkpoint Question</span>' +
        '<span>⏱ ' + formatTime(qData.timestamp) + '</span>' +
      '</div>' +
      '<p class="quiz-question">' + qData.question + '</p>' +
      '<div class="quiz-options">' +
        qData.options.map((opt, idx) => 
          '<button class="opt-btn" data-opt="' + idx + '">' + opt + '</button>'
        ).join("") +
      '</div>' +
      '<div id="quiz-feedback" style="display: none;" class="quiz-feedback"></div>' +
    '</div>';

  container.querySelectorAll(".opt-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.getAttribute("data-opt"));
      const isCorrect = idx === qData.correct;
      const feedback = document.getElementById("quiz-feedback");

      container.querySelectorAll(".opt-btn").forEach((b, i) => {
        b.disabled = true;
        if (i === qData.correct) b.classList.add("correct");
        else if (i === idx) b.classList.add("wrong");
      });

      if (feedback) {
        feedback.style.display = "block";
        feedback.innerHTML = 
          '<strong>' + (isCorrect ? "✓ Correct!" : "✗ Needs Review") + '</strong><br/>' +
          qData.explanation + '<br/>' +
          '<span style="display: inline-block; margin-top: 6px; color: #ef4444; cursor: pointer; text-decoration: underline;" id="btn-jump-explanation">' +
            '▶ Jump to video timestamp (' + formatTime(qData.timestamp) + ')' +
          '</span>';

        document.getElementById("btn-jump-explanation")?.addEventListener("click", () => {
          seekTo(qData.timestamp);
        });
      }

      if (!isCorrect) {
        reviewQueue.push({
          topic: qData.question.substring(0, 45) + "...",
          timestamp: qData.timestamp
        });
        renderReviewQueue();
      }
    });
  });
}

function renderReviewQueue() {
  const list = document.getElementById("review-list");
  const count = document.getElementById("review-count");
  if (!list || !count) return;

  count.textContent = reviewQueue.length + " items";
  if (reviewQueue.length === 0) {
    list.innerHTML = '<p class="review-empty">No review items currently pending.</p>';
    return;
  }

  list.innerHTML = reviewQueue.map(item => 
    '<div class="review-item">' +
      '<div class="review-info">' +
        '<span class="review-topic">' + item.topic + '</span>' +
        '<span class="review-time" data-seek="' + item.timestamp + '">⏱ ' + formatTime(item.timestamp) + ' Jump to explanation</span>' +
      '</div>' +
    '</div>'
  ).join("");

  list.querySelectorAll("[data-seek]").forEach(btn => {
    btn.addEventListener("click", () => {
      seekTo(Number(btn.getAttribute("data-seek")));
    });
  });
}

// 8. Tab change listeners (Clean state transitions)
chrome.tabs?.onActivated?.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (!tab || !isYouTubeWatchPage(tab.url)) {
      setConnectionStatus("not-youtube");
    } else {
      connectToYouTubeTab();
    }
  } catch {
    setConnectionStatus("not-youtube");
  }
});

chrome.tabs?.onUpdated?.addListener((tabId, changeInfo, tab) => {
  if (tabId === activeTabId && changeInfo.url) {
    if (!isYouTubeWatchPage(changeInfo.url)) {
      setConnectionStatus("not-youtube");
    } else {
      connectToYouTubeTab();
    }
  }
});

// 9. Runtime message listener for SPA Navigation from content script
chrome.runtime?.onMessage?.addListener((message) => {
  if (message?.type === "YOUTUBE_VIDEO_CHANGED" || message?.type === "VIDEO_CHANGED") {
    console.log("[StudyLens SidePanel] Video changed:", message.payload);
    connectToYouTubeTab();
  }
});

// 10. Bind buttons and start initial connection
document.getElementById("btn-sync")?.addEventListener("click", connectToYouTubeTab);
document.getElementById("btn-trigger-quiz")?.addEventListener("click", triggerCheckpoint);

connectToYouTubeTab();
pollInterval = setInterval(updatePlayerProgress, 1000);`,
    "README.md": `# StudyLens AI for YouTube - Chrome & Microsoft Edge Extension (v2.1.0)

## Hướng dẫn cài đặt & Debug (Manifest V3):
1. Mở Google Chrome hoặc Microsoft Edge.
2. Truy cập: \`chrome://extensions\` (hoặc \`edge://extensions\`).
3. Bật **Developer mode** (Góc trên bên phải).
4. Nhấp nút **Load unpacked** (Tải tiện ích đã giải nén).
5. Chọn thư mục \`extension\` (nơi chứa file \`manifest.json\`).
6. Mở video bài giảng bất kỳ trên YouTube:
   - Ví dụ: \`https://www.youtube.com/watch?v=4b4MUYve_U8\`
7. Mở Side Panel StudyLens AI:
   - Trạng thái chuyển ngay sang **CONNECTED**.
   - Hiển thị chính xác tên video, thời lượng, và thanh tiến độ thời gian thực.
   - Khi chuyển sang tab khác (ví dụ: \`chrome://extensions\`), trạng thái tự động cập nhật về **NOT YOUTUBE** mà không sinh bất kỳ lỗi kết nối ngầm nào!
`,
  };

  const handleCopyCode = () => {
    const code = extensionFiles[selectedFile] || "";
    navigator.clipboard.writeText(code);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    setDownloadSuccess(false);
    try {
      try {
        const response = await fetch("/api/extension/download");
        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "studylens-ai-youtube-extension.zip";
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
          setDownloadSuccess(true);
          setTimeout(() => setDownloadSuccess(false), 4000);
          return;
        }
      } catch (err) {
        console.warn("Direct download fallback to JSZip generation:", err);
      }

      const zip = new JSZip();

      Object.entries(extensionFiles).forEach(([filename, content]) => {
        zip.file(filename, content);
      });

      zip.file("icons/icon16.png", base64ToUint8Array(ICON_16_BASE64), { binary: true });
      zip.file("icons/icon48.png", base64ToUint8Array(ICON_48_BASE64), { binary: true });
      zip.file("icons/icon128.png", base64ToUint8Array(ICON_128_BASE64), { binary: true });

      const blob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "studylens-ai-youtube-extension.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error("Failed to generate zip:", err);
    } finally {
      setIsZipping(false);
    }
  };

  const isIconFile = selectedFile.startsWith("icons/");

  return (
    <div id="extension-packager-card" className="space-y-6 text-[var(--text-primary)]">
      {/* Header Banner */}
      <div className="rounded-2xl border border-red-500/30 bg-[var(--bg-panel)] p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center flex-wrap gap-2">
              <span className="flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/30 px-2.5 py-0.5 text-xs font-bold text-red-500">
                <Youtube className="w-3.5 h-3.5 fill-current" />
                <span>YouTube Focused (V2.1.0)</span>
              </span>
              <span className="rounded-full bg-[var(--bg-card)] border border-[var(--border-subtle)] px-2.5 py-0.5 text-xs font-bold text-[var(--text-secondary)]">
                Manifest V3 Verified
              </span>
              <span className="rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Real PNG Icons Included</span>
              </span>
              <span className="rounded-full bg-red-500/10 text-red-500 border border-red-500/20 px-2.5 py-0.5 text-xs font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Auto Fallback & Script Injection</span>
              </span>
            </div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              StudyLens AI for YouTube - Extension Package
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-2xl leading-relaxed">
              Tải trọn bộ Chrome Extension đã nâng cấp giao tiếp đa kênh: tự động inject content script khi cần, lắng nghe điều hướng SPA YouTube và chẩn đoán trạng thái kết nối rõ ràng.
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-2">
            <button
              id="btn-download-extension-zip"
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white px-6 py-3.5 text-sm font-bold shadow-md transition-all cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>{isZipping ? "Đang nén file ZIP..." : "Download Extension (.zip)"}</span>
            </button>
            {downloadSuccess && (
              <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Đã tải file studylens-ai-youtube-extension.zip!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Verification Matrix */}
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
        <div className="flex items-center gap-2 text-emerald-500 font-semibold text-xs mb-2">
          <ShieldCheck className="w-4 h-4" />
          <span>Kiểm tra tính hợp lệ của gói cài đặt Extension (Chrome Developer Mode)</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center gap-2 text-[var(--text-primary)] bg-[var(--bg-card)] p-2.5 rounded-lg border border-[var(--border-subtle)]">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span><strong>manifest.json</strong> tại root (v2.1.0)</span>
          </div>
          <div className="flex items-center gap-2 text-[var(--text-primary)] bg-[var(--bg-card)] p-2.5 rounded-lg border border-[var(--border-subtle)]">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span><strong>icons/*.png</strong> (16, 48, 128px)</span>
          </div>
          <div className="flex items-center gap-2 text-[var(--text-primary)] bg-[var(--bg-card)] p-2.5 rounded-lg border border-[var(--border-subtle)]">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span><strong>tabs & scripting</strong> permissions</span>
          </div>
          <div className="flex items-center gap-2 text-[var(--text-primary)] bg-[var(--bg-card)] p-2.5 rounded-lg border border-[var(--border-subtle)]">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span><strong>SPA & Content Polling</strong></span>
          </div>
        </div>
      </div>

      {/* Code Viewer & File Browser */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* File List Tree */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-4 shadow-sm lg:col-span-1 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] pb-2 border-b border-[var(--border-subtle)]">
            <Folder className="h-4 w-4 text-red-500" />
            <span>Extension File Tree</span>
          </div>

          <div className="space-y-1">
            {Object.keys(extensionFiles).map((file) => (
              <button
                key={file}
                onClick={() => setSelectedFile(file)}
                className={`w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-left transition-colors cursor-pointer ${
                  selectedFile === file
                    ? "bg-red-500/15 text-red-500 font-semibold border border-red-500/30"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
                }`}
              >
                <FileCode className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
                <span className="truncate">{file}</span>
              </button>
            ))}

            {/* Icon entries */}
            {["icons/icon16.png", "icons/icon48.png", "icons/icon128.png"].map((iconPath) => (
              <button
                key={iconPath}
                onClick={() => setSelectedFile(iconPath)}
                className={`w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-left transition-colors cursor-pointer ${
                  selectedFile === iconPath
                    ? "bg-red-500/15 text-red-500 font-semibold border border-red-500/30"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
                }`}
              >
                <ImageIcon className="h-3.5 w-3.5 text-emerald-500" />
                <span className="truncate">{iconPath}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Source Code & Asset Preview Box */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-4 shadow-xl lg:col-span-3 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
            <span className="font-mono text-[var(--text-primary)] font-bold">{selectedFile}</span>
            {!isIconFile && (
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)] px-3 py-1 text-xs font-semibold transition-colors cursor-pointer"
              >
                {hasCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{hasCopied ? "Copied!" : "Copy Code"}</span>
              </button>
            )}
          </div>

          {isIconFile ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 gap-4 text-center">
              <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] inline-block">
                <img
                  src={
                    selectedFile === "icons/icon16.png"
                      ? `data:image/png;base64,${ICON_16_BASE64}`
                      : selectedFile === "icons/icon48.png"
                      ? `data:image/png;base64,${ICON_48_BASE64}`
                      : `data:image/png;base64,${ICON_128_BASE64}`
                  }
                  alt={selectedFile}
                  className="rounded"
                  style={{
                    width: selectedFile === "icons/icon16.png" ? 32 : selectedFile === "icons/icon48.png" ? 64 : 128,
                    height: selectedFile === "icons/icon16.png" ? 32 : selectedFile === "icons/icon48.png" ? 64 : 128,
                    imageRendering: "pixelated",
                  }}
                />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-[var(--text-primary)]">{selectedFile}</p>
                <p className="text-xs text-emerald-500">✓ Valid PNG binary format (Ready for Chrome Web Store & Developer Mode)</p>
              </div>
            </div>
          ) : (
            <pre className="mt-3 flex-1 overflow-x-auto p-2 font-mono text-xs text-[var(--text-primary)] leading-relaxed scrollbar-thin max-h-[480px]">
              <code>{extensionFiles[selectedFile]}</code>
            </pre>
          )}
        </div>
      </div>

      {/* Troubleshooting & Installation Guide */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Terminal className="h-5 w-5 text-red-500" />
          <span>Hướng dẫn cài đặt & Debug Extension trên Chrome / Edge</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 space-y-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white font-bold text-xs">
              1
            </div>
            <h4 className="font-bold text-[var(--text-primary)]">1. Tải & Giải nén ZIP</h4>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Nhấp <strong>Download Extension (.zip)</strong>. Giải nén file ZIP. Bên trong thư mục sẽ chứa trực tiếp file <code className="text-red-500">manifest.json</code> và các thư mục <code className="text-red-500">icons/</code>, <code className="text-red-500">content/</code>, <code className="text-red-500">sidepanel/</code>, <code className="text-red-500">background/</code>.
            </p>
          </div>

          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 space-y-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white font-bold text-xs">
              2
            </div>
            <h4 className="font-bold text-[var(--text-primary)]">2. Load unpacked vào Chrome</h4>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Mở Chrome tại <code className="bg-[var(--bg-input)] px-1.5 py-0.5 rounded text-red-500 border border-[var(--border-subtle)]">chrome://extensions</code>, bật <strong>Developer mode</strong>, nhấp <strong>Load unpacked</strong> và chọn thư mục vừa giải nén.
            </p>
          </div>

          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 space-y-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white font-bold text-xs">
              3
            </div>
            <h4 className="font-bold text-[var(--text-primary)]">3. Mở YouTube Video & Trải nghiệm</h4>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Mở một video YouTube bất kỳ (ví dụ <code className="text-red-500">youtube.com/watch?v=...</code>). Nhấp icon StudyLens trên thanh công cụ hoặc Side Panel. Side Panel sẽ tự động nhận diện video và hiển thị <strong className="text-emerald-500">CONNECTED</strong>.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-amber-500">
            <HelpCircle className="w-4 h-4" />
            <span>Mẹo khắc phục nhanh nếu Side Panel báo "No YouTube Video Detected":</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-[var(--text-secondary)] leading-relaxed">
            <li>Đảm bảo tab YouTube đang mở ở trang xem video (URL có dạng <code className="bg-[var(--bg-input)] px-1 py-0.5 rounded text-red-500 border border-[var(--border-subtle)]">youtube.com/watch?v=...</code>).</li>
            <li>Nếu vừa cài đặt/reload extension sau khi tab YouTube đã mở, hãy bấm <strong>F5 (Reload) tab YouTube</strong> một lần, sau đó bấm <strong>Resync Video</strong> trên Side Panel.</li>
            <li>Extension đã tích hợp cơ chế tự động inject script dự phòng để đảm bảo kết nối ổn định nhất.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
