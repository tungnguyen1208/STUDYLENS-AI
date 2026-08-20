import { StudySegment } from "../../types/index.ts";

/**
 * Format seconds into mm:ss or hh:mm:ss format
 */
export function formatSeconds(totalSeconds: number): string {
  if (isNaN(totalSeconds) || totalSeconds < 0) return "00:00";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Parse string timestamp (e.g. "07:32" or "1:15:20") into total seconds
 */
export function parseTimestampToSeconds(timestampStr: string): number {
  if (!timestampStr) return 0;
  const parts = timestampStr.trim().split(":").map((p) => parseInt(p, 10));
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 1 && !isNaN(parts[0])) {
    return parts[0];
  }
  return 0;
}

/**
 * Split a YouTube video's total duration into structured study segments
 */
export function generateStudySegments(
  durationSeconds: number,
  intervalMinutes: number = 10,
  videoId: string = "video_default"
): StudySegment[] {
  const duration = Math.max(60, durationSeconds || 3600);
  const intervalSec = Math.max(60, intervalMinutes * 60);
  const totalSegments = Math.ceil(duration / intervalSec);

  const segments: StudySegment[] = [];
  for (let i = 0; i < totalSegments; i++) {
    const startTime = i * intervalSec;
    const endTime = Math.min(duration, (i + 1) * intervalSec);
    segments.push({
      id: `${videoId}_seg_${i}`,
      index: i,
      videoId,
      startTime,
      endTime,
      watchedSeconds: 0,
      completed: false,
      quizGenerated: false,
      quizPassed: false,
    });
  }

  return segments;
}
