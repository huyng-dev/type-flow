"use client"

import { useRef, useState, type ReactNode } from "react"
import {
  Activity,
  ArrowRight,
  Award,
  BarChart3,
  Brain,
  CalendarDays,
  Check,
  Download,
  Flame,
  Gauge,
  Keyboard,
  Lightbulb,
  Minus,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Trash2,
  Trophy,
  Upload,
  type LucideIcon,
} from "lucide-react"

import { AchievementBadge } from "@/components/achievement-icon"
import { EmptyState, Meter, Panel, Sparkline, StatTile, toneTextClass } from "@/components/data-display"
import { Button } from "@/components/ui/button"
import { adaptiveAlgorithm, type MistakeSummaryEntry } from "@/lib/adaptive-algorithm"
import { EngagementManager } from "@/lib/engagement"
import {
  scoringSystem,
  type Achievement,
  type ScoreEntry,
} from "@/lib/scoring-system"
import { StatisticsManager } from "@/lib/statistics"
import { cn } from "@/lib/utils"

import { TIME_RANGES, type ActivityDay, type DashboardData, type DashboardTab, type TimeRange } from "./data"

const LANGUAGE_LABEL: Record<string, string> = {
  english: "English",
  vietnamese: "Tiếng Việt",
}

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: "Dễ",
  medium: "Trung bình",
  hard: "Khó",
}

const DIFFICULTY_TONE: Record<string, string> = {
  easy: "border-success/30 bg-success/10 text-success",
  medium: "border-warning/30 bg-warning/10 text-warning",
  hard: "border-destructive/30 bg-destructive/10 text-destructive",
}

function formatNumber(value: number) {
  return Math.round(value).toLocaleString("vi-VN")
}

function languageLabel(language: string) {
  return LANGUAGE_LABEL[language] ?? language
}

function StatRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/50 py-1.5 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-semibold tabular-nums">{value}</span>
    </div>
  )
}

