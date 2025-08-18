"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Award, Flame, Star, Medal, Crown } from "lucide-react"
import { scoringSystem, type ScoreEntry, type Achievement } from "@/lib/scoring-system"

interface ScoreDisplayProps {
  scoreEntry?: ScoreEntry
  newAchievements?: Achievement[]
  className?: string
}

export function ScoreDisplay({ scoreEntry, newAchievements = [], className }: ScoreDisplayProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [leaderboard, setLeaderboard] = useState<ScoreEntry[]>([])
  const [personalBests, setPersonalBests] = useState<any>(null)
  const [achievementStats, setAchievementStats] = useState<any>(null)
  const [streakInfo, setStreakInfo] = useState<any>(null)

  useEffect(() => {
    updateData()
  }, [])

  useEffect(() => {
    if (newAchievements.length > 0) {
      setIsOpen(true)
    }
  }, [newAchievements])

  const updateData = () => {
    setLeaderboard(scoringSystem.getLeaderboard())
    setPersonalBests(scoringSystem.getPersonalBests())
    setAchievementStats(scoringSystem.getAchievementStats())
    setStreakInfo(scoringSystem.getStreakInfo())
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "text-gray-600"
      case "rare":
        return "text-blue-600"
      case "epic":
        return "text-purple-600"
      case "legendary":
        return "text-yellow-600"
      default:
        return "text-gray-600"
    }
  }

  const getRarityBg = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "bg-gray-100"
      case "rare":
        return "bg-blue-100"
      case "epic":
        return "bg-purple-100"
      case "legendary":
        return "bg-yellow-100"
      default:
        return "bg-gray-100"
    }
  }

  if (!scoreEntry) {
    return (
      <Button variant="outline" size="sm" className={className} disabled>
        <Trophy className="h-4 w-4 mr-2" />
        No Score Yet
      </Button>
    )
  }

  return (
    <div className={className}>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 bg-transparent">
            <Trophy className="h-4 w-4" />
            Score: {scoreEntry.score.toLocaleString()}
            <Badge variant="secondary" className={scoreEntry.rating.color}>
              {scoreEntry.rating.overall}
            </Badge>
            {streakInfo && streakInfo.current > 1 && (
              <Badge variant="outline" className="gap-1">
                <Flame className="h-3 w-3" />
                {streakInfo.current}
              </Badge>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Performance Report
            </DialogTitle>
            <DialogDescription>Detailed breakdown of your typing performance and achievements</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="score" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="score">Score</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
              <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
              <TabsTrigger value="stats">Statistics</TabsTrigger>
            </TabsList>

            {/* Score Breakdown */}
            <TabsContent value="score" className="space-y-6">
              {/* New Achievements Alert */}
              {newAchievements.length > 0 && (
                <Card className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-yellow-800">
                    <Award className="h-5 w-5" />
                    New Achievements Unlocked!
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {newAchievements.map((achievement) => (
                      <div key={achievement.id} className={`p-3 rounded-lg ${getRarityBg(achievement.rarity)}`}>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{achievement.icon}</span>
                          <div>
                            <h4 className={`font-medium ${getRarityColor(achievement.rarity)}`}>{achievement.name}</h4>
                            <p className="text-sm text-muted-foreground">{achievement.description}</p>
                            <Badge variant="outline" className="mt-1">
                              +{achievement.points} points
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Performance Rating */}
              <Card className="p-6">
                <div className="text-center mb-6">
                  <div className={`text-6xl font-bold ${scoreEntry.rating.color} mb-2`}>
                    {scoreEntry.rating.overall}
                  </div>
                  <div className="text-lg text-muted-foreground">{scoreEntry.rating.description}</div>
                  <div className="text-3xl font-bold text-primary mt-2">{scoreEntry.score.toLocaleString()} points</div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${scoreEntry.rating.color}`}>{scoreEntry.rating.speed}</div>
                    <div className="text-sm text-muted-foreground">Speed</div>
                    <div className="text-lg font-semibold">{scoreEntry.wpm} WPM</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${scoreEntry.rating.color}`}>{scoreEntry.rating.accuracy}</div>
                    <div className="text-sm text-muted-foreground">Accuracy</div>
                    <div className="text-lg font-semibold">{scoreEntry.accuracy}%</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${scoreEntry.rating.color}`}>
                      {scoreEntry.rating.consistency}
                    </div>
                    <div className="text-sm text-muted-foreground">Consistency</div>
                  </div>
                </div>
              </Card>

              {/* Score Breakdown */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Score Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Base Score (WPM × Accuracy)</span>
                    <span className="font-semibold">+{scoreEntry.breakdown.baseScore}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Speed Bonus</span>
                    <span className="font-semibold">+{scoreEntry.breakdown.speedBonus}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Accuracy Bonus</span>
                    <span className="font-semibold">+{scoreEntry.breakdown.accuracyBonus}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Consistency Bonus</span>
                    <span className="font-semibold">+{scoreEntry.breakdown.consistencyBonus}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Perfect Word Bonus</span>
                    <span className="font-semibold">+{scoreEntry.breakdown.perfectWordBonus}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Time Bonus</span>
                    <span className="font-semibold">+{scoreEntry.breakdown.timeBonus}</span>
                  </div>
                  {scoreEntry.breakdown.streakBonus > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1">
                        <Flame className="h-4 w-4" />
                        Streak Bonus
                      </span>
                      <span className="font-semibold">+{scoreEntry.breakdown.streakBonus}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span>Difficulty Multiplier</span>
                    <span className="font-semibold">×{scoreEntry.breakdown.difficultyMultiplier}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Language Multiplier</span>
                    <span className="font-semibold">×{scoreEntry.breakdown.languageMultiplier}</span>
                  </div>
                  <hr />
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total Score</span>
                    <span className="text-primary">{scoreEntry.breakdown.totalScore.toLocaleString()}</span>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Achievements */}
            <TabsContent value="achievements" className="space-y-6">
              {achievementStats && (
                <>
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Achievement Progress</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{achievementStats.unlocked}</div>
                        <div className="text-sm text-muted-foreground">Unlocked</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{achievementStats.total}</div>
                        <div className="text-sm text-muted-foreground">Total</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {achievementStats.points.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">Points</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {Math.round((achievementStats.unlocked / achievementStats.total) * 100)}%
                        </div>
                        <div className="text-sm text-muted-foreground">Complete</div>
                      </div>
                    </div>
                    <Progress value={(achievementStats.unlocked / achievementStats.total) * 100} className="h-2" />
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Recent Achievements</h3>
                    <div className="space-y-3">
                      {achievementStats.recent.length > 0 ? (
                        achievementStats.recent.map((achievement: Achievement) => (
                          <div key={achievement.id} className={`p-3 rounded-lg ${getRarityBg(achievement.rarity)}`}>
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{achievement.icon}</span>
                              <div className="flex-1">
                                <h4 className={`font-medium ${getRarityColor(achievement.rarity)}`}>
                                  {achievement.name}
                                </h4>
                                <p className="text-sm text-muted-foreground">{achievement.description}</p>
                              </div>
                              <Badge variant="outline">+{achievement.points}</Badge>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-center py-4">
                          No achievements unlocked yet. Keep typing to earn your first achievement!
                        </p>
                      )}
                    </div>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* Leaderboard */}
            <TabsContent value="leaderboard" className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Crown className="h-5 w-5" />
                  Top Scores
                </h3>
                <div className="space-y-3">
                  {leaderboard.map((entry, index) => (
                    <div
                      key={entry.id}
                      className={`flex items-center gap-4 p-3 rounded-lg ${
                        entry.id === scoreEntry.id ? "bg-primary/10 border border-primary/20" : "bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20">
                        {index === 0 ? (
                          <Crown className="h-4 w-4 text-yellow-600" />
                        ) : index === 1 ? (
                          <Medal className="h-4 w-4 text-gray-400" />
                        ) : index === 2 ? (
                          <Medal className="h-4 w-4 text-orange-600" />
                        ) : (
                          <span className="text-sm font-semibold">{index + 1}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{entry.score.toLocaleString()}</span>
                          <Badge variant="outline" className={entry.rating.color}>
                            {entry.rating.overall}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {entry.wpm} WPM • {entry.accuracy}% • {entry.language}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            {/* Statistics */}
            <TabsContent value="stats" className="space-y-6">
              {personalBests && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Personal Bests
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {personalBests.highestScore && (
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <div className="text-sm text-muted-foreground">Highest Score</div>
                        <div className="text-2xl font-bold text-primary">
                          {personalBests.highestScore.score.toLocaleString()}
                        </div>
                        <div className="text-sm">
                          {new Date(personalBests.highestScore.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                    {personalBests.fastestWpm && (
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <div className="text-sm text-muted-foreground">Fastest WPM</div>
                        <div className="text-2xl font-bold text-primary">{personalBests.fastestWpm.wpm}</div>
                        <div className="text-sm">
                          {new Date(personalBests.fastestWpm.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                    {personalBests.bestAccuracy && (
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <div className="text-sm text-muted-foreground">Best Accuracy</div>
                        <div className="text-2xl font-bold text-primary">{personalBests.bestAccuracy.accuracy}%</div>
                        <div className="text-sm">
                          {new Date(personalBests.bestAccuracy.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                    {personalBests.longestSession && (
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <div className="text-sm text-muted-foreground">Longest Session</div>
                        <div className="text-2xl font-bold text-primary">
                          {Math.round(personalBests.longestSession.timeElapsed / 60)}m
                        </div>
                        <div className="text-sm">
                          {new Date(personalBests.longestSession.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {streakInfo && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Flame className="h-5 w-5" />
                    Typing Streak
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-500">{streakInfo.current}</div>
                      <div className="text-sm text-muted-foreground">Current Streak</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-500">{streakInfo.longest}</div>
                      <div className="text-sm text-muted-foreground">Longest Streak</div>
                    </div>
                  </div>
                  {streakInfo.current > 1 && (
                    <div className="mt-4 p-3 bg-orange-50 rounded-lg">
                      <div className="text-sm text-orange-800">
                        Streak bonus: {Math.round((streakInfo.multiplier - 1) * 100)}% extra points!
                      </div>
                    </div>
                  )}
                </Card>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex gap-2">
            <Button onClick={updateData} variant="outline">
              Refresh Data
            </Button>
            <Button
              onClick={() => {
                scoringSystem.clearData()
                updateData()
              }}
              variant="outline"
              className="text-destructive"
            >
              Reset Scores
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
