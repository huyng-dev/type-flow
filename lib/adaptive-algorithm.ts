export interface PerformanceMetrics {
  wpm: number;
  accuracy: number;
  consistency: number; // How consistent the typing speed is
  errorRate: number;
  commonErrors: Record<string, number>; // Character pairs that cause errors
  weakWords: Record<string, number>; // Words that cause problems
  strongWords: Record<string, number>; // Words typed well
  timeOfDay: number; // Hour of day (0-23)
  sessionLength: number; // Minutes in current session
}

export interface SkillAssessment {
  overallLevel: "beginner" | "intermediate" | "advanced" | "expert";
  wpmLevel: number; // 1-10 scale
  accuracyLevel: number; // 1-10 scale
  consistencyLevel: number; // 1-10 scale
  strengths: string[]; // Areas where user excels
  weaknesses: string[]; // Areas needing improvement
  recommendedDifficulty: "easy" | "medium" | "hard";
  focusAreas: string[]; // Specific things to practice
}

export interface AdaptiveSettings {
  targetWpm: number;
  targetAccuracy: number;
  difficultyMultiplier: number; // 0.5 to 2.0
  errorThreshold: number; // Max errors before adjusting
  adaptationRate: number; // How quickly to adapt (0.1 to 1.0)
  personalizedWordWeight: number; // How much to weight personal weak/strong words
}

export interface SessionData {
  startTime: number;
  endTime?: number;
  totalWords: number;
  totalChars: number;
  correctChars: number;
  errors: number;
  wpmHistory: number[]; // WPM at different points in session
  accuracyHistory: number[]; // Accuracy at different points
  language: string;
  difficulty: string;
  contentType: string;
}

export class AdaptiveAlgorithm {
  private performanceHistory: PerformanceMetrics[] = [];
  private currentSession: SessionData | null = null;
  private settings: AdaptiveSettings = {
    targetWpm: 40,
    targetAccuracy: 95,
    difficultyMultiplier: 1.0,
    errorThreshold: 5,
    adaptationRate: 0.3,
    personalizedWordWeight: 0.4,
  };

  constructor() {
    this.loadFromStorage();
  }

  // Start a new typing session
  startSession(language: string, difficulty: string, contentType: string, wordCount: number): void {
    this.currentSession = {
      startTime: Date.now(),
      totalWords: wordCount,
      totalChars: 0,
      correctChars: 0,
      errors: 0,
      wpmHistory: [],
      accuracyHistory: [],
      language,
      difficulty,
      contentType,
    };
  }

  // Update session with current performance
  updateSession(stats: { wpm: number; accuracy: number; correctChars: number; totalChars: number; errors: number }): void {
    if (!this.currentSession) return;

    this.currentSession.totalChars = stats.totalChars;
    this.currentSession.correctChars = stats.correctChars;
    this.currentSession.errors = stats.errors;
    this.currentSession.wpmHistory.push(stats.wpm);
    this.currentSession.accuracyHistory.push(stats.accuracy);
  }

  // End session and analyze performance
  endSession(): PerformanceMetrics | null {
    if (!this.currentSession) return null;

    this.currentSession.endTime = Date.now();
    const sessionDuration = (this.currentSession.endTime - this.currentSession.startTime) / 1000 / 60; // minutes

    // Calculate consistency (standard deviation of WPM)
    const wpmMean = this.currentSession.wpmHistory.reduce((a, b) => a + b, 0) / this.currentSession.wpmHistory.length;
    const wpmVariance =
      this.currentSession.wpmHistory.reduce((acc, wpm) => acc + Math.pow(wpm - wpmMean, 2), 0) / this.currentSession.wpmHistory.length;
    const consistency = Math.max(0, 100 - Math.sqrt(wpmVariance));

    const metrics: PerformanceMetrics = {
      wpm: wpmMean,
      accuracy: this.currentSession.accuracyHistory[this.currentSession.accuracyHistory.length - 1] || 0,
      consistency,
      errorRate: (this.currentSession.errors / this.currentSession.totalChars) * 100,
      commonErrors: {}, // Will be populated by error analysis
      weakWords: {},
      strongWords: {},
      timeOfDay: new Date().getHours(),
      sessionLength: sessionDuration,
    };

    this.performanceHistory.push(metrics);
    this.saveToStorage();
    this.currentSession = null;

    return metrics;
  }

