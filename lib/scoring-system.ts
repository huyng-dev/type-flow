import { ACHIEVEMENT_SEED } from "./achievements-data";

export interface PersonalBests {
  highestScore: ScoreEntry | null;
  fastestWpm: ScoreEntry | null;
  bestAccuracy: ScoreEntry | null;
  longestSession: ScoreEntry | null;
}

export interface AchievementStats {
  total: number;
  unlocked: number;
  points: number;
  byCategory: Record<string, { total: number; unlocked: number }>;
  recent: Achievement[];
}

export interface ScoreBreakdown {
  baseScore: number;
  speedBonus: number;
  accuracyBonus: number;
  consistencyBonus: number;
  comboBonus: number;
  difficultyMultiplier: number;
  languageMultiplier: number;
  streakBonus: number;
  perfectWordBonus: number;
  timeBonus: number;
  totalScore: number;
}

export interface StatsForAchievement {
  wpm: number;
  accuracy: number;
  consistency: number;
  totalSessions: number;
  languagesUsed: number;
  longestStreak: number;
  hasNightSession: boolean;
  hasEarlySession: boolean;
  bestCombo: number;
  wordsTyped: number;
  goldenWords: number;
  hardSessions: number;
  vietnameseSessions: number;
  timeSessions: number;
  phraseSessions: number;
  longSessions: number;
  perfectSessions: number;
  [key: string]: unknown;
}

/** Dữ liệu tối thiểu của một phiên để tính huy hiệu. */
export interface AchievementSession {
  wpm: number;
  accuracy: number;
  consistency: number;
  language: string;
  difficulty: string;
  contentType: string;
  wordCount: number;
  timeElapsed: number;
  bestCombo?: number;
}

/** Chỉ số dùng để hiển thị thanh tiến độ của huy hiệu chưa mở. */
export type AchievementMetric =
  | "wpm"
  | "accuracy"
  | "consistency"
  | "totalSessions"
  | "languagesUsed"
  | "longestStreak"
  | "bestCombo"
  | "wordsTyped"
  | "goldenWords"
  | "hardSessions"
  | "vietnameseSessions"
  | "timeSessions"
  | "phraseSessions"
  | "longSessions"
  | "perfectSessions";

export interface AchievementProgress {
  current: number;
  target: number;
}

/** Khoá biểu tượng (không dùng emoji trong giao diện nữa). */
export type AchievementIcon =
  | "zap"
  | "rocket"
  | "target"
  | "gem"
  | "activity"
  | "star"
  | "footprints"
  | "book"
  | "trophy"
  | "languages"
  | "flame"
  | "moon"
  | "sunrise"
  | "crown"
  | "medal"
  | "keyboard"
  | "timer"
  | "layers"
  | "gauge"
  | "hash"
  | "calendar"
  | "sparkles"
  | "shield";

export type AchievementCategory =
  | "speed"
  | "accuracy"
  | "consistency"
  | "combo"
  | "milestone"
  | "special";

export type AchievementRarity = "common" | "rare" | "epic" | "legendary";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: AchievementIcon;
  category: AchievementCategory;
  requirement: (stats: StatsForAchievement) => boolean;
  points: number;
  rarity: AchievementRarity;
  /** Chỉ số + mục tiêu để vẽ tiến độ khi chưa mở khoá. */
  metric?: AchievementMetric;
  target?: number;
  unlocked?: boolean;
  unlockedAt?: number;
}

export type RatingTone = "primary" | "success" | "warning" | "destructive" | "info" | "muted";

export interface PerformanceRating {
  overall: "F" | "D" | "C" | "B" | "A" | "S" | "SS" | "SSS";
  speed: "F" | "D" | "C" | "B" | "A" | "S";
  accuracy: "F" | "D" | "C" | "B" | "A" | "S";
  consistency: "F" | "D" | "C" | "B" | "A" | "S";
  tone: RatingTone;
  description: string;
}

export interface ScoreEntry {
  id: string;
  timestamp: number;
  score: number;
  breakdown: ScoreBreakdown;
  wpm: number;
  accuracy: number;
  consistency: number;
  language: string;
  difficulty: string;
  contentType: string;
  wordCount: number;
  timeElapsed: number;
  rating: PerformanceRating;
  achievements: string[];
  totalScore: number;
  speedScore: number;
  accuracyScore: number;
  consistencyScore: number;
  bonusScore: number;
  /** Combo dài nhất của phiên; dữ liệu cũ có thể không có trường này. */
  bestCombo?: number;
}

export interface StreakData {
  current: number;
  longest: number;
  lastSessionDate: string;
  multiplier: number;
}

