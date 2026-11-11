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
  [key: string]: unknown;
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
  | "sunrise";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: AchievementIcon;
  category: "speed" | "accuracy" | "consistency" | "milestone" | "special";
  requirement: (stats: StatsForAchievement) => boolean;
  points: number;
  rarity: "common" | "rare" | "epic" | "legendary";
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
}

export interface StreakData {
  current: number;
  longest: number;
  lastSessionDate: string;
  multiplier: number;
}

const ACHIEVEMENTS: Achievement[] = [
  // Speed Achievements
  {
    id: "speed_demon_25",
    name: "Tia chớp",
    description: "Đạt 25 WPM",
    icon: "zap",
    category: "speed",
    requirement: (stats) => stats.wpm >= 25,
    points: 100,
    rarity: "common",
  },
  {
    id: "speed_demon_50",
    name: "Ngón tay thần tốc",
    description: "Đạt 50 WPM",
    icon: "zap",
    category: "speed",
    requirement: (stats) => stats.wpm >= 50,
    points: 250,
    rarity: "rare",
  },
  {
    id: "speed_demon_75",
    name: "Bậc thầy tốc độ",
    description: "Đạt 75 WPM",
    icon: "rocket",
    category: "speed",
    requirement: (stats) => stats.wpm >= 75,
    points: 500,
    rarity: "epic",
  },
  {
    id: "speed_demon_100",
    name: "Gõ siêu thanh",
    description: "Đạt 100 WPM",
    icon: "rocket",
    category: "speed",
    requirement: (stats) => stats.wpm >= 100,
    points: 1000,
    rarity: "legendary",
  },

  // Accuracy Achievements
  {
    id: "accuracy_95",
    name: "Chuẩn từng phím",
    description: "Đạt độ chính xác 95%",
    icon: "target",
    category: "accuracy",
    requirement: (stats) => stats.accuracy >= 95,
    points: 150,
    rarity: "common",
  },
  {
    id: "accuracy_98",
    name: "Gần như hoàn hảo",
    description: "Đạt độ chính xác 98%",
    icon: "target",
    category: "accuracy",
    requirement: (stats) => stats.accuracy >= 98,
    points: 300,
    rarity: "rare",
  },
  {
    id: "accuracy_100",
    name: "Không một lỗi",
    description: "Đạt độ chính xác 100%",
    icon: "gem",
    category: "accuracy",
    requirement: (stats) => stats.accuracy === 100,
    points: 750,
    rarity: "epic",
  },

  // Consistency Achievements
  {
    id: "consistency_master",
    name: "Nhịp gõ đều tay",
    description: "Giữ tốc độ ổn định suốt phiên",
    icon: "activity",
    category: "consistency",
    requirement: (stats) => stats.consistency >= 85,
    points: 200,
    rarity: "rare",
  },

  // Milestone Achievements
  {
    id: "first_session",
    name: "Bước đầu tiên",
    description: "Hoàn thành phiên gõ đầu tiên",
    icon: "star",
    category: "milestone",
    requirement: (stats) => stats.totalSessions >= 1,
    points: 50,
    rarity: "common",
  },
  {
    id: "sessions_10",
    name: "Khởi động",
    description: "Hoàn thành 10 phiên gõ",
    icon: "footprints",
    category: "milestone",
    requirement: (stats) => stats.totalSessions >= 10,
    points: 200,
    rarity: "common",
  },
  {
    id: "sessions_50",
    name: "Bền bỉ",
    description: "Hoàn thành 50 phiên gõ",
    icon: "book",
    category: "milestone",
    requirement: (stats) => stats.totalSessions >= 50,
    points: 500,
    rarity: "rare",
  },
  {
    id: "sessions_100",
    name: "Đam mê gõ phím",
    description: "Hoàn thành 100 phiên gõ",
    icon: "trophy",
    category: "milestone",
    requirement: (stats) => stats.totalSessions >= 100,
    points: 1000,
    rarity: "epic",
  },

  // Special Achievements
  {
    id: "multilingual",
    name: "Đa ngôn ngữ",
    description: "Luyện tập với nhiều ngôn ngữ",
    icon: "languages",
    category: "special",
    requirement: (stats) => stats.languagesUsed >= 2,
    points: 300,
    rarity: "rare",
  },
  {
    id: "streak_7",
    name: "Chiến binh 7 ngày",
    description: "Giữ chuỗi 7 ngày liên tiếp",
    icon: "flame",
    category: "special",
    requirement: (stats) => stats.longestStreak >= 7,
    points: 400,
    rarity: "rare",
  },
  {
    id: "streak_30",
    name: "Bậc thầy 30 ngày",
    description: "Giữ chuỗi 30 ngày liên tiếp",
    icon: "flame",
    category: "special",
    requirement: (stats) => stats.longestStreak >= 30,
    points: 1500,
    rarity: "legendary",
  },
  {
    id: "night_owl",
    name: "Cú đêm",
    description: "Luyện gõ sau nửa đêm",
    icon: "moon",
    category: "special",
    requirement: (stats) => stats.hasNightSession,
    points: 100,
    rarity: "common",
  },
  {
    id: "early_bird",
    name: "Chim sớm",
    description: "Luyện gõ trước 6 giờ sáng",
    icon: "sunrise",
    category: "special",
    requirement: (stats) => stats.hasEarlySession,
    points: 100,
    rarity: "common",
  },
];

