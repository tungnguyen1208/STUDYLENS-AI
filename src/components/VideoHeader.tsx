import React from "react";
import { YouTubeVideoInfo, ConnectionStatus } from "../types/index.ts";
import { formatSeconds } from "../extension/utils/time.ts";
import { Youtube, ExternalLink, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { useI18n } from "../i18n/index.tsx";

interface VideoHeaderProps {
  video: YouTubeVideoInfo | null;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  connectionStatus?: ConnectionStatus;
  onRefresh?: () => void;
  isSimulated?: boolean;
}

export const VideoHeader: React.FC<VideoHeaderProps> = ({
  video,
  currentTime,
  duration,
  isPlaying,
  connectionStatus = "synced",
  onRefresh,
}) => {
  const { t } = useI18n();

  if (!video) {
    let statusText = t("videoHeader.searchingForVideo");
    if (connectionStatus === "not-youtube") statusText = t("videoHeader.openYouTubeToStart");
    if (connectionStatus === "injecting") statusText = t("videoHeader.connectingToYouTube");
    if (connectionStatus === "searching") statusText = t("videoHeader.findingVideo");
    if (connectionStatus === "no-player") statusText = t("videoHeader.playerNotReady");

    return (
      <div id="video-header-empty" className="p-4 bg-[var(--bg-panel)] border-b border-[var(--border-subtle)] text-[var(--text-secondary)] text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Youtube className="w-4 h-4 text-red-500 shrink-0" />
          <span className="font-medium text-[var(--text-primary)]">{statusText}</span>
        </div>
        {onRefresh && (
          <button
            id="btn-header-refresh"
            onClick={onRefresh}
            className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] rounded-md transition-colors cursor-pointer"
            title={t("videoHeader.resyncVideo")}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  const effectiveDuration = duration || video.duration || 0;
  const progressPercent = effectiveDuration > 0 ? (currentTime / effectiveDuration) * 100 : 0;

  return (
    <div id="video-header" className="p-4 bg-[var(--bg-panel)] border-b border-[var(--border-subtle)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="mt-0.5 p-1.5 bg-red-600/10 border border-red-500/20 rounded-lg text-red-500 shrink-0">
            <Youtube className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] truncate leading-snug" title={video.title}>
              {video.title}
            </h2>
            <div className="flex items-center gap-2 mt-1 text-xs text-[var(--text-secondary)]">
              <span className="truncate max-w-[140px] font-medium text-[var(--text-primary)]">{video.channelName || "YouTube Creator"}</span>
              <span className="text-[var(--text-muted)]">•</span>
              <span className="font-mono text-[11px] text-[var(--text-secondary)]">
                {formatSeconds(currentTime)} / {formatSeconds(effectiveDuration)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <div
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
              isPlaying
                ? "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/30"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isPlaying ? "bg-emerald-500 dark:bg-emerald-400 animate-pulse" : "bg-amber-500 dark:bg-amber-400"
              }`}
            />
            {isPlaying ? t("videoHeader.tracking") : t("videoHeader.paused")}
          </div>

          {video.url && (
            <a
              id="link-open-youtube"
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] rounded-md transition-colors"
              title={t("videoHeader.openOnYouTube")}
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Synchronized Micro Progress Bar */}
      <div className="mt-3 w-full bg-[var(--border-subtle)] h-1 rounded-full overflow-hidden">
        <div
          className="bg-red-500 h-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
        />
      </div>
    </div>
  );
};
