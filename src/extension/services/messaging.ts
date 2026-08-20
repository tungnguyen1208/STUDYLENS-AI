import {
  ExtensionMessage,
  ExtensionResponse,
  YouTubeVideoInfo,
  YouTubePlayerState,
  TranscriptSegment,
  ConnectionStatus,
} from "../../types/index.ts";

export interface ConnectOptions {
  onVideoChanged?: (video: YouTubeVideoInfo) => void;
  onStatusChange?: (status: ConnectionStatus) => void;
  onPlayerState?: (state: YouTubePlayerState) => void;
}

/**
 * Extension Messaging & Realtime Synchronization Helper
 * Manages resilient communication between SidePanel / Web Preview and YouTube Tab
 */
export class ExtensionMessenger {
  /**
   * Safe check if URL is an active YouTube watch page
   * Handles ?v=..., &list=..., &t=..., youtu.be/...
   */
  public static isYouTubeWatchUrl(url?: string): boolean {
    if (!url) return false;
    try {
      const parsed = new URL(url);
      const isYtHost =
        parsed.hostname === "www.youtube.com" ||
        parsed.hostname === "youtube.com" ||
        parsed.hostname === "m.youtube.com";

      if (parsed.hostname.includes("youtu.be") && parsed.pathname.length > 1) {
        return true;
      }

      return (
        isYtHost &&
        parsed.pathname === "/watch" &&
        Boolean(parsed.searchParams.get("v"))
      );
    } catch {
      return false;
    }
  }

  /**
   * Extract video ID from URL safely
   */
  public static extractVideoId(url?: string): string | null {
    if (!url) return null;
    try {
      const parsed = new URL(url);
      if (parsed.hostname.includes("youtu.be")) {
        return parsed.pathname.slice(1).split("?")[0] || null;
      }
      if (parsed.pathname === "/watch") {
        return parsed.searchParams.get("v") || null;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Get active browser tab in current window
   */
  public static async getActiveTab(): Promise<any | null> {
    if (typeof chrome === "undefined" || !chrome.tabs?.query) {
      return null;
    }
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      return tab || null;
    } catch (err) {
      console.warn("[StudyLens:Panel] getActiveTab error:", err);
      return null;
    }
  }

  /**
   * Send PING to content script to check if loaded & responsive
   */
  public static async pingTab(tabId: number): Promise<boolean> {
    if (typeof chrome === "undefined" || !chrome.tabs?.sendMessage) {
      return false;
    }
    try {
      const res: any = await chrome.tabs.sendMessage(tabId, { type: "PING" });
      return Boolean(res && (res.success || res.source === "studylens-content-script"));
    } catch {
      return false;
    }
  }

  /**
   * Auto-inject content script via chrome.scripting if tab was open before extension install
   */
  public static async injectContentScript(tabId: number): Promise<boolean> {
    if (typeof chrome === "undefined" || !chrome.scripting?.executeScript) {
      return false;
    }
    try {
      console.log(`[StudyLens:Panel] Auto-injecting content script into tab: ${tabId}`);
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ["content/content-script.js"],
      });
      // Small pause for script initialization
      await new Promise((r) => setTimeout(r, 300));
      return await this.pingTab(tabId);
    } catch (err) {
      console.warn("[StudyLens:Panel] Failed to inject content script:", err);
      return false;
    }
  }

