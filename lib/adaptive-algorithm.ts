export interface PerformanceTrends {
  wpmTrend: "improving" | "declining" | "stable";
  accuracyTrend: "improving" | "declining" | "stable";
  consistencyTrend: "improving" | "declining" | "stable";
  overallProgress: number;
}

export interface AdaptiveStats {
  totalSessions: number;
  totalTimeMinutes: number;
  averageWpm: number;
  averageAccuracy: number;
  bestWpm: number;
  bestAccuracy: number;
  improvementRate: number;
}

export interface PerformanceMetrics {
  wpm: number;
  accuracy: number;
  consistency: number;
  errorRate: number;
  commonErrors: Record<string, number>;
  weakWords: Record<string, number>;
  strongWords: Record<string, number>;
  timeOfDay: number;
  sessionLength: number; // Thời lượng thực tế (phút)
}

/** Một cặp gõ nhầm: phím đích → phím đã gõ. */
export interface MistakeSummaryEntry {
  target: string;
  typed: string;
  count: number;
}

export interface WeakWordEntry {
  word: string;
  count: number;
}

export interface SkillAssessment {
  overallLevel: "beginner" | "intermediate" | "advanced" | "expert";
  wpmLevel: number; // Thang điểm 1-10
  accuracyLevel: number; // Thang điểm 1-10
  consistencyLevel: number; // Thang điểm 1-10
  strengths: string[];
  weaknesses: string[];
  recommendedDifficulty: "easy" | "medium" | "hard";
  focusAreas: string[];
}

export interface AdaptiveSettings {
  targetWpm: number;
  targetAccuracy: number;
  difficultyMultiplier: number;
  errorThreshold: number;
  adaptationRate: number;
  personalizedWordWeight: number;
}

const MAX_HISTORY_ENTRIES = 50;

export class AdaptiveAlgorithm {
  private performanceHistory: PerformanceMetrics[] = [];
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

