import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Download, Flame, Award, BookOpen, Layers, Settings as SettingsIcon, Youtube, Globe, ChevronDown, Check } from "lucide-react";
import { LearningStats } from "../types/index.ts";
import { useI18n, LanguageCode } from "../i18n/index.tsx";

interface NavbarProps {
  activeView: "studio" | "extension-export";
  setActiveView: (view: "studio" | "extension-export") => void;
  stats: LearningStats;
  onOpenSettings: () => void;
  isDemoMode: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  setActiveView,
  stats,
  onOpenSettings,
  isDemoMode,
}) => {
  const { t, language, setLanguage, languages, currentLanguageInfo } = useI18n();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border-subtle)] bg-[var(--bg-panel)] backdrop-blur-md text-[var(--text-primary)] transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white shadow-sm shadow-red-500/20">
            <Youtube className="h-5 w-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base sm:text-lg text-[var(--text-primary)] tracking-tight">{t("common.appName")}</span>
              <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-500 border border-red-500/20">
                {t("common.companionBadge")}
              </span>
              {isDemoMode && (
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-500 border border-amber-500/30">
                  {t("common.demoBadge")}
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-secondary)] hidden sm:block">
              {t("common.tagline")}
            </p>
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 rounded-xl bg-[var(--bg-app)] p-1 border border-[var(--border-subtle)]">
          <button
            id="nav-btn-studio"
            onClick={() => setActiveView("studio")}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              activeView === "studio"
                ? "bg-[var(--bg-panel)] text-[var(--text-primary)] shadow-sm border border-[var(--border-subtle)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <BookOpen className="h-4 w-4 text-red-500" />
            <span>{t("navbar.interactiveStudio")}</span>
          </button>
          <button
            id="nav-btn-extension"
            onClick={() => setActiveView("extension-export")}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              activeView === "extension-export"
                ? "bg-[var(--bg-panel)] text-[var(--text-primary)] shadow-sm border border-[var(--border-subtle)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Layers className="h-4 w-4 text-indigo-500" />
            <span>{t("navbar.extensionExport")}</span>
          </button>
        </div>

        {/* Gamification Stats & Language & Settings */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Streak */}
          <div className="flex items-center gap-1.5 rounded-lg bg-orange-500/10 px-2.5 py-1 text-xs font-semibold text-orange-500 border border-orange-500/30">
            <Flame className="h-4 w-4 text-orange-500 fill-orange-500" />
            <span>{stats.streakDays} {t("common.streakDays")}</span>
          </div>

          {/* XP */}
          <div className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-500 border border-amber-500/30">
            <Award className="h-4 w-4 text-amber-500 fill-amber-500" />
            <span>{stats.xp} XP</span>
          </div>

          {/* Language Selector Dropdown */}
          <div className="relative" ref={langMenuRef}>
            <button
              id="nav-btn-language-menu"
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] px-2.5 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors cursor-pointer"
              title={t("navbar.changeLanguage")}
            >
              <span className="text-sm">{currentLanguageInfo.flag}</span>
              <span className="hidden md:inline">{currentLanguageInfo.nativeName}</span>
              <ChevronDown className={`h-3 w-3 text-[var(--text-secondary)] transition-transform duration-200 ${isLangOpen ? "rotate-180" : ""}`} />
            </button>

            {isLangOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-1.5 shadow-xl backdrop-blur-xl z-50 animate-fadeIn">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border-subtle)] mb-1">
                  {t("navbar.changeLanguage")}
                </div>
                <div className="max-h-60 overflow-y-auto space-y-0.5 scrollbar-thin">
                  {languages.map((l) => {
                    const isSelected = l.code === language;
                    return (
                      <button
                        key={l.code}
                        id={`lang-select-${l.code}`}
                        onClick={() => {
                          setLanguage(l.code);
                          setIsLangOpen(false);
                        }}
                        className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-red-500/10 text-red-500 font-bold"
                            : "text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">{l.flag}</span>
                          <span>{l.nativeName}</span>
                        </div>
                        {isSelected && <Check className="h-3.5 w-3.5 text-red-500" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Settings Button */}
          <button
            id="nav-btn-settings"
            onClick={onOpenSettings}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            title={t("navbar.openSettings")}
          >
            <SettingsIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