const ACHIEVEMENTS: Achievement[] = ACHIEVEMENT_SEED;

export class ScoringSystem {
  private scoreHistory: ScoreEntry[] = [];
  /** id → timestamp mở khoá. 0 = đã mở từ dữ liệu cũ, không rõ ngày. */
  private unlockTimes: Map<string, number> = new Map();
  private streakData: StreakData = {
    current: 0,
    longest: 0,
    lastSessionDate: "",
    multiplier: 1.0,
  };

  constructor() {
    this.loadFromStorage();
  }

  // Calculate comprehensive score
  calculateScore(sessionData: {
    wpm: number;
    accuracy: number;
    consistency: number;
    language: string;
    difficulty: string;
    contentType: string;
    wordCount: number;
    timeElapsed: number;
    perfectWords: number;
    totalWords: number;
    bestCombo?: number;
  }): ScoreBreakdown {
    const { wpm, accuracy, consistency, language, difficulty, timeElapsed, perfectWords, totalWords, bestCombo } = sessionData;

    // Base score from WPM and accuracy
    const baseScore = Math.round(wpm * (accuracy / 100) * 10);

    // Speed bonus (exponential growth for higher speeds)
    const speedBonus = Math.round(Math.pow(Math.max(0, wpm - 20), 1.5) * 2);

    // Accuracy bonus (heavily reward high accuracy)
    const accuracyBonus = Math.round(Math.pow(accuracy / 100, 3) * 500);

    // Consistency bonus
    const consistencyBonus = Math.round((consistency / 100) * 200);

    // Difficulty multiplier
    const difficultyMultipliers = { easy: 1.0, medium: 1.2, hard: 1.5 };
    const difficultyMultiplier = difficultyMultipliers[difficulty as keyof typeof difficultyMultipliers] || 1.0;

    // Language multiplier (Vietnamese is harder due to diacritics)
    const languageMultipliers = { english: 1.0, vietnamese: 1.3 };
    const languageMultiplier = languageMultipliers[language as keyof typeof languageMultipliers] || 1.0;

    // Streak bonus
    const streakBonus = Math.round(this.streakData.current * 50 * this.streakData.multiplier);

    // Combo bonus: thưởng cho chuỗi gõ đúng, tối đa 200 điểm.
    // Độc lập với DPM — bật/tắt hiệu ứng không đổi điểm.
    const comboBonus = Math.min(200, Math.max(0, Math.round((bestCombo ?? 0) * 2)));

    // Perfect word bonus
    const perfectWordBonus = Math.round((perfectWords / totalWords) * 300);

    // Time bonus (reward longer sessions, but with diminishing returns)
    const timeMinutes = timeElapsed / 60;
    const timeBonus = Math.round(Math.min(timeMinutes * 10, 200));

    // Calculate total score
    const subtotal = baseScore + speedBonus + accuracyBonus + consistencyBonus + comboBonus + perfectWordBonus + timeBonus + streakBonus;
    const totalScore = Math.round(subtotal * difficultyMultiplier * languageMultiplier);

    return {
      baseScore,
      speedBonus,
      accuracyBonus,
      consistencyBonus,
      comboBonus,
      difficultyMultiplier,
      languageMultiplier,
      streakBonus,
      perfectWordBonus,
      timeBonus,
      totalScore,
    };
  }

  // Calculate performance rating
  calculateRating(wpm: number, accuracy: number, consistency: number): PerformanceRating {
    const getRating = (value: number, thresholds: number[]) => {
      if (value >= thresholds[5]) return "S";
      if (value >= thresholds[4]) return "A";
      if (value >= thresholds[3]) return "B";
      if (value >= thresholds[2]) return "C";
      if (value >= thresholds[1]) return "D";
      return "F";
    };

    const speedRating = getRating(wpm, [0, 15, 25, 40, 60, 80]);
    const accuracyRating = getRating(accuracy, [0, 70, 80, 90, 95, 98]);
    const consistencyRating = getRating(consistency, [0, 50, 65, 75, 85, 95]);

    // Calculate overall rating
    const ratings = { F: 0, D: 1, C: 2, B: 3, A: 4, S: 5 };
    const avgRating = (ratings[speedRating] + ratings[accuracyRating] + ratings[consistencyRating]) / 3;

    let overall: PerformanceRating["overall"];
    let tone: RatingTone;
    let description: string;

    if (avgRating >= 4.5 && wpm >= 100 && accuracy >= 99) {
      overall = "SSS";
      tone = "primary";
      description = "Đẳng cấp huyền thoại";
    } else if (avgRating >= 4.5 && wpm >= 80 && accuracy >= 98) {
      overall = "SS";
      tone = "warning";
      description = "Xuất sắc vượt trội";
    } else if (avgRating >= 4) {
      overall = "S";
      tone = "success";
      description = "Rất tốt";
    } else if (avgRating >= 3) {
      overall = "A";
      tone = "info";
      description = "Tốt";
    } else if (avgRating >= 2.5) {
      overall = "B";
      tone = "info";
      description = "Khá";
    } else if (avgRating >= 2) {
      overall = "C";
      tone = "warning";
      description = "Trung bình";
    } else if (avgRating >= 1) {
      overall = "D";
      tone = "destructive";
      description = "Cần cải thiện";
    } else {
      overall = "F";
      tone = "muted";
      description = "Hãy luyện thêm";
    }

    return {
      overall,
      speed: speedRating,
      accuracy: accuracyRating,
      consistency: consistencyRating,
      tone,
      description,
    };
  }

