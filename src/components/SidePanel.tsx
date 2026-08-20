import React, { useState } from "react";
import {
  YouTubeVideoInfo,
  StudySegment,
  Question,
  QuizSubmission,
  QuizResult as QuizResultType,
  ReviewItem,
  LearningStats,
  UserSettings,
  LearningSession,
  ConnectionStatus,
  DetectedConcept,
} from "../types/index.ts";
import { VideoHeader } from "./VideoHeader.tsx";
import { StudyProgress } from "./StudyProgress.tsx";
import { QuizCard } from "./QuizCard.tsx";
import { QuizResult } from "./QuizResult.tsx";
import { ReviewCard } from "./ReviewCard.tsx";
import { LearningTimeline } from "./LearningTimeline.tsx";
import { StudyStats } from "./StudyStats.tsx";
import { SettingsView } from "./Settings.tsx";
import {
  BookOpen,
  History,
  BarChart2,
  Settings,
  RotateCcw,
  Sparkles,
  Youtube,
  Zap,
  CheckCircle,
} from "lucide-react";
import { useI18n } from "../i18n/index.tsx";

interface SidePanelProps {
  video: YouTubeVideoInfo | null;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  connectionStatus?: ConnectionStatus;
  segments: StudySegment[];
  currentSegment: StudySegment | null;
  totalWatchedSeconds: number;
  stats: LearningStats;
  settings: UserSettings;
  reviewItems: ReviewItem[];
  sessions: LearningSession[];
  activeQuiz: {
    segment: StudySegment;
    questions: Question[];
    currentIndex: number;
    submissions: Record<string, QuizSubmission>;
    isCompleted: boolean;
  } | null;
  isLoadingQuiz: boolean;
  contextReadiness?: number;
  activeConcept?: DetectedConcept | null;
  detectedConcepts?: DetectedConcept[];
  insufficientContextMessage?: string | null;
  onTriggerCheck: (segment?: StudySegment) => void;
  onAnswerSubmit: (
    questionId: string,
    answer: any,
    isCorrect: boolean,
    reviewTimestamp: number
  ) => void;
  onNextQuestion: () => void;
  onSeek: (seconds: number) => void;
  onRetakeQuiz: () => void;
  onContinueLearning: () => void;
  onMasterReviewItem: (id: string) => void;
  onUpdateSettings: (updated: Partial<UserSettings>) => void;
  onSelectSession?: (session: LearningSession) => void;
  onRefresh?: () => void;
}

