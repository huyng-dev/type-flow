"use client"

import { useCallback, useEffect, useState } from "react"

import {
  adaptiveAlgorithm,
  type AdaptiveStats,
  type PerformanceTrends,
  type SkillAssessment,
} from "@/lib/adaptive-algorithm"
import {
  scoringSystem,
  type Achievement,
  type AchievementStats,
  type PersonalBests,
  type ScoreEntry,
  type StreakData,
} from "@/lib/scoring-system"
import {
  StatisticsManager,
  type GameSession,
  type LanguageStats,
  type ProgressPoint,
  type StatsSummary,
} from "@/lib/statistics"

export type DashboardTab = "overview" | "progress" | "achievements" | "coach" | "sessions"

export const DASHBOARD_TABS: { value: DashboardTab; label: string }[] = [
  { value: "overview", label: "Tổng quan" },
  { value: "progress", label: "Tiến bộ" },
  { value: "achievements", label: "Huy hiệu" },
  { value: "coach", label: "AI Coach" },
  { value: "sessions", label: "Nhật ký" },
]

export type TimeRange = 7 | 30 | 90 | 365

export const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: 7, label: "7 ngày" },
  { value: 30, label: "30 ngày" },
  { value: 90, label: "90 ngày" },
  { value: 365, label: "1 năm" },
]

export interface DifficultyStat {
  difficulty: "easy" | "medium" | "hard"
  sessions: number
  averageWpm: number
  averageAccuracy: number
  bestWpm: number
  improvementRate: number
}

export interface DashboardData {
  summary: StatsSummary
  languages: LanguageStats[]
  progress: ProgressPoint[]
  sessions: GameSession[]
  difficulty: DifficultyStat[]
  leaderboard: ScoreEntry[]
  bests: PersonalBests
  achievementStats: AchievementStats
  achievements: Achievement[]
  streak: StreakData
  skill: SkillAssessment
  trends: PerformanceTrends
  adaptiveStats: AdaptiveStats
  recommendations: string[]
}

const DIFFICULTIES: DifficultyStat["difficulty"][] = ["easy", "medium", "hard"]

function buildDifficultyStats(sessions: GameSession[]): DifficultyStat[] {
  return DIFFICULTIES.map((difficulty) => {
    const matching = sessions.filter((session) => session.difficulty === difficulty)

    if (matching.length === 0) {
      return {
        difficulty,
        sessions: 0,
        averageWpm: 0,
        averageAccuracy: 0,
        bestWpm: 0,
        improvementRate: 0,
      }
    }

    const averageWpm = Math.round(
      matching.reduce((sum, session) => sum + session.wpm, 0) / matching.length
    )
    const averageAccuracy = Math.round(
      matching.reduce((sum, session) => sum + session.accuracy, 0) / matching.length
    )
    const bestWpm = Math.max(...matching.map((session) => session.wpm))

    let improvementRate = 0
    if (matching.length >= 10) {
      const recent = matching.slice(0, 5)
      const previous = matching.slice(5, 10)
      const recentAverage = recent.reduce((sum, session) => sum + session.wpm, 0) / 5
      const previousAverage = previous.reduce((sum, session) => sum + session.wpm, 0) / 5
      improvementRate = previousAverage > 0 ? ((recentAverage - previousAverage) / previousAverage) * 100 : 0
    }

    return {
      difficulty,
      sessions: matching.length,
      averageWpm,
      averageAccuracy,
      bestWpm,
      improvementRate: Math.round(improvementRate * 10) / 10,
    }
  })
}

export function buildDashboardData(range: TimeRange): DashboardData {
  const allSessions = StatisticsManager.getAllSessions()

  return {
    summary: StatisticsManager.calculateSummary(),
    languages: StatisticsManager.getLanguageStats(),
    progress: StatisticsManager.getProgressData(range),
    sessions: StatisticsManager.getRecentSessions(range),
    difficulty: buildDifficultyStats(allSessions),
    leaderboard: scoringSystem.getLeaderboard(20),
    bests: scoringSystem.getPersonalBests(),
    achievementStats: scoringSystem.getAchievementStats(),
    achievements: scoringSystem.getAllAchievements(),
    streak: scoringSystem.getStreakInfo(),
    skill: adaptiveAlgorithm.assessSkill(),
    trends: adaptiveAlgorithm.getPerformanceTrends(),
    adaptiveStats: adaptiveAlgorithm.getStats(),
    recommendations: adaptiveAlgorithm.getRecommendations(),
  }
}

export function useDashboardData() {
  const [range, setRange] = useState<TimeRange>(30)
  const [revision, setRevision] = useState(0)
  const [data, setData] = useState<DashboardData>(() => buildDashboardData(30))

  useEffect(() => {
    setData(buildDashboardData(range))
  }, [range, revision])

  const refresh = useCallback(() => setRevision((value) => value + 1), [])

  return { data, range, setRange, refresh }
}
