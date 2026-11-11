"use client"

import { useEffect, useId, useRef, useState, type ReactNode } from "react"
import type { LucideIcon } from "lucide-react"

import { useReducedMotion } from "@/lib/motion"
import { cn } from "@/lib/utils"

const TONE_TEXT = {
  default: "text-foreground",
  primary: "text-primary",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
  info: "text-info",
  muted: "text-muted-foreground",
} as const

const TONE_BAR = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
  info: "bg-info",
  muted: "bg-muted-foreground/50",
} as const

export type Tone = keyof typeof TONE_TEXT
export type BarTone = keyof typeof TONE_BAR

/** Lớp chữ theo token màu — dùng chung cho hạng, điểm số, trạng thái. */
export function toneTextClass(tone: Tone): string {
  return TONE_TEXT[tone]
}

export function Panel({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}: {
  title?: ReactNode
  description?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
  contentClassName?: string
}) {
  return (
    <section className={cn("rounded-xl border border-border/70 bg-background/40 p-4", className)}>
      {title || action ? (
        <header className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title ? <h3 className="text-sm leading-tight font-semibold">{title}</h3> : null}
            {description ? (
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {action}
        </header>
      ) : null}
      <div className={contentClassName}>{children}</div>
    </section>
  )
}

export function StatTile({
  label,
  value,
  unit,
  hint,
  tone = "default",
  animateValue = false,
  format,
  className,
}: {
  label: ReactNode
  value: ReactNode
  unit?: ReactNode
  hint?: ReactNode
  tone?: Tone
  animateValue?: boolean
  format?: (value: number) => string
  className?: string
}) {
  const displayValue = useAnimatedNumber(value, animateValue, format)

  return (
    <div className={cn("rounded-xl border border-border/70 bg-background/50 px-4 py-3", className)}>
      <div className="flex items-baseline gap-1">
        <span
          className={cn(
            "text-2xl leading-none font-bold tracking-tight tabular-nums",
            TONE_TEXT[tone]
          )}
        >
          {displayValue}
        </span>
        {unit ? <span className="text-xs font-semibold text-muted-foreground">{unit}</span> : null}
      </div>
      <div className="mt-1.5 text-[10.5px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        {label}
      </div>
      {hint ? <div className="mt-1 text-[11px] text-muted-foreground/80">{hint}</div> : null}
    </div>
  )
}

/**
 * Đếm từ 0 lên giá trị đích trong ~500ms bằng requestAnimationFrame.
 * Chỉ áp dụng cho giá trị số; giá trị khác trả về nguyên trạng.
 * Tôn trọng reduced-motion: nhảy thẳng tới đích.
 */
function useAnimatedNumber(
  value: ReactNode,
  enabled: boolean,
  format?: (value: number) => string
): ReactNode {
  const isNumeric = typeof value === "number" && Number.isFinite(value)
  const reduced = useReducedMotion()
  const [display, setDisplay] = useState<number | null>(null)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    if (!enabled || !isNumeric || reduced) {
      setDisplay(null)
      return
    }

    const target = value as number
    const duration = 500
    const start = performance.now()

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      // easeOutCubic — giảm tốc, không giật ở cuối
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(target * eased))
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick)
      } else {
        setDisplay(null) // trả quyền hiển thị lại cho giá trị gốc
      }
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    }
  }, [enabled, isNumeric, reduced, value])

  if (display !== null) return format ? format(display) : display
  return value
}

export function Meter({
  label,
  value,
  max = 100,
  valueLabel,
  tone = "primary",
  className,
}: {
  label: ReactNode
  value: number
  max?: number
  valueLabel?: ReactNode
  tone?: BarTone
  className?: string
}) {
  const safeMax = max > 0 ? max : 1
  const pct = Math.max(0, Math.min(100, (value / safeMax) * 100))

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-medium">{label}</span>
        <span className="font-semibold tabular-nums text-muted-foreground">
          {valueLabel ?? Math.round(value)}
        </span>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label={typeof label === "string" ? label : undefined}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={Math.round(value)}
      >
        {/* scaleX thay vì width: cùng hình ảnh, không gây layout thrash. */}
        <div
          className={cn(
            "h-full w-full origin-left rounded-full transition-transform duration-300 ease-[cubic-bezier(0.2,0.9,0.4,1)]",
            TONE_BAR[tone]
          )}
          style={{ transform: `scaleX(${pct / 100})` }}
        />
      </div>
    </div>
  )
}

