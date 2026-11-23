"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  LogoConcept1,
  LogoConcept2,
  LogoConcept1Isometric,
  LogoConcept1Topdown,
  type LogoConcept,
} from "@/components/logo"
import { Check, Sparkles, Layers, Sliders, Wand2 } from "lucide-react"

interface LogoPreviewDialogProps {
  currentConcept: LogoConcept
  onSelectConcept: (concept: LogoConcept) => void
  trigger?: React.ReactNode
}

type BackgroundPreview = "theme" | "light" | "dark" | "forest" | "terminal"

export function LogoPreviewDialog({
  currentConcept,
  onSelectConcept,
  trigger,
}: LogoPreviewDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [bgPreview, setBgPreview] = React.useState<BackgroundPreview>("theme")

  const bgStyles: Record<BackgroundPreview, { label: string; containerClass: string; cardClass: string }> = {
    theme: {
      label: "Theme hiện tại",
      containerClass: "bg-muted/40 text-foreground",
      cardClass: "bg-background border-border text-foreground",
    },
    light: {
      label: "Trắng tối giản (Light)",
      containerClass: "bg-zinc-100 text-zinc-900",
      cardClass: "bg-white border-zinc-200 text-zinc-900 shadow-sm",
    },
    dark: {
      label: "Đen tuyền (Dark OLED)",
      containerClass: "bg-zinc-950 text-zinc-100",
      cardClass: "bg-zinc-900/90 border-zinc-800 text-zinc-100 shadow-sm",
    },
    forest: {
      label: "Xanh rừng (Forest)",
      containerClass: "bg-[#0b1d14] text-[#d1fae5]",
      cardClass: "bg-[#132e20] border-[#1e4632] text-[#ecfdf5] shadow-sm",
    },
    terminal: {
      label: "Retro Terminal",
      containerClass: "bg-[#101912] text-[#4ade80]",
      cardClass: "bg-[#18261b] border-[#223927] text-[#86efac] shadow-sm",
    },
  }

  const currentBg = bgStyles[bgPreview]

  const isSelected = (c: LogoConcept) => {
    if (c === "1-isometric" && (currentConcept === "1-isometric" || currentConcept === 1)) return true
    if (c === "1-topdown" && currentConcept === "1-topdown") return true
    if (c === "1-geometric" && currentConcept === "1-geometric") return true
    if (c === "2" && (currentConcept === "2" || currentConcept === 2)) return true
    return currentConcept === c
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 rounded-lg border-border/70 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <Sparkles className="size-3.5 text-primary" />
            <span>Xem thử Logo (AI SVG & Concept)</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-5xl p-6 sm:max-h-[92vh] overflow-y-auto">
        <DialogHeader className="space-y-1.5 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                Thiết kế Logo TypeFlow (AI Vector SVG & Concept)
              </DialogTitle>
              <Badge variant="outline" className="border-border text-xs font-medium">
                Neutral / Không Gradient
              </Badge>
            </div>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Các mẫu logo được tạo bởi AI Image Generator, xử lý xóa phông nền sạch sẽ và vector hóa thành mã SVG thuần (Bezier splines). Sử dụng màu trung tính <code>currentColor</code> để tự động biến đổi hoàn hảo trên mọi giao diện.
          </DialogDescription>
        </DialogHeader>

        {/* Nền mô phỏng kiểm tra độ tương thích theme */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/30 p-2.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Sliders className="size-3.5" />
            <span>Thử màu nền:</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {(Object.keys(bgStyles) as BackgroundPreview[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setBgPreview(key)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                  bgPreview === key
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-background/80 text-muted-foreground hover:bg-background hover:text-foreground border border-border/50"
                }`}
              >
                {bgStyles[key].label}
              </button>
            ))}
          </div>
        </div>

        {/* Lưới 4 Concept Logo */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 pt-2">
          {/* CONCEPT 1A: AI 2.5D Isometric (Đề xuất chính) */}
          <div
            className={`flex flex-col justify-between rounded-2xl border p-5 transition-all ${
              currentBg.cardClass
            } ${isSelected("1-isometric") ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
                      Concept 1A
                    </span>
                    <Badge className="bg-primary/15 text-primary border-primary/30 text-[10px] font-semibold gap-1">
                      <Wand2 className="size-2.5" />
                      AI Vector SVG
                    </Badge>
                    {isSelected("1-isometric") && (
                      <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-semibold">
                        Đang chọn
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-base font-bold tracking-tight">The Flowing Keycap (2.5D Isometric)</h3>
                </div>
              </div>

              {/* Showcase Preview */}
              <div
                className={`flex flex-col items-center justify-center gap-4 rounded-xl border border-border/40 p-6 ${currentBg.containerClass}`}
              >
                <div className="relative group">
                  <LogoConcept1Isometric size={84} />
                </div>

                <div className="inline-flex items-center gap-2.5">
                  <LogoConcept1Isometric size={28} />
                  <div className="flex flex-col">
                    <span className="text-[1.2rem] font-extrabold tracking-tight text-foreground leading-none">
                      Type<span className="text-foreground/70">Flow</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-2 border-t border-border/30 w-full justify-center text-[10px] text-muted-foreground font-mono">
                  <div className="flex flex-col items-center gap-1">
                    <LogoConcept1Isometric size={18} />
                    <span>18px</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <LogoConcept1Isometric size={24} />
                    <span>24px</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <LogoConcept1Isometric size={36} />
                    <span>36px</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <LogoConcept1Isometric size={48} />
                    <span>48px</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-muted-foreground leading-relaxed">
                <p>
                  <strong className="text-foreground">Đặc điểm:</strong> Tạo bằng AI từ mô hình prompt góc phối cảnh 2.5D, tách nền sạch và chuyển thành spline SVG. Các mặt phẳng vát cạnh cơ học tạo chiều sâu tự nhiên, chữ &apos;T&apos; uốn thành dòng chảy mượt mà.
                </p>
              </div>
            </div>

            <div className="pt-4">
              <Button
                type="button"
                className="w-full gap-2 font-medium"
                variant={isSelected("1-isometric") ? "default" : "outline"}
                onClick={() => onSelectConcept("1-isometric")}
              >
                {isSelected("1-isometric") ? (
                  <>
                    <Check className="size-4" />
                    Đã áp dụng Concept 1A
                  </>
                ) : (
                  "Áp dụng Concept 1A (AI Isometric)"
                )}
              </Button>
            </div>
          </div>

          {/* CONCEPT 1B: AI Flat Top-Down */}
          <div
            className={`flex flex-col justify-between rounded-2xl border p-5 transition-all ${
              currentBg.cardClass
            } ${isSelected("1-topdown") ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
                      Concept 1B
                    </span>
                    <Badge className="bg-primary/15 text-primary border-primary/30 text-[10px] font-semibold gap-1">
                      <Wand2 className="size-2.5" />
                      AI Vector SVG
                    </Badge>
                    {isSelected("1-topdown") && (
                      <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-semibold">
                        Đang chọn
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-base font-bold tracking-tight">The Flowing Keycap (Flat Top-Down)</h3>
                </div>
              </div>

              {/* Showcase Preview */}
              <div
                className={`flex flex-col items-center justify-center gap-4 rounded-xl border border-border/40 p-6 ${currentBg.containerClass}`}
              >
                <div className="relative group">
                  <LogoConcept1Topdown size={84} />
                </div>

                <div className="inline-flex items-center gap-2.5">
                  <LogoConcept1Topdown size={28} />
                  <div className="flex flex-col">
                    <span className="text-[1.2rem] font-extrabold tracking-tight text-foreground leading-none">
                      Type<span className="text-foreground/70">Flow</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-2 border-t border-border/30 w-full justify-center text-[10px] text-muted-foreground font-mono">
                  <div className="flex flex-col items-center gap-1">
                    <LogoConcept1Topdown size={18} />
                    <span>18px</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <LogoConcept1Topdown size={24} />
                    <span>24px</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <LogoConcept1Topdown size={36} />
                    <span>36px</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <LogoConcept1Topdown size={48} />
                    <span>48px</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-muted-foreground leading-relaxed">
                <p>
                  <strong className="text-foreground">Đặc điểm:</strong> Góc nhìn phẳng trực diện từ trên xuống (top-down), lòng phím bo tròn vát mép với nét ngang chữ &apos;T&apos; vươn dài lướt sóng qua viền phím. Tách nền và chuyển thành đường cong SVG sạch sẽ.
                </p>
              </div>
            </div>

            <div className="pt-4">
              <Button
                type="button"
                className="w-full gap-2 font-medium"
                variant={isSelected("1-topdown") ? "default" : "outline"}
                onClick={() => onSelectConcept("1-topdown")}
              >
                {isSelected("1-topdown") ? (
                  <>
                    <Check className="size-4" />
                    Đã áp dụng Concept 1B
                  </>
                ) : (
                  "Áp dụng Concept 1B (AI Top-Down)"
                )}
              </Button>
            </div>
          </div>

          {/* CONCEPT 1C: Precision Geometric Vector */}
          <div
            className={`flex flex-col justify-between rounded-2xl border p-5 transition-all ${
              currentBg.cardClass
            } ${isSelected("1-geometric") ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
                      Concept 1C
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      Line Art Vector
                    </Badge>
                    {isSelected("1-geometric") && (
                      <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-semibold">
                        Đang chọn
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-base font-bold tracking-tight">The Flowing Keycap (Precision Line Art)</h3>
                </div>
              </div>

              {/* Showcase Preview */}
              <div
                className={`flex flex-col items-center justify-center gap-4 rounded-xl border border-border/40 p-6 ${currentBg.containerClass}`}
              >
                <div className="relative group">
                  <LogoConcept1 size={84} />
                </div>

                <div className="inline-flex items-center gap-2.5">
                  <LogoConcept1 size={28} />
                  <div className="flex flex-col">
                    <span className="text-[1.2rem] font-extrabold tracking-tight text-foreground leading-none">
                      Type<span className="text-foreground/70">Flow</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-2 border-t border-border/30 w-full justify-center text-[10px] text-muted-foreground font-mono">
                  <div className="flex flex-col items-center gap-1">
                    <LogoConcept1 size={18} variant="minimal" />
                    <span>18px</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <LogoConcept1 size={24} />
                    <span>24px</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <LogoConcept1 size={36} />
                    <span>36px</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <LogoConcept1 size={48} />
                    <span>48px</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-muted-foreground leading-relaxed">
                <p>
                  <strong className="text-foreground">Đặc điểm:</strong> Bản vẽ hình học chuẩn từng pixel với vạch định vị tactile homing bar (phím F/J), lòng phím công thái học và nét lượn thủy động học.
                </p>
              </div>
            </div>

            <div className="pt-4">
              <Button
                type="button"
                className="w-full gap-2 font-medium"
                variant={isSelected("1-geometric") ? "default" : "outline"}
                onClick={() => onSelectConcept("1-geometric")}
              >
                {isSelected("1-geometric") ? (
                  <>
                    <Check className="size-4" />
                    Đã áp dụng Concept 1C
                  </>
                ) : (
                  "Áp dụng Concept 1C (Hình học)"
                )}
              </Button>
            </div>
          </div>

          {/* CONCEPT 2: Infinity Keystroke */}
          <div
            className={`flex flex-col justify-between rounded-2xl border p-5 transition-all ${
              currentBg.cardClass
            } ${isSelected("2") ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
                      Concept 2
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      Phím Đôi Vô Cực
                    </Badge>
                    {isSelected("2") && (
                      <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-semibold">
                        Đang chọn
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-base font-bold tracking-tight">Infinity Keystroke / Switch</h3>
                </div>
              </div>

              {/* Showcase Preview */}
              <div
                className={`flex flex-col items-center justify-center gap-4 rounded-xl border border-border/40 p-6 ${currentBg.containerClass}`}
              >
                <div className="relative group">
                  <LogoConcept2 size={84} />
                </div>

                <div className="inline-flex items-center gap-2.5">
                  <LogoConcept2 size={28} />
                  <div className="flex flex-col">
                    <span className="text-[1.2rem] font-extrabold tracking-tight text-foreground leading-none">
                      Type<span className="text-foreground/70">Flow</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-2 border-t border-border/30 w-full justify-center text-[10px] text-muted-foreground font-mono">
                  <div className="flex flex-col items-center gap-1">
                    <LogoConcept2 size={18} variant="minimal" />
                    <span>18px</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <LogoConcept2 size={24} />
                    <span>24px</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <LogoConcept2 size={36} />
                    <span>36px</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <LogoConcept2 size={48} />
                    <span>48px</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-muted-foreground leading-relaxed">
                <p>
                  <strong className="text-foreground">Đặc điểm:</strong> Hai phím kề cận mang trục switch cơ học (+) kết nối qua dải lụa vô cực (∞), tượng trưng cho nhịp gõ 2 tay liên hoàn và Flow State.
                </p>
              </div>
            </div>

            <div className="pt-4">
              <Button
                type="button"
                className="w-full gap-2 font-medium"
                variant={isSelected("2") ? "default" : "outline"}
                onClick={() => onSelectConcept("2")}
              >
                {isSelected("2") ? (
                  <>
                    <Check className="size-4" />
                    Đã áp dụng Concept 2
                  </>
                ) : (
                  "Áp dụng Concept 2 (Vô cực)"
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Chú thích kỹ thuật */}
        <div className="rounded-xl border border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground flex items-center gap-2.5">
          <Layers className="size-4 shrink-0 text-primary" />
          <span>
            Toàn bộ logo được đóng gói dưới dạng React SVG component thuần, sử dụng <code>currentColor</code> để màu logo tự động hòa nhập với bảng màu mọi theme mà không bị vỡ nét hay sai lệch màu sắc.
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
