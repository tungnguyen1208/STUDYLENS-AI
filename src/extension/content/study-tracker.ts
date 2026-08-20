import { YouTubePlayerController } from "./youtube-player.ts";
import { StudySegment, LearningSession } from "../../types/index.ts";
import { generateStudySegments } from "../utils/time.ts";

export type SegmentCompleteCallback = (segment: StudySegment) => void;
export type ProgressTickCallback = (watchSeconds: number, currentSegment: StudySegment) => void;

/**
 * YouTube Active Study Tracker
 * Monitors authentic video watch time, handles pauses, seek jumps, and triggers interval knowledge checks.
 */
export class YouTubeStudyTracker {
  private videoId: string;
  private videoTitle: string;
  private player: YouTubePlayerController;
  private timer: number | null = null;
  private isTracking: boolean = false;
  private lastPosition: number = 0;
  private segmentIntervalMinutes: number = 10;
  private segments: StudySegment[] = [];
  private currentSegmentIndex: number = 0;

  private onSegmentCompleteCallbacks: SegmentCompleteCallback[] = [];
  private onProgressCallbacks: ProgressTickCallback[] = [];

  constructor(
    videoId: string,
    videoTitle: string,
    durationSeconds: number,
    intervalMinutes: number = 10
  ) {
    this.videoId = videoId;
    this.videoTitle = videoTitle;
    this.segmentIntervalMinutes = intervalMinutes;
    this.player = YouTubePlayerController.getInstance();
    this.segments = generateStudySegments(durationSeconds, intervalMinutes, videoId);
    this.lastPosition = this.player.getCurrentTime();
  }

  public onSegmentComplete(cb: SegmentCompleteCallback): void {
    this.onSegmentCompleteCallbacks.push(cb);
  }

  public onProgress(cb: ProgressTickCallback): void {
    this.onProgressCallbacks.push(cb);
  }

  public start(): void {
    if (this.isTracking) return;
    this.isTracking = true;
    this.lastPosition = this.player.getCurrentTime();

    this.timer = window.setInterval(() => {
      this.tick();
    }, 1000);
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isTracking = false;
  }

  private tick(): void {
    if (!this.isTracking) return;

    const isPlaying = this.player.isPlaying();
    const isVisible = document.visibilityState === "visible";
    const currentPos = this.player.getCurrentTime();

    // Determine if playback was continuous (difference between 0.5s and 2.5s)
    const timeDelta = currentPos - this.lastPosition;
    this.lastPosition = currentPos;

    // Only count active focused watch time when playing and not seeking forward/skipping
    if (isPlaying && isVisible && timeDelta > 0 && timeDelta < 3.0) {
      const activeSegment = this.getCurrentActiveSegment(currentPos);
      if (activeSegment) {
        activeSegment.watchedSeconds += timeDelta;

        // Check if segment is completed
        const segmentDuration = activeSegment.endTime - activeSegment.startTime;
        const requiredWatchTime = segmentDuration * 0.8; // 80% watch threshold for interval completion

        if (
          !activeSegment.completed &&
          !activeSegment.quizGenerated &&
          activeSegment.watchedSeconds >= requiredWatchTime
        ) {
          activeSegment.completed = true;
          this.onSegmentCompleteCallbacks.forEach((cb) => cb(activeSegment));
        }

        this.onProgressCallbacks.forEach((cb) =>
          cb(Math.round(activeSegment.watchedSeconds), activeSegment)
        );
      }
    }
  }

  public getCurrentActiveSegment(currentTime: number): StudySegment | null {
    const found = this.segments.find(
      (s) => currentTime >= s.startTime && currentTime <= s.endTime
    );
    return found || this.segments[this.segments.length - 1] || null;
  }

  public getSegments(): StudySegment[] {
    return this.segments;
  }

  public updateSegmentQuizStatus(segmentId: string, passed: boolean, score: number, total: number): void {
    const seg = this.segments.find((s) => s.id === segmentId);
    if (seg) {
      seg.quizGenerated = true;
      seg.quizPassed = passed;
      seg.quizScore = score;
      seg.quizTotal = total;
      seg.needsReview = !passed;
    }
  }
}
