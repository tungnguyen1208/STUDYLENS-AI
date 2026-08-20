// StudyLens AI - SidePanel Controller (Manifest V3 Architecture)
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

  container.innerHTML = `
    <div class="quiz-card">
      <div class="quiz-header">
        <span>Checkpoint Question</span>
        <span>⏱ ${formatTime(qData.timestamp)}</span>
      </div>
      <p class="quiz-question">${qData.question}</p>
      <div class="quiz-options">
        ${qData.options.map((opt, idx) => `
          <button class="opt-btn" data-opt="${idx}">${opt}</button>
        `).join("")}
      </div>
      <div id="quiz-feedback" style="display: none;" class="quiz-feedback"></div>
    </div>
  `;

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
        feedback.innerHTML = `
          <strong>${isCorrect ? "✓ Correct!" : "✗ Needs Review"}</strong><br/>
          ${qData.explanation}<br/>
          <span style="display: inline-block; margin-top: 6px; color: #ef4444; cursor: pointer; text-decoration: underline;" id="btn-jump-explanation">
            ▶ Jump to video timestamp (${formatTime(qData.timestamp)})
          </span>
        `;

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

  list.innerHTML = reviewQueue.map(item => `
    <div class="review-item">
      <div class="review-info">
        <span class="review-topic">${item.topic}</span>
        <span class="review-time" data-seek="${item.timestamp}">⏱ ${formatTime(item.timestamp)} Jump to explanation</span>
      </div>
    </div>
  `).join("");

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
pollInterval = setInterval(updatePlayerProgress, 1000);
