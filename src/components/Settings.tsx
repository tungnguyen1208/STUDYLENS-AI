import React from "react";
import { UserSettings, ThemeMode } from "../types/index.ts";
import { Sun, Moon, Monitor, Sliders, Bell, Volume2, ShieldCheck, Brain, Play, Check } from "lucide-react";
import { useI18n } from "../i18n/index.tsx";

interface SettingsProps {
  settings: UserSettings;
  onUpdate: (updated: Partial<UserSettings>) => void;
}

export const SettingsView: React.FC<SettingsProps> = ({ settings, onUpdate }) => {
  const { t } = useI18n();
  const currentTheme = settings.theme || "system";

  return (
    <div id="settings-view" className="space-y-5">
      {/* Theme / Appearance Setting */}
      <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-[var(--text-primary)] block">
            {t("settings.appearanceTheme")}
          </label>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)] px-2 py-0.5 rounded bg-[var(--accent-glow)]">
            {currentTheme}
          </span>
        </div>
        <p className="text-[11px] text-[var(--text-secondary)]">
          {t("settings.appearanceDesc")}
        </p>

        <div className="grid grid-cols-3 gap-2 pt-1">
          <button
            id="theme-btn-light"
            onClick={() => onUpdate({ theme: "light" })}
            className={`py-2 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              currentTheme === "light"
                ? "bg-red-600 text-white border-red-500 shadow-sm"
                : "bg-[var(--bg-input)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>{t("settings.themeLight")}</span>
          </button>

          <button
            id="theme-btn-dark"
            onClick={() => onUpdate({ theme: "dark" })}
            className={`py-2 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              currentTheme === "dark"
                ? "bg-red-600 text-white border-red-500 shadow-sm"
                : "bg-[var(--bg-input)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>{t("settings.themeDark")}</span>
          </button>

          <button
            id="theme-btn-system"
            onClick={() => onUpdate({ theme: "system" })}
            className={`py-2 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              currentTheme === "system"
                ? "bg-red-600 text-white border-red-500 shadow-sm"
                : "bg-[var(--bg-input)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>{t("settings.themeSystem")}</span>
          </button>
        </div>
      </div>

      {/* Checkpoint Frequency Setting (Context Aware) */}
      <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl space-y-2.5">
        <label className="text-xs font-semibold text-[var(--text-primary)] block">
          {t("studyProgress.interval")} (Context-Aware Checkpoints)
        </label>
        <p className="text-[11px] text-[var(--text-secondary)]">
          {settings.language === "vi"
            ? "Điều chỉnh độ nhạy của AI khi nhận diện các khái niệm kiến thức độc lập trong bài giảng."
            : "Control how frequently AI triggers checkpoints based on concept completeness."}
        </p>

        <div className="grid grid-cols-3 gap-2 pt-1">
          {(["high", "balanced", "low"] as const).map((freq) => {
            const isSelected = (settings.checkpointFrequency || "balanced") === freq;
            const labels: Record<string, string> = {
              high: settings.language === "vi" ? "⚡ Chi tiết (Nhiều)" : "⚡ High (Detailed)",
              balanced: settings.language === "vi" ? "⚖️ Cân bằng" : "⚖️ Balanced",
              low: settings.language === "vi" ? "🎯 Trọng tâm (Ít)" : "🎯 Low (Major)",
            };
            return (
              <button
                key={freq}
                id={`btn-frequency-${freq}`}
                onClick={() => onUpdate({ checkpointFrequency: freq })}
                className={`py-2 px-2.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-red-600 text-white border-red-500 shadow-sm"
                    : "bg-[var(--bg-input)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                }`}
              >
                {labels[freq]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Interval Setting */}
      <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl space-y-2.5">
        <label className="text-xs font-semibold text-[var(--text-primary)] block">
          {t("settings.intervalTitle")}
        </label>
        <p className="text-[11px] text-[var(--text-secondary)]">
          {t("settings.intervalDesc")}
        </p>

        <div className="grid grid-cols-4 gap-2 pt-1">
          {[5, 10, 15, 20].map((mins) => {
            const isSelected = settings.quizIntervalMinutes === mins;
            return (
              <button
                key={mins}
                id={`btn-interval-${mins}`}
                onClick={() => onUpdate({ quizIntervalMinutes: mins })}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-red-600 text-white border-red-500 shadow-sm"
                    : "bg-[var(--bg-input)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                }`}
              >
                {mins} {t("common.minutesShort")}
              </button>
            );
          })}
        </div>
      </div>

      {/* Questions Count Setting */}
      <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl space-y-2.5">
        <label className="text-xs font-semibold text-[var(--text-primary)] block">
          {t("settings.questionsCountTitle")}
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[1, 3, 5].map((count) => {
            const isSelected = settings.questionsPerQuiz === count;
            return (
              <button
                key={count}
                id={`btn-qcount-${count}`}
                onClick={() => onUpdate({ questionsPerQuiz: count })}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-red-600 text-white border-red-500 shadow-sm"
                    : "bg-[var(--bg-input)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                }`}
              >
                {count} {count === 1 ? t("settings.questionSingle") : t("settings.questionMultiple")}
              </button>
            );
          })}
        </div>
      </div>

      {/* Difficulty Setting */}
      <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl space-y-2.5">
        <label className="text-xs font-semibold text-[var(--text-primary)] block">
          {t("settings.difficultyTitle")}
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(["adaptive", "easy", "medium", "hard"] as const).map((diff) => {
            const isSelected = settings.difficulty === diff;
            const labelMap: Record<string, string> = {
              adaptive: `⚡ ${t("settings.diffAdaptive")}`,
              easy: t("settings.diffEasy"),
              medium: t("settings.diffMedium"),
              hard: t("settings.diffHard"),
            };
            return (
              <button
                key={diff}
                id={`btn-difficulty-${diff}`}
                onClick={() => onUpdate({ difficulty: diff })}
                className={`py-2 px-3 rounded-lg text-xs font-semibold capitalize border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-red-600 text-white border-red-500 shadow-sm"
                    : "bg-[var(--bg-input)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                }`}
              >
                {labelMap[diff] || diff}
              </button>
            );
          })}
        </div>
      </div>

      {/* Feature Toggles */}
      <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl space-y-3 divide-y divide-[var(--border-subtle)]">
        {/* Auto Pause */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <div className="text-xs font-semibold text-[var(--text-primary)]">{t("settings.autoPauseTitle")}</div>
            <div className="text-[11px] text-[var(--text-secondary)]">{t("settings.autoPauseDesc")}</div>
          </div>
          <button
            id="toggle-auto-pause"
            onClick={() => onUpdate({ autoPauseOnQuiz: !settings.autoPauseOnQuiz })}
            className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
              settings.autoPauseOnQuiz ? "bg-red-600" : "bg-[var(--border-strong)]"
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                settings.autoPauseOnQuiz ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Learning Mode */}
        <div className="flex items-center justify-between pt-3">
          <div>
            <div className="text-xs font-semibold text-[var(--text-primary)]">{t("settings.learningModeTitle")}</div>
            <div className="text-[11px] text-[var(--text-secondary)]">{t("settings.learningModeDesc")}</div>
          </div>
          <button
            id="toggle-learning-mode"
            onClick={() => onUpdate({ learningMode: !settings.learningMode })}
            className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
              settings.learningMode ? "bg-red-600" : "bg-[var(--border-strong)]"
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                settings.learningMode ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Sound Effects */}
        <div className="flex items-center justify-between pt-3">
          <div>
            <div className="text-xs font-semibold text-[var(--text-primary)]">{t("settings.soundEffectsTitle")}</div>
            <div className="text-[11px] text-[var(--text-secondary)]">{t("settings.soundEffectsDesc")}</div>
          </div>
          <button
            id="toggle-sound-effects"
            onClick={() => onUpdate({ soundEffects: !settings.soundEffects })}
            className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
              settings.soundEffects ? "bg-red-600" : "bg-[var(--border-strong)]"
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                settings.soundEffects ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
