export interface YouTubeVideoInfo {
  videoId: string;
  url: string;
  title: string;
  duration: number; // in seconds
  channelName?: string;
  thumbnailUrl?: string;
  channel?: string;
  id?: string;
  platform?: "youtube";
}

export type VideoInfo = YouTubeVideoInfo;

export interface YouTubePlayerState {
  videoId: string;
  currentTime: number;
  duration: number;
  paused: boolean;
  ended: boolean;
  playbackRate: number;
  volume: number;
  muted: boolean;
  timestamp: number;
  isPlaying?: boolean;
  isPaused?: boolean;
  isEnded?: boolean;
  isMuted?: boolean;
}

export type ConnectionStatus =
  | "idle"
  | "searching"
  | "injecting"
  | "connecting"
  | "synced"
  | "not-youtube"
  | "no-player"
  | "error";

export type ThemeMode = "light" | "dark" | "system";

