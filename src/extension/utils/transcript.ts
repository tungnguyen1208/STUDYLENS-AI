import { TranscriptSegment } from "../../types/index.ts";

export function sliceTranscriptByRange(
  transcript: TranscriptSegment[],
  startTime: number,
  endTime: number
): TranscriptSegment[] {
  if (!transcript || transcript.length === 0) return [];
  return transcript.filter((t) => {
    // Overlapping condition
    return (t.start >= startTime && t.start <= endTime) || (t.end >= startTime && t.end <= endTime);
  });
}

export function findSnippetAtTimestamp(
  transcript: TranscriptSegment[],
  timestamp: number
): TranscriptSegment | null {
  if (!transcript || transcript.length === 0) return null;
  const match = transcript.find((t) => timestamp >= t.start && timestamp <= t.end);
  if (match) return match;

  // Closest previous or next snippet
  let closest: TranscriptSegment | null = null;
  let minDiff = Infinity;

  for (const item of transcript) {
    const diff = Math.abs(item.start - timestamp);
    if (diff < minDiff) {
      minDiff = diff;
      closest = item;
    }
  }

  return closest;
}