  // Analyze user's skill level
  assessSkill(): SkillAssessment {
    if (this.performanceHistory.length === 0) {
      return {
        overallLevel: "beginner",
        wpmLevel: 1,
        accuracyLevel: 1,
        consistencyLevel: 1,
        strengths: [],
        weaknesses: ["Speed", "Accuracy", "Consistency"],
        recommendedDifficulty: "easy",
        focusAreas: ["Basic finger placement", "Common words"],
      };
    }

    // Get recent performance (last 10 sessions or all if less)
    const recentSessions = this.performanceHistory.slice(-10);
    const avgWpm = recentSessions.reduce((sum, session) => sum + session.wpm, 0) / recentSessions.length;
    const avgAccuracy = recentSessions.reduce((sum, session) => sum + session.accuracy, 0) / recentSessions.length;
    const avgConsistency = recentSessions.reduce((sum, session) => sum + session.consistency, 0) / recentSessions.length;

    // Determine levels (1-10 scale)
    const wpmLevel = Math.min(10, Math.max(1, Math.floor(avgWpm / 10) + 1));
    const accuracyLevel = Math.min(10, Math.max(1, Math.floor(avgAccuracy / 10)));
    const consistencyLevel = Math.min(10, Math.max(1, Math.floor(avgConsistency / 10)));

    // Determine overall level
    const overallScore = (wpmLevel + accuracyLevel + consistencyLevel) / 3;
    let overallLevel: SkillAssessment["overallLevel"];
    if (overallScore < 3) overallLevel = "beginner";
    else if (overallScore < 6) overallLevel = "intermediate";
    else if (overallScore < 8) overallLevel = "advanced";
    else overallLevel = "expert";

    // Identify strengths and weaknesses
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const focusAreas: string[] = [];

    if (wpmLevel >= 7) strengths.push("Speed");
    else if (wpmLevel <= 4) {
      weaknesses.push("Speed");
      focusAreas.push("Speed building exercises");
    }

    if (accuracyLevel >= 8) strengths.push("Accuracy");
    else if (accuracyLevel <= 6) {
      weaknesses.push("Accuracy");
      focusAreas.push("Accuracy improvement");
    }

    if (consistencyLevel >= 7) strengths.push("Consistency");
    else if (consistencyLevel <= 5) {
      weaknesses.push("Consistency");
      focusAreas.push("Rhythm and flow practice");
    }

    // Recommend difficulty
    let recommendedDifficulty: "easy" | "medium" | "hard";
    if (overallScore < 4) recommendedDifficulty = "easy";
    else if (overallScore < 7) recommendedDifficulty = "medium";
    else recommendedDifficulty = "hard";

    return {
      overallLevel,
      wpmLevel,
      accuracyLevel,
      consistencyLevel,
      strengths,
      weaknesses,
      recommendedDifficulty,
      focusAreas,
    };
  }

  // Get adaptive word selection weights
  getWordSelectionWeights(language: string): Record<string, number> {
    const weights: Record<string, number> = {};

    // Base weights for difficulty progression
    const skillAssessment = this.assessSkill();

    // Adjust weights based on user's weak areas
    if (this.performanceHistory.length > 0) {
      const recentSessions = this.performanceHistory.slice(-5);

      // Increase weight for words that caused errors
      recentSessions.forEach((session) => {
        Object.entries(session.weakWords).forEach(([word, errorCount]) => {
          weights[word] = (weights[word] || 1) + errorCount * 0.3;
        });

        // Decrease weight for words typed well
        Object.entries(session.strongWords).forEach(([word, successCount]) => {
          weights[word] = Math.max(0.1, (weights[word] || 1) - successCount * 0.1);
        });
      });
    }

    return weights;
  }

  // Get recommended settings based on performance
  getAdaptiveSettings(): AdaptiveSettings {
    const skillAssessment = this.assessSkill();
    const settings = { ...this.settings };

    // Adjust target WPM based on current level
    settings.targetWpm = Math.max(20, Math.min(100, skillAssessment.wpmLevel * 10));

    // Adjust target accuracy based on current level
    settings.targetAccuracy = Math.max(85, Math.min(99, 85 + skillAssessment.accuracyLevel * 1.5));

    // Adjust difficulty multiplier
    if (skillAssessment.overallLevel === "beginner") {
      settings.difficultyMultiplier = 0.7;
    } else if (skillAssessment.overallLevel === "expert") {
      settings.difficultyMultiplier = 1.3;
    }

    // Adjust adaptation rate based on consistency
    settings.adaptationRate = Math.max(0.1, Math.min(1.0, 0.5 - skillAssessment.consistencyLevel * 0.05));

    return settings;
  }

