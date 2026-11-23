"use client"

import type React from "react"
import { ArrowRight, ArrowUpRight, BarChart3, Brain, RotateCcw, Sparkles, Trophy, Zap } from "lucide-react"

import { AchievementBadge } from "@/components/achievement-icon"
import { Panel, Sparkline, StatTile, toneTextClass } from "@/components/data-display"
import type { DashboardTab } from "@/components/dashboard/data"
import { Button } from "@/components/ui/button"
import type { DopamineMode } from "@/lib/dopamine"
import type { Achievement, ScoreEntry } from "@/lib/scoring-system"
import { cn } from "@/lib/utils"

export interface TestResultExtras {
  sessionXp: number
  level: number
  levelTitle: string
  levelProgress: number
  xpIntoLevel: number
  xpForNext: number
  bestCombo: number
  recordDelta: number | null
  levelUp: boolean
}

interface TestResultProps {
  score: ScoreEntry
  achievements: Achievement[]
  wpmHistory: number[]
  onRestart: () => void
  onRetry: () => void
  onOpenDashboard: (tab: DashboardTab) => void
  extras?: TestResultExtras | null
  dopamineMode?: DopamineMode
  showDopaminePrompt?: boolean
  onDopaminePromptAction?: (action: "dismiss" | DopamineMode) => void
}

export function TestResult({
  score,
  achievements,
  wpmHistory,
  onRestart,
  onRetry,
  onOpenDashboard,
  extras,
  dopamineMode = "balanced",
  showDopaminePrompt = false,
  onDopaminePromptAction,
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

            {extras?.recordDelta ? (
              <span className="inline-flex items-center gap-1 rounded-md border border-success/35 bg-success/10 px-2 py-0.5 text-[11px] font-bold text-success animate-in fade-in slide-in-from-bottom-1 duration-200">
                <ArrowUpRight className="size-3" aria-hidden />
                +{extras.recordDelta} WPM so với kỷ lục
              </span>
            ) : null}
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

        {extras ? (
          <div className="mt-4 grid gap-2.5 border-t border-border/60 pt-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border/70 bg-background/40 px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                  <Sparkles className="size-3.5 text-primary" aria-hidden />
                  Cấp {extras.level}
                  {extras.levelUp ? (
                    <span className="rounded bg-primary/12 px-1.5 py-0.5 text-[9.5px] font-bold tracking-wide text-primary uppercase">
                      Lên cấp
                    </span>
                  ) : null}
                </span>
                <span className="text-[10.5px] text-muted-foreground tabular-nums">
                  {extras.xpIntoLevel}/{extras.xpForNext} XP
                </span>
              </div>
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full w-full origin-left rounded-full bg-primary"
                  style={{ transform: `scaleX(${extras.levelProgress})` }}
                />
              </div>
              <p className="mt-1.5 text-[10.5px] text-muted-foreground">{extras.levelTitle}</p>
            </div>

            <div className="rounded-xl border border-border/70 bg-background/40 px-4 py-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                <Zap className="size-3.5 text-warning" aria-hidden />
                XP phiên này
              </span>
              <p className="mt-1.5 text-xl leading-none font-bold tabular-nums text-warning">
                +{extras.sessionXp}
              </p>
              <p className="mt-1.5 text-[10.5px] text-muted-foreground">
                Gồm điểm phiên, từ vàng và nhiệm vụ đã nhận.
              </p>
            </div>

            <div className="rounded-xl border border-border/70 bg-background/40 px-4 py-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                <Trophy className="size-3.5 text-primary" aria-hidden />
                Combo tốt nhất
              </span>
              <p className="mt-1.5 text-xl leading-none font-bold tabular-nums text-primary">
                {extras.bestCombo}
              </p>
              <p className="mt-1.5 text-[10.5px] text-muted-foreground">
                Ký tự đúng liên tiếp · thưởng tối đa 200 điểm.
              </p>
            </div>
          </div>
        ) : null}
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

      {showDopaminePrompt && onDopaminePromptAction ? (
        <section className="flex flex-col gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 animate-in fade-in slide-in-from-bottom-1 duration-200 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-primary/25 bg-primary/10 text-primary">
              <Sparkles className="size-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">
                {dopamineMode === "off"
                  ? "Bật DPM Mode?"
                  : dopamineMode === "balanced"
                    ? "DPM đang ở mức Cân bằng"
                    : "DPM đang ở mức Tối đa"}
              </p>
              <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted-foreground">
                {dopamineMode === "off"
                  ? "Hạt sáng, combo và chúc mừng kết quả giúp phiên luyện dễ chịu hơn. Có thể tắt bất cứ lúc nào."
                  : dopamineMode === "balanced"
                    ? "Thử mức Tối đa để có confetti và âm thưởng đầy đủ — hoặc giữ nguyên nếu thấy vừa đủ."
                    : "Mọi hiệu ứng đang bật. Nếu thấy quá nhiều, hạ về Cân bằng trong nút DPM trên thanh trên."}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {dopamineMode === "off" ? (
              <Button size="sm" onClick={() => onDopaminePromptAction("balanced")}>
                Bật Cân bằng
              </Button>
            ) : null}
            {dopamineMode === "balanced" ? (
              <Button size="sm" onClick={() => onDopaminePromptAction("dpm")}>
                Thử Tối đa
              </Button>
            ) : null}
            <Button variant="ghost" size="sm" onClick={() => onDopaminePromptAction("dismiss")}>
              {dopamineMode === "dpm" ? "Giữ nguyên" : "Để sau"}
            </Button>
          </div>
        </section>
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