export class ScoringSystem {
  private scoreHistory: ScoreEntry[] = [];
  private unlockedAchievements: Set<string> = new Set();
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
  }): ScoreBreakdown {
    const { wpm, accuracy, consistency, language, difficulty, timeElapsed, perfectWords, totalWords } = sessionData;

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

    // Perfect word bonus
    const perfectWordBonus = Math.round((perfectWords / totalWords) * 300);

    // Time bonus (reward longer sessions, but with diminishing returns)
    const timeMinutes = timeElapsed / 60;
    const timeBonus = Math.round(Math.min(timeMinutes * 10, 200));

    // Calculate total score
    const subtotal = baseScore + speedBonus + accuracyBonus + consistencyBonus + perfectWordBonus + timeBonus + streakBonus;
    const totalScore = Math.round(subtotal * difficultyMultiplier * languageMultiplier);

    return {
      baseScore,
      speedBonus,
      accuracyBonus,
      consistencyBonus,
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

  // Check for new achievements
  checkAchievements(
    sessionData: Partial<StatsForAchievement>,
    userStats: Partial<StatsForAchievement>
  ): Achievement[] {
    const newAchievements: Achievement[] = [];

    const currentHour = new Date().getHours();
    const combinedStats: StatsForAchievement = {
      wpm: 0,
      accuracy: 0,
      consistency: 0,
      totalSessions: 0,
      languagesUsed: 1,
      longestStreak: this.streakData.longest,
      hasNightSession: currentHour >= 0 && currentHour < 6,
      hasEarlySession: currentHour >= 4 && currentHour < 6,
      ...userStats,
      ...sessionData,
    };

    for (const achievement of ACHIEVEMENTS) {
      if (!this.unlockedAchievements.has(achievement.id)) {
        if (achievement.requirement(combinedStats)) {
          this.unlockedAchievements.add(achievement.id);
          achievement.unlockedAt = Date.now();
          newAchievements.push(achievement);
        }
      }
    }

    return newAchievements;
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
    },
    userStats: Partial<StatsForAchievement>
  ): { scoreEntry: ScoreEntry; newAchievements: Achievement[] } {
    this.updateStreak();

    const breakdown = this.calculateScore(sessionData);
    const rating = this.calculateRating(sessionData.wpm, sessionData.accuracy, sessionData.consistency);
    const newAchievements = this.checkAchievements(sessionData, userStats);

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
  getAchievementStats(): {
    total: number;
    unlocked: number;
    points: number;
    byCategory: Record<string, { total: number; unlocked: number }>;
    recent: Achievement[];
  } {
    const byCategory: Record<string, { total: number; unlocked: number }> = {};
    let totalPoints = 0;

    for (const achievement of ACHIEVEMENTS) {
      if (!byCategory[achievement.category]) {
        byCategory[achievement.category] = { total: 0, unlocked: 0 };
      }
      byCategory[achievement.category].total++;

      if (this.unlockedAchievements.has(achievement.id)) {
        byCategory[achievement.category].unlocked++;
        totalPoints += achievement.points;
      }
    }

    const recent = ACHIEVEMENTS.filter((a) => this.unlockedAchievements.has(a.id) && a.unlockedAt)
      .sort((a, b) => (b.unlockedAt || 0) - (a.unlockedAt || 0))
      .slice(0, 5);

    return {
      total: ACHIEVEMENTS.length,
      unlocked: this.unlockedAchievements.size,
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
    return ACHIEVEMENTS.map((achievement) => ({
      ...achievement,
      unlockedAt: this.unlockedAchievements.has(achievement.id) ? achievement.unlockedAt : undefined,
    }));
  }

  // Clear all data
  clearData(): void {
    this.scoreHistory = [];
    this.unlockedAchievements.clear();
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
    if (typeof window !== "undefined") {
      localStorage.setItem("typeflow-scores", JSON.stringify(this.scoreHistory));
      localStorage.setItem("typeflow-achievements", JSON.stringify([...this.unlockedAchievements]));
      localStorage.setItem("typeflow-streak", JSON.stringify(this.streakData));
    }
  }

  // Load from localStorage
  private loadFromStorage(): void {
    if (typeof window !== "undefined") {
      const scoresData = localStorage.getItem("typeflow-scores");
      if (scoresData) {
        this.scoreHistory = JSON.parse(scoresData);
      }

      const achievementsData = localStorage.getItem("typeflow-achievements");
      if (achievementsData) {
        this.unlockedAchievements = new Set(JSON.parse(achievementsData));
      }

      const streakData = localStorage.getItem("typeflow-streak");
      if (streakData) {
        this.streakData = JSON.parse(streakData);
      }
    }
  }
}

export const scoringSystem = new ScoringSystem();