  /**
   * Dựng thống kê huy hiệu từ lịch sử + phiên hiện tại.
   * Nhờ cộng phiên hiện tại ở đây, `first_session` mở ngay ở phiên đầu thay vì
   * phải chờ StatisticsManager lưu xong (lỗi lệch một phiên trước đây).
   */
  private buildStats(
    session?: AchievementSession,
    extra?: Partial<StatsForAchievement>
  ): StatsForAchievement {
    const list: AchievementSession[] = session
      ? [...this.scoreHistory, session]
      : this.scoreHistory;
    const countWhere = (predicate: (entry: AchievementSession) => boolean) =>
      list.filter(predicate).length;
    const maxOf = (pick: (entry: AchievementSession) => number) =>
      list.reduce((best, entry) => Math.max(best, pick(entry)), 0);
    const hour = new Date().getHours();

    // Xét giờ của từng phiên đã lưu để huy hiệu "Cú đêm"/"Chim sớm" vẫn đúng
    // khi mở khoá bù cho dữ liệu cũ. Chỉ dùng giờ hiện tại khi đang có phiên mới.
    const hasNightFromHistory = this.scoreHistory.some((entry) => {
      const entryHour = new Date(entry.timestamp).getHours();
      return entryHour >= 0 && entryHour < 4;
    });
    const hasEarlyFromHistory = this.scoreHistory.some((entry) => {
      const entryHour = new Date(entry.timestamp).getHours();
      return entryHour >= 4 && entryHour < 6;
    });

    return {
      wpm: maxOf((entry) => entry.wpm),
      accuracy: maxOf((entry) => entry.accuracy),
      consistency: maxOf((entry) => entry.consistency),
      totalSessions: list.length,
      languagesUsed: new Set(list.map((entry) => entry.language)).size,
      longestStreak: this.streakData.longest,
      // Ca đêm 0–4h và ca sớm 4–6h tách rời để hai huy hiệu không trùng nhau.
      hasNightSession: hasNightFromHistory || (Boolean(session) && hour < 4),
      hasEarlySession: hasEarlyFromHistory || (Boolean(session) && hour >= 4 && hour < 6),
      bestCombo: maxOf((entry) => entry.bestCombo ?? 0),
      wordsTyped: list.reduce((sum, entry) => sum + entry.wordCount, 0),
      goldenWords: 0,
      hardSessions: countWhere((entry) => entry.difficulty === "hard"),
      vietnameseSessions: countWhere((entry) => entry.language === "vietnamese"),
      timeSessions: countWhere((entry) => entry.contentType === "time"),
      phraseSessions: countWhere((entry) => entry.contentType === "phrases"),
      longSessions: countWhere((entry) => entry.timeElapsed >= 300),
      perfectSessions: countWhere(
        (entry) => entry.accuracy >= 100 && entry.wordCount >= 10
      ),
      ...extra,
    };
  }

  /** Mở khoá mọi huy hiệu thoả điều kiện; chống trùng bằng map id → thời điểm. */
  private award(stats: StatsForAchievement): Achievement[] {
    const now = Date.now();
    const unlocked: Achievement[] = [];

    for (const achievement of ACHIEVEMENTS) {
      if (this.unlockTimes.has(achievement.id)) continue;
      if (!achievement.requirement(stats)) continue;
      this.unlockTimes.set(achievement.id, now);
      unlocked.push({ ...achievement, unlocked: true, unlockedAt: now });
    }

    if (unlocked.length > 0) this.saveToStorage();
    return unlocked;
  }

  // Check for new achievements
  checkAchievements(
    session: AchievementSession,
    extra?: Partial<StatsForAchievement>
  ): Achievement[] {
    return this.award(this.buildStats(session, extra));
  }

