import React, { useRef, useEffect, useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize,
  Clock,
  Sparkles,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  FastForward,
} from "lucide-react";
import { VideoInfo, TranscriptSegment, StudySegment } from "../types/index.ts";
import { formatSeconds } from "../extension/utils/time.ts";
import { useI18n } from "../i18n/index.tsx";

interface VideoPlayerProps {
  videoInfo: VideoInfo;
  transcript: TranscriptSegment[];
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  onSeek: (seconds: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  studySegments: StudySegment[];
  currentSegment: StudySegment | null;
  activeSeekNotice: { time: number; timestamp: number } | null;
  sampleVideoSrc?: string;
  onManualTriggerQuiz?: () => void;
  isGeneratingQuiz?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoInfo,
  transcript,
  currentTime,
  onTimeUpdate,
  onSeek,
  isPlaying,
  onTogglePlay,
  studySegments,
  currentSegment,
  activeSeekNotice,
  sampleVideoSrc,
  onManualTriggerQuiz,
  isGeneratingQuiz,
}) => {
  const { t } = useI18n();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const transcriptContainerRef = useRef<HTMLDivElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [transcriptSearch, setTranscriptSearch] = useState("");
  const [autoScrollTranscript, setAutoScrollTranscript] = useState(true);

  // Sync video element time when seeking occurs from outside
  useEffect(() => {
    if (videoRef.current && Math.abs(videoRef.current.currentTime - currentTime) > 1.5) {
      videoRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  // Sync play/pause state
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying && videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
      } else if (!isPlaying && !videoRef.current.paused) {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Find active transcript index
  const activeTranscriptIndex = transcript.findIndex(
    (t) => currentTime >= t.start && currentTime <= t.end
  );

  // Auto-scroll transcript to active line
  useEffect(() => {
    if (autoScrollTranscript && activeTranscriptIndex >= 0 && transcriptContainerRef.current) {
      const activeEl = transcriptContainerRef.current.querySelector(
        `[data-transcript-idx="${activeTranscriptIndex}"]`
      );
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [activeTranscriptIndex, autoScrollTranscript]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    onSeek(newTime);
  };

  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const filteredTranscript = transcript.filter((t) =>
    t.text.toLowerCase().includes(transcriptSearch.toLowerCase())
  );

  // Video duration fallback
  const duration = videoInfo.duration || 3600;
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Video Container Card */}
      <div className="relative overflow-hidden rounded-2xl bg-black border border-[var(--border-subtle)] shadow-xl">
        {/* Video or Simulated HTML5 Canvas Player */}
        <div className="relative aspect-video w-full bg-black flex items-center justify-center">
          <video
            ref={videoRef}
            src={
              sampleVideoSrc ||
              "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
            }
            className="h-full w-full object-contain"
            onTimeUpdate={() => {
              if (videoRef.current) {
                onTimeUpdate(videoRef.current.currentTime);
              }
            }}
            onEnded={() => onTogglePlay()}
            muted={isMuted}
            playsInline
          />

          {/* Timestamp Seek Notification Overlay */}
          {activeSeekNotice && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 animate-bounce">
              <div className="flex items-center gap-2 rounded-full bg-red-600/90 text-white px-4 py-2 text-sm font-semibold shadow-lg backdrop-blur-md border border-red-400/40">
                <Sparkles className="h-4 w-4 text-amber-300" />
                <span>{t("videoPlayer.jumpedToTimestamp", { time: formatSeconds(activeSeekNotice.time) })}</span>
              </div>
            </div>
          )}

          {/* Active Segment Overlay Badge */}
          <div className="absolute top-3 left-3 z-20 flex items-center gap-2 rounded-lg bg-black/70 px-3 py-1.5 backdrop-blur-md border border-white/10 text-xs text-white">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              {t("videoPlayer.segmentPrefix")} {currentSegment ? currentSegment.index + 1 : 1}:{" "}
              {currentSegment ? formatSeconds(currentSegment.startTime) : "00:00"} →{" "}
              {currentSegment ? formatSeconds(currentSegment.endTime) : "10:00"}
            </span>
          </div>

          {/* Big Center Play/Pause button on hover */}
          <button
            id="video-center-play-btn"
            onClick={onTogglePlay}
            className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-zinc-900 shadow-2xl transition-transform hover:scale-110">
              {isPlaying ? <Pause className="h-8 w-8 fill-zinc-900" /> : <Play className="h-8 w-8 fill-zinc-900 ml-1" />}
            </div>
          </button>
        </div>

        {/* Video Controls Bar */}
        <div className="p-3 bg-[var(--bg-panel)] border-t border-[var(--border-subtle)] text-[var(--text-primary)] flex flex-col gap-2">
          {/* Custom Segmented Progress Bar */}
          <div className="relative w-full h-3 group flex items-center cursor-pointer">
            {/* Timeline track */}
            <div className="absolute inset-x-0 h-1.5 rounded-full bg-[var(--border-strong)] overflow-hidden">
              <div
                className="h-full bg-red-600 transition-all duration-100"
                style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
              />
            </div>

            {/* Segment milestone marker ticks */}
            {studySegments.map((seg) => {
              const segStartPercent = (seg.startTime / duration) * 100;
              return (
                <div
                  key={seg.id}
                  className="absolute top-0 bottom-0 w-0.5 bg-white/60 z-10"
                  style={{ left: `${segStartPercent}%` }}
                  title={`${t("videoPlayer.segmentPrefix")} ${seg.index + 1}: ${formatSeconds(seg.startTime)} - ${formatSeconds(seg.endTime)}`}
                />
              );
            })}

            {/* Range Input overlay */}
            <input
              id="video-timeline-slider"
              type="range"
              min={0}
              max={duration}
              step={0.5}
              value={currentTime}
              onChange={handleSliderChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
            />
          </div>

          {/* Controls row */}
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-3">
              <button
                id="video-btn-play-toggle"
                onClick={onTogglePlay}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] transition-colors cursor-pointer"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
              </button>

              <button
                id="video-btn-rewind-10"
                onClick={() => onSeek(Math.max(0, currentTime - 10))}
                className="flex items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors px-1 cursor-pointer"
                title={t("videoPlayer.rewind10s")}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="text-[11px]">10s</span>
              </button>

              <button
                id="video-btn-forward-10"
                onClick={() => onSeek(Math.min(duration, currentTime + 10))}
                className="flex items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors px-1 cursor-pointer"
                title={t("videoPlayer.forward10s")}
              >
                <FastForward className="h-3.5 w-3.5" />
                <span className="text-[11px]">10s</span>
              </button>

              {/* Time display */}
              <div className="flex items-center gap-1 font-mono text-xs text-[var(--text-primary)]">
                <Clock className="h-3.5 w-3.5 text-red-500" />
                <span>{formatSeconds(currentTime)}</span>
                <span className="text-[var(--text-muted)]">/</span>
                <span className="text-[var(--text-secondary)]">{formatSeconds(duration)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Playback rate */}
              <div className="flex items-center gap-1 rounded-md bg-[var(--bg-card)] border border-[var(--border-subtle)] p-0.5 text-[11px]">
                {[1, 1.25, 1.5, 2].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => handleRateChange(rate)}
                    className={`px-1.5 py-0.5 rounded cursor-pointer ${
                      playbackRate === rate ? "bg-red-600 text-white font-semibold" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>

              {/* Mute button */}
              <button
                id="video-btn-mute-toggle"
                onClick={() => setIsMuted(!isMuted)}
                className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors cursor-pointer"
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>

              {/* Quick Trigger Quiz Button */}
              {onManualTriggerQuiz && (
                <button
                  id="video-btn-test-quiz"
                  onClick={onManualTriggerQuiz}
                  disabled={isGeneratingQuiz}
                  className="flex items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white px-2.5 py-1 text-xs font-semibold transition-colors shadow-sm cursor-pointer"
                  title="Trigger Knowledge Check for this segment now"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  <span>{isGeneratingQuiz ? t("videoPlayer.generatingQuiz") : t("videoPlayer.triggerQuizNow")}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Synchronized Transcript / Caption Viewer */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-red-500" />
            <h3 className="font-semibold text-sm text-[var(--text-primary)]">{t("videoPlayer.transcriptTitle")}</h3>
            <span className="rounded-full bg-[var(--bg-card)] border border-[var(--border-subtle)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-secondary)]">
              {transcript.length} {t("videoPlayer.transcriptLines")}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)]" />
              <input
                id="transcript-search-input"
                type="text"
                placeholder={t("videoPlayer.searchPlaceholder")}
                value={transcriptSearch}
                onChange={(e) => setTranscriptSearch(e.target.value)}
                className="w-40 sm:w-48 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] pl-8 pr-2.5 py-1 text-xs text-[var(--text-primary)] focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Auto scroll toggle */}
            <button
              id="transcript-autoscroll-toggle"
              onClick={() => setAutoScrollTranscript(!autoScrollTranscript)}
              className={`rounded-lg px-2 py-1 text-xs font-medium border transition-colors cursor-pointer ${
                autoScrollTranscript
                  ? "bg-red-500/10 text-red-500 border-red-500/20 font-semibold"
                  : "bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-subtle)]"
              }`}
            >
              {t("videoPlayer.autoScroll")}: {autoScrollTranscript ? t("common.on") : t("common.off")}
            </button>
          </div>
        </div>

        {/* Transcript rows list */}
        <div
          ref={transcriptContainerRef}
          className="mt-3 max-h-56 overflow-y-auto space-y-1.5 pr-2 scrollbar-thin"
        >
          {filteredTranscript.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--text-muted)]">
              {t("videoPlayer.noTranscriptMatches")}
            </div>
          ) : (
            filteredTranscript.map((item, idx) => {
              const isActive = currentTime >= item.start && currentTime <= item.end;
              const isWithinActiveSegment =
                currentSegment &&
                item.start >= currentSegment.startTime &&
                item.start <= currentSegment.endTime;

              return (
                <div
                  key={`${item.start}_${idx}`}
                  data-transcript-idx={idx}
                  onClick={() => onSeek(item.start)}
                  className={`group flex items-start gap-3 rounded-xl p-2 text-xs transition-all cursor-pointer ${
                    isActive
                      ? "bg-red-500/15 text-[var(--text-primary)] font-medium border border-red-500/30 shadow-xs"
                      : isWithinActiveSegment
                      ? "hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)] bg-[var(--bg-card)]"
                      : "hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)]"
                  }`}
                >
                  <span
                    className={`font-mono shrink-0 rounded px-1.5 py-0.5 text-[11px] font-semibold transition-colors ${
                      isActive
                        ? "bg-red-600 text-white shadow-xs"
                        : "bg-[var(--bg-input)] text-[var(--text-secondary)] border border-[var(--border-subtle)] group-hover:border-red-500/40"
                    }`}
                  >
                    {formatSeconds(item.start)}
                  </span>
                  <p className="leading-relaxed flex-1">{item.text}</p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
