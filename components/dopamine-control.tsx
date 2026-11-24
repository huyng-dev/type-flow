"use client";

import { useEffect, useState } from "react";
import { Check, Sparkles, Volume2, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { DopamineMode } from "@/lib/dopamine";
import { cn } from "@/lib/utils";

const MODES: {
  id: DopamineMode;
  name: string;
  description: string;
}[] = [
  {
    id: "off",
    name: "Tắt",
    description: "Chỉ giữ phản hồi gõ cơ bản. Không hạt sáng, không âm thưởng, không confetti.",
  },
  {
    id: "balanced",
    name: "Cân bằng",
    description: "Hạt sáng nhẹ khi xong từ, âm ở mốc combo, chúc mừng vừa phải. Phù hợp luyện hằng ngày.",
  },
  {
    id: "dpm",
    name: "DPM tối đa",
    description: "Viền flow, nhiều hạt hơn, confetti kết quả và đầy đủ âm thưởng. Dành cho lúc muốn bùng nổ.",
  },
];

const MODE_LABEL: Record<DopamineMode, string> = {
  off: "Tắt",
  balanced: "Cân bằng",
  dpm: "Tối đa",
};

interface DopamineControlProps {
  mode: DopamineMode;
  onModeChange: (mode: DopamineMode) => void;
  effectsVolume: number;
  onEffectsVolumeChange: (volume: number) => void;
  haptics: boolean;
  onHapticsChange: (enabled: boolean) => void;
  wellbeingNudges: boolean;
  onWellbeingNudgesChange: (enabled: boolean) => void;
  reducedMotion: boolean;
  level: number;
  onReset: () => void;
}

export function DopamineControl({
  mode,
  onModeChange,
  effectsVolume,
  onEffectsVolumeChange,
  haptics,
  onHapticsChange,
  wellbeingNudges,
  onWellbeingNudgesChange,
  reducedMotion,
  level,
  onReset,
}: DopamineControlProps) {
  const [open, setOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (!open) setConfirmReset(false);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label={`DPM Mode: ${MODE_LABEL[mode]}. Mở cài đặt phản hồi thưởng.`}
          className={cn(
            "h-9 gap-1.5 px-2.5 text-xs font-medium",
            mode !== "off"
              ? "border-primary/35 bg-primary/5 text-primary hover:border-primary/50 hover:bg-primary/12 hover:text-primary"
              : "hover:bg-muted/60 hover:text-foreground"
          )}
        >
          <Zap className={cn("size-4", mode === "off" ? "text-muted-foreground" : "text-primary")} aria-hidden />
          <span className="hidden md:inline">DPM</span>
          <span className="hidden text-[10px] font-bold tracking-wide text-muted-foreground uppercase lg:inline">
            {MODE_LABEL[mode]}
          </span>
          <span className="hidden rounded bg-primary/10 px-1 py-0.5 text-[10px] font-bold text-primary tabular-nums sm:inline">
            Lv {level}
          </span>
        </Button>
      </DialogTrigger>

      <DialogContent size="md">
        <DialogHeader
          icon={Sparkles}
          title="DPM Mode"
          description="Tăng phản hồi thưởng khi luyện gõ. Chỉ đổi cảm giác, không đổi điểm số hay xếp hạng."
        />

        <DialogBody>
          <div className="space-y-5">
            <section aria-labelledby="dpm-mode-label">
              <h3 id="dpm-mode-label" className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.08em]">
                Mức phản hồi
              </h3>
              <div className="mt-2 space-y-2">
                {MODES.map((option) => {
                  const active = mode === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => onModeChange(option.id)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-[translate,scale,background-color,border-color,box-shadow] duration-150 ease-[cubic-bezier(0.2,0.9,0.4,1)] active:duration-75 motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        active
                          ? "border-primary/45 bg-primary/8 ring-1 ring-primary/25"
                          : "border-border/70 bg-background/40 hover:border-border"
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border",
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background"
                        )}
                      >
                        {active ? <Check className="size-3" aria-hidden /> : null}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs font-semibold">{option.name}</span>
                        <span className="mt-0.5 block text-[11px] leading-relaxed text-muted-foreground">
                          {option.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="dpm-volume" className="flex items-center gap-1.5 text-xs font-semibold">
                  <Volume2 className="size-3.5 text-primary" aria-hidden />
                  Âm lượng hiệu ứng
                </label>
                <span className="text-[11px] font-semibold text-muted-foreground tabular-nums">
                  {Math.round(effectsVolume * 100)}%
                </span>
              </div>
              <input
                id="dpm-volume"
                type="range"
                min={0}
                max={100}
                step={5}
                value={Math.round(effectsVolume * 100)}
                onChange={(event) => onEffectsVolumeChange(Number(event.target.value) / 100)}
                className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
              />
              <p className="mt-1 text-[10.5px] text-muted-foreground">
                Tách khỏi âm thanh phím. Tắt âm phím cũng tắt hiệu ứng thưởng.
              </p>
            </section>

            <section className="space-y-2">
              <ToggleRow
                label="Rung nhẹ trên thiết bị di động"
                description="Phản hồi xúc giác ở mốc combo và từ hoàn hảo."
                checked={haptics}
                onChange={onHapticsChange}
              />
              <ToggleRow
                label="Nhắc nghỉ sau 25 phút"
                description="Một lời nhắc mỗi ngày, không chặn phiên đang gõ."
                checked={wellbeingNudges}
                onChange={onWellbeingNudgesChange}
              />
            </section>

            {reducedMotion ? (
              <p className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-[10.5px] leading-relaxed text-warning">
                Hệ điều hành đang bật “giảm chuyển động”, nên phần hình ảnh của DPM đã được
                giới hạn. Âm thanh và số liệu vẫn hoạt động bình thường.
              </p>
            ) : null}

            <section className="rounded-xl border border-border/70 bg-background/40 p-3">
              <p className="text-xs font-semibold">Đặt lại tiến trình động lực</p>
              <p className="mt-0.5 text-[10.5px] leading-relaxed text-muted-foreground">
                Xoá XP, cấp, nhiệm vụ ngày và kỷ lục combo. Không ảnh hưởng điểm số hay lịch sử phiên.
              </p>
              <Button
                variant={confirmReset ? "destructive" : "outline"}
                size="sm"
                className="mt-2"
                onClick={() => {
                  if (!confirmReset) {
                    setConfirmReset(true);
                    return;
                  }
                  onReset();
                  setConfirmReset(false);
                }}
              >
                {confirmReset ? "Chắc chắn đặt lại?" : "Đặt lại"}
              </Button>
            </section>
          </div>
        </DialogBody>

        <DialogFooter>
          <p className="mr-auto text-[10.5px] text-muted-foreground">
            DPM không thay đổi điểm số, chỉ thay đổi cách bạn cảm nhận phiên gõ.
          </p>
          <Button size="sm" onClick={() => setOpen(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-border/70 bg-background/40 p-3">
      <div className="min-w-0">
        <p className="text-xs font-semibold">{label}</p>
        <p className="mt-0.5 text-[10.5px] leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "group relative mt-0.5 h-5 w-9 shrink-0 rounded-full border transition-[background-color,border-color,box-shadow] duration-150 active:duration-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          checked ? "border-primary bg-primary" : "border-border bg-muted"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-3.5 origin-left rounded-full bg-background shadow-sm transition-[transform,scale] duration-150 ease-[cubic-bezier(0.2,0.9,0.4,1)] motion-safe:group-active:scale-x-110",
            checked && "translate-x-4"
          )}
        />
      </button>
    </div>
  );
}