export function Sparkline({
  values,
  height = 140,
  ariaLabel,
  className,
  showDots = true,
  axisLabels,
}: {
  /** `null` = ngày không có dữ liệu; trục thời gian vẫn được giữ. */
  values: (number | null)[]
  height?: number
  ariaLabel?: string
  className?: string
  showDots?: boolean
  /** Nhãn hai đầu trục thời gian, ví dụ ["01/10", "30/10"]. */
  axisLabels?: [string, string]
}) {
  const gradientId = `spark-${useId().replace(/[^a-zA-Z0-9]/g, "")}`
  const present = values.filter((value): value is number => value !== null)

  if (present.length < 2) {
    return (
      <div
        className={cn(
          "grid place-items-center rounded-xl border border-dashed border-border/70 px-6 text-center text-xs text-muted-foreground",
          className
        )}
        style={{ height }}
      >
        Cần ít nhất 2 ngày có dữ liệu trong khoảng này để vẽ biểu đồ
      </div>
    )
  }

  const W = 600
  const H = 160
  const padX = 10
  const padTop = 14
  const padBottom = 22
  const max = Math.max(...present)
  const min = Math.min(...present)
  const span = Math.max(max - min, 1)
  const step = values.length > 1 ? (W - padX * 2) / (values.length - 1) : 0

  const pointAt = (value: number, index: number) => ({
    x: padX + index * step,
    y: padTop + (1 - (value - min) / span) * (H - padTop - padBottom),
  })

  // Chia thành từng đoạn liên tục: ngày nghỉ làm đứt nét thay vì nối bừa.
  const segments: { x: number; y: number }[][] = []
  let current: { x: number; y: number }[] = []
  values.forEach((value, index) => {
    if (value === null) {
      if (current.length > 0) segments.push(current)
      current = []
      return
    }
    current.push(pointAt(value, index))
  })
  if (current.length > 0) segments.push(current)

  const activePoints = values
    .map((value, index) => (value === null ? null : { ...pointAt(value, index), value, index }))
    .filter((point): point is { x: number; y: number; value: number; index: number } => point !== null)

  const areaPath =
    segments.length > 0
      ? segments
          .map((segment) => {
            const line = segment.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" L ")
            const first = segment[0]
            const last = segment[segment.length - 1]
            const base = H - padBottom
            return `M ${first.x.toFixed(1)},${first.y.toFixed(1)} L ${line} L ${last.x.toFixed(1)},${base} L ${first.x.toFixed(1)},${base} Z`
          })
          .join(" ")
      : ""

  const linePath = segments
    .map((segment) => `M ${segment.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" L ")}`)
    .join(" ")

  const axis = axisLabels
    ? [
        { x: padX, anchor: "start" as const, text: axisLabels[0] },
        { x: W - padX, anchor: "end" as const, text: axisLabels[1] },
      ]
    : []

  return (
    <div className={cn("w-full", className)}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height={height}
        className="block overflow-visible"
        role={ariaLabel ? "img" : "presentation"}
        aria-label={ariaLabel}
        preserveAspectRatio="none"
      >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </linearGradient>
      </defs>

      <line
        x1={padX}
        y1={H - padBottom}
        x2={W - padX}
        y2={H - padBottom}
        stroke="var(--border)"
        strokeWidth="1"
      />

      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path
        d={linePath}
        fill="none"
        stroke="var(--primary)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />

      {showDots
        ? activePoints.map((point) => (
            <circle key={point.index} cx={point.x} cy={point.y} r="2.8" fill="var(--primary)">
              <title>{`${point.value} WPM`}</title>
            </circle>
          ))
        : null}

      {activePoints.length > 0 ? (
        <circle
          cx={activePoints[activePoints.length - 1].x}
          cy={activePoints[activePoints.length - 1].y}
          r="4"
          fill="var(--primary)"
        />
      ) : null}
      </svg>

      {axis.length > 0 ? (
        <div className="mt-1 flex items-center justify-between px-0.5 text-[10px] font-medium text-muted-foreground tabular-nums">
          <span>{axis[0].text}</span>
          <span>{axis[1].text}</span>
        </div>
      ) : null}
    </div>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/70 px-6 py-10 text-center",
        className
      )}
    >
      {Icon ? <Icon className="size-7 text-muted-foreground/50" aria-hidden /> : null}
      <p className="text-sm font-semibold">{title}</p>
      {description ? <p className="max-w-sm text-xs text-muted-foreground">{description}</p> : null}
      {action}
    </div>
  )
}
