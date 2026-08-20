import { TranscriptSegment, TranscriptCache } from "../../types/index.ts";

/**
 * YouTube Transcript / Caption Extractor
 * Extracts timed text segments directly from YouTube's active tracks or DOM panels
 */
export class YouTubeTranscriptService {
  /**
   * Attempts to extract transcript from YouTube HTML5 textTracks or embedded caption data
   */
  public static async getTranscript(videoId: string): Promise<TranscriptSegment[]> {
    if (!videoId) return [];

    // 1. Try checking cache first
    const cached = await this.getFromCache(videoId);
    if (cached && cached.segments.length > 0) {
      return cached.segments;
    }

    // 2. Try scraping from YouTube Video TextTracks
    try {
      const segmentsFromTracks = await this.extractFromTextTracks();
      if (segmentsFromTracks && segmentsFromTracks.length > 0) {
        await this.saveToCache(videoId, segmentsFromTracks);
        return segmentsFromTracks;
      }
    } catch (e) {
      console.warn("[StudyLens Transcript] TextTracks extract notice:", e);
    }

    // 3. Try scraping from YouTube DOM Engagement Panel / Transcript Drawer if open
    try {
      const segmentsFromDOM = this.extractFromDOM();
      if (segmentsFromDOM && segmentsFromDOM.length > 0) {
        await this.saveToCache(videoId, segmentsFromDOM);
        return segmentsFromDOM;
      }
    } catch (e) {
      console.warn("[StudyLens Transcript] DOM extract notice:", e);
    }

    // 4. Return empty if unavailable (no caption track)
    return [];
  }

  /**
   * Extract cues from active HTML5 video textTracks
   */
  private static async extractFromTextTracks(): Promise<TranscriptSegment[]> {
    const video = document.querySelector("video") as HTMLVideoElement;
    if (!video || !video.textTracks || video.textTracks.length === 0) {
      return [];
    }

    const segments: TranscriptSegment[] = [];

    // Look for caption or subtitle track
    for (let i = 0; i < video.textTracks.length; i++) {
      const track = video.textTracks[i];
      if (track.kind === "subtitles" || track.kind === "captions") {
        track.mode = "hidden"; // Ensure cues are loaded

        if (track.cues && track.cues.length > 0) {
          for (let j = 0; j < track.cues.length; j++) {
            const cue = track.cues[j] as VTTCue;
            if (cue && cue.text) {
              segments.push({
                start: Math.round(cue.startTime * 10) / 10,
                end: Math.round(cue.endTime * 10) / 10,
                text: cue.text.replace(/<[^>]*>/g, "").trim(),
              });
            }
          }
        }
      }
    }

    return segments;
  }

  /**
   * Extract segments from YouTube transcript drawer elements if present
   */
  private static extractFromDOM(): TranscriptSegment[] {
    const cueElements = document.querySelectorAll(
      "ytd-transcript-segment-renderer, ytd-transcript-body-renderer .cue-group"
    );

    if (!cueElements || cueElements.length === 0) return [];

    const segments: TranscriptSegment[] = [];
    cueElements.forEach((el, index) => {
      const timeStr = el.querySelector(".segment-timestamp, .cue-group-start-offset")?.textContent?.trim();
      const text = el.querySelector(".segment-text, .cues")?.textContent?.trim();

      if (timeStr && text) {
        const parts = timeStr.split(":").map((n) => parseInt(n, 10));
        let start = 0;
        if (parts.length === 3) start = parts[0] * 3600 + parts[1] * 60 + parts[2];
        else if (parts.length === 2) start = parts[0] * 60 + parts[1];

        segments.push({
          start,
          end: start + 15,
          text,
        });
      }
    });

    return segments;
  }

  private static async getFromCache(videoId: string): Promise<TranscriptCache | null> {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      return new Promise((resolve) => {
        chrome.storage.local.get([`transcript_${videoId}`], (res: any) => {
          resolve(res?.[`transcript_${videoId}`] || null);
        });
      });
    }
    try {
      const local = localStorage.getItem(`transcript_${videoId}`);
      return local ? JSON.parse(local) : null;
    } catch {
      return null;
    }
  }

  private static async saveToCache(videoId: string, segments: TranscriptSegment[]): Promise<void> {
    const cache: TranscriptCache = {
      videoId,
      segments,
      cachedAt: Date.now(),
    };

    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.set({ [`transcript_${videoId}`]: cache });
    } else {
      try {
        localStorage.setItem(`transcript_${videoId}`, JSON.stringify(cache));
      } catch {}
    }
  }
}
