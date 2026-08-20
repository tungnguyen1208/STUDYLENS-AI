export interface TranscriptSegment {
  start: number; // in seconds
  end: number;   // in seconds
  text: string;
}

export interface TranscriptCache {
  videoId: string;
  videoTitle?: string;
  segments: TranscriptSegment[];
  cachedAt: number;
}
