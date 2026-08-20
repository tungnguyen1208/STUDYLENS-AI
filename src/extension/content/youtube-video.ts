import { YouTubeVideoInfo } from "../../types/index.ts";
import { extractYouTubeVideoId, sanitizeYouTubeTitle } from "../utils/youtube.ts";
import { YouTubePlayerController } from "./youtube-player.ts";

/**
 * Extracts YouTube Video Metadata from DOM and URL
 */
export class YouTubeVideoDetector {
  /**
   * Scrapes current YouTube video metadata
   */
  public static detectCurrentVideo(): YouTubeVideoInfo | null {
    const videoId = extractYouTubeVideoId(window.location.href);
    if (!videoId) return null;

    const player = YouTubePlayerController.getInstance();
    const duration = player.getDuration();

    // 1. Scrape Title
    let title = "";
    const titleEl =
      document.querySelector("h1.ytd-watch-metadata yt-formatted-string") ||
      document.querySelector("h1.title.style-scope.ytd-video-primary-info-renderer") ||
      document.querySelector("#title h1 yt-formatted-string");

    if (titleEl && titleEl.textContent?.trim()) {
      title = sanitizeYouTubeTitle(titleEl.textContent.trim());
    } else {
      title = sanitizeYouTubeTitle(document.title);
    }

    // 2. Scrape Channel Name
    let channelName = "YouTube Creator";
    const channelEl =
      document.querySelector("ytd-channel-name a") ||
      document.querySelector("#channel-name a") ||
      document.querySelector("#owner-name a");

    if (channelEl && channelEl.textContent?.trim()) {
      channelName = channelEl.textContent.trim();
    }

    // 3. Construct clean YouTube thumbnail URL
    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    return {
      videoId,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      title: title || `YouTube Video (${videoId})`,
      duration: duration || 3600,
      channelName,
      thumbnailUrl,
    };
  }
}
