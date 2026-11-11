import type { CSSProperties } from "react"
import {
  Activity,
  Award,
  BookOpen,
  Flame,
  Footprints,
  Gem,
  Languages,
  Moon,
  Rocket,
  Star,
  Sunrise,
  Target,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react"

import type { AchievementIcon, Achievement } from "@/lib/scoring-system"
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
}

const RARITY_STYLE = {
  common: "border-border/80 bg-muted/50 text-muted-foreground",
  rare: "border-info/30 bg-info/10 text-info",
  epic: "border-primary/30 bg-primary/10 text-primary",
  legendary: "border-warning/40 bg-warning/15 text-warning",
} as const

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
  className,
  style,
}: {
  achievement: Achievement
  unlocked: boolean
  className?: string
  style?: CSSProperties
}) {
  return (
    <div
      style={style}
      className={cn(
        "flex items-start gap-3 rounded-xl border p-3.5 transition-colors",
        unlocked ? RARITY_STYLE[achievement.rarity] : "border-dashed border-border/70 bg-muted/20",
        unlocked && achievement.rarity === "legendary" ? "animate-legendary-pulse" : "",
        className
      )}
    >
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-lg border border-border/70",
          unlocked ? "bg-background/60" : "bg-muted/40 text-muted-foreground/60"
        )}
      >
        <AchievementGlyph name={achievement.icon} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p
            className={cn(
              "truncate text-[13px] leading-tight font-semibold",
              unlocked ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {achievement.name}
          </p>
          {unlocked ? null : <span className="text-[10px] font-medium text-muted-foreground/70">chưa mở</span>}
        </div>
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
  )
}
