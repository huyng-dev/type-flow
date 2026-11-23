"use client";

import { StatisticsManager } from "@/lib/statistics";

/**
 * Tiến trình động lực (XP, cấp, nhiệm vụ ngày, kỷ lục combo).
 *
 * Tách hoàn toàn khỏi `scoring-system` để dữ liệu điểm cũ không bị đổi schema.
 * Khoá lưu trữ có version riêng; dữ liệu hỏng sẽ rơi về mặc định.
 */

export const LEVEL_TITLES = [
  "Người mới",
  "Tay gõ",
  "Ổn định",
  "Nhanh nhạy",
  "Bậc thầy",
  "Huyền thoại",
] as const;

export interface QuestItem {
  id: string;
  templateId: string;
  label: string;
  target: number;
  progress: number;
  reward: number;
  claimed: boolean;
}

export interface EngagementSnapshot {
  xp: number;
  level: number;
  levelTitle: string;
  xpIntoLevel: number;
  xpForNext: number;
  levelProgress: number;
  bestCombo: number;
  goldenWords: number;
  quests: QuestItem[];
  questsReady: number;
  todayMinutes: number;
  shouldNudgeBreak: boolean;
}

interface StoredQuest {
  id: string;
  templateId: string;
  label: string;
  target: number;
  reward: number;
  claimed: boolean;
}

interface EngagementState {
  version: 1;
  xp: number;
  bestCombo: number;
  bestComboDate: string;
  goldenWords: number;
  claims: number;
  questsDate: string;
  quests: StoredQuest[];
  nudgeDate: string;
}

const STORAGE_KEY = "typeflow-engagement-v1";

const DEFAULT_STATE: EngagementState = {
  version: 1,
  xp: 0,
  bestCombo: 0,
  bestComboDate: "",
  goldenWords: 0,
  claims: 0,
  questsDate: "",
  quests: [],
  nudgeDate: "",
};

type QuestMetric = "sessions" | "words" | "bestWpm" | "bestAccuracy" | "bestCombo";

interface QuestTemplate {
  id: string;
  metric: QuestMetric;
  targets: number[];
  reward: number;
  label: (target: number) => string;
}

const QUEST_TEMPLATES: QuestTemplate[] = [
  {
    id: "sessions",
    metric: "sessions",
    targets: [3, 4, 5],
    reward: 60,
    label: (target) => `Hoàn thành ${target} phiên gõ`,
  },
  {
    id: "wpm",
    metric: "bestWpm",
    targets: [40, 55, 70],
    reward: 90,
    label: (target) => `Đạt ${target} WPM trong một phiên`,
  },
  {
    id: "accuracy",
    metric: "bestAccuracy",
    targets: [95, 97, 99],
    reward: 80,
    label: (target) => `Đạt ${target}% chính xác`,
  },
  {
    id: "combo",
    metric: "bestCombo",
    targets: [25, 40, 60],
    reward: 100,
    label: (target) => `Giữ combo ${target} ký tự`,
  },
  {
    id: "words",
    metric: "words",
    targets: [120, 200, 320],
    reward: 70,
    label: (target) => `Gõ ${target} từ hôm nay`,
  },
];

function toDateKey(timestamp = Date.now()): string {
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** PRNG nhỏ, ổn định theo ngày: cùng ngày → cùng nhiệm vụ. */
function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Mốc XP bắt đầu của một cấp: 0, 100, 300, 600, 1000, 1500… */
function levelStart(level: number): number {
  return (100 * (level - 1) * level) / 2;
}

function levelFromXp(xp: number): number {
  let level = 1;
  while (xp >= levelStart(level + 1) && level < 99) level += 1;
  return level;
}

function levelTitle(level: number): string {
  return LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];
}

function sessionXpForScore(score: number): number {
  return Math.max(15, Math.min(150, Math.round(score / 20)));
}

function readState(): EngagementState {
  if (typeof window === "undefined") return { ...DEFAULT_STATE };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw) as Partial<EngagementState>;
    return {
      ...DEFAULT_STATE,
      ...parsed,
      quests: Array.isArray(parsed.quests) ? parsed.quests : [],
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function writeState(state: EngagementState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Hết quota hoặc chế độ riêng tư: bỏ qua, tiến trình chỉ sống trong phiên.
  }
}

function todaySessions() {
  const key = toDateKey();
  return StatisticsManager.getAllSessions().filter((session) => toDateKey(session.timestamp) === key);
}

function buildQuests(dateKey: string): StoredQuest[] {
  const random = seededRandom(hashString(dateKey));
  const pool = [...QUEST_TEMPLATES];

  const picked: QuestTemplate[] = [];
  while (picked.length < 3 && pool.length > 0) {
    const index = Math.floor(random() * pool.length);
    picked.push(pool.splice(index, 1)[0]);
  }

  return picked.map((template) => {
    const target = template.targets[Math.floor(random() * template.targets.length)];
    return {
      id: `${dateKey}-${template.id}`,
      templateId: template.id,
      label: template.label(target),
      target,
      reward: template.reward,
      claimed: false,
    };
  });
}