  // Get personalized recommendations
  getRecommendations(): string[] {
    const skillAssessment = this.assessSkill();
    const recommendations: string[] = [];

    if (skillAssessment.weaknesses.includes("Speed")) {
      recommendations.push("Focus on common word patterns to build muscle memory");
      recommendations.push("Practice short bursts of fast typing followed by rest");
    }

    if (skillAssessment.weaknesses.includes("Accuracy")) {
      recommendations.push("Slow down and focus on hitting the correct keys");
      recommendations.push("Practice difficult letter combinations");
    }

    if (skillAssessment.weaknesses.includes("Consistency")) {
      recommendations.push("Maintain steady rhythm throughout typing sessions");
      recommendations.push("Take breaks to avoid fatigue");
    }

    // Time-based recommendations
    const currentHour = new Date().getHours();
    if (currentHour < 10) {
      recommendations.push("Morning sessions are great for building accuracy");
    } else if (currentHour > 20) {
      recommendations.push("Evening practice can help with consistency");
    }

    // Session length recommendations
    const recentSessions = this.performanceHistory.slice(-5);
    const avgSessionLength = recentSessions.reduce((sum, s) => sum + s.sessionLength, 0) / recentSessions.length;

    if (avgSessionLength > 15) {
      recommendations.push("Consider shorter, more focused practice sessions");
    } else if (avgSessionLength < 5) {
      recommendations.push("Try longer practice sessions to build endurance");
    }

    return recommendations.slice(0, 3); // Return top 3 recommendations
  }

  // Check if difficulty should be adjusted mid-session
  shouldAdjustDifficulty(currentStats: { wpm: number; accuracy: number; errors: number }): {
    shouldAdjust: boolean;
    newDifficulty?: "easy" | "medium" | "hard";
    reason?: string;
  } {
    const settings = this.getAdaptiveSettings();

    // Too many errors - make it easier
    if (currentStats.errors > settings.errorThreshold && currentStats.accuracy < 85) {
      return {
        shouldAdjust: true,
        newDifficulty: "easy",
        reason: "High error rate detected - switching to easier content",
      };
    }

    // Performing very well - make it harder
    if (currentStats.wpm > settings.targetWpm * 1.2 && currentStats.accuracy > 95) {
      return {
        shouldAdjust: true,
        newDifficulty: "hard",
        reason: "Excellent performance - increasing challenge level",
      };
    }

    return { shouldAdjust: false };
  }

  // Get performance trends
  getPerformanceTrends(): {
    wpmTrend: "improving" | "declining" | "stable";
    accuracyTrend: "improving" | "declining" | "stable";
    consistencyTrend: "improving" | "declining" | "stable";
    overallProgress: number; // -1 to 1, where 1 is significant improvement
  } {
    if (this.performanceHistory.length < 5) {
      return {
        wpmTrend: "stable",
        accuracyTrend: "stable",
        consistencyTrend: "stable",
        overallProgress: 0,
      };
    }

    const recent = this.performanceHistory.slice(-5);
    const older = this.performanceHistory.slice(-10, -5);

    if (older.length === 0) {
      return {
        wpmTrend: "stable",
        accuracyTrend: "stable",
        consistencyTrend: "stable",
        overallProgress: 0,
      };
    }

    const recentAvgWpm = recent.reduce((sum, s) => sum + s.wpm, 0) / recent.length;
    const olderAvgWpm = older.reduce((sum, s) => sum + s.wpm, 0) / older.length;
    const wpmChange = (recentAvgWpm - olderAvgWpm) / olderAvgWpm;

    const recentAvgAcc = recent.reduce((sum, s) => sum + s.accuracy, 0) / recent.length;
    const olderAvgAcc = older.reduce((sum, s) => sum + s.accuracy, 0) / older.length;
    const accChange = (recentAvgAcc - olderAvgAcc) / olderAvgAcc;

    const recentAvgCon = recent.reduce((sum, s) => sum + s.consistency, 0) / recent.length;
    const olderAvgCon = older.reduce((sum, s) => sum + s.consistency, 0) / older.length;
    const conChange = (recentAvgCon - olderAvgCon) / olderAvgCon;

    const getTrend = (change: number) => {
      if (change > 0.05) return "improving";
      if (change < -0.05) return "declining";
      return "stable";
    };

    return {
      wpmTrend: getTrend(wpmChange),
      accuracyTrend: getTrend(accChange),
      consistencyTrend: getTrend(conChange),
      overallProgress: (wpmChange + accChange + conChange) / 3,
    };
  }