  /**
   * Connect to active YouTube tab with automatic PING, fallback injection, and metadata query
   */
  public static async connectToActiveYouTubeTab(options?: ConnectOptions): Promise<{
    status: ConnectionStatus;
    tabId?: number;
    video?: YouTubeVideoInfo | null;
  }> {
    const tab = await this.getActiveTab();
    if (!tab || !tab.id) {
      options?.onStatusChange?.("not-youtube");
      return { status: "not-youtube" };
    }

    if (!this.isYouTubeWatchUrl(tab.url)) {
      options?.onStatusChange?.("not-youtube");
      return { status: "not-youtube", tabId: tab.id };
    }

    options?.onStatusChange?.("connecting");
    console.log(`[StudyLens:Panel] Active YouTube tab detected (#${tab.id}): ${tab.url}`);

    // Step 1: PING content script
    let isAlive = await this.pingTab(tab.id);

    // Step 2: Auto-inject if missing
    if (!isAlive) {
      options?.onStatusChange?.("injecting");
      console.log("[StudyLens:Panel] Content script not responding. Attempting auto-injection...");
      isAlive = await this.injectContentScript(tab.id);
    }

    if (!isAlive) {
      console.warn("[StudyLens:Panel] Content script could not be established on tab");
      options?.onStatusChange?.("no-player");
      return { status: "no-player", tabId: tab.id };
    }

    // Step 3: Query Video Info
    const infoRes = await this.sendToTab<YouTubeVideoInfo>(tab.id, { type: "GET_VIDEO_INFO" });
    if (infoRes.success && infoRes.data && infoRes.data.videoId) {
      console.log("[StudyLens:Panel] Synced with YouTube video:", infoRes.data.title);
      options?.onStatusChange?.("synced");
      options?.onVideoChanged?.(infoRes.data);
      return {
        status: "synced",
        tabId: tab.id,
        video: infoRes.data,
      };
    }

    options?.onStatusChange?.("no-player");
    return { status: "no-player", tabId: tab.id };
  }

  /**
   * Send a strongly-typed message to a specific tab
   */
  public static async sendToTab<T = any>(
    tabId: number,
    message: ExtensionMessage
  ): Promise<ExtensionResponse<T>> {
    if (typeof chrome === "undefined" || !chrome.tabs?.sendMessage) {
      return { success: false, error: "Not running in Chrome Extension environment" };
    }
    try {
      const response: ExtensionResponse<T> = await chrome.tabs.sendMessage(tabId, message);
      return response || { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Failed to communicate with YouTube tab" };
    }
  }

  /**
   * Send a strongly-typed message to the currently active YouTube tab
   */
  public static async sendToActiveTab<T = any>(
    message: ExtensionMessage
  ): Promise<ExtensionResponse<T>> {
    const tab = await this.getActiveTab();
    if (!tab || !tab.id) {
      return { success: false, error: "No active tab found" };
    }
    return this.sendToTab<T>(tab.id, message);
  }

  /**
   * Convenience helpers
   */
  public static async getVideoInfo(tabId?: number): Promise<YouTubeVideoInfo | null> {
    const targetId = tabId || (await this.getActiveTab())?.id;
    if (!targetId) return null;
    const res = await this.sendToTab<YouTubeVideoInfo>(targetId, { type: "GET_VIDEO_INFO" });
    return res.success && res.data ? res.data : null;
  }

  public static async getPlayerState(tabId?: number): Promise<YouTubePlayerState | null> {
    const targetId = tabId || (await this.getActiveTab())?.id;
    if (!targetId) return null;
    const res = await this.sendToTab<YouTubePlayerState>(targetId, { type: "GET_PLAYER_STATE" });
    return res.success && res.data ? res.data : null;
  }

  public static async seekTo(seconds: number, tabId?: number): Promise<boolean> {
    const targetId = tabId || (await this.getActiveTab())?.id;
    if (!targetId) return false;
    const res = await this.sendToTab(targetId, {
      type: "SEEK_VIDEO",
      payload: { seconds },
    });
    return Boolean(res.success);
  }

  public static async pauseVideo(tabId?: number): Promise<boolean> {
    const targetId = tabId || (await this.getActiveTab())?.id;
    if (!targetId) return false;
    const res = await this.sendToTab(targetId, { type: "PAUSE_VIDEO" });
    return Boolean(res.success);
  }

  public static async playVideo(tabId?: number): Promise<boolean> {
    const targetId = tabId || (await this.getActiveTab())?.id;
    if (!targetId) return false;
    const res = await this.sendToTab(targetId, { type: "PLAY_VIDEO" });
    return Boolean(res.success);
  }

  public static async getTranscript(tabId?: number): Promise<TranscriptSegment[]> {
    const targetId = tabId || (await this.getActiveTab())?.id;
    if (!targetId) return [];
    const res = await this.sendToTab<TranscriptSegment[]>(targetId, { type: "GET_TRANSCRIPT" });
    return res.success && Array.isArray(res.data) ? res.data : [];
  }
}
