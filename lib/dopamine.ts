"use client";

/**
 * DPM (Dopamine Mode) — lớp phản hồi thưởng.
 *
 * Nguyên tắc:
 * - Chỉ đổi *cách phản hồi*, không bao giờ đổi gameplay hay điểm số.
 * - Mọi hiệu ứng hình ảnh đi qua một store riêng để không re-render vùng gõ.
 * - `prefers-reduced-motion` thắng mọi cài đặt: không phát hiệu ứng hình ảnh.
 * - Hiệu ứng "lớn" bị giới hạn tần suất để không biến thành tiếng ồn thị giác.
 */

export type DopamineMode = "off" | "balanced" | "dpm";

export const COMBO_TIERS = [10, 25, 50, 100] as const;
export type ComboTier = (typeof COMBO_TIERS)[number];

/** Hệ số hiển thị theo bậc combo. Không dùng để nhân điểm. */
export const COMBO_MULTIPLIERS = [1, 1.25, 1.5, 2, 2.5] as const;

export function comboTier(combo: number): 0 | 1 | 2 | 3 | 4 {
  if (combo >= 100) return 4;
  if (combo >= 50) return 3;
  if (combo >= 25) return 2;
  if (combo >= 10) return 1;
  return 0;
}

export function comboMultiplier(combo: number): number {
  return COMBO_MULTIPLIERS[comboTier(combo)];
}

/** Mốc combo kế tiếp, hoặc `null` nếu đã chạm mốc cao nhất. */
export function nextComboMilestone(combo: number): ComboTier | null {
  return COMBO_TIERS.find((tier) => combo < tier) ?? null;
}

export type RewardTone = "common" | "rare" | "epic";

/** Roll phần thưởng biến thiên khi hoàn thành một từ. */
export function rollWordReward(): RewardTone | null {
  const roll = Math.random();
  if (roll < 0.02) return "epic";
  if (roll < 0.1) return "rare";
  if (roll < 0.35) return "common";
  return null;
}

/**
 * Chọn vị trí "từ vàng" cho một danh sách từ.
 * Từ đầu tiên bị loại để người chơi kịp làm quen nhịp gõ.
 */
export function buildGoldenFlags(count: number): boolean[] {
  const flags = new Array<boolean>(count).fill(false);
  if (count < 8) return flags;

  const picks = Math.max(1, Math.round(count / 22));
  let guard = 0;
  while (flags.filter(Boolean).length < picks && guard < picks * 12) {
    guard += 1;
    const index = 1 + Math.floor(Math.random() * Math.max(1, count - 1));
    flags[index] = true;
  }
  return flags;
}

export type EffectTone = RewardTone | "legendary" | "primary" | "info";

export type FeedbackEvent =
  | { kind: "word"; golden: boolean; drop: RewardTone | null }
  | { kind: "combo"; tier: Exclude<0 | 1 | 2 | 3 | 4, 0>; combo: number; multiplier: number }
  | { kind: "record-near"; delta: number }
  | { kind: "record-beat"; delta: number }
  | { kind: "quest"; label: string; xp: number }
  | { kind: "level-up"; level: number; title: string }
  | {
      kind: "achievement";
      name: string;
      rarity: "common" | "rare" | "epic" | "legendary";
      points: number;
    }
  | { kind: "finish" };

export type EffectIcon =
  | "zap"
  | "target"
  | "trophy"
  | "sparkles"
  | "star"
  | "check";

export interface FeedbackEffect {
  id: number;
  kind: EffectKind;
  tone: EffectTone;
  icon: EffectIcon;
  title?: string;
  detail?: string;
  particles?: number;
  leaving?: boolean;
  createdAt: number;
}

type BannerKind = "combo" | "record-near" | "record-beat" | "quest" | "level-up" | "golden" | "achievement";
export type EffectKind = FeedbackEvent["kind"] | "golden";

const LIFETIME: Record<EffectKind, number> = {
  word: 720,
  finish: 1400,
  golden: 2200,
  combo: 1800,
  "record-near": 2800,
  "record-beat": 2800,
  quest: 2800,
  "level-up": 2200,
  achievement: 2600,
};

const BANNER_MIN_GAP = 1000;
const MAX_BANNERS = 3;

class FeedbackEngine {
  private effects: FeedbackEffect[] = [];
  private snapshot: readonly FeedbackEffect[] = [];
  private listeners = new Set<() => void>();
  private timers = new Set<ReturnType<typeof setTimeout>>();
  private seq = 0;
  private lastBannerAt = 0;
  private mode: DopamineMode = "balanced";
  private reduced = false;

  configure(next: { mode?: DopamineMode; reduced?: boolean }) {
    if (next.mode !== undefined) this.mode = next.mode;
    if (next.reduced !== undefined) this.reduced = next.reduced;
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): readonly FeedbackEffect[] => this.snapshot;

