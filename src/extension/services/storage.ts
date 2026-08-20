import {
  UserSettings,
  DEFAULT_SETTINGS,
  LearningStats,
  LearningSession,
  ReviewItem,
  QuizResult,
} from "../../types/index.ts";

const INITIAL_STATS: LearningStats = {
  videosStudied: 0,
  totalStudySeconds: 0,
  questionsAnswered: 0,
  correctAnswers: 0,
  accuracyRate: 0,
  streakDays: 1,
  xp: 0,
  lastStudyDate: new Date().toISOString().split("T")[0],
  topicsNeedingReviewCount: 0,
};

/**
 * Storage Service
 * Persists user study settings, learning history, quiz review queue, and stats
 */
export class StorageService {
  /**
   * Get settings
   */
  public static async getSettings(): Promise<UserSettings> {
    const data = await this.getItem<UserSettings>("user_settings");
    return data ? { ...DEFAULT_SETTINGS, ...data } : DEFAULT_SETTINGS;
  }

  /**
   * Save settings
   */
  public static async saveSettings(settings: UserSettings): Promise<void> {
    await this.setItem("user_settings", settings);
  }

  /**
   * Get aggregate stats
   */
  public static async getStats(): Promise<LearningStats> {
    const stats = await this.getItem<LearningStats>("learning_stats");
    return stats ? { ...INITIAL_STATS, ...stats } : INITIAL_STATS;
  }

  /**
   * Save aggregate stats
   */
  public static async saveStats(stats: LearningStats): Promise<void> {
    await this.setItem("learning_stats", stats);
  }

  /**
   * Get learning sessions for all YouTube videos studied
   */
  public static async getSessions(): Promise<LearningSession[]> {
    const sessions = await this.getItem<LearningSession[]>("learning_sessions");
    return Array.isArray(sessions) ? sessions : [];
  }

  /**
   * Save or update a specific session
   */
  public static async saveSession(session: LearningSession): Promise<void> {
    const sessions = await this.getSessions();
    const index = sessions.findIndex((s) => s.videoId === session.videoId);
    if (index >= 0) {
      sessions[index] = session;
    } else {
      sessions.unshift(session);
    }
    await this.setItem("learning_sessions", sessions);
  }

  /**
   * Get a session for a specific YouTube videoId
   */
  public static async getSession(videoId: string): Promise<LearningSession | null> {
    const sessions = await this.getSessions();
    return sessions.find((s) => s.videoId === videoId) || null;
  }

  /**
   * Get review queue items (missed concepts anchored to video timestamps)
   */
  public static async getReviewItems(): Promise<ReviewItem[]> {
    const items = await this.getItem<ReviewItem[]>("review_items");
    return Array.isArray(items) ? items : [];
  }

  /**
   * Add or update review items from a quiz result
   */
  public static async addReviewItem(item: ReviewItem): Promise<void> {
    const items = await this.getReviewItems();
    const existingIndex = items.findIndex(
      (i) => i.videoId === item.videoId && Math.abs(i.timestamp - item.timestamp) < 30
    );

    if (existingIndex >= 0) {
      items[existingIndex].mistakes += 1;
      items[existingIndex].lastAttemptAt = new Date().toISOString();
      items[existingIndex].status = "pending";
      items[existingIndex].mastered = false;
    } else {
      items.unshift(item);
    }

    await this.setItem("review_items", items);

    // Update stats count
    const stats = await this.getStats();
    stats.topicsNeedingReviewCount = items.filter((i) => !i.mastered).length;
    await this.saveStats(stats);
  }

  /**
   * Mark review item as mastered
   */
  public static async markReviewMastered(id: string): Promise<void> {
    const items = await this.getReviewItems();
    const target = items.find((i) => i.id === id);
    if (target) {
      target.mastered = true;
      target.status = "mastered";
      await this.setItem("review_items", items);

      const stats = await this.getStats();
      stats.topicsNeedingReviewCount = items.filter((i) => !i.mastered).length;
      stats.xp += 25; // Bonus XP for mastering a review topic
      await this.saveStats(stats);
    }
  }

  /**
   * Generic Chrome Storage / LocalStorage getter
   */
  private static getItem<T>(key: string): Promise<T | null> {
    return new Promise((resolve) => {
      if (typeof chrome !== "undefined" && chrome.storage?.local) {
        chrome.storage.local.get([key], (res: any) => {
          resolve(res?.[key] || null);
        });
      } else {
        try {
          const item = localStorage.getItem(`studylens_${key}`);
          resolve(item ? JSON.parse(item) : null);
        } catch {
          resolve(null);
        }
      }
    });
  }

  /**
   * Generic Chrome Storage / LocalStorage setter
   */
  private static setItem<T>(key: string, value: T): Promise<void> {
    return new Promise((resolve) => {
      if (typeof chrome !== "undefined" && chrome.storage?.local) {
        chrome.storage.local.set({ [key]: value }, () => resolve());
      } else {
        try {
          localStorage.setItem(`studylens_${key}`, JSON.stringify(value));
        } catch {}
        resolve();
      }
    });
  }
}
