"use client"

import type React from "react"
import { ArrowRight, BarChart3, Brain, RotateCcw, Sparkles, Trophy } from "lucide-react"

import { AchievementBadge } from "@/components/achievement-icon"
import { Panel, Sparkline, StatTile, toneTextClass } from "@/components/data-display"
import type { DashboardTab } from "@/components/dashboard/data"
import { Button } from "@/components/ui/button"
import type { Achievement, ScoreEntry } from "@/lib/scoring-system"
import { cn } from "@/lib/utils"

interface TestResultProps {
  score: ScoreEntry
  achievements: Achievement[]
  wpmHistory: number[]
  onRestart: () => void
  onRetry: () => void
  onOpenDashboard: (tab: DashboardTab) => void
}

export function TestResult({
  score,
  achievements,
  wpmHistory,
  onRestart,
  onRetry,
  onOpenDashboard,
}: TestResultProps) {
  const peak = wpmHistory.length > 0 ? Math.max(...wpmHistory) : score.wpm
  const ratingClass = toneTextClass(score.rating.tone)

  return (
    <div className="w-full max-w-4xl animate-in space-y-4 duration-300 fade-in-50">
      <section className="relative overflow-hidden rounded-2xl border border-border/70 bg-card p-5 shadow-sm md:p-6">
        <div className="pointer-events-none absolute -top-16 -right-16 size-44 rounded-full bg-primary/10 blur-3xl" />

        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:items-center">
          <div className="flex flex-col items-center gap-2 border-b border-border/60 pb-5 text-center md:items-start md:border-r md:border-b-0 md:pr-6 md:pb-0 md:text-left">
            <span className="text-[10.5px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
              Tốc độ gõ
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className={cn("text-5xl font-extrabold tracking-tight tabular-nums md:text-6xl", ratingClass)}>
                {score.wpm}
              </span>
              <span className="text-base font-bold text-muted-foreground">WPM</span>
            </div>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-muted/40 px-2 py-0.5 text-[11px] font-bold",
                ratingClass
              )}
            >
              Hạng {score.rating.overall}
              <span className="font-medium text-muted-foreground">· {score.rating.description}</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <StatTile label="Chính xác" value={score.accuracy} unit="%" animateValue />
            <StatTile
              label="Ổn định"
              value={score.consistency ? Math.round(score.consistency) : 100}
              unit="%"
              animateValue
            />
            <StatTile label="Thời gian" value={Math.round(score.timeElapsed)} unit="giây" />
            <StatTile
              label="Tổng điểm"
              value={score.score}
              tone="primary"
              animateValue
              format={(n) => n.toLocaleString("vi-VN")}
            />
          </div>
        </div>
      </section>

      <Panel
        title="Tốc độ theo thời gian"
        description={`Đỉnh cao nhất ${peak} WPM trong phiên này`}
        action={<Sparkles className="size-4 text-primary" aria-hidden />}
      >
        <Sparkline
          values={wpmHistory.length > 0 ? wpmHistory : [score.wpm]}
          height={130}
          ariaLabel="Biểu đồ tốc độ trong phiên vừa hoàn thành"
        />
      </Panel>

      {achievements.length > 0 ? (
        <Panel
          title="Huy hiệu vừa mở khoá"
          description={`${achievements.length} thành tích mới từ phiên này`}
          action={<Trophy className="size-4 text-warning" aria-hidden />}
        >
          <div className="grid gap-2.5 sm:grid-cols-2">
            {achievements.map((achievement, index) => (
              <AchievementBadge
                key={achievement.id}
                achievement={achievement}
                unlocked
                className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-200 ease-[cubic-bezier(0.2,0.9,0.4,1)]"
                style={{ animationDelay: `${Math.min(index, 5) * 60}ms` }}
              />
            ))}
          </div>
        </Panel>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          <Button size="lg" onClick={onRestart} className="gap-2 font-semibold">
            Bài tiếp theo
            <ArrowRight className="size-4" aria-hidden />
            <kbd className="ml-1 hidden rounded bg-primary-foreground/20 px-1.5 py-0.5 font-mono text-[10px] sm:inline-block">
              Tab + Enter
            </kbd>
          </Button>
          <Button variant="outline" size="lg" onClick={onRetry} className="gap-2">
            <RotateCcw className="size-4" aria-hidden />
            Thử lại bài này
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => onOpenDashboard("overview")}>
            <BarChart3 className="size-4" aria-hidden />
            Bảng điều khiển
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => onOpenDashboard("coach")}>
            <Brain className="size-4" aria-hidden />
            AI Coach
          </Button>
        </div>
      </div>
    </div>
  )
}
