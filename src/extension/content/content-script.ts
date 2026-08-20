import { YouTubePlayerController } from "./youtube-player.ts";
import { YouTubeVideoDetector } from "./youtube-video.ts";
import { YouTubeNavigationWatcher } from "./youtube-navigation.ts";
import { YouTubeTranscriptService } from "./youtube-transcript.ts";
import { YouTubeStudyTracker } from "./study-tracker.ts";
import { ExtensionMessage, ExtensionResponse, YouTubeVideoInfo } from "../../types/index.ts";

/**
 * YouTube Main Content Script Entry
 * Manages video state, transcript retrieval, and message passing to the SidePanel
 */
class YouTubeContentApp {
  private player: YouTubePlayerController;
  private navWatcher: YouTubeNavigationWatcher;
  private tracker: YouTubeStudyTracker | null = null;
  private currentVideo: YouTubeVideoInfo | null = null;

  constructor() {
    this.player = YouTubePlayerController.getInstance();
    this.navWatcher = new YouTubeNavigationWatcher();
    this.init();
  }

  private init(): void {
    console.log("[StudyLens AI] YouTube Content Script initialized.");

    // Detect video on initial load
    this.detectAndInitVideo();

    // Listen to YouTube SPA navigation changes (e.g. clicking related videos)
    this.navWatcher.onVideoChange((newVideoId, url) => {
      console.log(`[StudyLens AI] YouTube navigation detected -> ${newVideoId}`);
      this.detectAndInitVideo();
    });

    // Register Chrome Runtime message listener for Side Panel communication
    if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener(
        (
          message: ExtensionMessage,
          sender: chrome.runtime.MessageSender,
          sendResponse: (response: ExtensionResponse) => void
        ) => {
          this.handleIncomingMessage(message, sendResponse);
          return true; // Keep message channel open for async responses
        }
      );
    }
  }

  private detectAndInitVideo(): void {
    // Wait slightly for YouTube DOM metadata to settle
    setTimeout(() => {
      const info = YouTubeVideoDetector.detectCurrentVideo();
      if (info) {
        this.currentVideo = info;
        if (this.tracker) {
          this.tracker.stop();
        }
        this.tracker = new YouTubeStudyTracker(
          info.videoId,
          info.title,
          info.duration,
          10
        );

        this.tracker.onSegmentComplete((segment) => {
          console.log(`[StudyLens AI] YouTube study segment ${segment.index + 1} completed!`);
          // Notify sidepanel or background
          if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
            chrome.runtime.sendMessage({
              type: "SEGMENT_COMPLETED",
              payload: { segment, videoInfo: this.currentVideo },
            });
          }
        });

        this.tracker.start();
      }
    }, 1200);
  }

  private async handleIncomingMessage(
    message: ExtensionMessage,
    sendResponse: (response: ExtensionResponse) => void
  ): Promise<void> {
    try {
      switch (message.type) {
        case "PING": {
          sendResponse({
            success: true,
            data: { isYouTube: true, timestamp: Date.now() },
          });
          break;
        }

        case "GET_VIDEO_INFO": {
          const info = this.currentVideo || YouTubeVideoDetector.detectCurrentVideo();
          sendResponse({
            success: !!info,
            data: info,
            error: info ? undefined : "No active YouTube video found",
          });
          break;
        }

        case "GET_PLAYER_STATE": {
          const state = this.player.getPlayerState();
          sendResponse({
            success: true,
            data: state,
          });
          break;
        }

        case "SEEK_VIDEO": {
          const seconds = message.payload?.seconds ?? 0;
          this.player.seekTo(seconds);
          sendResponse({
            success: true,
            data: { seekedTo: seconds },
          });
          break;
        }

        case "PAUSE_VIDEO": {
          this.player.pause();
          sendResponse({ success: true });
          break;
        }

        case "PLAY_VIDEO": {
          await this.player.play();
          sendResponse({ success: true });
          break;
        }

        case "GET_TRANSCRIPT": {
          const videoId =
            this.currentVideo?.videoId ||
            YouTubeVideoDetector.detectCurrentVideo()?.videoId;
          if (!videoId) {
            sendResponse({
              success: false,
              error: "No active YouTube video ID available for transcript",
            });
            return;
          }
          const segments = await YouTubeTranscriptService.getTranscript(videoId);
          sendResponse({
            success: true,
            data: segments,
          });
          break;
        }

        case "START_STUDY_SESSION": {
          if (!this.tracker && this.currentVideo) {
            this.tracker = new YouTubeStudyTracker(
              this.currentVideo.videoId,
              this.currentVideo.title,
              this.currentVideo.duration,
              10
            );
          }
          this.tracker?.start();
          sendResponse({ success: true });
          break;
        }

        case "STOP_STUDY_SESSION": {
          this.tracker?.stop();
          sendResponse({ success: true });
          break;
        }

        default:
          sendResponse({
            success: false,
            error: `Unknown message type: ${(message as any).type}`,
          });
      }
    } catch (err: any) {
      console.error("[StudyLens AI] Content script message handler error:", err);
      sendResponse({
        success: false,
        error: err?.message || "Internal content script error",
      });
    }
  }
}

// Initialize YouTube content script
if (typeof window !== "undefined") {
  new YouTubeContentApp();
}
