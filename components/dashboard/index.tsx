"use client"

import { useEffect, useState } from "react"
import { BarChart3, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Achievement, ScoreEntry } from "@/lib/scoring-system"
import { cn } from "@/lib/utils"

import { DASHBOARD_TABS, useDashboardData, type DashboardTab } from "./data"
import {
  AchievementsPanel,
  CoachPanel,
  LatestScorePanel,
  LeaderboardPanel,
  OverviewPanel,
  ProgressPanel,
  SessionsPanel,
} from "./panels"

export interface DashboardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialTab?: DashboardTab
  newAchievements?: Achievement[]
  score?: ScoreEntry
}

export function Dashboard({
  open,
  onOpenChange,
  initialTab = "overview",
  newAchievements = [],
  score,
}: DashboardProps) {
  const { data, range, setRange, refresh } = useDashboardData()
  const [tab, setTab] = useState<DashboardTab>(initialTab)
  const [updatedAt, setUpdatedAt] = useState<string>("")

  useEffect(() => {
    if (!open) return
    setTab(initialTab)
    refresh()
    setUpdatedAt(
      new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    )
  }, [open, initialTab, refresh])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="2xl" className="h-[min(88vh,840px)]">
        <DialogHeader
          icon={BarChart3}
          title="Bảng điều khiển luyện gõ"
          description={`${data.summary.totalSessions} phiên · ${data.summary.averageWpm} WPM trung bình · ${data.summary.averageAccuracy}% chính xác${
            updatedAt ? ` · cập nhật ${updatedAt}` : ""
          }`}
        />

        <Tabs
          value={tab}
          onValueChange={(value) => setTab(value as DashboardTab)}
          className="flex min-h-0 flex-1 flex-col gap-0"
        >
          <div className="shrink-0 border-b border-border/70 px-6 py-2.5">
            <TabsList className="grid h-auto w-full grid-cols-3 gap-1 rounded-xl bg-muted/50 p-1 @xl/dialog:grid-cols-5">
              {DASHBOARD_TABS.map((item) => (
                <TabsTrigger
                  key={item.value}
                  value={item.value}
                  className="h-8 rounded-lg text-[11.5px] font-semibold"
                >
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <DialogBody>
            <TabsContent value="overview" className="mt-0 space-y-4 focus-visible:outline-none">
              {score ? <LatestScorePanel score={score} /> : null}
              <OverviewPanel data={data} newAchievements={newAchievements} onNavigate={setTab} />
            </TabsContent>

            <TabsContent value="progress" className="mt-0 space-y-4 focus-visible:outline-none">
              <ProgressPanel data={data} range={range} onRangeChange={setRange} />
            </TabsContent>

            <TabsContent value="achievements" className="mt-0 space-y-4 focus-visible:outline-none">
              <AchievementsPanel data={data} />
              <LeaderboardPanel data={data} />
            </TabsContent>

            <TabsContent value="coach" className="mt-0 space-y-4 focus-visible:outline-none">
              <CoachPanel data={data} />
            </TabsContent>

            <TabsContent value="sessions" className="mt-0 space-y-4 focus-visible:outline-none">
              <SessionsPanel data={data} onRefresh={refresh} />
            </TabsContent>
          </DialogBody>
        </Tabs>

        <DialogFooter>
          <p className={cn("mr-auto text-[11px] text-muted-foreground")}>
            Dữ liệu được lưu cục bộ trên trình duyệt này
          </p>
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={refresh}>
            <RefreshCw className="size-3.5" aria-hidden />
            Làm mới
          </Button>
          <Button size="sm" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
