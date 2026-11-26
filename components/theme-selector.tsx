"use client"

import { useEffect, useMemo, useState, type CSSProperties } from "react"
import { Check, Flame, Moon, Palette, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog"
import { THEMES, isDarkTheme, themeManager, type Theme, type ThemeId } from "@/lib/themes"
import { PreferencesManager } from "@/lib/preferences"
import { cn } from "@/lib/utils"

type ToneFilter = "all" | "light" | "dark"

const FILTERS: { id: ToneFilter; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: "light", label: "Sáng" },
  { id: "dark", label: "Tối" },
]

const ALL_THEMES = Object.values(THEMES)

/** Mô tả ngắn bằng tiếng Việt cho từng theme (dùng thay description tiếng Anh trong lib). */
const THEME_HINTS: Record<string, string> = {
  minimal_light: "Trắng tối giản, độ tương phản cao",
  minimal_dark: "Nền tối thuần khiết, không chói mắt",
  forest_green: "Xanh rừng dịu mắt, tập trung cao",
  ocean_blue: "Xanh biển mát mẻ, nhẹ nhàng",
  sunset_warm: "Tông cam ấm áp, giàu năng lượng",
  cherry_blossom: "Hồng anh đào mềm mại, thư giãn",
  arctic_frost: "Trong trẻo, lạnh như sớm mùa đông",
  lavender_dream: "Tím pastel êm dịu cho phiên dài",
  midnight: "Xanh đêm sâu lắng cho gõ ban đêm",
  cyberpunk_neon: "Tím neon tương phản cao kiểu code",
  high_contrast: "Tương phản tối đa, dễ đọc",
  retro_terminal: "Xanh lá trên nền đen kiểu terminal",
  sepia_vintage: "Tông nâu ấm như ảnh cũ",
}

