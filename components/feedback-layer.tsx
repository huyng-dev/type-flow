"use client";

import { useSyncExternalStore, type CSSProperties } from "react";
import {
  CheckCircle2,
  Sparkles,
  Star,
  Target,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react";

import {
  feedbackEngine,
  type EffectIcon,
  type EffectTone,
  type FeedbackEffect,
} from "@/lib/dopamine";
import { cn } from "@/lib/utils";

const ICONS: Record<EffectIcon, LucideIcon> = {
  zap: Zap,
  target: Target,
  trophy: Trophy,
  sparkles: Sparkles,
  star: Star,
  check: CheckCircle2,
};

/**
 * Banner dùng nền đục (`bg-card`) thay vì nền tone trong suốt: chữ luôn đủ
 * tương phản trên mọi theme và trên cả nội dung đang gõ phía sau.
 * Màu nhận diện chuyển sang vạch bên trái + ô icon.
 */
const BANNER_TONE: Record<
  EffectTone,
  { shell: string; accent: string; icon: string }
> = {
  common: {
    shell: "border-border",
    accent: "bg-muted-foreground/50",
    icon: "bg-muted text-muted-foreground",
  },
  rare: {
    shell: "border-info/45",
    accent: "bg-info",
    icon: "bg-info/12 text-info",
  },
  epic: {
    shell: "border-primary/50",
    accent: "bg-primary",
    icon: "bg-primary/12 text-primary",
  },
  legendary: {
    shell: "border-warning/55",
    accent: "bg-warning",
    icon: "bg-warning/15 text-warning",
  },
  primary: {
    shell: "border-primary/50",
    accent: "bg-primary",
    icon: "bg-primary/12 text-primary",
  },
  info: {
    shell: "border-info/45",
    accent: "bg-info",
    icon: "bg-info/12 text-info",
  },
};

const PARTICLE_TONE: Record<EffectTone, string> = {
  common: "bg-primary/70",
  rare: "bg-info",
  epic: "bg-primary",
  legendary: "bg-warning",
  primary: "bg-primary/80",
  info: "bg-info/80",
};

const CONFETTI_COLORS = [
  "var(--primary)",
  "var(--success)",
  "var(--warning)",
  "var(--info)",
  "var(--accent)",
];

/**
 * Lớp hiệu ứng DPM.
 *
 * Sống ngoài cây state của vùng gõ: engine đẩy hiệu ứng vào store riêng và
 * component này là nơi duy nhất re-render. Nhờ vậy gõ nhanh không bị ảnh hưởng.
 */
export function FeedbackLayer() {
  const effects = useSyncExternalStore(
    feedbackEngine.subscribe,
    feedbackEngine.getSnapshot,
    feedbackEngine.getSnapshot
  );

  if (effects.length === 0) return null;

  const banners = effects.filter((effect) => effect.title);
  const sparks = effects.filter((effect) => effect.kind === "word");
  const confetti = effects.find((effect) => effect.kind === "finish");
  const latest = banners[banners.length - 1];

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
        {sparks.length > 0 ? (
          <div className="absolute bottom-[26%] left-1/2">
            {sparks.map((effect) => (
              <SparkBurst key={effect.id} effect={effect} />
            ))}
          </div>
        ) : null}

        {confetti ? <Confetti seed={confetti.id} /> : null}

        <div className="absolute inset-x-0 top-20 flex flex-col items-center gap-2 px-4">
          {banners.map((effect) => (
            <Banner key={effect.id} effect={effect} />
          ))}
        </div>
      </div>

      <div className="sr-only" role="status" aria-live="polite">
        {latest ? `${latest.title}${latest.detail ? ` — ${latest.detail}` : ""}` : ""}
      </div>
    </>
  );
}

function Banner({ effect }: { effect: FeedbackEffect }) {
  const Icon = ICONS[effect.icon];
  const tone = BANNER_TONE[effect.tone];

  return (
    <div
      data-state={effect.leaving ? "closed" : "open"}
      className={cn(
        "relative flex w-full max-w-md items-start gap-2.5 overflow-hidden rounded-xl border bg-card py-2.5 pr-3.5 pl-4 text-card-foreground",
        "shadow-lg shadow-black/10 backdrop-blur-md",
        "animate-in fade-in slide-in-from-top-2 duration-200 ease-[cubic-bezier(0.2,0.9,0.4,1)]",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-1",
        effect.tone === "legendary" && "ring-1 ring-warning/20",
        tone.shell
      )}
    >
      <span
        aria-hidden
        className={cn("absolute inset-y-0 left-0 w-1", tone.accent)}
      />
      <span
        className={cn(
          "mt-px grid size-7 shrink-0 place-items-center rounded-lg",
          tone.icon
        )}
      >
        <Icon className="size-3.5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-[12.5px] leading-tight font-bold">{effect.title}</p>
        {effect.detail ? (
          <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
            {effect.detail}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function SparkBurst({ effect }: { effect: FeedbackEffect }) {
  const count = effect.particles ?? 3;

  return (
    <>
      {Array.from({ length: count }).map((_, index) => {
        const angle = (index / count) * Math.PI * 2 + (effect.id % 5) * 0.4;
        const distance = 26 + (index % 3) * 12;
        const dx = Math.cos(angle) * distance;
        const dy = -30 - Math.abs(Math.sin(angle)) * 26 - (index % 2) * 10;

        return (
          <span
            key={index}
            className={cn(
              "dpm-spark absolute size-1.5 rounded-full",
              PARTICLE_TONE[effect.tone]
            )}
            style={
              {
                "--dx": `${dx.toFixed(1)}px`,
                "--dy": `${dy.toFixed(1)}px`,
                animationDelay: `${index * 22}ms`,
              } as CSSProperties
            }
          />
        );
      })}
    </>
  );
}

function Confetti({ seed }: { seed: number }) {
  return (
    <div className="absolute inset-x-0 top-0 h-[80vh]">
      {Array.from({ length: 26 }).map((_, index) => {
        const left = (index * 37 + seed * 17) % 100;
        const dx = (index % 2 === 0 ? 1 : -1) * (12 + (index % 5) * 16);
        const rotation = (index % 2 === 0 ? 1 : -1) * (160 + index * 21);
        const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
        const isRound = index % 3 === 0;

        return (
          <span
            key={index}
            className={cn(
              "dpm-confetti absolute top-0",
              isRound ? "size-2 rounded-full" : "h-2.5 w-1.5 rounded-[1px]"
            )}
            style={
              {
                left: `${left}%`,
                backgroundColor: color,
                "--dx": `${dx}px`,
                "--rot": `${rotation}deg`,
                "--delay": `${(index % 7) * 32}ms`,
                "--dur": `${1050 + (index % 5) * 90}ms`,
              } as CSSProperties
            }
          />
        );
      })}
    </div>
  );
}
