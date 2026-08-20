import React from "react";
import { StudySegment } from "../types/index.ts";
import { formatSeconds } from "../extension/utils/time.ts";
import { CheckCircle2, AlertCircle, Play, Lock, Clock } from "lucide-react";
import { useI18n } from "../i18n/index.tsx";

interface LearningTimelineProps {
  segments: StudySegment[];
  currentVideoTime: number;
  onSelectSegment: (segment: StudySegment) => void;
  onSeek: (seconds: number) => void;
}

export const LearningTimeline: React.FC<LearningTimelineProps> = ({
  segments,
  currentVideoTime,
  onSelectSegment,
  onSeek,
}) => {
  const { t } = useI18n();

  if (!segments || segments.length === 0) return null;

  return (
    <div id="learning-timeline-container" className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-red-500" />
          <span>{t("learningTimeline.title")}</span>
        </h3>
        <span className="text-[11px] text-[var(--text-muted)]">{segments.length} {t("learningTimeline.checkpointsCount")}</span>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {segments.map((seg, idx) => {
          const isCurrentActive =
            currentVideoTime >= seg.startTime && currentVideoTime <= seg.endTime;
          const isPassed = seg.quizGenerated && seg.quizPassed;
          const isFailed = seg.quizGenerated && !seg.quizPassed;

          return (
            <div
              key={seg.id || idx}
              id={`segment-row-${idx}`}
              className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                isCurrentActive
                  ? "bg-[var(--bg-card-hover)] border-red-500/50 shadow-sm"
                  : "bg-[var(--bg-card)] border-[var(--border-subtle)] hover:border-[var(--border-strong)]"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                    isPassed
                      ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30"
                      : isFailed
                      ? "bg-red-500/20 text-red-500 border border-red-500/30"
                      : isCurrentActive
                      ? "bg-red-600 text-white animate-pulse"
                      : "bg-[var(--bg-input)] text-[var(--text-secondary)] border border-[var(--border-subtle)]"
                  }`}
                >
                  {isPassed ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : isFailed ? (
                    <AlertCircle className="w-4 h-4" />
                  ) : (
                    idx + 1
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[var(--text-primary)]">
                      {t("learningTimeline.segmentNumber")} {idx + 1}
                    </span>
                    <span className="font-mono text-[11px] text-[var(--text-secondary)]">
                      {formatSeconds(seg.startTime)} - {formatSeconds(seg.endTime)}
                    </span>
                  </div>

                  <div className="text-[11px] text-[var(--text-secondary)] flex items-center gap-2 mt-0.5">
                    <span>{t("learningTimeline.watchTime")}: {formatSeconds(Math.round(seg.watchedSeconds))}</span>
                    {seg.quizGenerated && (
                      <>
                        <span className="text-[var(--text-muted)]">•</span>
                        <span
                          className={
                            isPassed ? "text-emerald-500 font-medium" : "text-red-500 font-medium"
                          }
                        >
                          {t("learningTimeline.score")}: {seg.quizScore ?? 0}/{seg.quizTotal ?? 3}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  id={`btn-seek-segment-${idx}`}
                  onClick={() => onSeek(seg.startTime)}
                  className="p-1.5 bg-[var(--bg-input)] hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg transition-colors border border-[var(--border-subtle)] cursor-pointer"
                  title={t("learningTimeline.seekSegment")}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                </button>

                <button
                  id={`btn-open-quiz-segment-${idx}`}
                  onClick={() => onSelectSegment(seg)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    isPassed
                      ? "bg-[var(--bg-input)] text-[var(--text-primary)] border-[var(--border-subtle)] hover:bg-[var(--bg-card-hover)]"
                      : "bg-red-600/10 text-red-500 border-red-500/30 hover:bg-red-600 hover:text-white"
                  }`}
                >
                  {seg.quizGenerated ? t("learningTimeline.reviewQuiz") : t("learningTimeline.startQuiz")}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
