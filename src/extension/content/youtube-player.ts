import { YouTubePlayerState } from "../../types/index.ts";

/**
 * YouTube HTML5 Player Controller
 * Interacts directly with the video element on youtube.com/watch
 */
export class YouTubePlayerController {
  private static instance: YouTubePlayerController;

  private constructor() {}

  public static getInstance(): YouTubePlayerController {
    if (!YouTubePlayerController.instance) {
      YouTubePlayerController.instance = new YouTubePlayerController();
    }
    return YouTubePlayerController.instance;
  }

  /**
   * Retrieves the active HTML5 Video element on YouTube
   */
  public getVideoElement(): HTMLVideoElement | null {
    const video =
      (document.querySelector("video.html5-main-video") as HTMLVideoElement) ||
      (document.querySelector("#movie_player video") as HTMLVideoElement) ||
      (document.querySelector("video") as HTMLVideoElement);

    return video;
  }

  /**
   * Retrieves current playback time in seconds
   */
  public getCurrentTime(): number {
    const video = this.getVideoElement();
    return video ? video.currentTime : 0;
  }

  /**
   * Retrieves video duration in seconds
   */
  public getDuration(): number {
    const video = this.getVideoElement();
    return video ? video.duration || 0 : 0;
  }

  /**
   * Checks if video is currently playing
   */
  public isPlaying(): boolean {
    const video = this.getVideoElement();
    return !!video && !video.paused && !video.ended && video.readyState > 2;
  }

  /**
   * Play video
   */
  public async play(): Promise<void> {
    const video = this.getVideoElement();
    if (!video) throw new Error("YouTube video element not found");
    try {
      await video.play();
    } catch (err) {
      console.warn("[StudyLens YouTube] Play error:", err);
    }
  }

  /**
   * Pause video
   */
  public pause(): void {
    const video = this.getVideoElement();
    if (!video) throw new Error("YouTube video element not found");
    video.pause();
  }

  /**
   * Seek directly to a timestamp (in seconds) and resume playback
   */
  public seekTo(seconds: number): void {
    const video = this.getVideoElement();
    if (!video) throw new Error("YouTube video element not found");

    const targetSec = Math.max(0, Math.min(seconds, video.duration || 99999));
    video.currentTime = targetSec;
    video.play().catch(() => {});
  }

  /**
   * Adjust playback speed
   */
  public setPlaybackRate(rate: number): void {
    const video = this.getVideoElement();
    if (video && rate >= 0.25 && rate <= 3.0) {
      video.playbackRate = rate;
    }
  }

  /**
   * Full snapshot of player state
   */
  public getPlayerState(videoId: string = ""): YouTubePlayerState {
    const video = this.getVideoElement();
    if (!video) {
      return {
        videoId: videoId || "",
        currentTime: 0,
        duration: 0,
        paused: true,
        ended: false,
        playbackRate: 1,
        volume: 1,
        muted: false,
        timestamp: Date.now(),
        isPlaying: false,
        isPaused: true,
        isEnded: false,
        isMuted: false,
      };
    }

    return {
      videoId: videoId || "",
      currentTime: video.currentTime,
      duration: video.duration || 0,
      paused: video.paused,
      ended: video.ended,
      playbackRate: video.playbackRate,
      volume: video.volume,
      muted: video.muted,
      timestamp: Date.now(),
      isPlaying: !video.paused && !video.ended,
      isPaused: video.paused,
      isEnded: video.ended,
      isMuted: video.muted,
    };
  }
}
