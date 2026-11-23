import type { CSSProperties } from "react"
import {
  Activity,
  Award,
  BookOpen,
  CalendarCheck,
  Crown,
  Flame,
  Footprints,
  Gauge,
  Gem,
  Hash,
  Keyboard,
  Languages,
  Layers,
  Medal,
  Moon,
  Rocket,
  Shield,
  Sparkles,
  Star,
  Sunrise,
  Target,
  Timer,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react"

import type {
  Achievement,
  AchievementIcon,
  AchievementProgress,
  AchievementRarity,
} from "@/lib/scoring-system"
import { cn } from "@/lib/utils"

const ICONS: Record<AchievementIcon, LucideIcon> = {
  zap: Zap,
  rocket: Rocket,
  target: Target,
  gem: Gem,
  activity: Activity,
  star: Star,
  footprints: Footprints,
  book: BookOpen,
  trophy: Trophy,
  languages: Languages,
  flame: Flame,
  moon: Moon,
  sunrise: Sunrise,
  crown: Crown,
  medal: Medal,
  keyboard: Keyboard,
  timer: Timer,
  layers: Layers,
  gauge: Gauge,
  hash: Hash,
  calendar: CalendarCheck,
  sparkles: Sparkles,
  shield: Shield,
}

const RARITY_STYLE: Record<AchievementRarity, string> = {
  common: "border-border/80 bg-muted/50 text-muted-foreground",
  rare: "border-info/30 bg-info/10 text-info",
  epic: "border-primary/30 bg-primary/10 text-primary",
  legendary: "border-warning/40 bg-warning/15 text-warning",
}

export const RARITY_LABEL: Record<AchievementRarity, string> = {
  common: "Cơ bản",
  rare: "Hiếm",
  epic: "Sử thi",
  legendary: "Huyền thoại",
}

export function formatAchievementValue(value: number): string {
  return value.toLocaleString("vi-VN")
}

export function AchievementGlyph({
  name,
  className,
  size = "md",
}: {
  name: AchievementIcon
  className?: string
  size?: "sm" | "md"
}) {
  const Icon = ICONS[name] ?? Award
  return (
    <Icon
      className={cn(size === "sm" ? "size-4" : "size-5", className)}
      aria-hidden
    />
  )
}

export function AchievementBadge({
  achievement,
  unlocked,
  progress,
  className,
  style,
}: {
  achievement: Achievement
  unlocked: boolean
  progress?: AchievementProgress | null
  className?: string
  style?: CSSProperties
}) {
  const progressCurrent = progress?.current ?? 0
  const progressTarget = progress?.target ?? 0
  const showProgress = !unlocked && progressTarget > 0
  const ratio = showProgress ? Math.min(1, progressCurrent / progressTarget) : 0

  return (
    <div
      style={style}
      className={cn(
        "flex flex-col gap-2 rounded-xl border p-3.5 transition-colors",
        unlocked ? RARITY_STYLE[achievement.rarity] : "border-dashed border-border/70 bg-muted/20",
        unlocked && achievement.rarity === "legendary" ? "animate-legendary-pulse" : "",
        className
      )}
    >
      <div className="flex items-start gap-2.5">
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-lg border",
            unlocked ? "border-current/20 bg-background/60" : "border-border/70 bg-muted/40 text-muted-foreground/60"
          )}
        >
          <AchievementGlyph name={achievement.icon} size="sm" />
        </span>

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "truncate text-[13px] leading-tight font-semibold",
              unlocked ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {achievement.name}
          </p>
          <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-snug text-muted-foreground">
            {achievement.description}
          </p>
        </div>

        <span
          className={cn(
            "shrink-0 text-[11px] font-bold tabular-nums",
            unlocked ? "text-current" : "text-muted-foreground/60"
          )}
        >
          +{achievement.points}
        </span>
      </div>

      <div
        className={cn(
          "flex items-center justify-between gap-2 border-t pt-1.5 text-[10px] font-medium",
          unlocked ? "border-current/15" : "border-border/50"
        )}
      >
        <span className={cn(unlocked ? "opacity-80" : "text-muted-foreground/70")}>
          {RARITY_LABEL[achievement.rarity]}
        </span>

        {unlocked ? (
          <span className="truncate tabular-nums opacity-70">
            {achievement.unlockedAt
              ? `Mở ${new Date(achievement.unlockedAt).toLocaleDateString("vi-VN")}`
              : "Đã mở"}
          </span>
        ) : showProgress ? (
          <span className="shrink-0 tabular-nums text-muted-foreground/80">
            {formatAchievementValue(progressCurrent)}/{formatAchievementValue(progressTarget)}
          </span>
        ) : (
          <span className="text-muted-foreground/60">chưa mở</span>
        )}
      </div>

      {showProgress ? (
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted" aria-hidden>
          <div
            className="h-full w-full origin-left rounded-full bg-muted-foreground/50 transition-transform duration-300 ease-[cubic-bezier(0.2,0.9,0.4,1)]"
            style={{ transform: `scaleX(${ratio})` }}
          />
        </div>
      ) : null}
    </div>
  )
}