  emit(event: FeedbackEvent) {
    // Tắt hoàn toàn: không sinh hiệu ứng nào.
    if (this.mode === "off") return;
    // Người dùng giảm chuyển động: bỏ toàn bộ hiệu ứng hình ảnh.
    if (this.reduced) return;

    switch (event.kind) {
      case "word": {
        this.pushBurst(event.golden ? "legendary" : event.drop === "epic" ? "epic" : event.drop === "rare" ? "rare" : "common");
        if (event.golden) {
          this.pushBanner("golden", {
            tone: "legendary",
            icon: "sparkles",
            title: "Từ vàng",
            detail: "+20 XP khi hoàn thành phiên",
          });
        }
        return;
      }
      case "combo": {
        this.pushBanner("combo", {
          tone: event.tier >= 3 ? "legendary" : "primary",
          icon: "zap",
          title: `Combo ${event.combo}`,
          detail: `Hệ số ×${event.multiplier.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")} · Chuỗi ${event.combo} ký tự`,
        }, event.tier >= 2);
        return;
      }
      case "record-near": {
        this.pushBanner("record-near", {
          tone: "info",
          icon: "target",
          title: "Sắp phá kỷ lục",
          detail: `Còn ${Math.max(1, Math.round(event.delta))} WPM nữa`,
        });
        return;
      }
      case "record-beat": {
        this.pushBanner("record-beat", {
          tone: "legendary",
          icon: "trophy",
          title: "Vượt kỷ lục!",
          detail: `+${Math.max(1, Math.round(event.delta))} WPM so với tốt nhất`,
        });
        return;
      }
      case "quest": {
        this.pushBanner("quest", {
          tone: "epic",
          icon: "check",
          title: "Nhiệm vụ hoàn thành",
          detail: `${event.label} · +${event.xp} XP`,
        });
        return;
      }
      case "level-up": {
        // Lên cấp luôn được hiển thị, không bị throttle.
        this.addEffect({
          kind: "level-up",
          tone: "legendary",
          icon: "star",
          title: `Lên cấp ${event.level}`,
          detail: event.title,
        });
        return;
      }
      case "achievement": {
        // Huy hiệu là cột mốc sưu tầm: luôn hiển thị, kể cả khi vừa có banner khác.
        this.pushBanner(
          "achievement",
          {
            tone: event.rarity,
            icon: "trophy",
            title: "Huy hiệu mới",
            detail: `${event.name} · +${event.points} điểm`,
          },
          true
        );
        return;
      }
      case "finish": {
        this.addEffect({ kind: "finish", tone: "primary", icon: "trophy" });
        return;
      }
    }
  }

  clear() {
    for (const timer of this.timers) clearTimeout(timer);
    this.timers.clear();
    if (this.effects.length === 0) return;
    this.effects = [];
    this.commit();
  }

  private pushBurst(tone: EffectTone) {
    this.addEffect({
      kind: "word",
      tone,
      icon: "sparkles",
      particles: this.mode === "dpm" ? 6 : 3,
    });
  }

  private pushBanner(
    _kind: BannerKind,
    data: Omit<FeedbackEffect, "id" | "kind" | "createdAt">,
    force = false
  ) {
    const now = Date.now();
    if (!force && now - this.lastBannerAt < BANNER_MIN_GAP) return;
    this.lastBannerAt = now;

    const banners = this.effects.filter((effect) => effect.title);
    if (banners.length >= MAX_BANNERS) {
      this.remove(banners[0].id);
    }

    this.addEffect({ kind: _kind, ...data });
  }

  private addEffect(data: Omit<FeedbackEffect, "id" | "createdAt">) {
    const effect: FeedbackEffect = { ...data, id: ++this.seq, createdAt: Date.now() };
    this.effects = [...this.effects, effect];
    this.commit();

    const lifetime = LIFETIME[effect.kind] ?? 1600;
    const leaveAt = Math.max(120, lifetime - 180);
    this.schedule(() => this.markLeaving(effect.id), leaveAt);
    this.schedule(() => this.remove(effect.id), lifetime);
  }

  private schedule(fn: () => void, delay: number) {
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      fn();
    }, delay);
    this.timers.add(timer);
  }

  private markLeaving(id: number) {
    this.effects = this.effects.map((effect) =>
      effect.id === id ? { ...effect, leaving: true } : effect
    );
    this.commit();
  }

  private remove(id: number) {
    if (!this.effects.some((effect) => effect.id === id)) return;
    this.effects = this.effects.filter((effect) => effect.id !== id);
    this.commit();
  }

  private commit() {
    this.snapshot = this.effects;
    for (const listener of this.listeners) listener();
  }
}

export const feedbackEngine = new FeedbackEngine();
