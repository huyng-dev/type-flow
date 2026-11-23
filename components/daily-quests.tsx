"use client";

import { CheckCircle2, Gift, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { EngagementSnapshot } from "@/lib/engagement";
import { cn } from "@/lib/utils";

interface DailyQuestsProps {
  snapshot: EngagementSnapshot | null;
  onClaim: (id: string) => void;
  className?: string;
}

export function DailyQuests({ snapshot, onClaim, className }: DailyQuestsProps) {
  return (
    <section className={cn("rounded-2xl border border-border/70 bg-card/60 p-4", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10.5px] font-semibold tracking-[0.09em] text-muted-foreground uppercase">
          Động lực hôm nay
        </span>
        <Sparkles className="size-4 text-primary" aria-hidden />
      </div>

      {snapshot ? (
        <>
          <div className="mt-2 flex items-end justify-between gap-2">
            <p className="text-2xl leading-none font-extrabold tabular-nums">
              Lv {snapshot.level}
              <span className="ml-1.5 text-[11px] font-semibold text-muted-foreground">
                {snapshot.levelTitle}
              </span>
            </p>
            <p className="shrink-0 text-[10.5px] font-semibold text-muted-foreground tabular-nums">
              {snapshot.xpIntoLevel}/{snapshot.xpForNext} XP
            </p>
          </div>

          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full w-full origin-left rounded-full bg-primary transition-transform duration-300 ease-[cubic-bezier(0.2,0.9,0.4,1)]"
              style={{ transform: `scaleX(${snapshot.levelProgress})` }}
            />
          </div>

          <ul className="mt-3 space-y-2">
            {snapshot.quests.map((quest) => {
              const complete = quest.progress >= quest.target;
              return (
                <li
                  key={quest.id}
                  className={cn(
                    "rounded-lg border px-2.5 py-2",
                    quest.claimed
                      ? "border-border/50 bg-muted/20"
                      : complete
                        ? "border-primary/35 bg-primary/5"
                        : "border-border/60 bg-background/40"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={cn(
                        "text-[11.5px] leading-snug font-semibold",
                        quest.claimed ? "text-muted-foreground" : "text-foreground"
                      )}
                    >
                      {quest.label}
                    </p>
                    {quest.claimed ? (
                      <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-bold text-success">
                        <CheckCircle2 className="size-3" aria-hidden />
                        Đã nhận
                      </span>
                    ) : complete ? (
                      <Button
                        size="sm"
                        className="h-6 shrink-0 px-2 text-[10.5px]"
                        onClick={() => onClaim(quest.id)}
                      >
                        <Gift className="size-3" aria-hidden />
                        +{quest.reward} XP
                      </Button>
                    ) : (
                      <span className="shrink-0 text-[10px] font-semibold text-muted-foreground tabular-nums">
                        {quest.progress}/{quest.target}
                      </span>
                    )}
                  </div>

                  {!quest.claimed ? (
                    <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full w-full origin-left rounded-full transition-transform duration-300",
                          complete ? "bg-primary" : "bg-muted-foreground/50"
                        )}
                        style={{
                          transform: `scaleX(${Math.min(1, quest.progress / quest.target)})`,
                        }}
                      />
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>

          <p className="mt-2.5 text-[10px] leading-snug text-muted-foreground">
            Nhiệm vụ đổi mỗi ngày · nghỉ một ngày không làm mất chuỗi XP.
          </p>
        </>
      ) : (
        <p className="mt-2.5 text-[11px] text-muted-foreground">Đang tải tiến trình…</p>
      )}
    </section>
  );
}
