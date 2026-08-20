import React from "react";
import { LearningStats } from "../types/index.ts";
import { formatSeconds } from "../extension/utils/time.ts";
import { Award, Zap, Clock, CheckCircle2, Flame, RotateCcw, Youtube, Target, Sparkles } from "lucide-react";
import { useI18n } from "../i18n/index.tsx";

interface StudyStatsProps {
  stats: LearningStats;
}

export const StudyStats: React.FC<StudyStatsProps> = ({ stats }) => {
  const { t } = useI18n();
  // Calculate Level based on XP (every 100 XP is a level)
  const currentLevel = Math.floor(stats.xp / 100) + 1;
  const levelProgress = stats.xp % 100;

  return (
    <div id="study-stats-view" className="space-y-4">
      {/* Level Progression Card */}
      <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500 font-bold text-sm">
              {t("studyStats.level")} {currentLevel}
            </div>
            <div>
              <div className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                <span>{t("studyStats.activeScholar")}</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <div className="text-[11px] text-[var(--text-secondary)]">{t("studyStats.totalXpEarned", { xp: stats.xp })}</div>
            </div>
          </div>

          <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/30 rounded-lg text-xs font-bold">
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span>{stats.streakDays} {stats.streakDays === 1 ? t("common.day") : t("common.days")} {t("studyStats.streakDays")}</span>
          </div>
        </div>

        {/* Level XP Progress Bar */}
        <div className="space-y-1">
          <div className="w-full bg-[var(--bg-input)] h-2 rounded-full overflow-hidden border border-[var(--border-subtle)]">
            <div
              className="bg-gradient-to-r from-red-600 to-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${levelProgress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
            <span>{t("studyStats.xpToNextLevel", { current: levelProgress, nextLevel: currentLevel + 1 })}</span>
            <span>{t("studyStats.xpNeeded", { needed: 100 - levelProgress })}</span>
          </div>
        </div>
      </div>

      {/* Grid of Key Performance Indicators */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
            <Clock className="w-3.5 h-3.5 text-red-500" />
            <span>{t("studyStats.totalTime")}</span>
          </div>
          <div className="text-base font-bold text-[var(--text-primary)]">
            {formatSeconds(stats.totalStudySeconds)}
          </div>
        </div>

        <div className="p-3 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
            <Target className="w-3.5 h-3.5 text-emerald-500" />
            <span>{t("studyStats.accuracy")}</span>
          </div>
          <div className="text-base font-bold text-[var(--text-primary)]">
            {stats.accuracyRate > 0 ? `${stats.accuracyRate}%` : "100%"}
          </div>
        </div>

        <div className="p-3 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
            <span>{t("studyStats.questionsSolved")}</span>
          </div>
          <div className="text-base font-bold text-[var(--text-primary)]">
            {stats.correctAnswers} / {stats.questionsAnswered}
          </div>
        </div>

        <div className="p-3 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
            <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
            <span>{t("studyStats.reviewQueue")}</span>
          </div>
          <div className="text-base font-bold text-[var(--text-primary)]">
            {stats.topicsNeedingReviewCount} {t("studyStats.pending")}
          </div>
        </div>
      </div>
    </div>
  );
};
