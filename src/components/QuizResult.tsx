import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import {
  Award,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Flame,
} from "lucide-react";
import { Question, QuizSubmission } from "../types/index.ts";
import { formatSeconds } from "../extension/utils/time.ts";
import { useI18n } from "../i18n/index.tsx";

interface QuizResultProps {
  questions: Question[];
  submissions: Record<string, QuizSubmission>;
  onSeekToTimestamp: (timestamp: number) => void;
  onContinueLearning: () => void;
  onRetakeQuiz: () => void;
  segmentStart: number;
  segmentEnd: number;
}

export const QuizResult: React.FC<QuizResultProps> = ({
  questions,
  submissions,
  onSeekToTimestamp,
  onContinueLearning,
  onRetakeQuiz,
  segmentStart,
  segmentEnd,
}) => {
  const { t } = useI18n();
  const total = questions.length;
  const correctCount = questions.filter((q) => submissions[q.id]?.isCorrect).length;
  const scorePercent = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const isPassed = scorePercent >= 65;

  useEffect(() => {
    if (isPassed) {
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ["#EF4444", "#F59E0B", "#10B981", "#3B82F6"],
        });
      } catch (e) {
        console.log("Confetti trigger:", e);
      }
    }
  }, [isPassed]);

  const missedQuestions = questions.filter((q) => !submissions[q.id]?.isCorrect);

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-sm space-y-6 text-[var(--text-primary)]">
      {/* Header Result Badge */}
      <div className="text-center space-y-2">
        <div
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${
            isPassed
              ? "bg-emerald-500/20 text-emerald-500 shadow-sm shadow-emerald-500/20"
              : "bg-amber-500/20 text-amber-500 shadow-sm shadow-amber-500/20"
          }`}
        >
          {isPassed ? <Award className="h-9 w-9" /> : <AlertCircle className="h-9 w-9" />}
        </div>

        <h3 className="text-xl font-bold text-[var(--text-primary)]">
          {isPassed ? t("quizResult.passedTitle") : t("quizResult.failedTitle")}
        </h3>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
          {t("quizResult.segmentScoreSummary", {
            start: formatSeconds(segmentStart),
            end: formatSeconds(segmentEnd),
            score: correctCount,
            total: total,
            percent: scorePercent,
          })}
        </p>

        {/* Gamification Reward */}
        <div className="inline-flex items-center gap-2 rounded-full bg-red-500/10 px-3.5 py-1 text-xs font-semibold text-red-500 border border-red-500/20 mt-1">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          <span>{t("quizResult.xpEarned", { xp: correctCount * 10 })}</span>
          <span>•</span>
          <span className="flex items-center gap-1 text-orange-500">
            <Flame className="h-3 w-3 fill-orange-500" /> {t("quizResult.streakActive")}
          </span>
        </div>
      </div>

      {/* Topics Needing Review List */}
      {missedQuestions.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              {t("quizResult.conceptsToReview", { count: missedQuestions.length })}
            </h4>
          </div>

          <div className="space-y-2">
            {missedQuestions.map((q, idx) => (
              <div
                key={q.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="font-semibold text-[var(--text-primary)] line-clamp-1">{q.question}</div>
                  <div className="text-[var(--text-secondary)] line-clamp-1">{q.explanation}</div>
                </div>

                <button
                  id={`result-review-btn-${idx}`}
                  onClick={() => onSeekToTimestamp(q.source.start)}
                  className="shrink-0 flex items-center justify-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>{t("quizResult.reviewAtTimestamp", { time: formatSeconds(q.source.start) })}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-2">
        <button
          id="result-retake-btn"
          onClick={onRetakeQuiz}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-input)] hover:bg-[var(--bg-card-hover)] py-3 text-xs sm:text-sm font-semibold text-[var(--text-primary)] transition-colors cursor-pointer"
        >
          <RotateCcw className="h-4 w-4" />
          <span>{t("quizResult.retakeQuiz")}</span>
        </button>

        <button
          id="result-continue-btn"
          onClick={onContinueLearning}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-500 py-3 text-xs sm:text-sm font-semibold text-white transition-colors shadow-sm cursor-pointer"
        >
          <span>{t("quizResult.continueLearning")}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
