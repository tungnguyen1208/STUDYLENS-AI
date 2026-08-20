import { YouTubeVideoInfo, YouTubePlayerState } from "./video.ts";
import { TranscriptSegment } from "./transcript.ts";

export type ExtensionMessage =
  | { type: "PING" }
  | { type: "GET_VIDEO_INFO" }
  | { type: "GET_PLAYER_STATE" }
  | { type: "PLAYER_STATE_UPDATE"; payload: YouTubePlayerState }
  | { type: "YOUTUBE_VIDEO_CHANGED"; payload: { videoId: string; url: string; title?: string; channelName?: string } }
  | { type: "SEEK_VIDEO"; payload: { seconds: number } }
  | { type: "PAUSE_VIDEO" }
  | { type: "PLAY_VIDEO" }
  | { type: "GET_TRANSCRIPT" }
  | { type: "START_STUDY_SESSION"; payload?: { videoId: string } }
  | { type: "STOP_STUDY_SESSION" }
  | { type: "TRIGGER_QUIZ"; payload?: { segmentIndex: number } };

export interface ExtensionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  source?: string;
  videoId?: string | null;
}

