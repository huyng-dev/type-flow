"use client";

import { Zap } from "lucide-react";

import {
  comboMultiplier,
  comboTier,
  nextComboMilestone,
  type DopamineMode,
} from "@/lib/dopamine";
import { cn } from "@/lib/utils";

const TIER_TEXT = [
  "text-muted-foreground",
  "text-info",
  "text-primary",
  "text-warning",
  "text-warning",
] as const;

const TIER_BAR = [
  "bg-muted-foreground/40",
  "bg-info",
  "bg-primary",
  "bg-warning",
  "bg-warning",
] as const;

const TIER_BORDER = [
  "border-border/60",
  "border-info/35",
  "border-primary/35",
  "border-warning/40",
  "border-warning/50",
] as const;

interface ComboMeterProps {
  combo: number;
  bestCombo: number;
  mode: DopamineMode;
  className?: string;
}

/**
 * Thanh combo: hiển thị ở mọi chế độ (vì combo có cộng điểm),
 * nhưng chỉ nhấp nháy khi DPM đang bật.
 */
export function ComboMeter({ combo, bestCombo, mode, className }: ComboMeterProps) {
  const tier = comboTier(combo);
  const multiplier = comboMultiplier(combo);
  const milestone = nextComboMilestone(combo);
  const progress = milestone ? Math.min(1, combo / milestone) : 1;
  const animate = mode !== "off";

  return (
    <div
      aria-label={`Combo ${combo}, hệ số ${multiplier}`}
      className={cn(
        "flex items-center gap-3 rounded-xl border bg-card/50 px-3 py-2 transition-colors duration-200",
        TIER_BORDER[tier],
        className
      )}
    >
      <span className={cn("inline-flex items-center gap-1.5", TIER_TEXT[tier])}>
        <Zap className="size-3.5" aria-hidden />
        <span
          key={tier}
          className={cn(
            "text-sm leading-none font-extrabold tabular-nums",
            animate && tier > 0 ? "dpm-tier-pop" : ""
          )}
        >
          {combo}
        </span>
        <span className="text-[10px] font-bold tracking-[0.08em] uppercase">combo</span>
      </span>

      <div className="min-w-0 flex-1">
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full w-full origin-left rounded-full",
              TIER_BAR[tier]
            )}
            style={{ transform: `scaleX(${progress})` }}
          />
        </div>
        <p className="mt-1 truncate text-[10px] leading-none text-muted-foreground">
          {milestone
            ? `Còn ${milestone - combo} điểm tới mốc ${milestone}`
            : "Đã chạm mốc combo cao nhất"}
        </p>
      </div>

      <span className={cn("text-xs font-bold tabular-nums", TIER_TEXT[tier])}>
        ×{multiplier.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}
      </span>

      {bestCombo > 0 ? (
        <span className="hidden shrink-0 text-[10.5px] text-muted-foreground sm:inline">
          Kỷ lục {bestCombo}
        </span>
      ) : null}
    </div>
  );
}