  /** Tiến độ từng huy hiệu (chỉ huy hiệu có metric + target). */
  getAchievementProgress(
    extra?: Partial<StatsForAchievement>
  ): Record<string, AchievementProgress> {
    const stats = this.buildStats(undefined, extra);
    const progress: Record<string, AchievementProgress> = {};

    for (const achievement of ACHIEVEMENTS) {
      if (!achievement.metric || achievement.target === undefined) continue;
      const value = Number(stats[achievement.metric] ?? 0);
      progress[achievement.id] = {
        current: Math.max(0, Math.min(value, achievement.target)),
        target: achievement.target,
      };
    }

    return progress;
  }

  // Update streak data
  updateStreak(): void {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

    if (this.streakData.lastSessionDate === today) {
      // Already practiced today, no change
      return;
    } else if (this.streakData.lastSessionDate === yesterday) {
      // Continuing streak
      this.streakData.current += 1;
      this.streakData.longest = Math.max(this.streakData.longest, this.streakData.current);
    } else {
      // Streak broken or first session
      this.streakData.current = 1;
    }

    this.streakData.lastSessionDate = today;
    this.streakData.multiplier = Math.min(2.0, 1.0 + this.streakData.current * 0.1);
  }

  // Record a new score
  recordScore(
    sessionData: {
      wpm: number;
      accuracy: number;
      consistency: number;
      language: string;
      difficulty: string;
      contentType: string;
      wordCount: number;
      timeElapsed: number;
      perfectWords: number;
      totalWords: number;
      bestCombo?: number;
    },
    extra?: Partial<StatsForAchievement>
  ): { scoreEntry: ScoreEntry; newAchievements: Achievement[] } {
    this.updateStreak();

    const breakdown = this.calculateScore(sessionData);
    const rating = this.calculateRating(sessionData.wpm, sessionData.accuracy, sessionData.consistency);
    const newAchievements = this.checkAchievements(sessionData, extra);

    const scoreEntry: ScoreEntry = {
      id: `score_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      score: breakdown.totalScore,
      breakdown,
      wpm: sessionData.wpm,
      accuracy: sessionData.accuracy,
      consistency: sessionData.consistency,
      language: sessionData.language,
      difficulty: sessionData.difficulty,
      contentType: sessionData.contentType,
      wordCount: sessionData.wordCount,
      timeElapsed: sessionData.timeElapsed,
      rating,
      achievements: newAchievements.map((a) => a.id),
      totalScore: breakdown.totalScore,
      speedScore: breakdown.speedBonus,
      accuracyScore: breakdown.accuracyBonus,
      consistencyScore: breakdown.consistencyBonus,
      bonusScore: breakdown.perfectWordBonus + breakdown.timeBonus + breakdown.streakBonus,
      bestCombo: sessionData.bestCombo ?? 0,
    };

    this.scoreHistory.push(scoreEntry);
    this.saveToStorage();

    return { scoreEntry, newAchievements };
  }

  // Get leaderboard data
  getLeaderboard(limit = 10): ScoreEntry[] {
    return [...this.scoreHistory].sort((a, b) => b.score - a.score).slice(0, limit);
  }

  // Get personal best scores
  getPersonalBests(): {
    highestScore: ScoreEntry | null;
    fastestWpm: ScoreEntry | null;
    bestAccuracy: ScoreEntry | null;
    longestSession: ScoreEntry | null;
  } {
    if (this.scoreHistory.length === 0) {
      return {
        highestScore: null,
        fastestWpm: null,
        bestAccuracy: null,
        longestSession: null,
      };
    }

    return {
      highestScore: this.scoreHistory.reduce((best, current) => (current.score > best.score ? current : best)),
      fastestWpm: this.scoreHistory.reduce((best, current) => (current.wpm > best.wpm ? current : best)),
      bestAccuracy: this.scoreHistory.reduce((best, current) => (current.accuracy > best.accuracy ? current : best)),
      longestSession: this.scoreHistory.reduce((best, current) => (current.timeElapsed > best.timeElapsed ? current : best)),
    };
  }

  // Get achievement statistics
  getAchievementStats(): AchievementStats {
    const byCategory: Record<string, { total: number; unlocked: number }> = {};
    let totalPoints = 0;
    let unlockedCount = 0;

    for (const achievement of ACHIEVEMENTS) {
      if (!byCategory[achievement.category]) {
        byCategory[achievement.category] = { total: 0, unlocked: 0 };
      }
      byCategory[achievement.category].total++;

      if (this.unlockTimes.has(achievement.id)) {
        byCategory[achievement.category].unlocked++;
        totalPoints += achievement.points;
        unlockedCount++;
      }
    }

    // "Gần đây" dựa trên timestamp đã lưu, nên vẫn đúng sau khi reload.
    const recent: Achievement[] = [];
    const byUnlockTime = [...this.unlockTimes.entries()].sort((a, b) => b[1] - a[1]);

    for (const [id, unlockedAt] of byUnlockTime) {
      if (unlockedAt <= 0) continue;
      const achievement = ACHIEVEMENTS.find((item) => item.id === id);
      if (achievement) recent.push({ ...achievement, unlocked: true, unlockedAt });
      if (recent.length >= 5) break;
    }

    return {
      total: ACHIEVEMENTS.length,
      unlocked: unlockedCount,
      points: totalPoints,
      byCategory,
      recent,
    };
  }

  // Get streak information
  getStreakInfo(): StreakData {
    return { ...this.streakData };
  }

  // Get score history
  getScoreHistory(): ScoreEntry[] {
    return [...this.scoreHistory].sort((a, b) => b.timestamp - a.timestamp);
  }

  // Get all achievements
  getAllAchievements(): Achievement[] {
    return ACHIEVEMENTS.map((achievement) => {
      const unlockedAt = this.unlockTimes.get(achievement.id);
      return {
        ...achievement,
        unlocked: unlockedAt !== undefined,
        // 0 = đã mở từ dữ liệu cũ nhưng không có ngày chính xác.
        unlockedAt: unlockedAt && unlockedAt > 0 ? unlockedAt : undefined,
      };
    });
  }

  // Clear all data
  clearData(): void {
    this.scoreHistory = [];
    this.unlockTimes.clear();
    this.streakData = {
      current: 0,
      longest: 0,
      lastSessionDate: "",
      multiplier: 1.0,
    };
    this.saveToStorage();
  }

  // Save to localStorage
  private saveToStorage(): void {
    if (typeof window === "undefined") return;

    try {
      window.localStorage.setItem("typeflow-scores", JSON.stringify(this.scoreHistory));
      window.localStorage.setItem(
        "typeflow-achievements",
        JSON.stringify({
          version: 2,
          unlocks: Object.fromEntries(this.unlockTimes),
        })
      );
      window.localStorage.setItem("typeflow-streak", JSON.stringify(this.streakData));
    } catch {
      // Hết quota hoặc chế độ riêng tư: giữ dữ liệu trong bộ nhớ phiên.
    }
  }

  // Load from localStorage
  public reloadFromStorage(): void {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    if (typeof window === "undefined") return;

    let migrated = false;

    try {
      const scoresData = window.localStorage.getItem("typeflow-scores");
      if (scoresData) {
        const parsed = JSON.parse(scoresData) as unknown;
        if (Array.isArray(parsed)) this.scoreHistory = parsed as ScoreEntry[];
      }
    } catch {
      // Dữ liệu điểm hỏng: bỏ qua, không chặn ứng dụng.
    }

    try {
      const achievementsData = window.localStorage.getItem("typeflow-achievements");
      if (achievementsData) {
        const parsed = JSON.parse(achievementsData) as unknown;

        if (Array.isArray(parsed)) {
          // Định dạng cũ: mảng id. Migrate sang map, không biết ngày mở.
          for (const id of parsed) {
            if (typeof id === "string") this.unlockTimes.set(id, 0);
          }
          migrated = true;
        } else if (parsed && typeof parsed === "object" && "unlocks" in parsed) {
          const unlocks = (parsed as { unlocks?: Record<string, unknown> }).unlocks ?? {};
          for (const [id, unlockedAt] of Object.entries(unlocks)) {
            if (typeof unlockedAt === "number" && Number.isFinite(unlockedAt)) {
              this.unlockTimes.set(id, unlockedAt);
            }
          }
        }
      }
    } catch {
      this.unlockTimes.clear();
    }

    try {
      const streakData = window.localStorage.getItem("typeflow-streak");
      if (streakData) {
        const parsed = JSON.parse(streakData) as Partial<StreakData>;
        this.streakData = { ...this.streakData, ...parsed };
      }
    } catch {
      // Dữ liệu chuỗi hỏng: giữ mặc định.
    }

    // Dữ liệu cũ có thể đã đủ điều kiện cho huy hiệu mới thêm vào danh mục:
    // đánh giá bù một lần khi tải để bộ sưu tập luôn nhất quán.
    this.award(this.buildStats());

    if (migrated) this.saveToStorage();
  }
}

export const scoringSystem = new ScoringSystem();
