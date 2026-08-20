import { YouTubeVideoDetector } from "./youtube-video.ts";
import { YouTubePlayerController } from "./youtube-player.ts";

export class VideoDetector {
  public static isYouTube(): boolean {
    return (
      typeof window !== "undefined" &&
      (window.location.hostname.includes("youtube.com") ||
        window.location.hostname.includes("youtu.be"))
    );
  }

  public static getVideoElement(): HTMLVideoElement | null {
    return YouTubePlayerController.getInstance().getVideoElement();
  }

  public static detectCurrentVideo() {
    return YouTubeVideoDetector.detectCurrentVideo();
  }
}