  // Save to localStorage
  private saveToStorage(): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("typeflow-performance", JSON.stringify(this.performanceHistory));
      localStorage.setItem("typeflow-settings", JSON.stringify(this.settings));
    }
  }

  // Load from localStorage
  private loadFromStorage(): void {
    if (typeof window !== "undefined") {
      const performanceData = localStorage.getItem("typeflow-performance");
      if (performanceData) {
        this.performanceHistory = JSON.parse(performanceData);
      }

      const settingsData = localStorage.getItem("typeflow-settings");
      if (settingsData) {
        this.settings = { ...this.settings, ...JSON.parse(settingsData) };
      }
    }
  }

  // Clear all data (for testing or reset)
  clearData(): void {
    this.performanceHistory = [];
    this.currentSession = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("typeflow-performance");
      localStorage.removeItem("typeflow-settings");
    }
  }

  // Get statistics for display
  getStats(): {
    totalSessions: number;
    totalTimeMinutes: number;
    averageWpm: number;
    averageAccuracy: number;
    bestWpm: number;
    bestAccuracy: number;
    improvementRate: number;
  } {
    if (this.performanceHistory.length === 0) {
      return {
        totalSessions: 0,
        totalTimeMinutes: 0,
        averageWpm: 0,
        averageAccuracy: 0,
        bestWpm: 0,
        bestAccuracy: 0,
        improvementRate: 0,
      };
    }

    const totalSessions = this.performanceHistory.length;
    const totalTimeMinutes = this.performanceHistory.reduce((sum, s) => sum + s.sessionLength, 0);
    const averageWpm = this.performanceHistory.reduce((sum, s) => sum + s.wpm, 0) / totalSessions;
    const averageAccuracy = this.performanceHistory.reduce((sum, s) => sum + s.accuracy, 0) / totalSessions;
    const bestWpm = Math.max(...this.performanceHistory.map((s) => s.wpm));
    const bestAccuracy = Math.max(...this.performanceHistory.map((s) => s.accuracy));

    // Calculate improvement rate (WPM improvement per session)
    let improvementRate = 0;
    if (totalSessions > 1) {
      const firstFive = this.performanceHistory.slice(0, 5);
      const lastFive = this.performanceHistory.slice(-5);
      const firstAvg = firstFive.reduce((sum, s) => sum + s.wpm, 0) / firstFive.length;
      const lastAvg = lastFive.reduce((sum, s) => sum + s.wpm, 0) / lastFive.length;
      improvementRate = (lastAvg - firstAvg) / totalSessions;
    }

    return {
      totalSessions,
      totalTimeMinutes,
      averageWpm,
      averageAccuracy,
      bestWpm,
      bestAccuracy,
      improvementRate,
    };
  }

  getRealtimeFeedback(currentPerformance: { wpm: number; accuracy: number; consistency: number }): string | null {
    const settings = this.getAdaptiveSettings();
    const skillAssessment = this.assessSkill();

    // Provide feedback based on current performance vs targets
    if (currentPerformance.accuracy < 85) {
      return "Focus on accuracy - slow down if needed to reduce errors";
    }

    if (currentPerformance.wpm < settings.targetWpm * 0.7) {
      return "Try to increase your typing speed while maintaining accuracy";
    }

    if (currentPerformance.consistency < 70) {
      return "Maintain steady rhythm - avoid speed bursts and slowdowns";
    }

    if (currentPerformance.wpm > settings.targetWpm * 1.2 && currentPerformance.accuracy > 95) {
      return "Excellent performance! Consider increasing difficulty level";
    }

    // No feedback needed
    return null;
  }

  calculateScore(scoreData: {
    wpm: number;
    accuracy: number;
    consistency: number;
    timeElapsed: number;
    wordCount: number;
    difficulty: string;
    language: string;
    perfectWords: number;
    totalWords: number;
    errorCount: number;
  }): {
    score: {
      totalScore: number;
      speedScore: number;
      accuracyScore: number;
      consistencyScore: number;
      bonusScore: number;
      rating: string;
    };
    achievements: Array<{
      name: string;
      description: string;
      icon: string;
    }>;
  } {
    // New balanced scoring constants (caps to avoid inflated scores)
    const SPD_MAX = 600;
    const ACC_MAX = 600;
    const CON_MAX = 300;
    const BONUS_MAX = 200;

    // Speed: proportional to WPM but capped
    const speedScore = Math.min(SPD_MAX, Math.round(Math.max(0, scoreData.wpm) * 10));

    // Accuracy: normalized from 0-100 to ACC_MAX
    const accPct = Math.max(0, Math.min(100, scoreData.accuracy));
    const accuracyScore = Math.min(ACC_MAX, Math.round((accPct / 100) * ACC_MAX));

    // Consistency: normalized from 0-100 to CON_MAX
    const conPct = Math.max(0, Math.min(100, scoreData.consistency));
    const consistencyScore = Math.min(CON_MAX, Math.round((conPct / 100) * CON_MAX));

    // Bonus: based on perfect words ratio, difficulty, language bonuses
    let bonusScore = 0;
    const perfectRatio = scoreData.totalWords > 0 ? scoreData.perfectWords / scoreData.totalWords : 0;
    bonusScore += Math.round(perfectRatio * BONUS_MAX * 0.6); // up to ~60% of BONUS_MAX from perfect words

    // Difficulty multiplier tuned smaller to avoid huge bonuses
    const difficultyMultiplier = scoreData.difficulty === "easy" ? 0.9 : scoreData.difficulty === "hard" ? 1.15 : 1.0;
    bonusScore = Math.round(bonusScore * difficultyMultiplier);

    // Small language bonus (keeps it modest)
    if (scoreData.language === "vietnamese") {
      bonusScore += 30;
    }

    // Ensure bonus does not exceed BONUS_MAX
    bonusScore = Math.min(BONUS_MAX, Math.max(0, bonusScore));

    const totalScore = speedScore + accuracyScore + consistencyScore + bonusScore;

    // Adjusted rating thresholds to match new score scale
    let rating: string;
    if (totalScore >= 1600) rating = "Legendary";
    else if (totalScore >= 1400) rating = "Master";
    else if (totalScore >= 1100) rating = "Expert";
    else if (totalScore >= 850) rating = "Advanced";
    else if (totalScore >= 550) rating = "Intermediate";
    else if (totalScore >= 250) rating = "Beginner";
    else rating = "Novice";

    // Achievements (kept but thresholds consistent with new scale)
    const achievements: Array<{ name: string; description: string; icon: string }> = [];

    if (scoreData.wpm >= 60) {
      achievements.push({
        name: "Speed Demon",
        description: "Achieved 60+ WPM",
        icon: "⚡",
      });
    }

    if (scoreData.accuracy >= 98) {
      achievements.push({
        name: "Perfectionist",
        description: "Achieved 98%+ accuracy",
        icon: "🎯",
      });
    }

    if (perfectRatio >= 0.9) {
      achievements.push({
        name: "Flawless",
        description: "90%+ perfect words",
        icon: "💎",
      });
    }

    if (scoreData.language === "vietnamese" && scoreData.wpm >= 40) {
      achievements.push({
        name: "Vietnamese Master",
        description: "40+ WPM in Vietnamese",
        icon: "🇻🇳",
      });
    }

    return {
      score: {
        totalScore,
        speedScore,
        accuracyScore,
        consistencyScore,
        bonusScore,
        rating,
      },
      achievements,
    };
  }

  recordPerformance(performanceData: {
    wpm: number;
    accuracy: number;
    consistency: number;
    difficulty: string;
    language: string;
    contentType: string;
    wordCount: number;
    errorPatterns: number[];
    timestamp: number;
  }): void {
    const metrics: PerformanceMetrics = {
      wpm: performanceData.wpm,
      accuracy: performanceData.accuracy,
      consistency: performanceData.consistency,
      errorRate: (performanceData.errorPatterns.length / (performanceData.wordCount * 5)) * 100, // Approximate
      commonErrors: {}, // Could be enhanced to track specific error patterns
      weakWords: {}, // Could be enhanced to track problematic words
      strongWords: {}, // Could be enhanced to track well-typed words
      timeOfDay: new Date(performanceData.timestamp).getHours(),
      sessionLength: 5, // Default session length in minutes
    };

    this.performanceHistory.push(metrics);
    this.saveToStorage();
  }
}

export const adaptiveAlgorithm = new AdaptiveAlgorithm();
