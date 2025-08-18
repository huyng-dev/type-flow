"use client"

import type React from "react"
import { useState, useMemo, useEffect } from "react"
import { StatisticsManager } from "@/lib/statistics"

interface StatisticsDashboardProps {
  isOpen: boolean
  onClose: () => void
}

export function StatisticsDashboard({ isOpen, onClose }: StatisticsDashboardProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "progress" | "languages" | "difficulty" | "sessions">(
    "overview",
  )
  const [timeRange, setTimeRange] = useState<7 | 30 | 90 | 365>(30)
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all")
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all")

  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (isOpen) {
      setRefreshKey((prev) => prev + 1)
    }
  }, [isOpen])

  const summary = useMemo(() => StatisticsManager.calculateSummary(), [refreshKey])
  const languageStats = useMemo(() => StatisticsManager.getLanguageStats(), [refreshKey])
  const progressData = useMemo(() => StatisticsManager.getProgressData(timeRange), [timeRange, refreshKey])
  const recentSessions = useMemo(() => StatisticsManager.getRecentSessions(timeRange), [timeRange, refreshKey])

  const difficultyStats = useMemo(() => {
    const sessions = StatisticsManager.getAllSessions()
    const difficulties = ["easy", "medium", "hard"]

    return difficulties.map((difficulty) => {
      const difficultySessions = sessions.filter((s) => s.difficulty === difficulty)

      if (difficultySessions.length === 0) {
        return {
          difficulty,
          sessions: 0,
          averageWpm: 0,
          averageAccuracy: 0,
          bestWpm: 0,
          totalTimeTyped: 0,
          improvementRate: 0,
        }
      }

      const averageWpm = Math.round(difficultySessions.reduce((sum, s) => sum + s.wpm, 0) / difficultySessions.length)
      const averageAccuracy = Math.round(
        difficultySessions.reduce((sum, s) => sum + s.accuracy, 0) / difficultySessions.length,
      )
      const bestWpm = Math.max(...difficultySessions.map((s) => s.wpm))
      const totalTimeTyped = difficultySessions.reduce((sum, s) => sum + s.timeElapsed, 0)

      let improvementRate = 0
      if (difficultySessions.length >= 10) {
        const recent5 = difficultySessions.slice(0, 5)
        const previous5 = difficultySessions.slice(5, 10)
        const recentAvg = recent5.reduce((sum, s) => sum + s.wpm, 0) / 5
        const previousAvg = previous5.reduce((sum, s) => sum + s.wpm, 0) / 5
        improvementRate = ((recentAvg - previousAvg) / previousAvg) * 100
      }

      return {
        difficulty,
        sessions: difficultySessions.length,
        averageWpm,
        averageAccuracy,
        bestWpm,
        totalTimeTyped,
        improvementRate: Math.round(improvementRate * 10) / 10,
      }
    })
  }, [refreshKey])

  const filteredSessions = useMemo(() => {
    let sessions = recentSessions

    if (selectedLanguage !== "all") {
      sessions = sessions.filter((s) => s.language === selectedLanguage)
    }

    if (selectedDifficulty !== "all") {
      sessions = sessions.filter((s) => s.difficulty === selectedDifficulty)
    }

    return sessions
  }, [recentSessions, selectedLanguage, selectedDifficulty])

  const handleExport = () => {
    const data = StatisticsManager.exportData()
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `typeflow-stats-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        if (StatisticsManager.importData(content)) {
          alert("Data imported successfully!")
          window.location.reload()
        } else {
          alert("Failed to import data. Please check the file format.")
        }
      }
      reader.readAsText(file)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card border rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">Statistics Dashboard</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            ✕
          </button>
        </div>

        <div className="flex border-b">
          {[
            { id: "overview", label: "Overview" },
            { id: "progress", label: "Progress" },
            { id: "languages", label: "Languages" },
            { id: "difficulty", label: "Difficulty" },
            { id: "sessions", label: "Sessions" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === tab.id
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-background border rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{summary.totalSessions}</div>
                  <div className="text-sm text-muted-foreground">Total Sessions</div>
                </div>
                <div className="bg-background border rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{Math.round(summary.totalTimeTyped / 60)}</div>
                  <div className="text-sm text-muted-foreground">Minutes Typed</div>
                </div>
                <div className="bg-background border rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{summary.averageWpm}</div>
                  <div className="text-sm text-muted-foreground">Average WPM</div>
                </div>
                <div className="bg-background border rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{summary.averageAccuracy}%</div>
                  <div className="text-sm text-muted-foreground">Average Accuracy</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-background border rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Personal Bests</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Best WPM:</span>
                      <span className="font-medium">{summary.bestWpm}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Best Accuracy:</span>
                      <span className="font-medium">{summary.bestAccuracy}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Words:</span>
                      <span className="font-medium">{summary.totalWordsTyped.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Achievements:</span>
                      <span className="font-medium">{summary.totalAchievements}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-background border rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Progress & Streaks</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Improvement Rate:</span>
                      <span
                        className={`font-medium ${summary.improvementRate >= 0 ? "text-green-400" : "text-red-400"}`}
                      >
                        {summary.improvementRate > 0 ? "+" : ""}
                        {summary.improvementRate}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Current Streak:</span>
                      <span className="font-medium">{summary.currentStreak} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Longest Streak:</span>
                      <span className="font-medium">{summary.longestStreak} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Favorite Language:</span>
                      <span className="font-medium capitalize">{summary.favoriteLanguage}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Favorite Difficulty:</span>
                      <span className="font-medium capitalize">{summary.favoritedifficulty}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "progress" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Progress Over Time</h3>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(Number(e.target.value) as any)}
                  className="p-2 bg-background border rounded-md"
                >
                  <option value={7}>Last 7 days</option>
                  <option value={30}>Last 30 days</option>
                  <option value={90}>Last 90 days</option>
                  <option value={365}>Last year</option>
                </select>
              </div>

              {progressData.length > 0 ? (
                <div className="bg-background border rounded-lg p-4">
                  <div className="h-64 flex items-end justify-between space-x-1">
                    {progressData.map((data, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center space-y-1">
                        <div className="flex flex-col items-center space-y-1 w-full">
                          <div
                            className="bg-primary/20 w-full rounded-t"
                            style={{ height: `${(data.wpm / Math.max(...progressData.map((d) => d.wpm))) * 100}px` }}
                            title={`${data.wpm} WPM`}
                          />
                          <div
                            className="bg-green-400/20 w-full rounded-b"
                            style={{ height: `${(data.accuracy / 100) * 50}px` }}
                            title={`${data.accuracy}% Accuracy`}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground transform -rotate-45 origin-left">
                          {new Date(data.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-center space-x-4 mt-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-primary/20 rounded"></div>
                      <span>WPM</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-400/20 rounded"></div>
                      <span>Accuracy</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-background border rounded-lg p-8 text-center text-muted-foreground">
                  No data available for the selected time range
                </div>
              )}
            </div>
          )}

          {activeTab === "languages" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Language Performance</h3>
              <div className="grid gap-4">
                {languageStats.map((lang) => (
                  <div key={lang.language} className="bg-background border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium capitalize">{lang.language}</h4>
                      <span className="text-sm text-muted-foreground">{lang.sessions} sessions</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Avg WPM</div>
                        <div className="font-medium">{lang.averageWpm}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Avg Accuracy</div>
                        <div className="font-medium">{lang.averageAccuracy}%</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Best WPM</div>
                        <div className="font-medium">{lang.bestWpm}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Improvement</div>
                        <div className={`font-medium ${lang.improvementRate >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {lang.improvementRate > 0 ? "+" : ""}
                          {lang.improvementRate}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "difficulty" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Difficulty Analysis</h3>
              <div className="bg-background border rounded-lg p-4">
                <h4 className="font-medium mb-4">Performance by Difficulty</h4>
                <div className="space-y-4">
                  {difficultyStats.map((diff) => (
                    <div key={diff.difficulty} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium capitalize">{diff.difficulty}</span>
                        <span className="text-sm text-muted-foreground">{diff.sessions} sessions</span>
                      </div>
                      {diff.sessions > 0 ? (
                        <>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">WPM: {diff.averageWpm}</span>
                              <span className="text-muted-foreground">Best: {diff.bestWpm}</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                style={{
                                  width: `${Math.min((diff.averageWpm / Math.max(...difficultyStats.map((d) => d.averageWpm))) * 100, 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Accuracy: {diff.averageAccuracy}%</span>
                              <span
                                className={`text-sm ${diff.improvementRate >= 0 ? "text-green-400" : "text-red-400"}`}
                              >
                                {diff.improvementRate > 0 ? "+" : ""}
                                {diff.improvementRate}%
                              </span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div
                                className="bg-green-400 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${diff.averageAccuracy}%` }}
                              />
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-muted-foreground italic">No sessions recorded</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-background border rounded-lg p-4">
                <h4 className="font-medium mb-3">Recommendations</h4>
                <div className="space-y-2 text-sm">
                  {difficultyStats
                    .map((diff) => {
                      if (diff.sessions === 0) return null

                      let recommendation = ""
                      if (diff.averageAccuracy >= 95 && diff.averageWpm >= 40) {
                        recommendation =
                          diff.difficulty === "hard"
                            ? "Excellent performance! Keep challenging yourself."
                            : "Consider moving to a higher difficulty level."
                      } else if (diff.averageAccuracy < 85) {
                        recommendation = "Focus on accuracy before increasing difficulty."
                      } else if (diff.averageWpm < 25) {
                        recommendation = "Practice more to build speed and muscle memory."
                      } else {
                        recommendation = "Good progress! Keep practicing consistently."
                      }

                      return (
                        <div
                          key={diff.difficulty}
                          className="flex justify-between items-center p-2 bg-muted/50 rounded"
                        >
                          <span className="font-medium capitalize">{diff.difficulty}:</span>
                          <span className="text-muted-foreground">{recommendation}</span>
                        </div>
                      )
                    })
                    .filter(Boolean)}
                </div>
              </div>
            </div>
          )}

          {activeTab === "sessions" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Recent Sessions</h3>
                <div className="flex space-x-2">
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="p-2 bg-background border rounded text-sm"
                  >
                    <option value="all">All Languages</option>
                    <option value="english">English</option>
                    <option value="vietnamese">Vietnamese</option>
                  </select>
                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className="p-2 bg-background border rounded text-sm"
                  >
                    <option value="all">All Difficulties</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                  <button
                    onClick={handleExport}
                    className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90"
                  >
                    Export
                  </button>
                  <label className="px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm hover:bg-secondary/90 cursor-pointer">
                    Import
                    <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                  </label>
                </div>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredSessions.map((session) => (
                  <div key={session.id} className="bg-background border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium capitalize">{session.language}</span>
                        <span
                          className={`text-sm px-2 py-1 rounded text-xs font-medium ${
                            session.difficulty === "easy"
                              ? "bg-green-100 text-green-800"
                              : session.difficulty === "medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {session.difficulty}
                        </span>
                        <span className="text-sm text-muted-foreground">{session.wordCount} words</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(session.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">WPM: </span>
                        <span className="font-medium">{session.wpm}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Accuracy: </span>
                        <span className="font-medium">{session.accuracy}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Score: </span>
                        <span className="font-medium">{session.totalScore}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Rating: </span>
                        <span className="font-medium">{session.rating}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredSessions.length === 0 && (
                  <div className="bg-background border rounded-lg p-8 text-center text-muted-foreground">
                    No sessions found for the selected filters
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
