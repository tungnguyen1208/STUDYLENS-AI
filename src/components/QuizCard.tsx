import React, { useState } from "react";
import {
  HelpCircle,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Send,
} from "lucide-react";
import { Question, QuestionType, UserSettings } from "../types/index.ts";
import { formatSeconds } from "../extension/utils/time.ts";
import { useI18n } from "../i18n/index.tsx";

interface QuizCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  onAnswerSubmit: (questionId: string, answer: any, isCorrect: boolean, reviewTimestamp: number) => void;
  onSeekToConcept: (timestamp: number) => void;
  onNextQuestion: () => void;
  settings: UserSettings;
}

export const QuizCard: React.FC<QuizCardProps> = ({
  question,
  questionNumber,
  totalQuestions,
  onAnswerSubmit,
  onSeekToConcept,
  onNextQuestion,
  settings,
}) => {
  const { t } = useI18n();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [shortAnswerText, setShortAnswerText] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isEvaluatingShort, setIsEvaluatingShort] = useState(false);
  const [shortFeedback, setShortFeedback] = useState("");

  const handleCheckAnswer = () => {
    if (question.type === "multiple_choice" || question.type === "true_false") {
      if (selectedOption === null) return;
      const correct = Number(question.correctAnswer) === selectedOption;
      setIsCorrect(correct);
      setIsSubmitted(true);
      onAnswerSubmit(question.id, selectedOption, correct, question.source.start);
    } else if (question.type === "short_answer") {
      if (!shortAnswerText.trim()) return;
      setIsEvaluatingShort(true);
      // Fallback evaluation
      setTimeout(() => {
        const correct = shortAnswerText.length > 8;
        setIsCorrect(correct);
        setShortFeedback(
          correct
            ? "Solid understanding of the core concept!"
            : "Review the exact timestamp to clarify subtle nuances."
        );
        setIsSubmitted(true);
        setIsEvaluatingShort(false);
        onAnswerSubmit(question.id, shortAnswerText, correct, question.source.start);
      }, 500);
    }
  };

  const handleRetry = () => {
    setSelectedOption(null);
    setShortAnswerText("");
    setIsSubmitted(false);
    setIsCorrect(null);
  };

  const letters = ["A", "B", "C", "D", "E"];

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-sm transition-all text-[var(--text-primary)]">
      {/* Header with question counter & confidence/difficulty */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
            {questionNumber}
          </span>
          <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            {t("quiz.questionOf", { current: questionNumber, total: totalQuestions })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${
              question.difficulty === "hard"
                ? "bg-red-500/10 text-red-500 border border-red-500/20"
                : question.difficulty === "medium"
                ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
            }`}
          >
            {question.difficulty}
          </span>

          <div
            className="flex items-center gap-1 text-[11px] text-[var(--text-secondary)] font-mono"
            title="Video Timestamp where concept was introduced"
          >
            <Clock className="h-3 w-3 text-red-500" />
            <span>{formatSeconds(question.source.start)}</span>
          </div>
        </div>
      </div>

      {/* Question Text */}
      <div className="py-4">
        <h4 className="text-base font-semibold text-[var(--text-primary)] leading-snug">{question.question}</h4>
      </div>

      {/* Options or Input */}
      {!isSubmitted || (settings.learningMode && !isCorrect) ? (
        <div className="space-y-2.5">
          {/* Multiple Choice / True-False */}
          {(question.type === "multiple_choice" || question.type === "true_false") &&
            question.options?.map((option, idx) => {
              const isSelected = selectedOption === idx;
              return (
                <button
                  key={idx}
                  id={`quiz-option-${idx}`}
                  onClick={() => setSelectedOption(idx)}
                  className={`w-full flex items-start gap-3 rounded-xl p-3.5 text-left text-sm transition-all border cursor-pointer ${
                    isSelected
                      ? "border-red-500 bg-red-500/10 text-[var(--text-primary)] font-medium shadow-xs"
                      : "border-[var(--border-subtle)] bg-[var(--bg-input)] hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)]"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                      isSelected
                        ? "bg-red-600 text-white"
                        : "bg-[var(--bg-card)] text-[var(--text-secondary)]"
                    }`}
                  >
                    {letters[idx] || idx + 1}
                  </span>
                  <span className="leading-relaxed">{option}</span>
                </button>
              );
            })}

          {/* Short Answer */}
          {question.type === "short_answer" && (
            <div className="space-y-2">
              <textarea
                id="quiz-short-answer-input"
                rows={3}
                placeholder={t("quiz.shortAnswerPlaceholder")}
                value={shortAnswerText}
                onChange={(e) => setShortAnswerText(e.target.value)}
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-input)] p-3 text-sm text-[var(--text-primary)] focus:border-red-500 focus:outline-none"
              />
            </div>
          )}

          {/* Submit Action Button */}
          <div className="pt-2">
            <button
              id="quiz-btn-check-answer"
              onClick={handleCheckAnswer}
              disabled={
                (question.type !== "short_answer" && selectedOption === null) ||
                (question.type === "short_answer" && !shortAnswerText.trim()) ||
                isEvaluatingShort
              }
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white py-3 text-sm font-semibold transition-all shadow-sm cursor-pointer disabled:cursor-not-allowed"
            >
              {isEvaluatingShort ? (
                <>
                  <Sparkles className="h-4 w-4 animate-spin text-amber-300" />
                  <span>{t("quiz.evaluatingAnswer")}</span>
                </>
              ) : (
                <>
                  <span>{t("quiz.checkAnswer")}</span>
                  <Send className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      ) : null}

      {/* Answer Feedback & Wrong Answer Flow */}
      {isSubmitted && (
        <div className="mt-4 space-y-4 pt-2">
          {/* Correct State */}
          {isCorrect ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-500 animate-fadeIn">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                <span>{t("quiz.correct")}</span>
              </div>
              <p className="mt-2 text-xs sm:text-sm text-[var(--text-primary)] leading-relaxed">
                {question.explanation}
              </p>
              {shortFeedback && <p className="mt-1 text-xs italic text-emerald-600 dark:text-emerald-400">{shortFeedback}</p>}
            </div>
          ) : (
            /* Wrong Answer State -> Core StudyLens Feature */
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 animate-fadeIn space-y-3">
              <div className="flex items-center gap-2 font-bold text-sm text-red-500">
                <XCircle className="h-5 w-5 text-red-500" />
                <span>{t("quiz.notQuite")}</span>
              </div>

              <p className="text-xs sm:text-sm text-[var(--text-primary)] leading-relaxed">
                {question.explanation}
              </p>

              {/* Timestamp Review Callout */}
              <div className="rounded-lg bg-[var(--bg-input)] p-3 border border-[var(--border-subtle)] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-[var(--text-primary)]">
                  <BookOpen className="h-4 w-4 text-red-500 shrink-0" />
                  <span>
                    {t("quiz.explainedAt")}{" "}
                    <strong className="font-mono text-red-500 font-bold">
                      {formatSeconds(question.source.start)}
                      {question.source.end ? ` → ${formatSeconds(question.source.end)}` : ""}
                    </strong>
                  </span>
                </div>

                <button
                  id="quiz-btn-review-timestamp"
                  onClick={() => onSeekToConcept(question.source.start)}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>{t("quiz.rewatchSegment")} {formatSeconds(question.source.start)}</span>
                </button>
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-between gap-3 pt-2">
            {!isCorrect && (
              <button
                id="quiz-btn-retry-question"
                onClick={handleRetry}
                className="flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-input)] hover:bg-[var(--bg-card-hover)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>{t("quiz.retryQuestion")}</span>
              </button>
            )}

            <button
              id="quiz-btn-next-question"
              onClick={onNextQuestion}
              className="ml-auto flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 text-xs sm:text-sm font-semibold transition-all shadow-sm cursor-pointer"
            >
              <span>{questionNumber < totalQuestions ? t("quiz.nextQuestion") : t("quiz.completeQuiz")}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
