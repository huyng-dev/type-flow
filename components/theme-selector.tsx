"use client"

import { useEffect, useState } from "react"
import { Check, Palette } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog"
import { themeManager, THEMES, type Theme, type ThemeId } from "@/lib/themes"
import { PreferencesManager } from "@/lib/preferences"
import { cn } from "@/lib/utils"

const CATEGORIES = [
  { id: "minimalist", name: "Tối giản", description: "Sạch sẽ, tập trung vào nội dung" },
  { id: "nature", name: "Thiên nhiên", description: "Tông màu dịu, lấy cảm hứng từ tự nhiên" },
  { id: "dark", name: "Tối", description: "Dịu mắt khi luyện buổi tối" },
  { id: "accessibility", name: "Dễ tiếp cận", description: "Tương phản cao, dễ đọc" },
  { id: "retro", name: "Cổ điển", description: "Không khí máy tính thập niên trước" },
] as const

export function ThemeSelector({ className }: { className?: string }) {
  // Render đầu tiên dùng theme mặc định để khớp HTML từ server; theme đã lưu
  // được áp trong useEffect bên dưới.
  const [currentTheme, setCurrentTheme] = useState<Theme>(THEMES.forest_green)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const savedPreferences = PreferencesManager.getPreferences()
    if (savedPreferences.theme) {
      themeManager.setTheme(savedPreferences.theme as ThemeId)
    }

    themeManager.initialize()
    setCurrentTheme(themeManager.getCurrentTheme())

    const unsubscribe = themeManager.subscribe(setCurrentTheme)
    return unsubscribe
  }, [])

  const handleThemeChange = (themeId: ThemeId) => {
    themeManager.setTheme(themeId)
    PreferencesManager.savePreferences({ theme: themeId })
    setIsOpen(false)
  }

  return (
    <div className={className}>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Palette className="size-4 text-primary" aria-hidden />
            <span className="hidden md:inline">{currentTheme.name}</span>
          </Button>
        </DialogTrigger>

        <DialogContent size="xl">
          <DialogHeader
            icon={Palette}
            title="Giao diện"
            description="Chọn bảng màu phù hợp với không gian và thói quen luyện gõ của bạn"
          />

          <DialogBody>
            <div className="space-y-5">
              {CATEGORIES.map((category) => {
                const themes = themeManager.getThemesByCategory(category.id)
                if (themes.length === 0) return null

                return (
                  <section key={category.id}>
                    <div className="mb-2">
                      <h3 className="text-sm font-semibold">{category.name}</h3>
                      <p className="text-[11.5px] text-muted-foreground">{category.description}</p>
                    </div>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-2.5">
                      {themes.map((theme) => (
                        <ThemeCard
                          key={theme.id}
                          theme={theme}
                          selected={currentTheme.id === theme.id}
                          onSelect={() => handleThemeChange(theme.id as ThemeId)}
                        />
                      ))}
                    </div>
                  </section>
                )
              })}
            </div>
          </DialogBody>

          <DialogFooter>
            <p className="mr-auto text-[11px] text-muted-foreground">
              Đang dùng: <span className="font-semibold text-foreground">{currentTheme.name}</span>
            </p>
            <Button size="sm" onClick={() => setIsOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ThemeCard({
  theme,
  selected,
  onSelect,
}: {
  theme: Theme
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "group relative flex w-full flex-col gap-2 rounded-xl border p-3 text-left transition-[transform,box-shadow,border-color,background-color] duration-150 ease-[cubic-bezier(0.2,0.9,0.4,1)] hover:-translate-y-0.5 hover:shadow-sm",
        "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
        selected
          ? "border-primary/50 bg-primary/5 ring-1 ring-primary/30"
          : "border-border/70 bg-background/40 hover:border-border hover:bg-muted/30"
      )}
    >
      {selected ? (
        <span className="absolute top-2 right-2 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-3" aria-hidden />
        </span>
      ) : null}

      <div>
        <p className="text-xs font-semibold">{theme.name}</p>
        <p className="mt-0.5 line-clamp-1 text-[10.5px] text-muted-foreground">{theme.description}</p>
      </div>

      <div className="flex gap-1">
        {[theme.colors.background, theme.colors.primary, theme.colors.secondary, theme.colors.accent].map(
          (color, index) => (
            <span
              key={`${theme.id}-${index}`}
              className="size-3.5 rounded-full border border-black/10"
              style={{ backgroundColor: color }}
            />
          )
        )}
      </div>

      <div
        className="rounded-lg border p-2"
        style={{
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.border,
          color: theme.colors.foreground,
        }}
      >
        <p className="text-[10.5px] leading-snug">
          <span style={{ color: theme.colors.primary }}>The quick</span> brown fox
        </p>
        <p
          className="mt-1 rounded px-1.5 py-0.5 text-[9.5px]"
          style={{ backgroundColor: theme.colors.muted, color: theme.colors.mutedForeground }}
        >
          WPM 65 · 98%
        </p>
      </div>
    </button>
  )
}
