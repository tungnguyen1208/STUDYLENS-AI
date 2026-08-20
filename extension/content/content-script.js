// StudyLens AI - Dedicated YouTube Content Script (Manifest V3)
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

    return (document.title || "").replace(/\s*-\s*YouTube\s*$/i, "").trim() || "YouTube Video";
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
}
