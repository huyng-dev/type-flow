export interface GameSession {
  id: string;
  timestamp: number;
  language: string;
  difficulty: string;
  contentType: string;
  wordCount: number;
  wpm: number;
  accuracy: number;
  consistency: number;
  totalScore: number;
  rating: string;
  timeElapsed: number;
  perfectWords: number;
  totalWords: number;
  errorCount: number;
  achievements: string[];
}

export interface StatsSummary {
  totalSessions: number;
  totalTimeTyped: number;
  averageWpm: number;
  averageAccuracy: number;
  averageConsistency: number;
  bestWpm: number;
  bestAccuracy: number;
  totalWordsTyped: number;
  totalAchievements: number;
  favoriteLanguage: string;
  favoriteDifficulty: string; // Fixed typo from "favoritedifficulty"
  improvementRate: number;
  currentStreak: number;
  longestStreak: number;
}

export interface LanguageStats {
  language: string;
  sessions: number;
  averageWpm: number;
  averageAccuracy: number;
  totalTimeTyped: number;
  bestWpm: number;
  improvementRate: number;
}

export interface ProgressPoint {
  /** Khoá ngày theo giờ địa phương, dạng YYYY-MM-DD. */
  date: string;
  /** WPM trung bình ngày đó; `null` nếu không luyện. */
  wpm: number | null;
  accuracy: number | null;
  sessions: number;
}

