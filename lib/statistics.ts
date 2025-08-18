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

  static getProgressData(days = 30): Array<{ date: string; wpm: number; accuracy: number }> {
    const sessions = this.getRecentSessions(days);
    const dailyData = sessions.reduce((acc, session) => {
      const date = new Date(session.timestamp).toISOString().split("T")[0];
      if (!acc[date]) {
        acc[date] = { wpm: [], accuracy: [] };
      }
      acc[date].wpm.push(session.wpm);
      acc[date].accuracy.push(session.accuracy);
      return acc;
    }, {} as Record<string, { wpm: number[]; accuracy: number[] }>);

    return Object.entries(dailyData)
      .map(([date, data]) => ({
        date,
        wpm: Math.round(data.wpm.reduce((sum, w) => sum + w, 0) / data.wpm.length),
        accuracy: Math.round(data.accuracy.reduce((sum, a) => sum + a, 0) / data.accuracy.length),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
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