export function ThemeSelector({ className }: { className?: string }) {
  // Render đầu tiên dùng theme mặc định để khớp HTML từ server; theme đã lưu
  // được áp trong useEffect bên dưới.
  const [currentTheme, setCurrentTheme] = useState<Theme>(THEMES.forest_green)
  const [isOpen, setIsOpen] = useState(false)
  const [filter, setFilter] = useState<ToneFilter>("all")
  // Theme nháp: chỉ áp dụng khi bấm "Áp dụng", không đổi ngay khi bấm card.
  const [draftId, setDraftId] = useState<ThemeId>("forest_green")

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

  // Mỗi lần mở dialog lại bắt đầu từ theme đang dùng.
  useEffect(() => {
    if (isOpen) {
      setDraftId(currentTheme.id as ThemeId)
    }
  }, [isOpen, currentTheme.id])

  const counts = useMemo(() => {
    const dark = ALL_THEMES.filter(isDarkTheme).length
    return { all: ALL_THEMES.length, light: ALL_THEMES.length - dark, dark }
  }, [])

  const visibleThemes = useMemo(
    () =>
      filter === "all"
        ? ALL_THEMES
        : ALL_THEMES.filter((theme) => (filter === "dark") === isDarkTheme(theme)),
    [filter]
  )

  const draftTheme = THEMES[draftId] ?? currentTheme
  const pristine = draftId === currentTheme.id

  const applyDraft = () => {
    if (pristine) {
      setIsOpen(false)
      return
    }
    themeManager.setTheme(draftId)
    PreferencesManager.savePreferences({ theme: draftId })
    setIsOpen(false)
  }

  return (
    <div className={className}>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 rounded-lg border-outline-variant/70 px-2.5 text-xs font-medium hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
            title={`Giao diện: ${currentTheme.name}`}
          >
            <Palette className="size-4 text-primary" aria-hidden />
            <span className="hidden xl:inline">{currentTheme.name}</span>
          </Button>
        </DialogTrigger>

        <DialogContent size="2xl" className="h-[min(88vh,800px)] overflow-hidden">
          <DialogHeader
            icon={Palette}
            title="Giao diện & Chủ đề"
            description="Chọn bảng màu phù hợp với không gian và ánh sáng khi luyện gõ."
          />

          <DialogBody className="flex min-h-0 flex-col gap-3 overflow-hidden px-5 py-4">
            {/* Filter pills */}
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
              <div
                role="group"
                aria-label="Lọc theo tông sáng tối"
                className="inline-flex items-center gap-0.5 rounded-full border border-outline-variant/60 bg-surface-container-low p-0.5"
              >
                {FILTERS.map((item) => {
                  const active = filter === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFilter(item.id)}
                      aria-pressed={active}
                      className={cn(
                        "rounded-full px-3 py-1 text-[11px] font-semibold tabular-nums transition-colors duration-150",
                        "focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
                        active
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {item.label} ({counts[item.id]})
                    </button>
                  )
                })}
              </div>
              <span className="text-[11px] text-muted-foreground">
                {visibleThemes.length} chủ đề
              </span>
            </div>

            <div className="grid min-h-0 flex-1 gap-4 md:grid-cols-12">
              {/* Theme grid */}
              <div className="min-h-0 overflow-y-auto pr-1 md:col-span-7">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {visibleThemes.map((theme) => (
                    <ThemeCard
                      key={theme.id}
                      theme={theme}
                      selected={draftId === theme.id}
                      onSelect={() => setDraftId(theme.id as ThemeId)}
                    />
                  ))}
                </div>
              </div>

              {/* Preview — dựng lại đúng các thành phần của trang chính */}
              <aside className="hidden min-h-0 flex-col gap-3 overflow-y-auto rounded-xl border border-outline-variant/60 bg-surface-container-low p-4 md:col-span-5 md:flex">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                    Xem trước
                  </span>
                  <span className="truncate text-xs font-semibold text-primary">
                    {draftTheme.name}
                  </span>
                </div>

                <ThemePreview theme={draftTheme} />

                <div className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium">Tông màu</span>
                    <span className="inline-flex items-center gap-1 text-[10.5px] text-muted-foreground">
                      {isDarkTheme(draftTheme) ? (
                        <Moon className="size-3" aria-hidden />
                      ) : (
                        <Sun className="size-3" aria-hidden />
                      )}
                      {isDarkTheme(draftTheme) ? "Tối" : "Sáng"}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {[
                      draftTheme.colors.background,
                      draftTheme.colors.primary,
                      draftTheme.colors.secondary,
                      draftTheme.colors.accent,
                      draftTheme.colors.muted,
                      draftTheme.colors.border,
                    ].map((color, index) => (
                      <span
                        key={`${draftTheme.id}-swatch-${index}`}
                        className="size-4 rounded-full border border-black/10"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <p className="mt-auto text-[10.5px] leading-relaxed text-muted-foreground">
                  Bấm <span className="font-semibold text-foreground">Áp dụng</span> để dùng chủ
                  đề này. Lựa chọn được lưu cục bộ trên thiết bị.
                </p>
              </aside>
            </div>
          </DialogBody>

          <DialogFooter>
            <p className="mr-auto text-[11px] text-muted-foreground">
              Đang dùng:{" "}
              <span className="font-semibold text-foreground">{currentTheme.name}</span>
              {!pristine && (
                <>
                  {" · "}
                  <span className="font-semibold text-primary">{draftTheme.name}</span> đang chờ
                  áp dụng
                </>
              )}
            </p>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              Hủy
            </Button>
            <Button size="sm" className="gap-1.5" disabled={pristine} onClick={applyDraft}>
              <Check className="size-3.5" aria-hidden />
              Áp dụng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/** Bản thu nhỏ của màn luyện gõ: titlebar, config bar, vùng gõ, HUD, status bar. */
function ThemePreview({ theme }: { theme: Theme }) {
  const c = theme.colors
  const vars = {
    "--background": c.background,
    "--foreground": c.foreground,
    "--card": c.card,
    "--card-foreground": c.cardForeground,
    "--primary": c.primary,
    "--primary-foreground": c.primaryForeground,
    "--secondary": c.secondary,
    "--secondary-foreground": c.secondaryForeground,
    "--muted": c.muted,
    "--muted-foreground": c.mutedForeground,
    "--accent": c.accent,
    "--accent-foreground": c.accentForeground,
    "--destructive": c.destructive,
    "--destructive-foreground": c.destructiveForeground,
    "--border": c.border,
    "--outline-variant": c.border,
    "--surface-container-lowest": c.card,
    "--surface-container-low": `color-mix(in oklch, ${c.card} 94%, ${c.foreground})`,
    "--surface-container-high": `color-mix(in oklch, ${c.card} 88%, ${c.foreground})`,
  } as CSSProperties

  return (
    <div
      style={vars}
      aria-hidden
      className="overflow-hidden rounded-lg border border-outline-variant/70 bg-background text-foreground"
    >
      {/* Titlebar */}
      <div className="flex items-center justify-between gap-2 border-b border-outline-variant/70 px-2 py-1.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="grid size-4 shrink-0 place-items-center rounded-[5px] bg-primary text-[8px] font-black text-primary-foreground">
            T
          </span>
          <span className="truncate text-[10px] leading-none font-extrabold tracking-tight">
            TypeFlowing
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <span className="inline-flex items-center gap-0.5 rounded-full border border-outline-variant/60 bg-surface-container-low px-1.5 py-px text-[7.5px] font-semibold">
            <Flame className="size-2 text-primary" aria-hidden /> 7
          </span>
          <span className="size-3 rounded-[4px] border border-outline-variant/60 bg-surface-container-low" />
        </div>
      </div>

      {/* Config bar — một card chứa các nhóm như trang chính */}
      <div className="flex flex-wrap items-center justify-center gap-1 px-2 py-1.5">
        <div className="flex w-full flex-wrap items-center justify-center gap-1 rounded-md border border-outline-variant/70 bg-surface-container-low p-0.5">
          <div className="flex items-center gap-0.5 rounded border border-outline-variant/60 bg-surface-container-lowest px-0.5 py-px">
            <span className="rounded-sm bg-primary px-1.5 py-0.5 text-[7.5px] font-semibold text-primary-foreground">
              English
            </span>
            <span className="px-1.5 py-0.5 text-[7.5px] font-medium text-muted-foreground">
              Tiếng Việt
            </span>
          </div>
          <div className="flex items-center gap-0.5 rounded border border-outline-variant/60 bg-surface-container-lowest px-0.5 py-px">
            <span className="px-1 py-0.5 text-[7.5px] text-muted-foreground">Từ</span>
            <span className="rounded-sm bg-primary px-1.5 py-0.5 text-[7.5px] font-semibold text-primary-foreground">
              25
            </span>
            <span className="px-1.5 py-0.5 text-[7.5px] text-muted-foreground">50</span>
          </div>
          <div className="flex items-center gap-0.5 rounded border border-outline-variant/60 bg-surface-container-lowest px-0.5 py-px">
            <span className="px-1.5 py-0.5 text-[7.5px] font-medium text-muted-foreground">Vừa</span>
          </div>
        </div>
      </div>

      {/* Typing arena */}
      <div className="mx-2 rounded-md border-2 border-primary/60 bg-card px-2.5 py-2 font-mono text-[11px] leading-relaxed ring-2 ring-primary/10">
        <span className="font-semibold text-primary">hôm</span>{" "}
        <span className="font-semibold text-primary">nay</span>{" "}
        <span className="rounded-sm bg-destructive/15 px-0.5 text-destructive">ta</span>{" "}
        <span className="relative inline-block text-foreground">
          luyện
          <span className="absolute top-0 bottom-0 -left-px w-0.5 rounded-full bg-primary" />
        </span>{" "}
        <span className="text-muted-foreground/60">gõ mỗi ngày</span>
      </div>

      {/* HUD */}
      <div className="grid grid-cols-4 gap-1 px-2 py-1.5">
        {[
          { label: "WPM", value: "65", accent: true },
          { label: "Chính xác", value: "98%", accent: false },
          { label: "Tiến độ", value: "3/25", accent: false },
          { label: "Ổn định", value: "87%", accent: false },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded border border-outline-variant/60 bg-surface-container-lowest px-1 py-0.5"
          >
            <p className="truncate text-[6.5px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
              {stat.label}
            </p>
            <p
              className={cn(
                "text-[10.5px] font-bold tabular-nums",
                stat.accent && "text-primary"
              )}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between border-t border-outline-variant/60 px-2 py-1 text-[7.5px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <span className="size-1 rounded-full bg-primary" aria-hidden />
          Lưu cục bộ
        </span>
        <span className="inline-flex items-center gap-1">
          <kbd className="rounded border border-outline-variant/70 bg-muted/70 px-1 font-mono text-[7px]">
            Esc
          </kbd>
          Thử lại
        </span>
      </div>
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
  const dark = isDarkTheme(theme)
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "group flex w-full flex-col gap-2.5 rounded-lg border p-3 text-left transition-[border-color,background-color,box-shadow] duration-150",
        "focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
        selected
          ? "border-2 border-primary bg-primary/[0.06] shadow-xs"
          : "border-outline-variant/60 bg-surface-container-lowest hover:border-primary/40 hover:bg-surface-container-low"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold">{theme.name}</p>
          <p className="mt-0.5 line-clamp-1 text-[10.5px] text-muted-foreground">
            {THEME_HINTS[theme.id] ?? theme.description}
          </p>
        </div>
        {selected ? (
          <Check className="size-3.5 shrink-0 text-primary" aria-hidden />
        ) : dark ? (
          <Moon className="size-3.5 shrink-0 text-muted-foreground/60" aria-hidden />
        ) : (
          <Sun className="size-3.5 shrink-0 text-muted-foreground/60" aria-hidden />
        )}
      </div>

      <div className="flex items-center gap-1">
        {[theme.colors.background, theme.colors.primary, theme.colors.accent].map(
          (color, index) => (
            <span
              key={`${theme.id}-dot-${index}`}
              className="size-3.5 rounded-full border border-black/10"
              style={{ backgroundColor: color }}
            />
          )
        )}
      </div>
    </button>
  )
}