export const SidePanel: React.FC<SidePanelProps> = ({
  video,
  currentTime,
  duration,
  isPlaying,
  connectionStatus = "synced",
  segments,
  currentSegment,
  totalWatchedSeconds,
  stats,
  settings,
  reviewItems,
  sessions,
  activeQuiz,
  isLoadingQuiz,
  contextReadiness = 0.65,
  activeConcept = null,
  detectedConcepts = [],
  insufficientContextMessage = null,
  onTriggerCheck,
  onAnswerSubmit,
  onNextQuestion,
  onSeek,
  onRetakeQuiz,
  onContinueLearning,
  onMasterReviewItem,
  onUpdateSettings,
  onSelectSession,
  onRefresh,
}) => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<"study" | "review" | "history" | "stats" | "settings">("study");

  const pendingReviews = reviewItems.filter((r) => !r.mastered);

  return (
    <div id="studylens-sidepanel" className="h-full flex flex-col bg-[var(--bg-panel)] text-[var(--text-primary)] font-sans select-none overflow-hidden">
      {/* 1. Synchronized Video Header */}
      <VideoHeader
        video={video}
        currentTime={currentTime}
        duration={duration}
        isPlaying={isPlaying}
        connectionStatus={connectionStatus}
        onRefresh={onRefresh}
      />

      {/* 2. Top Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-app)] px-2">
        <button
          id="tab-btn-study"
          onClick={() => setActiveTab("study")}
          className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === "study"
              ? "border-red-500 text-red-500 font-bold"
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>{t("common.study")}</span>
        </button>

        <button
          id="tab-btn-review"
          onClick={() => setActiveTab("review")}
          className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 text-xs font-semibold border-b-2 transition-all cursor-pointer relative ${
            activeTab === "review"
              ? "border-red-500 text-red-500 font-bold"
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{t("common.review")}</span>
          {pendingReviews.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center font-bold">
              {pendingReviews.length}
            </span>
          )}
        </button>

        <button
          id="tab-btn-history"
          onClick={() => setActiveTab("history")}
          className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === "history"
              ? "border-red-500 text-red-500 font-bold"
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>{t("common.history")}</span>
        </button>

        <button
          id="tab-btn-stats"
          onClick={() => setActiveTab("stats")}
          className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === "stats"
              ? "border-red-500 text-red-500 font-bold"
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          <span>{t("common.stats")}</span>
        </button>

        <button
          id="tab-btn-settings"
          onClick={() => setActiveTab("settings")}
          className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === "settings"
              ? "border-red-500 text-red-500 font-bold"
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>{t("common.settings")}</span>
        </button>
      </div>

      {/* 3. Main Dynamic Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* TAB 1: STUDY */}
        {activeTab === "study" && (
          <div className="space-y-4 animate-fadeIn">
            {/* If Quiz is in progress */}
            {activeQuiz && !activeQuiz.isCompleted && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-red-500 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>{t("quiz.activeCheckpoint")}</span>
                  </span>
                  <button
                    onClick={onContinueLearning}
                    className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline cursor-pointer"
                  >
                    {t("quiz.backToTimeline")}
                  </button>
                </div>

                {activeQuiz.questions[activeQuiz.currentIndex] && (
                  <QuizCard
                    question={activeQuiz.questions[activeQuiz.currentIndex]}
                    questionNumber={activeQuiz.currentIndex + 1}
                    totalQuestions={activeQuiz.questions.length}
                    onAnswerSubmit={onAnswerSubmit}
                    onSeekToConcept={onSeek}
                    onNextQuestion={onNextQuestion}
                    settings={settings}
                  />
                )}
              </div>
            )}

            {/* If Quiz is completed and showing results */}
            {activeQuiz && activeQuiz.isCompleted && (
              <QuizResult
                questions={activeQuiz.questions}
                submissions={activeQuiz.submissions}
                onSeekToTimestamp={onSeek}
                onContinueLearning={onContinueLearning}
                onRetakeQuiz={onRetakeQuiz}
                segmentStart={activeQuiz.segment.startTime}
                segmentEnd={activeQuiz.segment.endTime}
              />
            )}

            {/* Normal Study Overview */}
            {!activeQuiz && (
              <>
                <StudyProgress
                  currentSegment={currentSegment}
                  totalWatchedSeconds={totalWatchedSeconds}
                  xp={stats.xp}
                  streakDays={stats.streakDays}
                  settings={settings}
                  onTriggerCheck={() => onTriggerCheck(currentSegment || undefined)}
                  isLoadingQuiz={isLoadingQuiz}
                  contextReadiness={contextReadiness}
                  activeConcept={activeConcept}
                  detectedConcepts={detectedConcepts}
                  insufficientContextMessage={insufficientContextMessage}
                />

                <LearningTimeline
                  segments={segments}
                  currentVideoTime={currentTime}
                  onSelectSegment={(seg) => onTriggerCheck(seg)}
                  onSeek={onSeek}
                />
              </>
            )}
          </div>
        )}

        {/* TAB 2: REVIEW QUEUE */}
        {activeTab === "review" && (
          <div className="space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                  {t("reviewQueue.title")}
                </h3>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  {t("reviewQueue.subtitle")}
                </p>
              </div>
              <span className="text-xs font-semibold text-[var(--text-secondary)]">
                {pendingReviews.length} {t("reviewQueue.toReviewCount")}
              </span>
            </div>

            {reviewItems.length === 0 ? (
              <div className="p-8 text-center bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl space-y-2">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
                <h4 className="text-sm font-semibold text-[var(--text-primary)]">{t("reviewQueue.queueClearTitle")}</h4>
                <p className="text-xs text-[var(--text-secondary)]">
                  {t("reviewQueue.queueClearDesc")}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {reviewItems.map((item) => (
                  <ReviewCard
                    key={item.id}
                    item={item}
                    onSeek={onSeek}
                    onMastered={onMasterReviewItem}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: HISTORY */}
        {activeTab === "history" && (
          <div className="space-y-3 animate-fadeIn">
            <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
              {t("history.title")}
            </h3>

            {sessions.length === 0 ? (
              <div className="p-8 text-center bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl space-y-2">
                <Youtube className="w-8 h-8 text-[var(--text-muted)] mx-auto" />
                <h4 className="text-sm font-semibold text-[var(--text-primary)]">{t("history.noHistoryTitle")}</h4>
                <p className="text-xs text-[var(--text-secondary)]">
                  {t("history.noHistoryDesc")}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {sessions.map((sess) => (
                  <div
                    key={sess.videoId}
                    className="p-3 bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] rounded-xl space-y-2 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-[var(--text-primary)] truncate" title={sess.title}>
                          {sess.title}
                        </h4>
                        <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                          {sess.channel || "YouTube"} • {sess.quizzes?.length || 0} {t("history.quizzesCompleted")}
                        </div>
                      </div>

                      {onSelectSession && (
                        <button
                          onClick={() => onSelectSession(sess)}
                          className="px-2.5 py-1 bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-500/30 rounded-lg text-xs font-semibold shrink-0 cursor-pointer"
                        >
                          {t("history.openLesson")}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: STATS */}
        {activeTab === "stats" && (
          <div className="animate-fadeIn">
            <StudyStats stats={stats} />
          </div>
        )}

        {/* TAB 5: SETTINGS */}
        {activeTab === "settings" && (
          <div className="animate-fadeIn">
            <SettingsView settings={settings} onUpdate={onUpdateSettings} />
          </div>
        )}
      </div>
    </div>
  );
};
