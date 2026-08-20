import React, { useState } from "react";
import { StudySegment, UserSettings, DetectedConcept } from "../types/index.ts";
import { formatSeconds } from "../extension/utils/time.ts";
import { Zap, Clock, Target, Flame, Sparkles, Brain, CheckCircle2, AlertCircle, Bookmark } from "lucide-react";
import { useI18n } from "../i18n/index.tsx";

interface StudyProgressProps {
  currentSegment: StudySegment | null;
  totalWatchedSeconds: number;
  xp: number;
  streakDays: number;
  settings: UserSettings;
  onTriggerCheck: () => void;
  isLoadingQuiz?: boolean;
  contextReadiness?: number; // 0.0 to 1.0
  activeConcept?: DetectedConcept | null;
  detectedConcepts?: DetectedConcept[];
  insufficientContextMessage?: string | null;
}

export const StudyProgress: React.FC<StudyProgressProps> = ({
  currentSegment,
  totalWatchedSeconds,
  xp,
  streakDays,
  settings,
  onTriggerCheck,
  isLoadingQuiz = false,
  contextReadiness = 0.65,
  activeConcept = null,
  detectedConcepts = [],
  insufficientContextMessage = null,
}) => {
  const { t } = useI18n();
  const [showToast, setShowToast] = useState(false);

  if (!currentSegment) return null;

  const readinessPercent = Math.round(contextReadiness * 100);
  const isConceptReady = readinessPercent >= (settings.checkpointFrequency === "low" ? 85 : settings.checkpointFrequency === "high" ? 65 : 75);
  const conceptName = activeConcept?.name || currentSegment.conceptName || currentSegment.title || "Foundational Knowledge";

  const handleTrigger = () => {
    if (readinessPercent < 60) {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    }
    onTriggerCheck();
  };

  return (
    <div id="study-progress-card" className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-4 space-y-4 shadow-sm">
      {/* Top Gamification stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg p-2.5 flex items-center gap-2">
          <div className="p-1.5 bg-amber-500/10 text-amber-500 rounded-md">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-[var(--text-secondary)] font-medium">{t("studyProgress.dailyStreak")}</div>
            <div className="text-xs font-bold text-[var(--text-primary)]">{streakDays} {streakDays === 1 ? t("common.day") : t("common.days")}</div>
          </div>
        </div>

        <div className="bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg p-2.5 flex items-center gap-2">
          <div className="p-1.5 bg-indigo-500/10 text-indigo-500 rounded-md">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-[var(--text-secondary)] font-medium">{t("studyProgress.learningXp")}</div>
            <div className="text-xs font-bold text-indigo-500">+{xp} XP</div>
          </div>
        </div>

        <div className="bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg p-2.5 flex items-center gap-2">
          <div className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-md">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-[var(--text-secondary)] font-medium">{t("studyProgress.timeStudied")}</div>
            <div className="text-xs font-bold text-[var(--text-primary)]">{formatSeconds(totalWatchedSeconds)}</div>
          </div>
        </div>
      </div>

      {/* Semantic Context Monitor Banner */}
      <div className={`p-3 rounded-lg border text-xs transition-all ${
        isConceptReady
          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
          : "bg-blue-500/5 border-blue-500/20 text-[var(--text-primary)]"
      }`}>
        <div className="flex items-center gap-2 font-medium">
          {isConceptReady ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          ) : (
            <Brain className="w-4 h-4 text-blue-500 shrink-0 animate-pulse" />
          )}
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold text-[var(--text-secondary)]">
              {t("studyProgress.learningContext")}
            </div>
            <div className="truncate font-medium mt-0.5">
              {isConceptReady ? (
                <span>{t("studyProgress.conceptReady")} <strong className="text-[var(--text-primary)]">{conceptName}</strong></span>
              ) : (
                <span className="text-[var(--text-secondary)]">{t("studyProgress.analyzingContext")} ({conceptName})</span>
              )}
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--bg-input)] border border-[var(--border-subtle)]">
            {readinessPercent}%
          </span>
        </div>
      </div>

      {/* Concept Readiness Buffer Meter */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-medium text-[var(--text-primary)]">
            <Target className="w-3.5 h-3.5 text-red-500" />
            <span>
              {t("studyProgress.contextReadiness")}
            </span>
          </div>
          <span className="font-mono text-[var(--text-secondary)] text-[11px]">
            {readinessPercent}% / 100%
          </span>
        </div>

        <div className="w-full bg-[var(--bg-input)] h-2 rounded-full overflow-hidden border border-[var(--border-subtle)]">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isConceptReady
                ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                : "bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-400"
            }`}
            style={{ width: `${Math.min(100, Math.max(8, readinessPercent))}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
          <span>{readinessPercent}% {t("studyProgress.progressTowardsCheckpoint")}</span>
          <span className="capitalize">{t("studyProgress.interval")}: {settings.checkpointFrequency || "balanced"}</span>
        </div>
      </div>

      {/* Detected Concept Badges (if any) */}
      {detectedConcepts.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1">
            <Bookmark className="w-3 h-3 text-red-500" />
            <span>{detectedConcepts.length} {t("studyProgress.detectedConceptsCount")}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {detectedConcepts.slice(0, 3).map((concept) => (
              <span
                key={concept.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-md bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-secondary)] font-medium"
              >
                <span className="text-red-500 font-semibold">[{concept.type}]</span>
                <span>{concept.name}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Insufficient Context Feedback Toast / Banner */}
      {(showToast || insufficientContextMessage) && (
        <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            {insufficientContextMessage || t("studyProgress.insufficientContextToast")}
          </div>
        </div>
      )}

      {/* Instant Action */}
      <button
        id="btn-trigger-quiz-now"
        onClick={handleTrigger}
        disabled={isLoadingQuiz}
        className="w-full py-2.5 px-3 bg-red-600 hover:bg-red-500 disabled:bg-[var(--border-subtle)] disabled:text-[var(--text-muted)] text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
      >
        {isLoadingQuiz ? (
          <>
            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>{t("studyProgress.generatingCheckpoint")}</span>
          </>
        ) : (
          <>
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>{t("studyProgress.generateCheckpointNow")}</span>
          </>
        )}
      </button>
    </div>
  );
};

