import { extractYouTubeVideoId } from "../utils/youtube.ts";

export type NavigationChangeCallback = (newVideoId: string, url: string) => void;

/**
 * Monitors YouTube's Single Page Application (SPA) navigation events
 * YouTube uses custom 'yt-navigate-finish' and 'yt-page-data-updated' events
 */
export class YouTubeNavigationWatcher {
  private currentVideoId: string | null = null;
  private callbacks: NavigationChangeCallback[] = [];
  private observer: MutationObserver | null = null;

  constructor() {
    this.currentVideoId = extractYouTubeVideoId(window.location.href);
    this.initListeners();
  }

  public onVideoChange(callback: NavigationChangeCallback): void {
    this.callbacks.push(callback);
  }

  private notify(newVideoId: string, url: string): void {
    if (newVideoId === this.currentVideoId) return;
    this.currentVideoId = newVideoId;
    this.callbacks.forEach((cb) => cb(newVideoId, url));
  }

  private initListeners(): void {
    // 1. YouTube Custom SPA lifecycle event
    window.addEventListener("yt-navigate-finish", () => {
      const vid = extractYouTubeVideoId(window.location.href);
      if (vid && vid !== this.currentVideoId) {
        this.notify(vid, window.location.href);
      }
    });

    // 2. Popstate (Back/Forward buttons)
    window.addEventListener("popstate", () => {
      const vid = extractYouTubeVideoId(window.location.href);
      if (vid && vid !== this.currentVideoId) {
        this.notify(vid, window.location.href);
      }
    });

    // 3. Fallback URL polling check (handles inline video switches)
    let lastUrl = window.location.href;
    setInterval(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        const vid = extractYouTubeVideoId(lastUrl);
        if (vid && vid !== this.currentVideoId) {
          this.notify(vid, lastUrl);
        }
      }
    }, 1000);
  }

  public getCurrentVideoId(): string | null {
    return this.currentVideoId;
  }
}
