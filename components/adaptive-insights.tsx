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
import { TrendingUp, TrendingDown, Minus, Brain, Target, Lightbulb } from "lucide-react"
import { adaptiveAlgorithm, type SkillAssessment } from "@/lib/adaptive-algorithm"

interface AdaptiveInsightsProps {
  className?: string
}

export function AdaptiveInsights({ className }: AdaptiveInsightsProps) {
  const [skillAssessment, setSkillAssessment] = useState<SkillAssessment | null>(null)
  const [recommendations, setRecommendations] = useState<string[]>([])
  const [trends, setTrends] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    updateInsights()
  }, [])

  const updateInsights = () => {
    setSkillAssessment(adaptiveAlgorithm.assessSkill())
    setRecommendations(adaptiveAlgorithm.getRecommendations())
    setTrends(adaptiveAlgorithm.getPerformanceTrends())
    setStats(adaptiveAlgorithm.getStats())
  }

  const getTrendIcon = (trend: "improving" | "declining" | "stable") => {
    switch (trend) {
      case "improving":
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case "declining":
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getLevelColor = (level: number) => {
    if (level >= 8) return "text-green-500"
    if (level >= 6) return "text-blue-500"
    if (level >= 4) return "text-yellow-500"
    return "text-red-500"
  }

  if (!skillAssessment || !stats) {
    return (
      <Button variant="outline" size="sm" className={className} disabled>
        <Brain className="h-4 w-4 mr-2" />
        No Data Yet
      </Button>
    )
  }

  return (
    <div className={className}>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 bg-transparent">
            <Brain className="h-4 w-4" />
            AI Insights
            <Badge variant="secondary" className="ml-1">
              {skillAssessment.overallLevel}
            </Badge>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Your Typing Intelligence Report
            </DialogTitle>
            <DialogDescription>
              AI-powered analysis of your typing performance and personalized recommendations
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Skill Assessment */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Target className="h-5 w-5" />
                Skill Assessment
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Speed Level</span>
                        <span className={`text-sm font-bold ${getLevelColor(skillAssessment.wpmLevel)}`}>
                          {skillAssessment.wpmLevel}/10
                        </span>
                      </div>
                      <Progress value={skillAssessment.wpmLevel * 10} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Accuracy Level</span>
                        <span className={`text-sm font-bold ${getLevelColor(skillAssessment.accuracyLevel)}`}>
                          {skillAssessment.accuracyLevel}/10
                        </span>
                      </div>
                      <Progress value={skillAssessment.accuracyLevel * 10} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Consistency Level</span>
                        <span className={`text-sm font-bold ${getLevelColor(skillAssessment.consistencyLevel)}`}>
                          {skillAssessment.consistencyLevel}/10
                        </span>
                      </div>
                      <Progress value={skillAssessment.consistencyLevel * 10} className="h-2" />
                    </div>
                  </div>
                </div>
                <div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-green-600 mb-2">Strengths</h4>
                      <div className="flex flex-wrap gap-2">
                        {skillAssessment.strengths.length > 0 ? (
                          skillAssessment.strengths.map((strength) => (
                            <Badge key={strength} variant="secondary" className="bg-green-100 text-green-800">
                              {strength}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">Keep practicing to develop strengths!</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-orange-600 mb-2">Areas for Improvement</h4>
                      <div className="flex flex-wrap gap-2">
                        {skillAssessment.weaknesses.map((weakness) => (
                          <Badge key={weakness} variant="outline" className="border-orange-200 text-orange-700">
                            {weakness}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Recommended Difficulty</h4>
                      <Badge variant="default">{skillAssessment.recommendedDifficulty}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Performance Trends */}
            {trends && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Performance Trends</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">Speed</span>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(trends.wpmTrend)}
                      <span className="text-sm capitalize">{trends.wpmTrend}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">Accuracy</span>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(trends.accuracyTrend)}
                      <span className="text-sm capitalize">{trends.accuracyTrend}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">Consistency</span>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(trends.consistencyTrend)}
                      <span className="text-sm capitalize">{trends.consistencyTrend}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium">Overall Progress</span>
                    <Badge
                      variant={
                        trends.overallProgress > 0
                          ? "default"
                          : trends.overallProgress < 0
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {trends.overallProgress > 0.1
                        ? "Excellent"
                        : trends.overallProgress > 0
                          ? "Good"
                          : trends.overallProgress < -0.1
                            ? "Needs Focus"
                            : "Stable"}
                    </Badge>
                  </div>
                  <Progress value={Math.max(0, Math.min(100, (trends.overallProgress + 1) * 50))} className="h-2" />
                </div>
              </Card>
            )}

            {/* Statistics */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Your Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{stats.totalSessions}</div>
                  <div className="text-sm text-muted-foreground">Sessions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{Math.round(stats.totalTimeMinutes)}</div>
                  <div className="text-sm text-muted-foreground">Minutes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{Math.round(stats.bestWpm)}</div>
                  <div className="text-sm text-muted-foreground">Best WPM</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{Math.round(stats.bestAccuracy)}%</div>
                  <div className="text-sm text-muted-foreground">Best Accuracy</div>
                </div>
              </div>
            </Card>

            {/* Personalized Recommendations */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Personalized Recommendations
              </h3>
              <div className="space-y-3">
                {recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-medium text-primary">{index + 1}</span>
                    </div>
                    <p className="text-sm">{recommendation}</p>
                  </div>
                ))}
              </div>
              {skillAssessment.focusAreas.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-medium mb-2">Focus Areas</h4>
                  <div className="flex flex-wrap gap-2">
                    {skillAssessment.focusAreas.map((area) => (
                      <Badge key={area} variant="outline">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Actions */}
            <div className="flex gap-2">
              <Button onClick={updateInsights} variant="outline">
                Refresh Analysis
              </Button>
              <Button
                onClick={() => {
                  adaptiveAlgorithm.clearData()
                  updateInsights()
                }}
                variant="outline"
                className="text-destructive"
              >
                Reset Data
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