  /**
   * Phân tích trình độ hiện tại của người dùng
   */
  assessSkill(): SkillAssessment {
    if (this.performanceHistory.length === 0) {
      return {
        overallLevel: "beginner",
        wpmLevel: 1,
        accuracyLevel: 1,
        consistencyLevel: 1,
        strengths: [],
        weaknesses: ["Tốc độ gõ", "Độ chính xác", "Độ ổn định"],
        recommendedDifficulty: "easy",
        focusAreas: ["Tư thế đặt ngón cơ bản", "Rèn luyện các từ thông dụng"],
      };
    }

    // Lấy tối đa 10 phiên gần nhất
    const recentSessions = this.performanceHistory.slice(-10);
    const avgWpm = recentSessions.reduce((sum, s) => sum + s.wpm, 0) / recentSessions.length;
    const avgAccuracy = recentSessions.reduce((sum, s) => sum + s.accuracy, 0) / recentSessions.length;
    const avgConsistency = recentSessions.reduce((sum, s) => sum + s.consistency, 0) / recentSessions.length;

    // Quy đổi cấp độ (1-10)
    const wpmLevel = Math.min(10, Math.max(1, Math.floor(avgWpm / 10) + 1));
    const accuracyLevel = Math.min(10, Math.max(1, Math.floor(avgAccuracy / 10)));
    const consistencyLevel = Math.min(10, Math.max(1, Math.floor(avgConsistency / 10)));

    // Điểm tổng thể
    const overallScore = (wpmLevel + accuracyLevel + consistencyLevel) / 3;
    let overallLevel: SkillAssessment["overallLevel"];
    if (overallScore < 3.2) overallLevel = "beginner";
    else if (overallScore < 5.5) overallLevel = "intermediate";
    else if (overallScore < 7.5) overallLevel = "advanced";
    else overallLevel = "expert";

    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const focusAreas: string[] = [];

    if (wpmLevel >= 6) strengths.push("Tốc độ nhanh");
    else if (wpmLevel <= 4) {
      weaknesses.push("Tốc độ gõ");
      focusAreas.push("Luyện gõ các cụm từ ngắn để tăng phản xạ");
    }

    if (accuracyLevel >= 8) strengths.push("Độ chính xác cao");
    else if (accuracyLevel <= 6) {
      weaknesses.push("Độ chính xác");
      focusAreas.push("Tập trung chuẩn phím, giảm nhịp để tránh gõ nhầm");
    }

    if (consistencyLevel >= 7) strengths.push("Nhịp gõ ổn định");
    else if (consistencyLevel <= 5) {
      weaknesses.push("Độ ổn định");
      focusAreas.push("Luyện nhịp điệu đều đặn, tránh gõ dồn dập rồi khựng lại");
    }

    // Đề xuất độ khó (Đã cân chỉnh ngưỡng thực tế):
    // - Dưới 3.5 điểm hoặc độ chính xác dưới 85%: Easy
    // - Trên 5.8 điểm hoặc (WPM >= 45 và Accuracy >= 93%): Hard
    // - Còn lại: Medium
    let recommendedDifficulty: "easy" | "medium" | "hard";
    if (overallScore < 3.5 || avgAccuracy < 85) {
      recommendedDifficulty = "easy";
    } else if (overallScore >= 5.8 || (avgWpm >= 45 && avgAccuracy >= 93)) {
      recommendedDifficulty = "hard";
    } else {
      recommendedDifficulty = "medium";
    }

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

  /**
   * Tính trọng số từ vựng cá nhân hóa dựa trên lịch sử gõ sai/đúng
   */
  getWordSelectionWeights(): Record<string, number> {
    const weights: Record<string, number> = {};
    if (this.performanceHistory.length === 0) return weights;

    // Phân tích từ yếu/mạnh trong 10 phiên gần nhất
    const recentSessions = this.performanceHistory.slice(-10);

    for (const session of recentSessions) {
      if (session.weakWords) {
        for (const [word, errorCount] of Object.entries(session.weakWords)) {
          weights[word] = (weights[word] || 1) + errorCount * 0.5;
        }
      }

      if (session.strongWords) {
        for (const [word, successCount] of Object.entries(session.strongWords)) {
          weights[word] = Math.max(0.2, (weights[word] || 1) - successCount * 0.1);
        }
      }
    }

    return weights;
  }

  /**
   * Lấy danh sách các từ hay gõ sai nhất
   */
  getTopWeakWords(limit = 5): Array<{ word: string; count: number }> {
    const wordCounts: Record<string, number> = {};
    for (const session of this.performanceHistory.slice(-10)) {
      if (session.weakWords) {
        for (const [word, count] of Object.entries(session.weakWords)) {
          wordCounts[word] = (wordCounts[word] || 0) + count;
        }
      }
    }

    return Object.entries(wordCounts)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Lấy cấu hình tự thích ứng
   */
  getAdaptiveSettings(): AdaptiveSettings {
    const skillAssessment = this.assessSkill();
    const settings = { ...this.settings };

    settings.targetWpm = Math.max(20, Math.min(100, skillAssessment.wpmLevel * 10));
    settings.targetAccuracy = Math.max(85, Math.min(99, 85 + skillAssessment.accuracyLevel * 1.5));

    if (skillAssessment.overallLevel === "beginner") {
      settings.difficultyMultiplier = 0.7;
    } else if (skillAssessment.overallLevel === "expert") {
      settings.difficultyMultiplier = 1.3;
    }

    settings.adaptationRate = Math.max(0.1, Math.min(1.0, 0.5 - skillAssessment.consistencyLevel * 0.05));
    return settings;
  }

  /**
   * Lời khuyên cá nhân hóa cho Dashboard
   */
  getRecommendations(): string[] {
    const skillAssessment = this.assessSkill();
    const recommendations: string[] = [];

    // Gợi ý từ hay sai nếu có
    const topWeak = this.getTopWeakWords(3);
    if (topWeak.length > 0) {
      const wordsStr = topWeak.map((w) => `"${w.word}"`).join(", ");
      recommendations.push(`Chú ý các từ hay gõ sai gần đây: ${wordsStr} — hãy rèn chậm rãi để tạo phản xạ ngón.`);
    }

    if (skillAssessment.weaknesses.includes("Tốc độ gõ")) {
      recommendations.push("Tập trung vào các từ mẫu ngắn quen thuộc để tăng tốc độ phản xạ.");
      recommendations.push("Thử các lượt gõ nước rút 15 giây để kích hoạt nhịp ngón tay.");
    }

    if (skillAssessment.weaknesses.includes("Độ chính xác")) {
      recommendations.push("Chậm lại một nhịp và ưu tiên gõ đúng phím trước khi cố gắng tăng tốc.");
      recommendations.push("Để ý các cặp phím hay bị gõ đảo thứ tự.");
    }

    if (skillAssessment.weaknesses.includes("Độ ổn định")) {
      recommendations.push("Duy trì nhịp thở và gõ đều đặn, tránh bùng nổ rồi dừng khựng lại.");
      recommendations.push("Thả lỏng cổ tay và cơ vai để tránh mỏi khi gõ bài dài.");
    }

    // Gợi ý theo thời gian trong ngày
    const currentHour = new Date().getHours();
    if (currentHour < 10) {
      recommendations.push("Luyện tập buổi sáng rất hiệu quả để thiết lập độ chuẩn xác cho cả ngày.");
    } else if (currentHour > 20) {
      recommendations.push("Phiên tối nên gõ ở nhịp độ thư giãn để duy trì độ ổn định.");
    }

    // Gợi ý theo thời lượng bài tập
    if (this.performanceHistory.length > 0) {
      const recentSessions = this.performanceHistory.slice(-5);
      const avgLength = recentSessions.reduce((sum, s) => sum + s.sessionLength, 0) / recentSessions.length;
      if (avgLength < 0.3) {
        recommendations.push("Hãy thử các bài 25–50 từ hoặc 60s để rèn luyện độ bền gõ phím.");
      } else if (avgLength > 3) {
        recommendations.push("Nên nghỉ ngơi 1-2 phút giữa các phiên dài để giữ mắt và tay luôn thoải mái.");
      }
    }

    return recommendations.slice(0, 3);
  }

  /**
   * Phản hồi thời gian thực từ AI Coach trong lúc gõ (Bản địa hóa tiếng Việt + biến thể)
   */
  getRealtimeFeedback(
    currentPerformance: { wpm: number; accuracy: number; consistency: number },
    context?: { currentWord?: string; isError?: boolean }
  ): string | null {
    const settings = this.getAdaptiveSettings();

    // 1. Cảnh báo lỗi / Độ chính xác thấp
    if (currentPerformance.accuracy < 85 || context?.isError) {
      if (context?.currentWord) {
        return `Chú ý từ "${context.currentWord}" — hãy giảm tốc một chút để chuẩn phím`;
      }
      const accuracyTips = [
        "Ưu tiên độ chính xác — chậm lại một nhịp để giảm lỗi sai",
        "Hãy gõ chuẩn từng phím trước khi đẩy nhanh tốc độ",
        "Giữ bình tĩnh, độ chính xác cao sẽ tự khắc giúp tăng tốc độ",
      ];
      return accuracyTips[Math.floor(Math.random() * accuracyTips.length)];
    }

    // 2. Nhịp gõ quá chậm so với mục tiêu
    if (currentPerformance.wpm < settings.targetWpm * 0.7 && currentPerformance.accuracy >= 90) {
      return "Tốc độ đang hơi chậm — bạn đang gõ rất chuẩn, hãy tự tin tăng tốc!";
    }

    // 3. Thiếu ổn định (khựng lại nhiều)
    if (currentPerformance.consistency < 65) {
      return "Duy trì nhịp gõ đều đặn — tránh gõ dồn dập rồi khựng lại";
    }

    // 4. Phong độ xuất sắc
    if (currentPerformance.wpm > settings.targetWpm * 1.2 && currentPerformance.accuracy > 95) {
      const praiseTips = [
        "Phong độ tuyệt vời! Bạn đang kiểm soát phím rất chắc tay",
        "Tốc độ và độ chính xác đều xuất sắc, tiếp tục giữ vững!",
        "Flow gõ phím rất mượt mà!",
      ];
      return praiseTips[Math.floor(Math.random() * praiseTips.length)];
    }

    return null;
  }

  /**
   * Tính toán xu hướng tiến bộ
   */
  getPerformanceTrends(): PerformanceTrends {
    if (this.performanceHistory.length < 4) {
      return {
        wpmTrend: "stable",
        accuracyTrend: "stable",
        consistencyTrend: "stable",
        overallProgress: 0,
      };
    }

    const half = Math.floor(this.performanceHistory.length / 2);
    const older = this.performanceHistory.slice(0, half);
    const recent = this.performanceHistory.slice(half);

    const recentAvgWpm = recent.reduce((sum, s) => sum + s.wpm, 0) / recent.length;
    const olderAvgWpm = older.reduce((sum, s) => sum + s.wpm, 0) / older.length;
    const wpmChange = olderAvgWpm > 0 ? (recentAvgWpm - olderAvgWpm) / olderAvgWpm : 0;

    const recentAvgAcc = recent.reduce((sum, s) => sum + s.accuracy, 0) / recent.length;
    const olderAvgAcc = older.reduce((sum, s) => sum + s.accuracy, 0) / older.length;
    const accChange = olderAvgAcc > 0 ? (recentAvgAcc - olderAvgAcc) / olderAvgAcc : 0;

    const recentAvgCon = recent.reduce((sum, s) => sum + s.consistency, 0) / recent.length;
    const olderAvgCon = older.reduce((sum, s) => sum + s.consistency, 0) / older.length;
    const conChange = olderAvgCon > 0 ? (recentAvgCon - olderAvgCon) / olderAvgCon : 0;

    const getTrend = (change: number): "improving" | "declining" | "stable" => {
      if (change > 0.05) return "improving";
      if (change < -0.05) return "declining";
      return "stable";
    };

    return {
      wpmTrend: getTrend(wpmChange),
      accuracyTrend: getTrend(accChange),
      consistencyTrend: getTrend(conChange),
      overallProgress: Math.round(((wpmChange + accChange + conChange) / 3) * 100) / 100,
    };
  }

  /**
   * Thống kê tổng hợp cho Dashboard
   */
  getStats(): AdaptiveStats {
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
    const totalTimeMinutes = Math.round(this.performanceHistory.reduce((sum, s) => sum + s.sessionLength, 0) * 10) / 10;
    const averageWpm = Math.round(this.performanceHistory.reduce((sum, s) => sum + s.wpm, 0) / totalSessions);
    const averageAccuracy = Math.round((this.performanceHistory.reduce((sum, s) => sum + s.accuracy, 0) / totalSessions) * 10) / 10;
    const bestWpm = Math.max(...this.performanceHistory.map((s) => s.wpm));
    const bestAccuracy = Math.max(...this.performanceHistory.map((s) => s.accuracy));

    let improvementRate = 0;
    if (totalSessions > 1) {
      const firstChunk = this.performanceHistory.slice(0, Math.min(5, Math.floor(totalSessions / 2)));
      const lastChunk = this.performanceHistory.slice(-Math.min(5, Math.floor(totalSessions / 2)));
      const firstAvg = firstChunk.reduce((sum, s) => sum + s.wpm, 0) / firstChunk.length;
      const lastAvg = lastChunk.reduce((sum, s) => sum + s.wpm, 0) / lastChunk.length;
      improvementRate = Math.round(((lastAvg - firstAvg) / totalSessions) * 10) / 10;
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

  /**
   * Gộp lỗi gõ nhầm từ toàn bộ lịch sử học thích ứng — dùng cho dashboard.
   * Chỉ có dữ liệu khi người dùng bật chế độ AI Adaptive.
   */
  getMistakeSummary(limit = 6): MistakeSummaryEntry[] {
    const totals: Record<string, number> = {};

    for (const entry of this.performanceHistory) {
      for (const [pair, count] of Object.entries(entry.commonErrors || {})) {
        totals[pair] = (totals[pair] || 0) + count;
      }
    }

    return Object.entries(totals)
      .map(([pair, count]) => {
        const [target = "", typed = ""] = pair.split("->");
        return { target, typed, count };
      })
      .filter((item) => item.target.length > 0 && item.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  getWeakWords(limit = 12): WeakWordEntry[] {
    const totals: Record<string, number> = {};

    for (const entry of this.performanceHistory) {
      for (const [word, count] of Object.entries(entry.weakWords || {})) {
        totals[word] = (totals[word] || 0) + count;
      }
    }

    return Object.entries(totals)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Ghi nhận phiên gõ thực tế với thông tin chi tiết về từ đúng/sai và thời lượng thật
   */
  recordPerformance(performanceData: {
    wpm: number;
    accuracy: number;
    consistency: number;
    difficulty: string;
    language: string;
    contentType: string;
    wordCount: number;
    sessionLength?: number;
    weakWords?: Record<string, number>;
    strongWords?: Record<string, number>;
    commonErrors?: Record<string, number>;
    timestamp?: number;
  }): void {
    const sessionDurationMinutes = performanceData.sessionLength && performanceData.sessionLength > 0
      ? performanceData.sessionLength
      : Math.max(0.1, (performanceData.wordCount * 5) / (Math.max(performanceData.wpm, 20) * 5));

    const metrics: PerformanceMetrics = {
      wpm: Math.round(performanceData.wpm),
      accuracy: Math.round(performanceData.accuracy * 10) / 10,
      consistency: Math.round(performanceData.consistency),
      errorRate: Math.max(0, 100 - performanceData.accuracy),
      commonErrors: performanceData.commonErrors || {},
      weakWords: performanceData.weakWords || {},
      strongWords: performanceData.strongWords || {},
      timeOfDay: new Date(performanceData.timestamp || Date.now()).getHours(),
      sessionLength: Math.round(sessionDurationMinutes * 100) / 100,
    };

    this.performanceHistory.push(metrics);
    if (this.performanceHistory.length > MAX_HISTORY_ENTRIES) {
      this.performanceHistory = this.performanceHistory.slice(-MAX_HISTORY_ENTRIES);
    }

    this.saveToStorage();
  }

  /**
   * Lưu an toàn vào localStorage có try/catch
   */
  private saveToStorage(): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("typeflow-performance", JSON.stringify(this.performanceHistory.slice(-MAX_HISTORY_ENTRIES)));
      localStorage.setItem("typeflow-settings", JSON.stringify(this.settings));
    } catch (err) {
      console.warn("[AdaptiveAlgorithm] Failed to save to localStorage:", err);
    }
  }

  /**
   * Đọc lại dữ liệu từ localStorage (sau khi import dữ liệu mới)
   */
  public reloadFromStorage(): void {
    this.loadFromStorage();
  }

  /**
   * Đọc an toàn từ localStorage có try/catch và kiểm tra tính hợp lệ
   */
  private loadFromStorage(): void {
    if (typeof window === "undefined") return;
    try {
      const performanceData = localStorage.getItem("typeflow-performance");
      if (performanceData) {
        const parsed = JSON.parse(performanceData);
        if (Array.isArray(parsed)) {
          this.performanceHistory = parsed.slice(-MAX_HISTORY_ENTRIES);
        }
      }

      const settingsData = localStorage.getItem("typeflow-settings");
      if (settingsData) {
        const parsed = JSON.parse(settingsData);
        if (parsed && typeof parsed === "object") {
          this.settings = { ...this.settings, ...parsed };
        }
      }
    } catch (err) {
      console.warn("[AdaptiveAlgorithm] Failed to load from localStorage, resetting defaults:", err);
      this.performanceHistory = [];
    }
  }

  /**
   * Xóa toàn bộ dữ liệu thích ứng
   */
  clearData(): void {
    this.performanceHistory = [];
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem("typeflow-performance");
      localStorage.removeItem("typeflow-settings");
    } catch (err) {
      console.warn("[AdaptiveAlgorithm] Failed to clear storage:", err);
    }
  }
}

export const adaptiveAlgorithm = new AdaptiveAlgorithm();