/** Khoá ngày theo giờ địa phương (không dùng toISOString vì sẽ lệch múi giờ). */
function toDateKey(timestamp: number): string {
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export class StatisticsManager {
  private static readonly STORAGE_KEY = "typeflow-statistics";
  private static readonly MAX_SESSIONS = 1000;

  static saveSession(session: GameSession): void {
    const sessions = this.getAllSessions();
    sessions.unshift(session);

    // Keep only the most recent sessions
    if (sessions.length > this.MAX_SESSIONS) {
      sessions.splice(this.MAX_SESSIONS);
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessions));
  }

  static getAllSessions(): GameSession[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static getSessionsByLanguage(language: string): GameSession[] {
    return this.getAllSessions().filter((session) => session.language === language);
  }

  static getSessionsByDateRange(startDate: Date, endDate: Date): GameSession[] {
    const start = startDate.getTime();
    const end = endDate.getTime();
    return this.getAllSessions().filter((session) => session.timestamp >= start && session.timestamp <= end);
  }

  static getRecentSessions(days = 30): GameSession[] {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return this.getAllSessions().filter((session) => session.timestamp >= cutoff);
  }

  static calculateSummary(): StatsSummary {
    const sessions = this.getAllSessions();

    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        totalTimeTyped: 0,
        averageWpm: 0,
        averageAccuracy: 0,
        averageConsistency: 0,
        bestWpm: 0,
        bestAccuracy: 0,
        totalWordsTyped: 0,
        totalAchievements: 0,
        favoriteLanguage: "english",
        favoriteDifficulty: "medium", // Fixed typo from "favoritedifficulty"
        improvementRate: 0,
        currentStreak: 0,
        longestStreak: 0,
      };
    }

    const totalTimeTyped = sessions.reduce((sum, s) => sum + s.timeElapsed, 0);
    const averageWpm = sessions.reduce((sum, s) => sum + s.wpm, 0) / sessions.length;
    const averageAccuracy = sessions.reduce((sum, s) => sum + s.accuracy, 0) / sessions.length;
    const averageConsistency = sessions.reduce((sum, s) => sum + s.consistency, 0) / sessions.length;
    const bestWpm = Math.max(...sessions.map((s) => s.wpm));
    const bestAccuracy = Math.max(...sessions.map((s) => s.accuracy));
    const totalWordsTyped = sessions.reduce((sum, s) => sum + s.totalWords, 0);
    const totalAchievements = new Set(sessions.flatMap((s) => s.achievements)).size;

    // Calculate favorite language and difficulty
    const languageCounts = sessions.reduce((acc, s) => {
      acc[s.language] = (acc[s.language] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const favoriteLanguage = Object.keys(languageCounts).reduce((a, b) => (languageCounts[a] > languageCounts[b] ? a : b), "english");

    const difficultyCounts = sessions.reduce((acc, s) => {
      acc[s.difficulty] = (acc[s.difficulty] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const favoriteDifficulty = Object.keys(difficultyCounts).reduce(
      (a, b) => (difficultyCounts[a] > difficultyCounts[b] ? a : b),
      "medium"
    );

    // Calculate improvement rate (WPM improvement over last 10 sessions vs previous 10)
    let improvementRate = 0;
    if (sessions.length >= 20) {
      const recent10 = sessions.slice(0, 10);
      const previous10 = sessions.slice(10, 20);
      const recentAvg = recent10.reduce((sum, s) => sum + s.wpm, 0) / 10;
      const previousAvg = previous10.reduce((sum, s) => sum + s.wpm, 0) / 10;
      improvementRate = ((recentAvg - previousAvg) / previousAvg) * 100;
    }

    // Calculate streaks (consecutive days with sessions)
    const { currentStreak, longestStreak } = this.calculateStreaks(sessions);

    return {
      totalSessions: sessions.length,
      totalTimeTyped,
      averageWpm: Math.round(averageWpm),
      averageAccuracy: Math.round(averageAccuracy),
      averageConsistency: Math.round(averageConsistency),
      bestWpm,
      bestAccuracy,
      totalWordsTyped,
      totalAchievements,
      favoriteLanguage,
      favoriteDifficulty, // Fixed typo
      improvementRate: Math.round(improvementRate * 10) / 10,
      currentStreak,
      longestStreak,
    };
  }

  static getLanguageStats(): LanguageStats[] {
    const sessions = this.getAllSessions();
    const languageGroups = sessions.reduce((acc, session) => {
      if (!acc[session.language]) {
        acc[session.language] = [];
      }
      acc[session.language].push(session);
      return acc;
    }, {} as Record<string, GameSession[]>);

    return Object.entries(languageGroups).map(([language, languageSessions]) => {
      const averageWpm = languageSessions.reduce((sum, s) => sum + s.wpm, 0) / languageSessions.length;
      const averageAccuracy = languageSessions.reduce((sum, s) => sum + s.accuracy, 0) / languageSessions.length;
      const totalTimeTyped = languageSessions.reduce((sum, s) => sum + s.timeElapsed, 0);
      const bestWpm = Math.max(...languageSessions.map((s) => s.wpm));

      // Calculate improvement rate for this language
      let improvementRate = 0;
      if (languageSessions.length >= 10) {
        const recent5 = languageSessions.slice(0, 5);
        const previous5 = languageSessions.slice(5, 10);
        const recentAvg = recent5.reduce((sum, s) => sum + s.wpm, 0) / 5;
        const previousAvg = previous5.reduce((sum, s) => sum + s.wpm, 0) / 5;
        improvementRate = ((recentAvg - previousAvg) / previousAvg) * 100;
      }

      return {
        language,
        sessions: languageSessions.length,
        averageWpm: Math.round(averageWpm),
        averageAccuracy: Math.round(averageAccuracy),
        totalTimeTyped,
        bestWpm,
        improvementRate: Math.round(improvementRate * 10) / 10,
      };
    });
  }

  /**
   * Chuỗi tiến bộ cho đúng khoảng thời gian đã chọn.
   *
   * Trả về ĐỦ `days` điểm, mỗi ngày một điểm; ngày không luyện có `wpm = null`
   * để biểu đồ giữ đúng trục thời gian. Trước đây hàm chỉ trả về những ngày
   * có phiên, nên khi dữ liệu chỉ nằm trong vài ngày gần nhất thì mọi mốc
   * 7 / 30 / 90 / 365 ngày đều cho ra cùng một mảng — biểu đồ trông như
   * "không đổi" dù người dùng bấm mốc khác.
   */
  static getProgressData(days = 30): ProgressPoint[] {
    const span = Math.max(1, Math.floor(days));
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (span - 1));

    const buckets = new Map<string, { wpm: number[]; accuracy: number[] }>();

    for (const session of this.getAllSessions()) {
      if (session.timestamp < start.getTime()) continue;
      const key = toDateKey(session.timestamp);
      const bucket = buckets.get(key) ?? { wpm: [], accuracy: [] };
      bucket.wpm.push(session.wpm);
      bucket.accuracy.push(session.accuracy);
      buckets.set(key, bucket);
    }

    return Array.from({ length: span }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      const key = toDateKey(day.getTime());
      const bucket = buckets.get(key);

      if (!bucket || bucket.wpm.length === 0) {
        return { date: key, wpm: null, accuracy: null, sessions: 0 };
      }

      return {
        date: key,
        wpm: Math.round(bucket.wpm.reduce((sum, value) => sum + value, 0) / bucket.wpm.length),
        accuracy: Math.round(
          bucket.accuracy.reduce((sum, value) => sum + value, 0) / bucket.accuracy.length
        ),
        sessions: bucket.wpm.length,
      };
    });
  }

  private static calculateStreaks(sessions: GameSession[]): { currentStreak: number; longestStreak: number } {
    if (sessions.length === 0) return { currentStreak: 0, longestStreak: 0 };

    // Group sessions by date
    const sessionDates = sessions.map((s) => new Date(s.timestamp).toDateString());
    const uniqueDates = [...new Set(sessionDates)].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

    // Calculate current streak
    for (let i = 0; i < uniqueDates.length; i++) {
      const date = uniqueDates[i];
      if (i === 0 && (date === today || date === yesterday)) {
        currentStreak = 1;
      } else if (i > 0) {
        const prevDate = new Date(uniqueDates[i - 1]);
        const currentDate = new Date(date);
        const dayDiff = (prevDate.getTime() - currentDate.getTime()) / (24 * 60 * 60 * 1000);

        if (dayDiff === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Calculate longest streak
    for (let i = 0; i < uniqueDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = new Date(uniqueDates[i - 1]);
        const currentDate = new Date(uniqueDates[i]);
        const dayDiff = (prevDate.getTime() - currentDate.getTime()) / (24 * 60 * 60 * 1000);

        if (dayDiff === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return { currentStreak, longestStreak };
  }

  static exportData(): string {
    const sessions = this.getAllSessions();
    return JSON.stringify(sessions, null, 2);
  }

  static importData(jsonData: string): boolean {
    try {
      const sessions = JSON.parse(jsonData) as GameSession[];
      if (Array.isArray(sessions)) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessions));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  static clearAllData(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