function SessionRow({ session }: { session: DashboardData["sessions"][number] }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/40 px-3 py-2">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-md border border-border/60 bg-muted/40 text-[10px] font-bold tracking-wide uppercase">
          {session.language === "vietnamese" ? "VI" : "EN"}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "rounded border px-1.5 py-px text-[10px] font-semibold",
                DIFFICULTY_TONE[session.difficulty] ?? "border-border/60 bg-muted/40 text-muted-foreground"
              )}
            >
              {DIFFICULTY_LABEL[session.difficulty] ?? session.difficulty}
            </span>
            <span className="truncate text-[11px] text-muted-foreground">{session.wordCount} từ</span>
          </div>
          <p className="mt-0.5 truncate text-[10.5px] text-muted-foreground">
            {new Date(session.timestamp).toLocaleString("vi-VN", {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3 text-xs tabular-nums">
        <span className="font-semibold">
          {session.wpm} <span className="text-[10px] font-normal text-muted-foreground">WPM</span>
        </span>
        <span className="text-muted-foreground">{session.accuracy}%</span>
        <span className="font-semibold text-primary">{formatNumber(session.totalScore)}</span>
      </div>
    </li>
  )
}

const WEEKDAY_LABELS = ["T2", "", "T4", "", "T6", "", "CN"]

const HEAT_LEVELS = [
  "bg-muted/60",
  "bg-primary/20",
  "bg-primary/40",
  "bg-primary/60",
  "bg-primary/85",
] as const

function heatLevel(sessions: number) {
  if (sessions <= 0) return 0
  if (sessions === 1) return 1
  if (sessions === 2) return 2
  if (sessions <= 4) return 3
  return 4
}

function formatDayLabel(key: string) {
  const [, month, day] = key.split("-")
  return `${day}/${month}`
}

/** Lịch hoạt động 18 tuần: mỗi cột một tuần, mỗi ô một ngày. */
function ActivityHeatmap({ days }: { days: ActivityDay[] }) {
  const first = days[0]
  // getDay(): CN = 0 → đổi sang thứ tự bắt đầu từ thứ Hai.
  const leading = first ? (new Date(`${first.date}T00:00:00`).getDay() + 6) % 7 : 0
  const cells: (ActivityDay | null)[] = [
    ...(new Array<null>(leading).fill(null) as null[]),
    ...days,
  ]
  const weeks: (ActivityDay | null)[][] = []
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7))
  }

  return (
    <div className="flex gap-2">
      <div className="flex flex-col justify-between text-[9.5px] text-muted-foreground/80">
        {WEEKDAY_LABELS.map((label, index) => (
          <span key={index} className="flex h-3.5 items-center leading-none">
            {label}
          </span>
        ))}
      </div>
      <div className="flex min-w-0 gap-1 overflow-x-auto pb-1">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-1">
            {week.map((day, dayIndex) =>
              day ? (
                <span
                  key={day.date}
                  title={`${formatDayLabel(day.date)} · ${day.sessions} phiên · ${formatNumber(day.words)} từ`}
                  className={cn(
                    "size-3.5 rounded-[4px] border border-outline-variant/40",
                    HEAT_LEVELS[heatLevel(day.sessions)]
                  )}
                />
              ) : (
                <span key={`empty-${dayIndex}`} className="size-3.5" aria-hidden />
              )
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function HeatLegend() {
  return (
    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
      <span>Ít</span>
      {HEAT_LEVELS.map((style, index) => (
        <span
          key={index}
          className={cn("size-2.5 rounded-[3px] border border-outline-variant/40", style)}
        />
      ))}
      <span>Nhiều</span>
    </div>
  )
}

function SkillSnapshot({ data }: { data: DashboardData }) {
  const { skill } = data

  return (
    <Panel title="Kỹ năng hiện tại" description="Thang 1–10 theo dữ liệu gần đây">
      <div className="space-y-3">
        <Meter
          label="Tốc độ"
          value={skill.wpmLevel}
          max={10}
          valueLabel={`${skill.wpmLevel}/10`}
          tone={skill.wpmLevel >= 7 ? "success" : skill.wpmLevel >= 4 ? "warning" : "destructive"}
        />
        <Meter
          label="Độ chính xác"
          value={skill.accuracyLevel}
          max={10}
          valueLabel={`${skill.accuracyLevel}/10`}
          tone={skill.accuracyLevel >= 7 ? "success" : skill.accuracyLevel >= 4 ? "warning" : "destructive"}
        />
        <Meter
          label="Độ ổn định"
          value={skill.consistencyLevel}
          max={10}
          valueLabel={`${skill.consistencyLevel}/10`}
          tone={
            skill.consistencyLevel >= 7 ? "success" : skill.consistencyLevel >= 4 ? "warning" : "destructive"
          }
        />
        <div className="flex items-center justify-between border-t border-border/60 pt-2.5">
          <span className="text-xs text-muted-foreground">Độ khó gợi ý</span>
          <span className="rounded-md border border-primary/25 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
            {DIFFICULTY_LABEL[skill.recommendedDifficulty] ?? skill.recommendedDifficulty}
          </span>
        </div>
      </div>
    </Panel>
  )
}

function MistakeList({
  mistakes,
  onDrill,
}: {
  mistakes: MistakeSummaryEntry[]
  onDrill?: (char: string) => void
}) {
  if (mistakes.length === 0) {
    return (
      <EmptyState
        icon={Keyboard}
        title="Chưa ghi nhận lỗi gõ"
        description="Bật AI Adaptive khi luyện để hệ thống ghi lại những phím bạn hay gõ nhầm."
      />
    )
  }

  return (
    <ul className="space-y-1.5">
      {mistakes.map((mistake) => (
        <li
          key={`${mistake.target}->${mistake.typed}`}
          className="flex items-center gap-2 rounded-lg border border-outline-variant/50 bg-surface-container-low/60 px-2.5 py-1.5"
        >
          <span className="grid size-7 shrink-0 place-items-center rounded-md border border-outline-variant/60 bg-surface-container-lowest font-mono text-[13px] font-semibold">
            {mistake.target === " " ? "␣" : mistake.target}
          </span>
          <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
          <span className="grid size-7 shrink-0 place-items-center rounded-md border border-destructive/30 bg-destructive/10 font-mono text-[13px] font-semibold text-destructive">
            {mistake.typed === " " ? "␣" : mistake.typed}
          </span>
          <span className="ml-auto text-[11px] tabular-nums text-muted-foreground">
            {formatNumber(mistake.count)} lần
          </span>
          {onDrill ? (
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-[11px]"
              onClick={() => onDrill(mistake.target)}
            >
              Luyện
            </Button>
          ) : null}
        </li>
      ))}
    </ul>
  )
}

export function OverviewPanel({
  data,
  newAchievements,
  onNavigate,
  onDrill,
}: {
  data: DashboardData
  newAchievements: Achievement[]
  onNavigate: (tab: DashboardTab) => void
  onDrill?: (char: string) => void
}) {
  const { summary, bests, streak, sessions, activity, mistakes } = data
  const activeDays = activity.filter((day) => day.sessions > 0).length

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 @2xl/dialog:grid-cols-4">
        <StatTile label="Phiên gõ" value={formatNumber(summary.totalSessions)} tone="primary" />
        <StatTile label="Phút luyện" value={formatNumber(summary.totalTimeTyped / 60)} />
        <StatTile label="WPM trung bình" value={formatNumber(summary.averageWpm)} />
        <StatTile label="Chính xác" value={`${formatNumber(summary.averageAccuracy)}%`} />
      </div>

      <Panel
        title="Hoạt động luyện tập"
        description={`${activeDays}/${activity.length} ngày có luyện trong 18 tuần gần nhất`}
        action={<HeatLegend />}
      >
        <ActivityHeatmap days={activity} />
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <CalendarDays className="size-3.5 shrink-0" aria-hidden />
          Đưa chuột lên từng ô để xem số phiên và số từ của ngày đó.
        </p>
      </Panel>

      <div className="grid gap-3 @2xl/dialog:grid-cols-2">
        <SkillSnapshot data={data} />
        <Panel
          title="Phím hay gõ sai"
          description="Gộp từ các phiên bật AI Adaptive — bấm Luyện để tạo bài tập riêng"
        >
          <MistakeList mistakes={mistakes} onDrill={onDrill} />
        </Panel>
      </div>

      {newAchievements.length > 0 ? (
        <Panel
          title="Huy hiệu vừa mở khoá"
          description={`${newAchievements.length} thành tích mới trong phiên gần nhất`}
        >
          <div className="grid gap-2 @2xl/dialog:grid-cols-2">
            {newAchievements.map((achievement) => (
              <AchievementBadge key={achievement.id} achievement={achievement} unlocked />
            ))}
          </div>
        </Panel>
      ) : null}

      <div className="grid gap-3 @2xl/dialog:grid-cols-2">
        <Panel title="Kỷ lục cá nhân" description="Tính trên toàn bộ lịch sử">
          <div className="space-y-0.5">
            <StatRow
              label="Điểm cao nhất"
              value={bests.highestScore ? formatNumber(bests.highestScore.score) : "—"}
            />
            <StatRow label="WPM cao nhất" value={bests.fastestWpm ? bests.fastestWpm.wpm : "—"} />
            <StatRow
              label="Chính xác cao nhất"
              value={bests.bestAccuracy ? `${bests.bestAccuracy.accuracy}%` : "—"}
            />
            <StatRow
              label="Phiên dài nhất"
              value={bests.longestSession ? `${formatNumber(bests.longestSession.timeElapsed)} giây` : "—"}
            />
            <StatRow label="Tổng số từ đã gõ" value={formatNumber(summary.totalWordsTyped)} />
          </div>
        </Panel>

        <Panel title="Chuỗi luyện tập" description="Giữ nhịp mỗi ngày để nhận thưởng điểm">
          <div className="grid grid-cols-2 gap-3">
            <StatTile label="Chuỗi hiện tại" value={streak.current} unit="ngày" tone="warning" />
            <StatTile label="Dài nhất" value={streak.longest} unit="ngày" />
          </div>
          <p className="mt-3 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-muted-foreground">
            <Flame className="mt-px size-3.5 shrink-0 text-warning" aria-hidden />
            {streak.current > 0
              ? `Đang giữ chuỗi ${streak.current} ngày, hệ số thưởng ×${streak.multiplier}.`
              : "Hoàn thành một phiên hôm nay để bắt đầu chuỗi mới."}
          </p>
        </Panel>
      </div>

      <Panel
        title="Phiên gần đây"
        description="Hiển thị theo khoảng thời gian đang chọn"
        action={
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => onNavigate("sessions")}>
            Xem tất cả
          </Button>
        }
      >
        {sessions.length > 0 ? (
          <ul className="space-y-1.5">
            {sessions.slice(0, 3).map((session) => (
              <SessionRow key={session.id} session={session} />
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={BarChart3}
            title="Chưa có phiên nào"
            description="Hoàn thành một bài luyện để bắt đầu ghi nhận thống kê."
          />
        )}
      </Panel>
    </div>
  )
}

export function ProgressPanel({
  data,
  range,
  onRangeChange,
}: {
  data: DashboardData
  range: TimeRange
  onRangeChange: (range: TimeRange) => void
}) {
  const { progress, languages, difficulty } = data
  const values = progress.map((point) => point.wpm)
  const present = values.filter((value): value is number => value !== null)
  const peak = present.length > 0 ? Math.max(...present) : 0
  const average = present.length > 0 ? present.reduce((sum, value) => sum + value, 0) / present.length : 0
  const totalSessions = progress.reduce((sum, point) => sum + point.sessions, 0)
  const activeDays = progress.filter((point) => point.sessions > 0).length
  const bestLanguageWpm = languages.length > 0 ? Math.max(...languages.map((item) => item.averageWpm)) : 0

  const formatDay = (key: string) => {
    const [, month, day] = key.split("-")
    return `${day}/${month}`
  }
  const firstDay = progress.length > 0 ? formatDay(progress[0].date) : ""
  const lastDay = progress.length > 0 ? formatDay(progress[progress.length - 1].date) : ""

  return (
    <div className="space-y-4">
      <Panel
        title="Tiến bộ tốc độ"
        description={`WPM trung bình mỗi ngày · ${activeDays}/${progress.length} ngày có luyện`}
        action={
          <div className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-muted/40 p-1">
            {TIME_RANGES.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onRangeChange(option.value)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-[11.5px] font-semibold transition-[color,background-color,box-shadow,scale] duration-150 active:duration-75 motion-safe:active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  range === option.value
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                )}
                aria-pressed={range === option.value}
              >
                {option.label}
              </button>
            ))}
          </div>
        }
      >
        <Sparkline
          values={values}
          height={160}
          ariaLabel={`Biểu đồ WPM ${firstDay} đến ${lastDay}`}
          axisLabels={[firstDay, lastDay]}
        />
        <div className="mt-3 grid grid-cols-3 gap-3">
          <StatTile label="Đỉnh" value={formatNumber(peak)} unit="WPM" tone="primary" />
          <StatTile label="Trung bình" value={formatNumber(average)} unit="WPM" />
          <StatTile label="Số phiên" value={formatNumber(totalSessions)} />
        </div>
        {activeDays < 2 ? (
          <p className="mt-2 text-[11px] text-muted-foreground">
            Cần ít nhất 2 ngày có dữ liệu trong khoảng này để thấy đường xu hướng; hiện mới có {activeDays} ngày.
          </p>
        ) : null}
      </Panel>

      <div className="grid gap-3 @2xl/dialog:grid-cols-2">
        <Panel title="Theo ngôn ngữ" description="So sánh tốc độ và độ chính xác">
          {languages.length > 0 ? (
            <ul className="space-y-3">
              {languages.map((language) => (
                <li key={language.language} className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-semibold">{languageLabel(language.language)}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {language.sessions} phiên · {language.averageAccuracy}% chính xác
                    </span>
                  </div>
                  <Meter
                    label=""
                    value={language.averageWpm}
                    max={Math.max(bestLanguageWpm, 1)}
                    valueLabel={`${language.averageWpm} WPM`}
                    tone="primary"
                  />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={Target} title="Chưa có dữ liệu ngôn ngữ" />
          )}
        </Panel>

        <Panel title="Theo độ khó" description="Tốc độ trung bình ở mỗi mức">
          {difficulty.some((item) => item.sessions > 0) ? (
            <ul className="space-y-3">
              {difficulty.map((item) => (
                <li key={item.difficulty} className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-semibold">{DIFFICULTY_LABEL[item.difficulty]}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {item.sessions > 0 ? `${item.sessions} phiên` : "chưa luyện"}
                      {item.sessions >= 10 ? (
                        <span
                          className={cn(
                            "ml-1.5 font-semibold",
                            item.improvementRate >= 0 ? "text-success" : "text-destructive"
                          )}
                        >
                          {item.improvementRate > 0 ? "+" : ""}
                          {item.improvementRate}%
                        </span>
                      ) : null}
                    </span>
                  </div>
                  <Meter
                    label=""
                    value={item.averageWpm}
                    max={Math.max(...difficulty.map((entry) => entry.averageWpm), 1)}
                    valueLabel={`${item.averageWpm} WPM`}
                    tone={item.difficulty === "hard" ? "destructive" : item.difficulty === "medium" ? "warning" : "success"}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={Target} title="Chưa có dữ liệu độ khó" />
          )}
        </Panel>
      </div>
    </div>
  )
}

const ACHIEVEMENT_CATEGORIES: {
  id: "speed" | "accuracy" | "consistency" | "combo" | "milestone" | "special"
  label: string
  icon: LucideIcon
}[] = [
  { id: "speed", label: "Tốc độ", icon: Gauge },
  { id: "accuracy", label: "Chính xác", icon: Target },
  { id: "consistency", label: "Độ ổn định", icon: Activity },
  { id: "combo", label: "Combo", icon: Flame },
  { id: "milestone", label: "Cột mốc", icon: Trophy },
  { id: "special", label: "Đặc biệt", icon: Sparkles },
]

export function AchievementsPanel({ data }: { data: DashboardData }) {
  const { achievementStats, achievements, achievementProgress } = data
  const total = achievementStats.total
  const unlocked = achievementStats.unlocked
  const completion = total > 0 ? Math.round((unlocked / total) * 100) : 0

  return (
    <div className="space-y-4">
      <Panel title="Tiến độ mở khoá" description="Hoàn thành bài luyện để mở thêm huy hiệu">
        <div className="grid grid-cols-2 gap-3 @2xl/dialog:grid-cols-4">
          <StatTile label="Đã đạt" value={unlocked} tone="primary" />
          <StatTile label="Tổng huy hiệu" value={total} />
          <StatTile label="Điểm thưởng" value={formatNumber(achievementStats.points)} tone="warning" />
          <StatTile label="Hoàn thành" value={`${completion}%`} tone="success" />
        </div>

        <div className="mt-4">
          <Meter
            label="Toàn bộ huy hiệu"
            value={unlocked}
            max={Math.max(total, 1)}
            valueLabel={`${unlocked}/${total}`}
            tone="primary"
          />
        </div>

        <ul className="mt-4 grid gap-2 @xl/dialog:grid-cols-2 @4xl/dialog:grid-cols-3">
          {ACHIEVEMENT_CATEGORIES.map((category) => {
            const stats = achievementStats.byCategory[category.id] ?? { total: 0, unlocked: 0 }
            const ratio = stats.total > 0 ? stats.unlocked / stats.total : 0
            const Icon = category.icon

            return (
              <li key={category.id} className="rounded-lg border border-border/60 bg-background/40 px-2.5 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex min-w-0 items-center gap-1.5 text-[11px] font-semibold">
                    <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="truncate">{category.label}</span>
                  </span>
                  <span className="shrink-0 text-[10px] font-semibold text-muted-foreground tabular-nums">
                    {stats.unlocked}/{stats.total}
                  </span>
                </div>
                <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted" aria-hidden>
                  <div
                    className="h-full w-full origin-left rounded-full bg-primary transition-transform duration-300"
                    style={{ transform: `scaleX(${ratio})` }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      </Panel>

      {achievementStats.recent.length > 0 ? (
        <Panel title="Mở gần đây" description="5 huy hiệu mới nhất, vẫn giữ sau khi tải lại">
          <div className="grid gap-2.5 @2xl/dialog:grid-cols-2 @4xl/dialog:grid-cols-3">
            {achievementStats.recent.map((achievement) => (
              <AchievementBadge key={achievement.id} achievement={achievement} unlocked />
            ))}
          </div>
        </Panel>
      ) : null}

      <Panel
        title="Bộ sưu tập"
        description={`${unlocked}/${total} huy hiệu · huy hiệu chưa mở hiển thị tiến độ`}
      >
        {achievements.length > 0 ? (
          <div className="space-y-5">
            {ACHIEVEMENT_CATEGORIES.map((category) => {
              const items = achievements
                .filter((achievement) => achievement.category === category.id)
                .sort(
                  (a, b) =>
                    Number(Boolean(b.unlocked)) - Number(Boolean(a.unlocked)) ||
                    a.points - b.points
                )

              if (items.length === 0) return null
              const stats = achievementStats.byCategory[category.id] ?? { total: 0, unlocked: 0 }
              const Icon = category.icon

              return (
                <section key={category.id} aria-labelledby={`achievement-group-${category.id}`}>
                  <div className="flex items-center gap-2">
                    <Icon className="size-3.5 text-primary" aria-hidden />
                    <h3
                      id={`achievement-group-${category.id}`}
                      className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase"
                    >
                      {category.label}
                    </h3>
                    <span className="text-[10px] font-semibold text-muted-foreground tabular-nums">
                      {stats.unlocked}/{stats.total}
                    </span>
                    <span className="ml-auto h-px flex-1 bg-border/60" aria-hidden />
                  </div>

                  <div className="mt-2 grid gap-2.5 @2xl/dialog:grid-cols-2 @4xl/dialog:grid-cols-3">
                    {items.map((achievement) => (
                      <AchievementBadge
                        key={achievement.id}
                        achievement={achievement}
                        unlocked={Boolean(achievement.unlocked)}
                        progress={achievementProgress[achievement.id] ?? null}
                      />
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        ) : (
          <EmptyState icon={Award} title="Chưa có huy hiệu" />
        )}
      </Panel>
    </div>
  )
}

function trendMeta(trend: "improving" | "declining" | "stable") {
  switch (trend) {
    case "improving":
      return { label: "Tăng", icon: TrendingUp, tone: "text-success" }
    case "declining":
      return { label: "Giảm", icon: TrendingDown, tone: "text-destructive" }
    default:
      return { label: "Ổn định", icon: Minus, tone: "text-muted-foreground" }
  }
}

export function CoachPanel({ data }: { data: DashboardData }) {
  const { skill, trends, adaptiveStats, recommendations } = data
  const overall =
    trends.overallProgress > 0.1
      ? "Rất tốt"
      : trends.overallProgress > 0
        ? "Đang tiến bộ"
        : trends.overallProgress < -0.1
          ? "Cần tập trung"
          : "Ổn định"

  return (
    <div className="space-y-4">
      <div className="grid gap-3 @2xl/dialog:grid-cols-2">
        <Panel title="Đánh giá kỹ năng" description="Thang điểm 1–10 theo dữ liệu gần đây">
          <div className="space-y-3">
            <Meter
              label="Tốc độ"
              value={skill.wpmLevel}
              max={10}
              valueLabel={`${skill.wpmLevel}/10`}
              tone={skill.wpmLevel >= 7 ? "success" : skill.wpmLevel >= 4 ? "warning" : "destructive"}
            />
            <Meter
              label="Độ chính xác"
              value={skill.accuracyLevel}
              max={10}
              valueLabel={`${skill.accuracyLevel}/10`}
              tone={skill.accuracyLevel >= 7 ? "success" : skill.accuracyLevel >= 4 ? "warning" : "destructive"}
            />
            <Meter
              label="Độ ổn định"
              value={skill.consistencyLevel}
              max={10}
              valueLabel={`${skill.consistencyLevel}/10`}
              tone={skill.consistencyLevel >= 7 ? "success" : skill.consistencyLevel >= 4 ? "warning" : "destructive"}
            />
            <div className="flex items-center justify-between border-t border-border/60 pt-2.5">
              <span className="text-xs text-muted-foreground">Độ khó gợi ý</span>
              <span className="rounded-md border border-primary/25 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary capitalize">
                {DIFFICULTY_LABEL[skill.recommendedDifficulty] ?? skill.recommendedDifficulty}
              </span>
            </div>
          </div>
        </Panel>

        <Panel title="Điểm mạnh & cần cải thiện">
          <div className="space-y-3">
            <div>
              <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-success uppercase">Điểm mạnh</p>
              {skill.strengths.length > 0 ? (
                <ul className="flex flex-wrap gap-1.5">
                  {skill.strengths.map((item) => (
                    <li
                      key={item}
                      className="inline-flex items-center gap-1 rounded-md border border-success/30 bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success"
                    >
                      <Check className="size-3" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[11.5px] text-muted-foreground">Tiếp tục luyện để nhận diện điểm mạnh.</p>
              )}
            </div>
            <div>
              <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-warning uppercase">
                Cần cải thiện
              </p>
              {skill.weaknesses.length > 0 ? (
                <ul className="flex flex-wrap gap-1.5">
                  {skill.weaknesses.map((item) => (
                    <li
                      key={item}
                      className="rounded-md border border-warning/30 bg-warning/10 px-2 py-0.5 text-[11px] font-medium text-warning"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[11.5px] text-muted-foreground">Chưa phát hiện điểm yếu nổi bật.</p>
              )}
            </div>
            {skill.focusAreas.length > 0 ? (
              <div>
                <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                  Khu vực nên rèn thêm
                </p>
                <ul className="flex flex-wrap gap-1.5">
                  {skill.focusAreas.map((item) => (
                    <li
                      key={item}
                      className="rounded-md border border-border/70 bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </Panel>
      </div>

      <Panel title="Xu hướng gần đây" description={`Đánh giá chung: ${overall}`}>
        <div className="grid grid-cols-1 gap-2.5 @xl/dialog:grid-cols-3">
          {(
            [
              ["Tốc độ", trends.wpmTrend],
              ["Độ chính xác", trends.accuracyTrend],
              ["Độ ổn định", trends.consistencyTrend],
            ] as const
          ).map(([label, trend]) => {
            const meta = trendMeta(trend)
            return (
              <div
                key={label}
                className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2"
              >
                <span className="text-xs font-medium">{label}</span>
                <span className={cn("flex items-center gap-1 text-xs font-semibold", meta.tone)}>
                  <meta.icon className="size-3.5" aria-hidden />
                  {meta.label}
                </span>
              </div>
            )
          })}
        </div>
        <div className="mt-3">
          <Meter
            label="Mức tiến bộ tổng thể"
            value={trends.overallProgress * 100}
            max={100}
            valueLabel={
              trends.overallProgress > 0
                ? `+${Math.round(trends.overallProgress * 100)}%`
                : `${Math.round(trends.overallProgress * 100)}%`
            }
            tone={trends.overallProgress >= 0 ? "success" : "destructive"}
          />
        </div>
      </Panel>

      <Panel
        title="Lời khuyên từ huấn luyện viên"
        description="Sinh tự động từ dữ liệu luyện tập của bạn"
        action={<Sparkles className="size-4 text-primary" aria-hidden />}
      >
        {recommendations.length > 0 ? (
          <ol className="space-y-2">
            {recommendations.map((recommendation, index) => (
              <li
                key={recommendation}
                className="flex items-start gap-2.5 rounded-lg border border-border/60 bg-background/40 px-3 py-2"
              >
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[10.5px] font-bold text-primary">
                  {index + 1}
                </span>
                <p className="text-xs leading-relaxed">{recommendation}</p>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState
            icon={Lightbulb}
            title="Chưa đủ dữ liệu để gợi ý"
            description="Luyện thêm vài phiên để huấn luyện viên phân tích."
          />
        )}
      </Panel>

      <Panel title="Chỉ số huấn luyện">
        <div className="grid grid-cols-2 gap-3 @2xl/dialog:grid-cols-4">
          <StatTile label="Số phiên" value={formatNumber(adaptiveStats.totalSessions)} />
          <StatTile label="Phút luyện" value={formatNumber(adaptiveStats.totalTimeMinutes)} />
          <StatTile label="WPM cao nhất" value={formatNumber(adaptiveStats.bestWpm)} tone="primary" />
          <StatTile label="Chính xác nhất" value={`${formatNumber(adaptiveStats.bestAccuracy)}%`} />
        </div>
      </Panel>
    </div>
  )
}

export function SessionsPanel({ data, onRefresh }: { data: DashboardData; onRefresh: () => void }) {
  const { sessions } = data
  const [language, setLanguage] = useState<string>("all")
  const [difficulty, setDifficulty] = useState<string>("all")
  const [notice, setNotice] = useState<{ tone: "success" | "destructive"; text: string } | null>(null)
  const [confirming, setConfirming] = useState<null | "score" | "all">(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const filtered = sessions.filter((session) => {
    if (language !== "all" && session.language !== language) return false
    if (difficulty !== "all" && session.difficulty !== difficulty) return false
    return true
  })

  const handleExport = () => {
    const blob = new Blob([StatisticsManager.exportData()], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `typeflow-stats-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
    setNotice({ tone: "success", text: "Đã xuất dữ liệu ra tệp JSON." })
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (loadEvent) => {
      const content = String(loadEvent.target?.result ?? "")
      if (StatisticsManager.importData(content)) {
        scoringSystem.reloadFromStorage()
        adaptiveAlgorithm.reloadFromStorage()
        setNotice({ tone: "success", text: "Nhập dữ liệu thành công." })
        onRefresh()
      } else {
        setNotice({ tone: "destructive", text: "Tệp không hợp lệ, vui lòng kiểm tra lại định dạng JSON." })
      }
      if (fileRef.current) fileRef.current.value = ""
    }
    reader.readAsText(file)
  }

  const resetScore = () => {
    scoringSystem.clearData()
    setConfirming(null)
    setNotice({ tone: "success", text: "Đã đặt lại điểm số và huy hiệu." })
    onRefresh()
  }

  const resetAll = () => {
    StatisticsManager.clearAllData()
    scoringSystem.clearData()
    adaptiveAlgorithm.clearData()
    EngagementManager.reset()
    setConfirming(null)
    setNotice({ tone: "success", text: "Đã xoá toàn bộ dữ liệu luyện tập." })
    onRefresh()
  }

  const selectClass =
    "h-8 rounded-lg border border-border/70 bg-background px-2 text-xs font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/40"

  return (
    <div className="space-y-4">
      <Panel
        title="Nhật ký phiên gõ"
        description={`${filtered.length} phiên trong khoảng thời gian đang chọn`}
        action={
          <div className="flex items-center gap-1.5">
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className={selectClass}
              aria-label="Lọc theo ngôn ngữ"
            >
              <option value="all">Mọi ngôn ngữ</option>
              <option value="english">English</option>
              <option value="vietnamese">Tiếng Việt</option>
            </select>
            <select
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value)}
              className={selectClass}
              aria-label="Lọc theo độ khó"
            >
              <option value="all">Mọi độ khó</option>
              <option value="easy">Dễ</option>
              <option value="medium">Trung bình</option>
              <option value="hard">Khó</option>
            </select>
          </div>
        }
      >
        {filtered.length > 0 ? (
          <ul className="space-y-1.5">
            {filtered.map((session) => (
              <SessionRow key={session.id} session={session} />
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={BarChart3}
            title="Không có phiên nào khớp bộ lọc"
            description="Thử đổi ngôn ngữ hoặc độ khó, hoặc mở rộng khoảng thời gian."
          />
        )}
      </Panel>

      <Panel title="Dữ liệu" description="Sao lưu, khôi phục hoặc xoá dữ liệu luyện tập">
        {notice ? (
          <div
            role="status"
            className={cn(
              "mb-3 rounded-lg border px-3 py-2 text-[11.5px] font-medium",
              notice.tone === "success"
                ? "border-success/30 bg-success/10 text-success"
                : "border-destructive/30 bg-destructive/10 text-destructive"
            )}
          >
            {notice.text}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport}>
            <Download className="size-3.5" aria-hidden />
            Xuất JSON
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="size-3.5" aria-hidden />
            Nhập JSON
          </Button>
          <input ref={fileRef} type="file" accept=".json,application/json" onChange={handleImport} className="hidden" />
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setConfirming(confirming === "score" ? null : "score")}
          >
            <Trash2 className="size-3.5" aria-hidden />
            Đặt lại điểm &amp; huy hiệu
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setConfirming(confirming === "all" ? null : "all")}
          >
            <Trash2 className="size-3.5" aria-hidden />
            Xoá toàn bộ dữ liệu
          </Button>
        </div>

        {confirming ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2">
            <p className="text-[11.5px] font-medium text-destructive">
              {confirming === "score"
                ? "Xoá toàn bộ điểm số và huy hiệu đã mở? Không thể hoàn tác."
                : "Xoá toàn bộ lịch sử phiên gõ, điểm số và dữ liệu huấn luyện? Không thể hoàn tác."}
            </p>
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setConfirming(null)}>
                Huỷ
              </Button>
              <Button
                size="sm"
                className="h-7 bg-destructive text-xs text-white hover:bg-destructive/90"
                onClick={confirming === "score" ? resetScore : resetAll}
              >
                Xoá
              </Button>
            </div>
          </div>
        ) : null}
      </Panel>
    </div>
  )
}

export function LatestScorePanel({ score }: { score: ScoreEntry }) {
  const breakdown: { label: string; value: string; tone?: string }[] = [
    { label: "Điểm cơ bản", value: `+${formatNumber(score.breakdown.baseScore)}` },
    { label: "Thưởng tốc độ", value: `+${formatNumber(score.breakdown.speedBonus)}`, tone: "text-success" },
    {
      label: "Thưởng chính xác",
      value: `+${formatNumber(score.breakdown.accuracyBonus)}`,
      tone: "text-success",
    },
    {
      label: "Thưởng ổn định",
      value: `+${formatNumber(score.breakdown.consistencyBonus)}`,
      tone: "text-success",
    },
    ...(score.breakdown.comboBonus
      ? [{ label: "Thưởng combo", value: `+${formatNumber(score.breakdown.comboBonus)}`, tone: "text-warning" }]
      : []),
    {
      label: "Thưởng từ hoàn hảo",
      value: `+${formatNumber(score.breakdown.perfectWordBonus)}`,
      tone: "text-success",
    },
    ...(score.breakdown.streakBonus > 0
      ? [{ label: "Thưởng chuỗi ngày", value: `+${formatNumber(score.breakdown.streakBonus)}`, tone: "text-warning" }]
      : []),
    { label: "Hệ số độ khó", value: `×${score.breakdown.difficultyMultiplier}` },
    { label: "Hệ số ngôn ngữ", value: `×${score.breakdown.languageMultiplier}` },
  ]

  return (
    <Panel
      title="Điểm phiên gần nhất"
      description={`${score.wpm} WPM · ${score.accuracy}% chính xác · ${formatNumber(score.timeElapsed)} giây`}
      action={
        <span
          className={cn(
            "rounded-md border border-border/70 bg-muted/40 px-2 py-0.5 text-[11px] font-bold",
            toneTextClass(score.rating.tone)
          )}
        >
          Hạng {score.rating.overall}
        </span>
      }
    >
      <div className="grid gap-4 @2xl/dialog:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="flex flex-col justify-center rounded-xl border border-border/60 bg-background/40 p-4 text-center @2xl/dialog:text-left">
          <span
            className={cn(
              "text-4xl leading-none font-black tracking-tight tabular-nums",
              toneTextClass(score.rating.tone)
            )}
          >
            {formatNumber(score.score)}
          </span>
          <span className="mt-1.5 text-[10.5px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
            tổng điểm
          </span>
          <p className="mt-2 text-xs text-muted-foreground">{score.rating.description}</p>
        </div>

        <div className="space-y-0.5">
          {breakdown.map((row) => (
            <div
              key={row.label}
              className="flex items-baseline justify-between gap-3 border-b border-border/50 py-1.5 last:border-0"
            >
              <span className="text-xs text-muted-foreground">{row.label}</span>
              <span className={cn("text-xs font-semibold tabular-nums", row.tone)}>{row.value}</span>
            </div>
          ))}
          <div className="flex items-baseline justify-between gap-3 pt-2">
            <span className="text-xs font-semibold">Tổng điểm</span>
            <span className="text-sm font-bold text-primary tabular-nums">
              {formatNumber(score.breakdown.totalScore)}
            </span>
          </div>
        </div>
      </div>
    </Panel>
  )
}

export function LeaderboardPanel({ data }: { data: DashboardData }) {
  const { leaderboard } = data

  return (
    <Panel title="Bảng điểm cao nhất của bạn" description="20 kết quả gần nhất">
      {leaderboard.length > 0 ? (
        <ol className="space-y-1.5">
          {leaderboard.map((entry, index) => (
            <li
              key={entry.id}
              className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/40 px-3 py-2"
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-muted/60 text-[11px] font-bold tabular-nums">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold tabular-nums">{formatNumber(entry.score)} điểm</p>
                <p className="truncate text-[10.5px] text-muted-foreground">
                  {entry.wpm} WPM · {entry.accuracy}% · {languageLabel(entry.language)}
                </p>
              </div>
              <span className="shrink-0 text-[10.5px] text-muted-foreground">
                {new Date(entry.timestamp).toLocaleDateString("vi-VN")}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <EmptyState
          icon={Brain}
          title="Chưa có điểm nào"
          description="Hoàn thành bài kiểm tra đầu tiên để ghi tên vào bảng."
        />
      )}
    </Panel>
  )
}