function ensureTodayQuests(state: EngagementState): EngagementState {
  const today = toDateKey();
  if (state.questsDate === today && state.quests.length === 3) return state;
  const next: EngagementState = {
    ...state,
    questsDate: today,
    quests: buildQuests(today),
  };
  writeState(next);
  return next;
}

function questProgress(metric: QuestMetric, state: EngagementState, sessions: ReturnType<typeof todaySessions>): number {
  switch (metric) {
    case "sessions":
      return sessions.length;
    case "words":
      return sessions.reduce((sum, session) => sum + (session.totalWords || 0), 0);
    case "bestWpm":
      return sessions.reduce((best, session) => Math.max(best, session.wpm || 0), 0);
    case "bestAccuracy":
      return sessions.reduce((best, session) => Math.max(best, session.accuracy || 0), 0);
    case "bestCombo":
      return state.bestComboDate === toDateKey() ? state.bestCombo : 0;
    default:
      return 0;
  }
}

export class EngagementManager {
  static getSnapshot(): EngagementSnapshot {
    const state = ensureTodayQuests(readState());
    const sessions = todaySessions();
    const level = levelFromXp(state.xp);
    const start = levelStart(level);
    const next = levelStart(level + 1);
    const todayMinutes = Math.round(
      sessions.reduce((sum, session) => sum + (session.timeElapsed || 0), 0) / 60
    );

    const quests: QuestItem[] = state.quests.map((quest) => {
      const template = QUEST_TEMPLATES.find((item) => item.id === quest.templateId);
      const progress = template ? questProgress(template.metric, state, sessions) : 0;
      return {
        id: quest.id,
        templateId: quest.templateId,
        label: quest.label,
        target: quest.target,
        progress: Math.min(progress, quest.target),
        reward: quest.reward,
        claimed: quest.claimed,
      };
    });

    return {
      xp: state.xp,
      level,
      levelTitle: levelTitle(level),
      xpIntoLevel: state.xp - start,
      xpForNext: Math.max(1, next - start),
      levelProgress: Math.min(1, Math.max(0, (state.xp - start) / Math.max(1, next - start))),
      bestCombo: state.bestCombo,
      goldenWords: state.goldenWords,
      quests,
      questsReady: quests.filter((quest) => !quest.claimed && quest.progress >= quest.target).length,
      todayMinutes,
      shouldNudgeBreak: todayMinutes >= 25 && state.nudgeDate !== toDateKey(),
    };
  }

  static getLevel(): number {
    return levelFromXp(readState().xp);
  }

  static recordBestCombo(combo: number): void {
    if (combo <= 0) return;
    const state = readState();
    if (combo <= state.bestCombo) return;
    writeState({ ...state, bestCombo: combo, bestComboDate: toDateKey() });
  }

  static recordGoldenWord(): void {
    const state = readState();
    writeState({ ...state, goldenWords: state.goldenWords + 1 });
  }

  static recordSession(input: {
    score: number;
    bestCombo: number;
    bonusXp?: number;
  }): {
    sessionXp: number;
    levelUp: boolean;
    level: number;
    levelTitle: string;
    levelProgress: number;
    snapshot: EngagementSnapshot;
  } {
    const state = ensureTodayQuests(readState());
    const levelBefore = levelFromXp(state.xp);
    const sessionXp = sessionXpForScore(input.score) + Math.max(0, Math.round(input.bonusXp ?? 0));

    const next: EngagementState = {
      ...state,
      xp: state.xp + sessionXp,
      bestCombo: Math.max(state.bestCombo, input.bestCombo),
      bestComboDate:
        input.bestCombo > state.bestCombo ? toDateKey() : state.bestComboDate,
    };

    writeState(next);
    const snapshot = this.getSnapshot();
    return {
      sessionXp,
      levelUp: snapshot.level > levelBefore,
      level: snapshot.level,
      levelTitle: snapshot.levelTitle,
      levelProgress: snapshot.levelProgress,
      snapshot,
    };
  }

  static claimQuest(id: string): {
    reward: number;
    label: string;
    levelUp: boolean;
    level: number;
    levelTitle: string;
    snapshot: EngagementSnapshot;
  } | null {
    const state = ensureTodayQuests(readState());
    const sessions = todaySessions();
    const quest = state.quests.find((item) => item.id === id);
    if (!quest || quest.claimed) return null;

    const template = QUEST_TEMPLATES.find((item) => item.id === quest.templateId);
    const progress = template ? questProgress(template.metric, state, sessions) : 0;
    if (progress < quest.target) return null;

    const levelBefore = levelFromXp(state.xp);
    const next: EngagementState = {
      ...state,
      xp: state.xp + quest.reward,
      claims: state.claims + 1,
      quests: state.quests.map((item) =>
        item.id === id ? { ...item, claimed: true } : item
      ),
    };
    writeState(next);
    const snapshot = this.getSnapshot();

    return {
      reward: quest.reward,
      label: quest.label,
      levelUp: snapshot.level > levelBefore,
      level: snapshot.level,
      levelTitle: snapshot.levelTitle,
      snapshot,
    };
  }

  static markNudgeShown(): void {
    const state = readState();
    writeState({ ...state, nudgeDate: toDateKey() });
  }

  static getTodayTypedMinutes(): number {
    return this.getSnapshot().todayMinutes;
  }

  static reset(): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}

export { levelFromXp };
