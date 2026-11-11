"use client"

import { ChevronRight, Flame } from "lucide-react"

import type { DashboardTab } from "@/components/dashboard/data"
import type { GameSession } from "@/lib/statistics"
import type { StreakData } from "@/lib/scoring-system"

interface PracticeSidebarProps {
  streakInfo: StreakData | null
  recentSessions: GameSession[]
  onOpenDashboard: (tab: DashboardTab) => void
  layout?: "stack" | "grid"
}

/**
 * Các thẻ phụ của khu luyện. Hiển thị dạng cột bên phải khi mở sidebar (xl),
 * và tự xuống dưới khu gõ ở màn hình nhỏ để không làm loãng vùng tập trung.
 */
export function PracticeSidebar({
  streakInfo,
  recentSessions,
  onOpenDashboard,
  layout = "stack",
}: PracticeSidebarProps) {
  const card = "rounded-2xl border border-border/70 bg-card/60 p-4"

  return (
    <div className={layout === "grid" ? "grid grid-cols-1 gap-3 sm:grid-cols-2" : "space-y-3"}>
      <section className={card}>
        <div className="flex items-center justify-between">
          <span className="text-[10.5px] font-semibold tracking-[0.09em] text-muted-foreground uppercase">
            Chuỗi luyện
          </span>
          <Flame className="size-4 text-warning" aria-hidden />
        </div>
        <p className="mt-2 text-3xl leading-none font-extrabold tabular-nums">
          {streakInfo?.current ?? 0}
          <span className="ml-1 text-[11px] font-semibold text-muted-foreground">ngày</span>
        </p>
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          Dài nhất {streakInfo?.longest ?? 0} ngày · hệ số ×{streakInfo?.multiplier ?? 1}
        </p>
      </section>

      <section className={card}>
        <div className="flex items-center justify-between">
          <span className="text-[10.5px] font-semibold tracking-[0.09em] text-muted-foreground uppercase">
            Phiên gần đây
          </span>
          <button
            type="button"
            onClick={() => onOpenDashboard("sessions")}
            className="text-[11px] font-semibold text-primary hover:underline"
          >
            Tất cả
          </button>
        </div>
        {recentSessions.length > 0 ? (
          <ul className="mt-2.5 space-y-1.5">
            {recentSessions.map((session) => (
              <li
                key={session.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-background/40 px-2.5 py-1.5"
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

      <section className={card}>
        <span className="text-[10.5px] font-semibold tracking-[0.09em] text-muted-foreground uppercase">
          Phím tắt
        </span>
        <div className="mt-2.5 space-y-1.5 text-[11px]">
          <div className="flex items-center justify-between gap-2">
            <kbd className="rounded border border-border/70 bg-muted px-1.5 py-0.5 font-mono text-[10px]">
              Tab + Enter
            </kbd>
            <span className="text-muted-foreground">Bài mới</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <kbd className="rounded border border-border/70 bg-muted px-1.5 py-0.5 font-mono text-[10px]">
              Esc
            </kbd>
            <span className="text-muted-foreground">Bắt đầu lại</span>
          </div>
        </div>
      </section>

      <button
        type="button"
        onClick={() => onOpenDashboard("overview")}
        className={`flex w-full items-center justify-between rounded-2xl border border-primary/25 bg-primary/10 px-4 py-3 text-left transition-colors hover:bg-primary/15 ${
          layout === "grid" ? "sm:col-span-2" : ""
        }`}
      >
        <span>
          <span className="block text-xs font-semibold text-primary">Bảng điều khiển</span>
          <span className="block text-[10.5px] text-muted-foreground">
            Thống kê, huy hiệu, AI Coach
          </span>
        </span>
        <ChevronRight className="size-4 text-primary" aria-hidden />
      </button>
    </div>
  )
}
