"use client"

import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Brain,
  Clock,
  Gauge,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react"

import { AchievementBadge } from "@/components/achievement-icon"
import { AnimatedNumber, Sparkline, toneTextClass, type Tone } from "@/components/data-display"
import type { DashboardTab } from "@/components/dashboard/data"
import { Button } from "@/components/ui/button"
import { comboMultiplier, nextComboMilestone, type DopamineMode } from "@/lib/dopamine"
import type { Achievement, ScoreEntry } from "@/lib/scoring-system"
import { cn } from "@/lib/utils"

const MICRO = "text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase"
const CARD = "rounded-2xl border border-outline-variant/60 bg-surface-container-lowest/80"

const LANGUAGE_LABEL: Record<string, string> = {
  english: "English",
  vietnamese: "Tiếng Việt",
}

const MODE_LABEL: Record<string, string> = {
  words: "Words",
  time: "Time",
  phrases: "Phrases",
}

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: "Dễ",
  medium: "Vừa",
  hard: "Khó",
}

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

function SummaryCard({
  label,
  icon: Icon,
  value,
  unit,
  hint,
  tone = "default",
  format,
  className,
}: {
  label: string
  icon?: LucideIcon
  value: number
  unit?: string
  hint?: ReactNode
  tone?: Tone
  format?: (value: number) => string
  className?: string
}) {
  return (
    <div className={cn(CARD, "flex flex-col justify-between p-3.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className={MICRO}>{label}</span>
        {Icon ? <Icon className="size-3.5 text-muted-foreground/70" aria-hidden /> : null}
      </div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <AnimatedNumber
          value={value}
          format={format}
          className={cn(
            "text-2xl leading-none font-extrabold tracking-tight tabular-nums",
            toneTextClass(tone)
          )}
        />
        {unit ? <span className="text-[11px] font-semibold text-muted-foreground">{unit}</span> : null}
      </div>
      {hint ? <p className="mt-1 text-[10.5px] leading-snug text-muted-foreground/80">{hint}</p> : null}
    </div>
  )
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
  const duration = Math.max(1, Math.round(score.timeElapsed))
  const ratingClass = toneTextClass(score.rating.tone)
  const consistency = score.consistency ? Math.round(score.consistency) : 100
  const multiplier = extras ? comboMultiplier(extras.bestCombo) : 1
  const nextMilestone = extras ? nextComboMilestone(extras.bestCombo) : null
  const comboProgress = nextMilestone
    ? Math.min(1, extras ? extras.bestCombo / nextMilestone : 1)
    : 1

  const metaChips = [
    LANGUAGE_LABEL[score.language] ?? score.language,
    MODE_LABEL[score.contentType] ?? score.contentType,
    DIFFICULTY_LABEL[score.difficulty] ?? score.difficulty,
    `${score.wordCount} từ`,
    new Date(score.timestamp).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  ]

  return (
    <div className="w-full animate-in space-y-3 duration-300 fade-in-50">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className={MICRO}>Phiên hoàn thành</p>
          <h2 className="mt-0.5 text-base leading-tight font-bold">Kết quả luyện gõ</h2>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {metaChips.map((chip) => (
            <span
              key={chip}
              className="rounded-md border border-outline-variant/60 bg-surface-container-low/60 px-2 py-0.5 text-[10.5px] font-medium text-muted-foreground"
            >
              {chip}
            </span>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-6">
        {/* Hero: tốc độ + cấp độ */}
        <section
          className={cn(
            CARD,
            "relative col-span-2 flex flex-col justify-between overflow-hidden p-4 md:row-span-2 md:p-5"
          )}
        >
          <div className="pointer-events-none absolute -top-14 -right-10 size-36 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative">
            <div className="flex items-center justify-between gap-2">
              <span className={MICRO}>Tốc độ gõ</span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-md border border-outline-variant/70 bg-surface-container-low/70 px-1.5 py-0.5 text-[10.5px] font-bold",
                  ratingClass
                )}
              >
                Hạng {score.rating.overall}
              </span>
            </div>

            <div className="mt-1 flex items-baseline gap-1.5">
              <AnimatedNumber
                value={score.wpm}
                className={cn(
                  "text-5xl leading-none font-extrabold tracking-tight tabular-nums md:text-6xl",
                  ratingClass
                )}
              />
              <span className="text-sm font-bold text-muted-foreground">WPM</span>
            </div>

            <p className="mt-1.5 text-[11.5px] text-muted-foreground">{score.rating.description}</p>
            <p className="mt-0.5 text-[10.5px] text-muted-foreground/80 tabular-nums">
              Tốc độ {score.rating.speed} · Chính xác {score.rating.accuracy} · Ổn định{" "}
              {score.rating.consistency}
            </p>

            {extras?.recordDelta ? (
              <span className="mt-2 inline-flex items-center gap-1 rounded-md border border-success/35 bg-success/10 px-2 py-0.5 text-[11px] font-bold text-success animate-in fade-in slide-in-from-bottom-1 duration-200">
                <ArrowUpRight className="size-3" aria-hidden />
                +{extras.recordDelta} WPM so với kỷ lục
              </span>
            ) : null}
          </div>

          {extras ? (
            <div className="relative mt-4 space-y-1.5 border-t border-border/60 pt-3">
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="inline-flex items-center gap-1.5 font-semibold">
                  <Sparkles className="size-3 text-primary" aria-hidden />
                  Cấp {extras.level} · {extras.levelTitle}
                  {extras.levelUp ? (
                    <span className="rounded bg-primary/12 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-primary uppercase">
                      Lên cấp
                    </span>
                  ) : null}
                </span>
                <span className="text-muted-foreground tabular-nums">
                  {extras.xpIntoLevel}/{extras.xpForNext} XP
                </span>
              </div>
              <div
                className="h-1 w-full overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-label="Tiến độ cấp độ"
                aria-valuemin={0}
                aria-valuemax={extras.xpForNext}
                aria-valuenow={extras.xpIntoLevel}
              >
                <div
                  className="h-full w-full origin-left rounded-full bg-primary"
                  style={{ transform: `scaleX(${extras.levelProgress})` }}
                />
              </div>
            </div>
          ) : null}
        </section>

        <SummaryCard
          label="Chính xác"
          icon={Target}
          value={score.accuracy}
          unit="%"
          tone={score.accuracy >= 97 ? "success" : "default"}
        />
        <SummaryCard
          label="Ổn định"
          icon={Gauge}
          value={consistency}
          unit="%"
          tone={consistency >= 85 ? "primary" : "default"}
        />
        <SummaryCard label="Thời gian" icon={Clock} value={duration} unit="giây" />
        <SummaryCard
          label="Tổng điểm"
          icon={Trophy}
          value={score.score}
          tone="primary"
          format={(n) => n.toLocaleString("vi-VN")}
        />

        {/* XP phiên này */}
        <section className={cn(CARD, "col-span-1 flex flex-col justify-between p-3.5 md:col-span-2")}>
          <div className="flex items-center justify-between gap-2">
            <span className={MICRO}>XP phiên này</span>
            <Zap className="size-3.5 text-warning" aria-hidden />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <AnimatedNumber
              value={extras?.sessionXp ?? 0}
              format={(n) => `+${n}`}
              className="text-2xl leading-none font-extrabold tracking-tight text-warning tabular-nums"
            />
            <span className="text-[11px] font-semibold text-muted-foreground">XP</span>
          </div>
          <p className="mt-1 text-[10.5px] leading-snug text-muted-foreground/80">
            Điểm phiên, từ vàng và nhiệm vụ đã nhận.
          </p>
        </section>

        {/* Combo tốt nhất + mốc kế tiếp */}
        <section className={cn(CARD, "col-span-1 flex flex-col justify-between p-3.5 md:col-span-2")}>
          <div className="flex items-center justify-between gap-2">
            <span className={MICRO}>Combo tốt nhất</span>
            <Zap className="size-3.5 text-primary" aria-hidden />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <AnimatedNumber
              value={extras?.bestCombo ?? 0}
              className="text-2xl leading-none font-extrabold tracking-tight text-primary tabular-nums"
            />
            <span className="text-[11px] font-semibold text-muted-foreground">
              ×{multiplier.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}
            </span>
          </div>
          <div className="mt-1.5 space-y-1">
            <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full w-full origin-left rounded-full bg-primary/70"
                style={{ transform: `scaleX(${comboProgress})` }}
              />
            </div>
            <p className="truncate text-[10.5px] leading-none text-muted-foreground/80">
              {extras && nextMilestone
                ? `Còn ${nextMilestone - extras.bestCombo} điểm tới mốc ${nextMilestone}`
                : "Đã chạm mốc combo cao nhất"}
            </p>
          </div>
        </section>

        {/* Biểu đồ tốc độ */}
        <section className={cn(CARD, "col-span-2 flex flex-col p-3.5 md:col-span-4")}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-sm leading-tight font-semibold">Tốc độ theo thời gian</h3>
              <p className="mt-0.5 text-[10.5px] text-muted-foreground">
                Đỉnh {peak} WPM · {duration}s
              </p>
            </div>
            <Sparkles className="size-4 shrink-0 text-primary" aria-hidden />
          </div>
          <div className="mt-2 flex-1">
            <Sparkline
              values={wpmHistory.length > 0 ? wpmHistory : [score.wpm]}
              height={118}
              showDots={false}
              axisLabels={["0s", `${duration}s`]}
              ariaLabel="Biểu đồ tốc độ trong phiên vừa hoàn thành"
            />
          </div>
        </section>

        {/* Gợi ý DPM */}
        {showDopaminePrompt && onDopaminePromptAction ? (
          <section className={cn(CARD, "col-span-2 flex flex-col justify-between gap-2.5 p-3.5")}>
            <div className="flex items-start gap-2.5">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
                <Sparkles className="size-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-[12.5px] leading-tight font-semibold">
                  {dopamineMode === "off"
                    ? "Bật DPM Mode?"
                    : dopamineMode === "balanced"
                      ? "DPM đang ở mức Cân bằng"
                      : "DPM đang ở mức Tối đa"}
                </p>
                <p className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">
                  {dopamineMode === "off"
                    ? "Hạt sáng, combo và chúc mừng kết quả giúp phiên luyện dễ chịu hơn. Có thể tắt bất cứ lúc nào."
                    : dopamineMode === "balanced"
                      ? "Thử mức Tối đa để có confetti và âm thưởng đầy đủ — hoặc giữ nguyên nếu thấy vừa đủ."
                      : "Mọi hiệu ứng đang bật. Nếu thấy quá nhiều, hạ về Cân bằng trong nút DPM trên thanh trên."}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
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

        {/* Huy hiệu mới */}
        {achievements.length > 0 ? (
          <section className={cn(CARD, "col-span-2 p-3.5 md:col-span-6")}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm leading-tight font-semibold">Huy hiệu vừa mở khoá</h3>
                <p className="mt-0.5 text-[10.5px] text-muted-foreground">
                  {achievements.length} thành tích mới từ phiên này
                </p>
              </div>
              <Trophy className="size-4 shrink-0 text-warning" aria-hidden />
            </div>
            <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
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
          </section>
        ) : null}

        {/* Hành động */}
        <div className="col-span-2 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3 md:col-span-6">
          <div className="flex flex-wrap items-center gap-2">
            <Button size="lg" onClick={onRestart} className="group gap-2 font-semibold">
              Bài tiếp theo
              <ArrowRight
                className="size-4 transition-[translate] duration-200 ease-[cubic-bezier(0.2,0.9,0.4,1)] group-hover:translate-x-0.5"
                aria-hidden
              />
              <kbd className="ml-1 hidden rounded bg-primary-foreground/20 px-1.5 py-0.5 font-mono text-[10px] transition-[transform,scale] duration-150 group-active:scale-95 sm:inline-block">
                Tab + Enter
              </kbd>
            </Button>
            <Button variant="outline" size="lg" onClick={onRetry} className="group gap-2">
              <RotateCcw
                className="size-4 transition-[rotate] duration-300 ease-[cubic-bezier(0.2,0.9,0.4,1)] group-hover:-rotate-[30deg]"
                aria-hidden
              />
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
    </div>
  )
}
