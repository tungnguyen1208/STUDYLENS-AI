import React from "react";
import { ReviewItem } from "../types/index.ts";
import { formatSeconds } from "../extension/utils/time.ts";
import { RotateCcw, CheckCircle, Clock, Youtube, Sparkles, BookOpen } from "lucide-react";
import { useI18n } from "../i18n/index.tsx";

interface ReviewCardProps {
  item: ReviewItem;
  onSeek: (timestamp: number) => void;
  onMastered: (id: string) => void;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  item,
  onSeek,
  onMastered,
}) => {
  const { t } = useI18n();
  const isMastered = item.mastered || item.status === "mastered";

  return (
    <div
      id={`review-card-${item.id}`}
      className={`rounded-xl border p-4 transition-all ${
        isMastered
          ? "bg-[var(--bg-card)] border-[var(--border-subtle)] opacity-70"
          : "bg-[var(--bg-card)] border-[var(--border-subtle)] hover:border-[var(--border-strong)] shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                isMastered
                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                  : "bg-red-500/10 text-red-500 border border-red-500/20"
              }`}
            >
              {isMastered ? t("reviewCard.mastered") : t("reviewCard.needsReview")}
            </span>

            <div className="flex items-center gap-1 font-mono text-[11px] text-[var(--text-secondary)]">
              <Clock className="w-3 h-3 text-red-500" />
              <span>{formatSeconds(item.timestamp)}</span>
            </div>
          </div>

          <h4 className="text-sm font-semibold text-[var(--text-primary)] truncate mt-1">
            {item.topic || item.questionSummary || t("reviewCard.defaultTopic")}
          </h4>

          {item.videoTitle && (
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] truncate">
              <Youtube className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <span className="truncate">{item.videoTitle}</span>
            </div>
          )}

          {item.snippet && (
            <p className="text-xs text-[var(--text-secondary)] line-clamp-2 bg-[var(--bg-input)] p-2 rounded-lg border border-[var(--border-subtle)] mt-2 font-sans italic">
              "{item.snippet}"
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
        <button
          id={`btn-seek-review-${item.id}`}
          onClick={() => onSeek(item.timestamp)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-input)] hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-red-500" />
          <span>{t("reviewCard.jumpTo")} {formatSeconds(item.timestamp)}</span>
        </button>

        {!isMastered && (
          <button
            id={`btn-master-review-${item.id}`}
            onClick={() => onMastered(item.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-500 border border-emerald-500/30 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{t("reviewCard.markMastered")}</span>
          </button>
        )}
      </div>
    </div>
  );
};
