"use client"

import { Flame, X } from "lucide-react"

import { DailyQuests } from "@/components/daily-quests"
import type { DashboardTab } from "@/components/dashboard/data"
import type { EngagementSnapshot } from "@/lib/engagement"
import type { GameSession } from "@/lib/statistics"
import type { StreakData } from "@/lib/scoring-system"

interface PracticeSidebarProps {
  streakInfo: StreakData | null
  recentSessions: GameSession[]
  onOpenDashboard: (tab: DashboardTab) => void
  onClose: () => void
  engagement?: EngagementSnapshot | null
  onClaimQuest?: (id: string) => void
}

/**
 * Inspector panel: cột phụ kiểu app desktop (không phải sidebar marketing).
 * Từ xl nằm trong flow cạnh vùng gõ; dưới xl là overlay trượt từ phải.
 * Nội dung: chuỗi luyện (header), nhiệm vụ ngày, phiên gần đây.
 */
export function PracticeSidebar({
  streakInfo,
  recentSessions,
  onOpenDashboard,
  onClose,
  engagement = null,
  onClaimQuest,
}: PracticeSidebarProps) {
  const card = "rounded-xl border border-outline-variant/60 bg-surface-container-lowest/70 p-3.5"
  const label = "text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase"

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-start justify-between gap-2 border-b border-border/60 px-4 py-3">
        <div className="min-w-0">
          <p className={label}>Inspector</p>
          <div className="mt-1 flex min-w-0 items-center gap-2">
            <span className="truncate text-sm font-semibold">Tiến độ luyện</span>
            <span
              className="inline-flex shrink-0 items-center gap-1 rounded-md border border-warning/30 bg-warning/10 px-1.5 py-0.5 text-[10.5px] leading-none font-bold text-warning tabular-nums"
              title={`Chuỗi hiện tại ${streakInfo?.current ?? 0} ngày · dài nhất ${
                streakInfo?.longest ?? 0
              } ngày · hệ số ×${streakInfo?.multiplier ?? 1}`}
            >
              <Flame className="size-3 fill-warning/20" aria-hidden />
              {streakInfo?.current ?? 0} ngày
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng bảng phụ"
          title="Đóng bảng phụ (Ctrl+B)"
          className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-muted/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {onClaimQuest ? <DailyQuests snapshot={engagement} onClaim={onClaimQuest} /> : null}

        <section className={card}>
          <div className="flex items-center justify-between gap-2">
            <span className={label}>Phiên gần đây</span>
            <button
              type="button"
              onClick={() => onOpenDashboard("sessions")}
              className="rounded-sm text-[11px] font-semibold text-primary underline-offset-2 transition-[color,background-color,box-shadow] duration-150 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Tất cả
            </button>
          </div>
          {recentSessions.length > 0 ? (
            <ul className="mt-2.5 space-y-1.5">
              {recentSessions.map((session) => (
                <li
                  key={session.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border/50 bg-background/40 px-2.5 py-1.5"
                >
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold tabular-nums">
                      {session.wpm} WPM · {session.accuracy}%
                    </p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {session.language === "vietnamese" ? "Tiếng Việt" : "English"} ·{" "}
                      {new Date(session.timestamp).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] font-bold text-primary tabular-nums">
                    {session.totalScore.toLocaleString("vi-VN")}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2.5 text-[11px] leading-relaxed text-muted-foreground">
              Chưa có phiên nào trong 7 ngày gần đây.
            </p>
          )}
        </section>

        <p className="px-1 text-[10px] leading-relaxed text-muted-foreground">
          Dữ liệu được lưu cục bộ trên thiết bị này.
        </p>
      </div>
    </div>
  )
}
