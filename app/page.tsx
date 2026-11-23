"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ThemeSelector } from "@/components/theme-selector";
import { PracticeSidebar } from "@/components/practice-sidebar";
import { Dashboard } from "@/components/dashboard";
import type { DashboardTab } from "@/components/dashboard/data";
import { TestResult, type TestResultExtras } from "@/components/test-result";
import { StatTile } from "@/components/data-display";
import { SegmentedHighlight } from "@/components/ui/segmented";
import { ComboMeter } from "@/components/combo-meter";
import { DopamineControl } from "@/components/dopamine-control";
import { FeedbackLayer } from "@/components/feedback-layer";
import { getLogoIcon, type LogoConcept } from "@/components/logo";
import { LogoPreviewDialog } from "@/components/logo-preview-dialog";

import { PreferencesManager } from "@/lib/preferences";
import { adaptiveAlgorithm } from "@/lib/adaptive-algorithm";
import { languageManager, type ContentType, type DifficultyType, type LanguageType } from "@/lib/languages";
import {
  scoringSystem,
  type Achievement,
  type ScoreEntry,
  type StreakData,
} from "@/lib/scoring-system";
import { StatisticsManager, type GameSession } from "@/lib/statistics";
import { soundManager, type SwitchType } from "@/lib/audio";
import {
  buildGoldenFlags,
  comboMultiplier,
  comboTier,
  feedbackEngine,
  rollWordReward,
  type DopamineMode,
} from "@/lib/dopamine";
import { EngagementManager, type EngagementSnapshot } from "@/lib/engagement";
import { useReducedMotion } from "@/lib/motion";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Keyboard,
  RotateCcw,
  Volume2,
  VolumeX,
  Flame,
  Brain,
  BarChart3,
  Globe,
  Gauge,
  Clock,
  Sparkle,
  Type,
  Quote,
  PanelRight,
  PanelRightClose,
  Coffee,
} from "lucide-react";

type ModeType = "words" | "time" | "phrases";

interface GameStats {
  wpm: number;
  accuracy: number;
  correctChars: number;
  totalChars: number;
  timeElapsed: number;
  consistency: number;
}

export default function TypingGame() {
  // Giá trị khởi tạo phải trùng với bản render trên server (mặc định), sau đó
  // mới áp lựa chọn đã lưu trong useEffect — tránh lỗi hydration mismatch.
  const [language, setLanguage] = useState<LanguageType>("english");
  const [difficulty, setDifficulty] = useState<DifficultyType>("medium");
  const [mode, setMode] = useState<ModeType>("words");
  const [wordCount, setWordCount] = useState<number>(25);
  const [timeLimit, setTimeLimit] = useState<number>(30); // 15, 30, 60, 120
  const [soundSwitch, setSoundSwitch] = useState<SwitchType>("blue");
  const [avoidRepeats, setAvoidRepeats] = useState<boolean>(true);
  const [adaptiveMode, setAdaptiveMode] = useState<boolean>(true);

  // Độ khó thực tế do AI đề xuất khi bật adaptiveMode
  const aiDifficulty = adaptiveMode ? adaptiveAlgorithm.assessSkill().recommendedDifficulty : difficulty;

  // Active Game State
  const [words, setWords] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);
  const [userInput, setUserInput] = useState<string>("");
  const [wordStatuses, setWordStatuses] = useState<("correct" | "incorrect" | "pending")[]>([]);
  const [wordInputs, setWordInputs] = useState<string[]>([]); // What user actually typed per word
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [perfectWordsCount, setPerfectWordsCount] = useState<number>(0);
  const [errorCount, setErrorCount] = useState<number>(0);
  const [isFocused, setIsFocused] = useState<boolean>(false);

  // Realtime & Post-test stats
  // HUD được suy ra từ trạng thái hiện tại + nhịp tick, không còn phụ thuộc
  // vào một interval bị khởi tạo lại sau mỗi lần gõ phím (nguyên nhân HUD đứng yên).
  const [, setTick] = useState<number>(0);
  const [finalStats, setFinalStats] = useState<GameStats | null>(null);
  const [wpmTimeline, setWpmTimeline] = useState<number[]>([]);
  const [currentScore, setCurrentScore] = useState<ScoreEntry | null>(null);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
  const [adaptiveAlert, setAdaptiveAlert] = useState<string | null>(null);
  const [alertLeaving, setAlertLeaving] = useState<boolean>(false);

  // Dashboard
  const [dashboardOpen, setDashboardOpen] = useState<boolean>(false);
  const [dashboardTab, setDashboardTab] = useState<DashboardTab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  // DPM Mode — lớp phản hồi thưởng
  const [dopamineMode, setDopamineMode] = useState<DopamineMode>("balanced");
  const [effectsVolume, setEffectsVolume] = useState<number>(0.6);
  const [haptics, setHaptics] = useState<boolean>(false);
  const [wellbeingNudges, setWellbeingNudges] = useState<boolean>(true);
  const [dopaminePromptSeen, setDopaminePromptSeen] = useState<boolean>(true);
  const [combo, setCombo] = useState<number>(0);
  const [goldenFlags, setGoldenFlags] = useState<boolean[]>([]);
  const [engagement, setEngagement] = useState<EngagementSnapshot | null>(null);
  const [resultExtras, setResultExtras] = useState<TestResultExtras | null>(null);
  const [breakNudge, setBreakNudge] = useState<boolean>(false);
  const reducedMotion = useReducedMotion();

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const wordsContainerRef = useRef<HTMLDivElement>(null);
  const activeCharRef = useRef<HTMLSpanElement>(null);
  const activeWordRef = useRef<HTMLSpanElement>(null);
  const statsRef = useRef<GameStats | null>(null);
  const timeUpHandledRef = useRef<boolean>(false);
  const comboRef = useRef<number>(0);
  const bestComboRef = useRef<number>(0);
  const recordBaselineRef = useRef<number | null>(null);
  const recordNudgedRef = useRef<boolean>(false);
  const lastCountdownRef = useRef<number>(0);
  const sessionBonusXpRef = useRef<number>(0);
  const levelUpTimerRef = useRef<number | null>(null);
  const isComposingRef = useRef<boolean>(false);

  // Streak & lịch sử gần đây (chỉ đọc localStorage khi cần, không đọc mỗi lần gõ phím)
  const [streakInfo, setStreakInfo] = useState<StreakData | null>(null);
  const [recentSessions, setRecentSessions] = useState<GameSession[]>([]);
  const [logoConcept, setLogoConcept] = useState<LogoConcept>("1-isometric");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("typeflow-logo-concept");
      if (saved) setLogoConcept(saved as LogoConcept);
    }
  }, []);

  const handleSelectLogoConcept = useCallback((concept: LogoConcept) => {
    setLogoConcept(concept);
    if (typeof window !== "undefined") {
      localStorage.setItem("typeflow-logo-concept", String(concept));
    }
  }, []);

  const openDashboard = useCallback((tab: DashboardTab = "overview") => {
    setDashboardTab(tab);
    setDashboardOpen(true);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((open) => {
      PreferencesManager.savePreferences({ sidebarOpen: !open });
      return !open;
    });
  }, []);

  const refreshEngagement = useCallback(() => {
    setEngagement(EngagementManager.getSnapshot());
  }, []);

  /** Rung nhẹ trên mobile — chỉ khi DPM bật và người dùng đã đồng ý. */
  const vibrate = useCallback(
    (pattern: number | number[]) => {
      if (dopamineMode === "off" || !haptics) return;
      if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
      try {
        navigator.vibrate(pattern);
      } catch {
        // Thiết bị chặn rung: bỏ qua.
      }
    },
    [dopamineMode, haptics]
  );

  /**
   * Cập nhật combo và chỉ phát hiệu ứng khi vừa vượt một bậc mới.
   * Dùng ref để nhiều lần gõ trong cùng một frame vẫn nhất quán.
   */
  const commitCombo = useCallback(
    (next: number) => {
      const safe = Math.max(0, next);
      const previousTier = comboTier(comboRef.current);
      comboRef.current = safe;
      bestComboRef.current = Math.max(bestComboRef.current, safe);
      setCombo(safe);

      const nextTier = comboTier(safe);
      if (nextTier > previousTier && nextTier > 0) {
        const tier = nextTier as 1 | 2 | 3 | 4;
        feedbackEngine.emit({
          kind: "combo",
          tier,
          combo: safe,
          multiplier: comboMultiplier(safe),
        });
        if (dopamineMode !== "off") soundManager.playCombo(tier);
        vibrate(tier >= 3 ? [24, 40, 24, 40, 40] : [18, 30, 18]);
        EngagementManager.recordBestCombo(safe);
        if (tier >= 2) refreshEngagement();
      }
    },
    [dopamineMode, refreshEngagement, vibrate]
  );

  const handleDopamineModeChange = useCallback((mode: DopamineMode) => {
    setDopamineMode(mode);
    setDopaminePromptSeen(true);
    PreferencesManager.savePreferences({ dopamineMode: mode, dopaminePromptSeen: true });
    if (mode === "off") feedbackEngine.clear();
  }, []);

  const handleDopaminePromptAction = useCallback(
    (action: "dismiss" | DopamineMode) => {
      if (action === "dismiss") {
        setDopaminePromptSeen(true);
        PreferencesManager.savePreferences({ dopaminePromptSeen: true });
        return;
      }
      handleDopamineModeChange(action);
    },
    [handleDopamineModeChange]
  );

  const handleEffectsVolumeChange = useCallback((volume: number) => {
    setEffectsVolume(volume);
    PreferencesManager.savePreferences({ effectsVolume: volume });
  }, []);

  const handleHapticsChange = useCallback((enabled: boolean) => {
    setHaptics(enabled);
    PreferencesManager.savePreferences({ haptics: enabled });
  }, []);

  const handleWellbeingChange = useCallback((enabled: boolean) => {
    setWellbeingNudges(enabled);
    PreferencesManager.savePreferences({ wellbeingNudges: enabled });
    if (!enabled) setBreakNudge(false);
  }, []);

  const handleResetEngagement = useCallback(() => {
    EngagementManager.reset();
    feedbackEngine.clear();
    comboRef.current = 0;
    bestComboRef.current = 0;
    setCombo(0);
    setResultExtras(null);
    setEngagement(EngagementManager.getSnapshot());
  }, []);

  const handleClaimQuest = useCallback(
    (id: string) => {
      const claimed = EngagementManager.claimQuest(id);
      if (!claimed) return;

      setEngagement(claimed.snapshot);
      feedbackEngine.emit({ kind: "quest", label: claimed.label, xp: claimed.reward });
      if (dopamineMode !== "off") soundManager.playReward("rare");
      vibrate(20);

      if (claimed.levelUp) {
        feedbackEngine.emit({
          kind: "level-up",
          level: claimed.level,
          title: claimed.levelTitle,
        });
        if (dopamineMode !== "off") soundManager.playLevelUp();
      }
    },
    [dopamineMode, vibrate]
  );

  useEffect(() => {
    feedbackEngine.configure({ mode: dopamineMode, reduced: reducedMotion });
    if (dopamineMode === "off") feedbackEngine.clear();
  }, [dopamineMode, reducedMotion]);

  useEffect(() => {
    soundManager.setEffectsVolume(effectsVolume);
  }, [effectsVolume]);

  useEffect(() => {
    setStreakInfo(scoringSystem.getStreakInfo());
    setRecentSessions(StatisticsManager.getRecentSessions(7).slice(0, 3));
    refreshEngagement();
  }, [isComplete, refreshEngagement]);

  // Generate words
  const generateWordsList = useCallback(() => {
    let effectiveDifficulty = difficulty;
    let wordWeights: Record<string, number> | undefined;

    if (adaptiveMode) {
      const assessment = adaptiveAlgorithm.assessSkill();
      effectiveDifficulty = assessment.recommendedDifficulty;
      wordWeights = adaptiveAlgorithm.getWordSelectionWeights();
    }

    const countToGenerate = mode === "time" ? 100 : wordCount;
    const contentType: ContentType = mode === "phrases" ? "phrases" : "words";

    const generated = languageManager.generateContent({
      language,
      difficulty: effectiveDifficulty,
      contentType,
      count: countToGenerate,
      avoidRepeats,
      wordWeights,
    });

    return generated;
  }, [language, difficulty, mode, wordCount, avoidRepeats, adaptiveMode]);

  // Reset toàn bộ trạng thái phiên gõ theo danh sách từ mục tiêu
  const resetSessionState = useCallback((targetWords: string[]) => {
    setWords(targetWords);
    setGoldenFlags(buildGoldenFlags(targetWords.length));
    setCurrentWordIndex(0);
    setUserInput("");
    setWordStatuses(new Array(targetWords.length).fill("pending"));
    setWordInputs(new Array(targetWords.length).fill(""));
    setIsActive(false);
    setIsComplete(false);
    setStartTime(null);
    setPerfectWordsCount(0);
    setErrorCount(0);
    setFinalStats(null);
    setTick(0);
    timeUpHandledRef.current = false;
    setWpmTimeline([]);
    setCurrentScore(null);
    setNewAchievements([]);
    setAdaptiveAlert(null);
    setResultExtras(null);

    // Reset trạng thái DPM của phiên mới
    comboRef.current = 0;
    bestComboRef.current = 0;
    setCombo(0);
    recordBaselineRef.current = scoringSystem.getPersonalBests().fastestWpm?.wpm ?? null;
    recordNudgedRef.current = false;
    lastCountdownRef.current = 0;
    sessionBonusXpRef.current = 0;
    if (levelUpTimerRef.current !== null) {
      window.clearTimeout(levelUpTimerRef.current);
      levelUpTimerRef.current = null;
    }
    feedbackEngine.clear();

    // Scroll word container back to top
    if (wordsContainerRef.current) {
      wordsContainerRef.current.scrollTop = 0;
    }

    // Focus input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  }, []);

  // Bài tiếp theo (sinh bộ từ mới)
  const initializeGame = useCallback(() => {
    const newWords = generateWordsList();
    resetSessionState(newWords);
  }, [generateWordsList, resetSessionState]);

  // Thử lại bài này (giữ nguyên danh sách từ vừa gõ)
  const retrySameGame = useCallback(() => {
    if (words.length > 0) {
      resetSessionState([...words]);
    } else {
      initializeGame();
    }
  }, [words, resetSessionState, initializeGame]);

  // Initialize on mount or when key settings change
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Synchronize sound manager
  useEffect(() => {
    soundManager.setSwitchType(soundSwitch);
  }, [soundSwitch]);

  // Áp lựa chọn đã lưu SAU khi hydrate: lần render đầu tiên luôn dùng mặc định
  // giống server, nên không còn lệch HTML giữa server và client.
  useEffect(() => {
    const saved = PreferencesManager.getPreferences();
    setLanguage((saved.language as LanguageType) || "english");
    setDifficulty((saved.difficulty as DifficultyType) || "medium");
    setMode(saved.contentType === "phrases" ? "phrases" : "words");
    setWordCount(saved.wordCount || 25);
    setAvoidRepeats(saved.avoidRepeats ?? true);
    setAdaptiveMode(saved.adaptiveMode ?? true);
    setSidebarOpen(saved.sidebarOpen ?? true);
    setDopamineMode(saved.dopamineMode ?? "balanced");
    setEffectsVolume(saved.effectsVolume ?? 0.6);
    setHaptics(saved.haptics ?? false);
    setWellbeingNudges(saved.wellbeingNudges ?? true);
    setDopaminePromptSeen(saved.dopaminePromptSeen ?? false);
    if (saved.soundSwitch) {
      setSoundSwitch((saved.soundSwitch === "linear" ? "red" : saved.soundSwitch) as SwitchType);
    }
    soundManager.setEffectsVolume(saved.effectsVolume ?? 0.6);
    recordBaselineRef.current = scoringSystem.getPersonalBests().fastestWpm?.wpm ?? null;
    refreshEngagement();
    if ((saved.wellbeingNudges ?? true) && EngagementManager.getSnapshot().shouldNudgeBreak) {
      setBreakNudge(true);
    }
  }, [refreshEngagement]);

  // Calculate stats helper
  const calculateCurrentStats = useCallback(
    (
      currentWordIdx: number,
      currentInput: string,
      statuses: ("correct" | "incorrect" | "pending")[],
      wordsList: string[],
      inputsList: string[],
      elapsedSeconds: number
    ): GameStats => {
      if (elapsedSeconds <= 0) {
        return {
          wpm: 0,
          accuracy: 100,
          correctChars: 0,
          totalChars: 0,
          timeElapsed: 0,
          consistency: 100,
        };
      }

      let correctChars = 0;
      let totalTypedChars = 0;

      // Count characters from completed words
      for (let i = 0; i < currentWordIdx; i++) {
        const targetWord = wordsList[i];
        const typedWord = inputsList[i] || "";
        totalTypedChars += typedWord.length + 1; // +1 for space

        if (statuses[i] === "correct") {
          correctChars += targetWord.length + 1;
        } else {
          // Count partial correct
          for (let j = 0; j < Math.min(typedWord.length, targetWord.length); j++) {
            if (typedWord[j] === targetWord[j]) correctChars++;
          }
        }
      }

      // Count characters in current word
      if (currentWordIdx < wordsList.length) {
        const targetWord = wordsList[currentWordIdx];
        totalTypedChars += currentInput.length;
        for (let j = 0; j < Math.min(currentInput.length, targetWord.length); j++) {
          if (currentInput[j] === targetWord[j]) correctChars++;
        }
      }

      const elapsedMinutes = elapsedSeconds / 60;
      const wpm = elapsedMinutes > 0 ? Math.round(correctChars / 5 / elapsedMinutes) : 0;
      const accuracy = totalTypedChars > 0 ? Math.round((correctChars / totalTypedChars) * 100) : 100;

      // Consistency based on timeline
      let consistency = 100;
      if (wpmTimeline.length > 2) {
        const mean = wpmTimeline.reduce((a, b) => a + b, 0) / wpmTimeline.length;
        const variance = wpmTimeline.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / wpmTimeline.length;
        consistency = Math.max(0, Math.min(100, Math.round(100 - Math.sqrt(variance))));
      }

      return {
        wpm,
        accuracy: Math.min(100, accuracy),
        correctChars,
        totalChars: totalTypedChars,
        timeElapsed: elapsedSeconds,
        consistency,
      };
    },
    [wpmTimeline]
  );

  // Complete Game Session
  const finishGame = useCallback(
    (
      finalWordIdx: number,
      finalInput: string,
      finalStatuses: ("correct" | "incorrect" | "pending")[],
      finalWords: string[],
      finalInputs: string[],
      elapsedSec: number
    ) => {
      setIsActive(false);
      setIsComplete(true);

      const computed = calculateCurrentStats(
        finalWordIdx,
        finalInput,
        finalStatuses,
        finalWords,
        finalInputs,
        elapsedSec
      );
      setFinalStats(computed);

      // Score record
      const sessionData = {
        wpm: computed.wpm,
        accuracy: computed.accuracy,
        consistency: computed.consistency,
        language,
        difficulty,
        contentType: mode,
        wordCount: finalWordIdx,
        timeElapsed: elapsedSec,
        perfectWords: perfectWordsCount,
        totalWords: Math.max(finalWordIdx, 1),
        bestCombo: bestComboRef.current,
      };

      // Huy hiệu: thống kê được tính từ lịch sử + chính phiên này bên trong
      // ScoringSystem, nên không còn lệch một phiên như trước.
      const { scoreEntry, newAchievements: unlocked } = scoringSystem.recordScore(sessionData, {
        goldenWords: EngagementManager.getSnapshot().goldenWords,
      });

      setCurrentScore(scoreEntry);
      setNewAchievements(unlocked);

      // Save to StatisticsManager
      const session: GameSession = {
        id: scoreEntry.id,
        timestamp: scoreEntry.timestamp,
        language,
        difficulty,
        contentType: mode,
        wordCount: finalWordIdx,
        wpm: computed.wpm,
        accuracy: computed.accuracy,
        consistency: computed.consistency,
        totalScore: scoreEntry.score,
        rating: scoreEntry.rating.overall,
        timeElapsed: elapsedSec,
        perfectWords: perfectWordsCount,
        totalWords: Math.max(finalWordIdx, 1),
        errorCount,
        achievements: unlocked.map((a) => a.name),
      };
      StatisticsManager.saveSession(session);

      // Adaptive algorithm record
      if (adaptiveMode) {
        // Thu thập từ sai và lỗi gõ thực tế
        const weakWords: Record<string, number> = {};
        const strongWords: Record<string, number> = {};
        const commonErrors: Record<string, number> = {};

        for (let i = 0; i < finalWordIdx; i++) {
          const target = words[i];
          const typed = wordInputs[i] || "";
          if (wordStatuses[i] === "incorrect" || (typed && typed !== target)) {
            weakWords[target] = (weakWords[target] || 0) + 1;
            const minLen = Math.min(target.length, typed.length);
            for (let c = 0; c < minLen; c++) {
              if (target[c] !== typed[c]) {
                const pair = `${target[c]}->${typed[c]}`;
                commonErrors[pair] = (commonErrors[pair] || 0) + 1;
              }
            }
          } else if (wordStatuses[i] === "correct" && typed === target) {
            strongWords[target] = (strongWords[target] || 0) + 1;
          }
        }

        const sessionDurationMinutes = Math.max(0.05, Math.round((elapsedSec / 60) * 100) / 100);

        adaptiveAlgorithm.recordPerformance({
          wpm: computed.wpm,
          accuracy: computed.accuracy,
          consistency: computed.consistency,
          difficulty: adaptiveMode ? aiDifficulty : difficulty,
          language,
          contentType: mode,
          wordCount: finalWordIdx,
          sessionLength: sessionDurationMinutes,
          weakWords,
          strongWords,
          commonErrors,
          timestamp: Date.now(),
        });
      }

      // Động lực: XP, level, kỷ lục combo
      const recordBaseline = recordBaselineRef.current;
      const recordDelta =
        recordBaseline !== null && computed.wpm > recordBaseline
          ? computed.wpm - recordBaseline
          : null;
      const outcome = EngagementManager.recordSession({
        score: scoreEntry.score,
        bestCombo: bestComboRef.current,
        bonusXp: sessionBonusXpRef.current,
      });

      setResultExtras({
        sessionXp: outcome.sessionXp,
        level: outcome.level,
        levelTitle: outcome.levelTitle,
        levelProgress: outcome.levelProgress,
        xpIntoLevel: outcome.snapshot.xpIntoLevel,
        xpForNext: outcome.snapshot.xpForNext,
        bestCombo: bestComboRef.current,
        recordDelta,
        levelUp: outcome.levelUp,
      });
      refreshEngagement();

      if (dopamineMode !== "off") {
        feedbackEngine.emit({ kind: "finish" });

        if (unlocked.length > 0) {
          const rank = { common: 0, rare: 1, epic: 2, legendary: 3 } as const;
          const top = unlocked.reduce(
            (best, item) => (rank[item.rarity] > rank[best.rarity] ? item : best),
            unlocked[0]
          );
          feedbackEngine.emit({
            kind: "achievement",
            name: unlocked.length === 1 ? unlocked[0].name : `${unlocked.length} huy hiệu mới`,
            rarity: top.rarity,
            points: unlocked.reduce((sum, item) => sum + item.points, 0),
          });
          soundManager.playReward(top.rarity === "common" ? "rare" : "epic");
          vibrate(top.rarity === "legendary" ? [20, 40, 20, 40, 50] : 20);
        }

        if (recordDelta) soundManager.playRecord();
        if (outcome.levelUp) {
          levelUpTimerRef.current = window.setTimeout(() => {
            feedbackEngine.emit({
              kind: "level-up",
              level: outcome.level,
              title: outcome.levelTitle,
            });
            soundManager.playLevelUp();
            levelUpTimerRef.current = null;
          }, 450);
        }
        vibrate(recordDelta ? [24, 40, 24, 40, 60] : 24);
      }
    },
    [
      calculateCurrentStats,
      language,
      difficulty,
      aiDifficulty,
      mode,
      perfectWordsCount,
      errorCount,
      adaptiveMode,
      dopamineMode,
      refreshEngagement,
      vibrate,
      words,
      wordInputs,
      wordStatuses,
    ]
  );

  // Nhịp cập nhật HUD: interval chỉ phụ thuộc trạng thái chạy, KHÔNG phụ thuộc
  // từng lần gõ phím — trước đây mỗi keystroke lại clear + tạo lại interval nên
  // đồng hồ không bao giờ chạm 1 giây và WPM/độ chính xác bị "đóng băng".
  useEffect(() => {
    if (!isActive || isComplete || !startTime) return;

    const id = setInterval(() => setTick((value) => value + 1), 200);
    return () => clearInterval(id);
  }, [isActive, isComplete, startTime]);

  // Số giây đã trôi qua, suy ra trực tiếp từ startTime + nhịp tick
  const elapsedSeconds =
    isActive && startTime && !isComplete
      ? Math.max(1, Math.floor((Date.now() - startTime) / 1000))
      : 0;

  // HUD realtime: tính lại mỗi lần render (rẻ, chỉ vài chục từ)
  const liveStats: GameStats =
    finalStats ??
    calculateCurrentStats(
      currentWordIndex,
      userInput,
      wordStatuses,
      words,
      wordInputs,
      elapsedSeconds
    );

  // Giữ bản mới nhất cho các effect chỉ chạy theo giây
  useEffect(() => {
    statsRef.current = liveStats;
  }, [liveStats]);

  const timeLeft = mode === "time" ? Math.max(0, timeLimit - elapsedSeconds) : timeLimit;

  // Ghi timeline WPM đúng 1 điểm mỗi giây (thay cho việc push trong interval cũ)
  useEffect(() => {
    if (!isActive || isComplete || !startTime) return;
    const snapshot = statsRef.current;
    if (!snapshot) return;
    setWpmTimeline((prev) => [...prev, snapshot.wpm]);
  }, [elapsedSeconds, isActive, isComplete, startTime]);

  // Phản hồi AI Coach mỗi 4 giây
  useEffect(() => {
    if (!adaptiveMode || !isActive || isComplete) return;
    if (elapsedSeconds === 0 || elapsedSeconds % 4 !== 0) return;
    const snapshot = statsRef.current;
    if (!snapshot) return;

    const currentWord = words[currentWordIndex];
    const isCurrentError = userInput.length > 0 && !currentWord?.startsWith(userInput);

    const feedback = adaptiveAlgorithm.getRealtimeFeedback(
      {
        wpm: snapshot.wpm,
        accuracy: snapshot.accuracy,
        consistency: snapshot.consistency,
      },
      {
        currentWord,
        isError: isCurrentError,
      }
    );

    if (feedback) {
      setAdaptiveAlert(feedback);
      setAlertLeaving(false);
      const timeout = setTimeout(() => {
        // Chạy exit animation trước khi unmount, tránh biến mất đột ngột.
        setAlertLeaving(true);
        window.setTimeout(() => {
          setAdaptiveAlert(null);
          setAlertLeaving(false);
        }, 180);
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [elapsedSeconds, adaptiveMode, isActive, isComplete, currentWordIndex, userInput, words]);

  // Hết giờ ở chế độ đếm ngược
  useEffect(() => {
    if (mode !== "time" || !isActive || isComplete || !startTime) return;
    if (elapsedSeconds < timeLimit || timeUpHandledRef.current) return;

    timeUpHandledRef.current = true;
    finishGame(currentWordIndex, userInput, wordStatuses, words, wordInputs, timeLimit);
  }, [
    mode,
    isActive,
    isComplete,
    startTime,
    elapsedSeconds,
    timeLimit,
    currentWordIndex,
    userInput,
    wordStatuses,
    words,
    wordInputs,
    finishGame,
  ]);

  // "Sắp phá kỷ lục" / "Vượt kỷ lục" — chỉ một lần mỗi phiên.
  useEffect(() => {
    if (!isActive || isComplete || dopamineMode === "off" || reducedMotion) return;
    if (elapsedSeconds < 6 || recordNudgedRef.current) return;

    const baseline = recordBaselineRef.current;
    if (!baseline) return;
    const current = statsRef.current?.wpm ?? 0;

    if (current >= baseline) {
      recordNudgedRef.current = true;
      feedbackEngine.emit({ kind: "record-beat", delta: Math.max(1, current - baseline) });
      soundManager.playRecord();
      vibrate(30);
      return;
    }

    if (baseline - current <= 8 && current >= baseline * 0.9) {
      recordNudgedRef.current = true;
      feedbackEngine.emit({ kind: "record-near", delta: baseline - current });
    }
  }, [elapsedSeconds, isActive, isComplete, dopamineMode, reducedMotion, vibrate]);

  // Chế độ đếm ngược: 5 giây cuối có nhịp báo căng thẳng, mỗi giây một lần.
  useEffect(() => {
    if (mode !== "time" || !isActive || isComplete) return;

    const secondsLeft = timeLimit - elapsedSeconds;
    if (secondsLeft <= 0 || secondsLeft > 5) return;
    if (lastCountdownRef.current === secondsLeft) return;
    lastCountdownRef.current = secondsLeft;

    if (dopamineMode === "off") return;
    soundManager.playCountdown(secondsLeft);
    if (secondsLeft <= 3) vibrate(10);
  }, [mode, isActive, isComplete, elapsedSeconds, timeLimit, dopamineMode, vibrate]);

  // Nhắc nghỉ: tối đa một lần mỗi ngày, không chặn phiên đang gõ.
  useEffect(() => {
    if (!wellbeingNudges) return;
    if (EngagementManager.getSnapshot().shouldNudgeBreak) setBreakNudge(true);
  }, [wellbeingNudges, isComplete]);

  // Keep word container scrolled so active word is in view
  useEffect(() => {
    if (activeWordRef.current && wordsContainerRef.current) {
      const container = wordsContainerRef.current;
      const wordElem = activeWordRef.current;
      const relativeTop = wordElem.offsetTop - container.offsetTop;

      if (relativeTop > 65) {
        container.scrollTo({
          top: relativeTop - 40,
          behavior: "smooth",
        });
      } else if (relativeTop < 20) {
        container.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }
    }
  }, [currentWordIndex]);

  /**
   * Phần thưởng khi hoàn thành một từ đúng: hạt sáng, từ vàng, tiếng hiếm.
   * Không chạy khi DPM tắt.
   */
  const rewardWord = useCallback(
    (wordIndex: number) => {
      if (dopamineMode === "off") return;

      const golden = goldenFlags[wordIndex] === true;
      const drop = rollWordReward();
      feedbackEngine.emit({ kind: "word", golden, drop });

      if (golden) {
        sessionBonusXpRef.current += 20;
        EngagementManager.recordGoldenWord();
        soundManager.playReward("epic");
        vibrate(24);
      } else if (drop === "epic" || drop === "rare") {
        soundManager.playReward(drop);
        if (drop === "epic") vibrate(18);
      }
    },
    [dopamineMode, goldenFlags, vibrate]
  );

  // Xử lý sự kiện IME tiếng Việt (Telex / VNI)
  const handleCompositionStart = () => {
    isComposingRef.current = true;
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    isComposingRef.current = false;
    const value = e.currentTarget.value;
    const currentWord = words[currentWordIndex];
    if (!currentWord) return;

    if (value.length > userInput.length) {
      const added = value.slice(userInput.length);
      const isPrefixExtension = value.startsWith(userInput) && currentWord.startsWith(value);
      const allCorrect = isPrefixExtension && added.length > 0;
      commitCombo(allCorrect ? comboRef.current + added.length : 0);
    }
  };

  // Handle Input typing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isComplete) return;

    const value = e.target.value;

    // First keystroke starts the game
    if (!isActive && !startTime) {
      setIsActive(true);
      setStartTime(Date.now());
    }

    const currentWord = words[currentWordIndex];

    // Nếu đang trong quá trình ghép dấu tiếng Việt (IME composition), cập nhật input và âm thanh nhưng không ngắt combo oan
    if (isComposingRef.current) {
      const typedChar = value.length > userInput.length ? value[value.length - 1] : undefined;
      soundManager.playKeypress(false, false, typedChar);
      setUserInput(value);
      return;
    }

    // Space key detection: user wants to complete word and advance
    if (value.endsWith(" ")) {
      const typedWord = value.trim();

      // If user hit space without typing anything, ignore
      if (typedWord.length === 0) {
        setUserInput("");
        return;
      }

      const isCorrect = typedWord === currentWord;

      // Sound feedback
      soundManager.playKeypress(true, !isCorrect, "Space");
      commitCombo(isCorrect ? comboRef.current + 1 : 0);

      const nextStatuses = [...wordStatuses];
      nextStatuses[currentWordIndex] = isCorrect ? "correct" : "incorrect";
      setWordStatuses(nextStatuses);

      const nextInputs = [...wordInputs];
      nextInputs[currentWordIndex] = typedWord;
      setWordInputs(nextInputs);

      if (isCorrect) {
        setPerfectWordsCount((prev) => prev + 1);
        rewardWord(currentWordIndex);
      } else {
        setErrorCount((prev) => prev + 1);
      }

      const nextWordIdx = currentWordIndex + 1;

      // Dynamic word append for time mode if user is near end
      if (mode === "time" && nextWordIdx >= words.length - 10) {
        const moreWords = generateWordsList();
        setWords((prev) => [...prev, ...moreWords]);
        setWordStatuses((prev) => [...prev, ...new Array(moreWords.length).fill("pending")]);
        setWordInputs((prev) => [...prev, ...new Array(moreWords.length).fill("")]);
        setGoldenFlags((prev) => [...prev, ...buildGoldenFlags(moreWords.length)]);
      }

      // Check if test completed in word/phrase mode
      if (mode !== "time" && nextWordIdx >= words.length) {
        const elapsedSec = startTime ? Math.max(1, Math.round((Date.now() - startTime) / 1000)) : 1;
        finishGame(nextWordIdx, "", nextStatuses, words, nextInputs, elapsedSec);
        return;
      }

      setCurrentWordIndex(nextWordIdx);
      setUserInput("");
      return;
    }

    // Normal typing within word
    const isErrorChar =
      value.length > 0 &&
      (value.length > currentWord.length || value[value.length - 1] !== currentWord[value.length - 1]);

    const typedChar = value.length > userInput.length ? value[value.length - 1] : undefined;
    soundManager.playKeypress(false, isErrorChar, typedChar);
    setUserInput(value);

    // Combo: chỉ cộng khi phần gõ thêm khớp từ đích. IME làm thay đổi độ dài
    // (Telex/VNI) hoặc backspace không bị coi là lỗi để tránh reset oan.
    if (value.length > userInput.length) {
      const added = value.slice(userInput.length);
      const isPrefixExtension = value.startsWith(userInput) && currentWord.startsWith(value);
      const allCorrect = isPrefixExtension && added.length > 0;
      commitCombo(allCorrect ? comboRef.current + added.length : 0);
    }

    // If on the last word and user typed it completely and accurately, finish immediately!
    if (
      mode !== "time" &&
      currentWordIndex === words.length - 1 &&
      value === currentWord
    ) {
      const nextStatuses = [...wordStatuses];
      nextStatuses[currentWordIndex] = "correct";
      setWordStatuses(nextStatuses);

      const nextInputs = [...wordInputs];
      nextInputs[currentWordIndex] = value;
      setWordInputs(nextInputs);

      setPerfectWordsCount((prev) => prev + 1);
      commitCombo(comboRef.current + 1);
      rewardWord(currentWordIndex);

      const elapsedSec = startTime ? Math.max(1, Math.round((Date.now() - startTime) / 1000)) : 1;
      finishGame(currentWordIndex + 1, "", nextStatuses, words, nextInputs, elapsedSec);
    }
  };

  // Keyboard shortcut handlers (Tab + Enter for restart, Backspace to previous word)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Quick Restart with Tab or Esc
    if (e.key === "Tab" || e.key === "Escape") {
      e.preventDefault();
      initializeGame();
      return;
    }

    // If Backspace pressed, play realistic key sound and handle word navigation
    if (e.key === "Backspace") {
      soundManager.playKeypress(false, false, "Backspace");
      if (userInput === "" && currentWordIndex > 0) {
        e.preventDefault();
        const prevIdx = currentWordIndex - 1;
        setCurrentWordIndex(prevIdx);
        const prevTyped = wordInputs[prevIdx] || "";
        setUserInput(prevTyped);

        // Reset previous status to pending
        const nextStatuses = [...wordStatuses];
        nextStatuses[prevIdx] = "pending";
        setWordStatuses(nextStatuses);
      }
    }
  };

  // Focus container click handler
  const handleArenaClick = () => {
    inputRef.current?.focus();
    setIsFocused(true);
  };

  // Setting handlers
  const handleLanguageChange = (newLang: LanguageType) => {
    setLanguage(newLang);
    PreferencesManager.savePreferences({ language: newLang });
  };

  const handleDifficultyChange = (newDiff: DifficultyType) => {
    setDifficulty(newDiff);
    PreferencesManager.savePreferences({ difficulty: newDiff });
    // Nếu đang bật adaptiveMode, chuyển về chế độ thủ công khi người dùng click chọn độ khó
    if (adaptiveMode) {
      setAdaptiveMode(false);
      PreferencesManager.savePreferences({ adaptiveMode: false });
    }
  };

  const handleModeChange = (newMode: ModeType) => {
    setMode(newMode);
    PreferencesManager.savePreferences({
      contentType: newMode === "phrases" ? "phrases" : "words",
    });
  };

  const handleWordCountChange = (count: number) => {
    setWordCount(count);
    PreferencesManager.savePreferences({ wordCount: count });
  };

  const cycleSoundSwitch = () => {
    const sequence: SwitchType[] = ["blue", "brown", "red", "off"];
    const normalizedCurrent = soundSwitch === "linear" ? "red" : soundSwitch;
    const nextIdx = (sequence.indexOf(normalizedCurrent) + 1) % sequence.length;
    const nextSwitch = sequence[nextIdx];
    setSoundSwitch(nextSwitch);
    PreferencesManager.savePreferences({ soundSwitch: nextSwitch });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-primary/20 selection:text-primary">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/45 to-transparent"
        />
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <LogoPreviewDialog
              currentConcept={logoConcept}
              onSelectConcept={handleSelectLogoConcept}
              trigger={
                <button
                  type="button"
                  className="group flex min-w-0 cursor-pointer items-center gap-2.5 rounded-lg text-left transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  title="Bấm để xem chi tiết & chuyển đổi các mẫu Logo"
                >
                  <div className="shrink-0 transition-transform duration-200 ease-[cubic-bezier(0.2,0.9,0.4,1)] group-hover:-translate-y-0.5">
                    {React.createElement(getLogoIcon(logoConcept), { size: 32 })}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[1.3rem] leading-none font-extrabold tracking-tight text-foreground">
                        Type<span className="text-foreground/75">Flow</span>
                      </span>
                      <span className="rounded-full border border-border/70 bg-muted/50 px-1.5 py-0.5 text-[9.5px] leading-none font-bold tracking-[0.14em] text-muted-foreground uppercase">
                        2.0
                      </span>
                    </div>
                    <p className="mt-1 hidden text-[11px] leading-none text-muted-foreground sm:block">
                      Luyện gõ tiếng Việt & English thông minh
                    </p>
                  </div>
                </button>
              }
            />
            <div className="hidden lg:block">
              <LogoPreviewDialog
                currentConcept={logoConcept}
                onSelectConcept={handleSelectLogoConcept}
              />
            </div>
          </div>

          {/* Quick Stats & Controls */}
          <div className="flex items-center gap-1.5">
            {/* Streak */}
            {streakInfo && streakInfo.current > 0 && (
              <>
                <Badge
                  variant="outline"
                  className="hidden h-9 items-center gap-1.5 rounded-lg border-warning/30 bg-warning/10 px-2.5 text-warning sm:flex"
                >
                  <Flame className="size-3.5 fill-warning/20" aria-hidden />
                  <span className="text-[11px] leading-none font-bold tabular-nums">
                    {streakInfo.current} ngày
                  </span>
                </Badge>
                <span
                  aria-hidden
                  className="mx-0.5 hidden h-6 w-px bg-border sm:block"
                />
              </>
            )}

            {/* DPM Mode */}
            <DopamineControl
              mode={dopamineMode}
              onModeChange={handleDopamineModeChange}
              effectsVolume={effectsVolume}
              onEffectsVolumeChange={handleEffectsVolumeChange}
              haptics={haptics}
              onHapticsChange={handleHapticsChange}
              wellbeingNudges={wellbeingNudges}
              onWellbeingNudgesChange={handleWellbeingChange}
              reducedMotion={reducedMotion}
              level={engagement?.level ?? 1}
              onReset={handleResetEngagement}
            />

            <span aria-hidden className="mx-0.5 hidden h-6 w-px bg-border md:block" />

            {/* Sound Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={cycleSoundSwitch}
              className="h-9 gap-1.5 rounded-lg px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
              title={`Âm thanh phím: ${soundSwitch === "off" ? "Tắt" : soundSwitch.toUpperCase()}`}
              aria-label={`Âm thanh phím: ${soundSwitch}`}
            >
              {soundSwitch === "off" ? (
                <VolumeX className="size-4" aria-hidden />
              ) : (
                <Volume2 className="size-4 text-primary" aria-hidden />
              )}
              <span className="hidden capitalize md:inline">
                {soundSwitch === "off" ? "Tắt âm" : soundSwitch === "linear" ? "Red" : soundSwitch}
              </span>
            </Button>

            {/* Dashboard */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => openDashboard("overview")}
              className="h-9 gap-1.5 rounded-lg border-border/70 px-2.5 text-xs font-medium transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
            >
              <BarChart3 className="size-4 text-primary" aria-hidden />
              <span className="hidden md:inline">Bảng điều khiển</span>
            </Button>

            {/* Ẩn/hiện bảng phụ (chỉ trên desktop) */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              aria-pressed={sidebarOpen}
              aria-label={sidebarOpen ? "Ẩn bảng phụ" : "Hiện bảng phụ"}
              title={sidebarOpen ? "Ẩn bảng phụ" : "Hiện bảng phụ"}
              className="hidden h-9 w-9 rounded-lg px-0 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground xl:inline-flex"
            >
              {sidebarOpen ? (
                <PanelRightClose className="size-4" aria-hidden />
              ) : (
                <PanelRight className="size-4" aria-hidden />
              )}
            </Button>

            {/* Theme Selector */}
            <ThemeSelector />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <div
          className={`grid gap-5 transition-[grid-template-columns] duration-200 ease-[cubic-bezier(0.2,0.9,0.4,1)] ${
            sidebarOpen ? "xl:grid-cols-[minmax(0,1fr)_300px]" : "xl:grid-cols-[minmax(0,1fr)_0px]"
          }`}
        >
          {/* Vùng gõ luôn căn giữa để giữ tập trung, bất kể sidebar mở hay đóng */}
          <div className="mx-auto w-full min-w-0 max-w-3xl">
            {/* Test Result View (When test completed) */}
            {isComplete && currentScore ? (
              <TestResult
                score={currentScore}
                achievements={newAchievements}
                wpmHistory={wpmTimeline}
                onRestart={initializeGame}
                onRetry={retrySameGame}
                onOpenDashboard={openDashboard}
                extras={resultExtras}
                dopamineMode={dopamineMode}
                showDopaminePrompt={!dopaminePromptSeen}
                onDopaminePromptAction={handleDopaminePromptAction}
              />
            ) : (
              /* Active Typing Arena & Controls */
              <div className="w-full space-y-5 animate-in fade-in duration-200 ease-[cubic-bezier(0.2,0.9,0.4,1)]">
            {/* Pill Navigation Toolbar */}
            <div className="flex flex-wrap items-center justify-center gap-3 p-2 rounded-2xl bg-card/70 border border-border/80 shadow-xs backdrop-blur-xs">
              {/* Language Selector */}
              <div className="flex items-center gap-1 bg-background/80 p-1 rounded-xl border border-border/60">
                <Globe className="w-3.5 h-3.5 ml-2 text-muted-foreground" />
                <SegmentedHighlight className="flex items-center gap-1">
                  <button
                    onClick={() => handleLanguageChange("english")}
                    data-segment-active={language === "english"}
                    className={`relative z-10 px-3 py-1 rounded-lg text-xs font-semibold transition-colors duration-150 ${
                      language === "english"
                        ? "text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => handleLanguageChange("vietnamese")}
                    data-segment-active={language === "vietnamese"}
                    className={`relative z-10 px-3 py-1 rounded-lg text-xs font-semibold transition-colors duration-150 ${
                      language === "vietnamese"
                        ? "text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Tiếng Việt
                  </button>
                </SegmentedHighlight>
              </div>

              {/* Mode Selector */}
              <div className="flex items-center gap-1 bg-background/80 p-1 rounded-xl border border-border/60">
                <SegmentedHighlight className="flex items-center gap-1">
                  <button
                    onClick={() => handleModeChange("words")}
                    data-segment-active={mode === "words"}
                    className={`relative z-10 px-3 py-1 rounded-lg text-xs font-semibold transition-colors duration-150 flex items-center gap-1.5 ${
                      mode === "words"
                        ? "text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Type className="w-3.5 h-3.5" />
                    <span>Words</span>
                  </button>
                  <button
                    onClick={() => handleModeChange("time")}
                    data-segment-active={mode === "time"}
                    className={`relative z-10 px-3 py-1 rounded-lg text-xs font-semibold transition-colors duration-150 flex items-center gap-1.5 ${
                      mode === "time"
                        ? "text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Time</span>
                  </button>
                  <button
                    onClick={() => handleModeChange("phrases")}
                    data-segment-active={mode === "phrases"}
                    className={`relative z-10 px-3 py-1 rounded-lg text-xs font-semibold transition-colors duration-150 flex items-center gap-1.5 ${
                      mode === "phrases"
                        ? "text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Quote className="w-3.5 h-3.5" />
                    <span>Phrases</span>
                  </button>
                </SegmentedHighlight>
              </div>

              {/* Word Count / Time Limit Options */}
              <div className="flex items-center gap-1 bg-background/80 p-1 rounded-xl border border-border/60">
                <SegmentedHighlight className="flex items-center gap-1">
                  {mode === "time"
                    ? [15, 30, 60, 120].map((t) => (
                        <button
                          key={t}
                          onClick={() => {
                            setTimeLimit(t);
                            initializeGame();
                          }}
                          data-segment-active={timeLimit === t}
                          className={`relative z-10 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors duration-150 ${
                            timeLimit === t
                              ? "text-primary-foreground"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {t}s
                        </button>
                      ))
                    : [10, 25, 50, 100].map((cnt) => (
                        <button
                          key={cnt}
                          onClick={() => handleWordCountChange(cnt)}
                          data-segment-active={wordCount === cnt}
                          className={`relative z-10 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors duration-150 ${
                            wordCount === cnt
                              ? "text-primary-foreground"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {cnt}
                        </button>
                      ))}
                </SegmentedHighlight>
              </div>

              {/* Difficulty */}
              <div className="flex items-center gap-1 bg-background/80 p-1 rounded-xl border border-border/60">
                <Gauge className="w-3.5 h-3.5 ml-2 text-muted-foreground" />
                <SegmentedHighlight className="flex items-center gap-1">
                  {(["easy", "medium", "hard"] as DifficultyType[]).map((d) => {
                    const isAiSelected = adaptiveMode && aiDifficulty === d;
                    const isSegmentActive = adaptiveMode ? isAiSelected : difficulty === d;
                    return (
                      <button
                        key={d}
                        onClick={() => handleDifficultyChange(d)}
                        data-segment-active={isSegmentActive}
                        className={`relative z-10 px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-colors duration-150 flex items-center gap-1 ${
                          isSegmentActive
                            ? "text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                        title={
                          adaptiveMode
                            ? isAiSelected
                              ? `AI đang chọn độ khó: ${d}`
                              : `Bấm để chuyển sang độ khó thủ công: ${d}`
                            : `Độ khó: ${d}`
                        }
                      >
                        {isAiSelected && <Sparkle className="w-2.5 h-2.5 text-primary-foreground animate-pulse" />}
                        <span>{d}</span>
                      </button>
                    );
                  })}
                </SegmentedHighlight>
              </div>

              {/* Adaptive AI Mode Switch */}
              <button
                onClick={() => {
                  const nextState = !adaptiveMode;
                  setAdaptiveMode(nextState);
                  PreferencesManager.savePreferences({ adaptiveMode: nextState });
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  adaptiveMode
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-background/80 border-border/60 text-muted-foreground hover:text-foreground"
                }`}
                title={
                  adaptiveMode
                    ? `AI đang chọn độ khó [${aiDifficulty.toUpperCase()}] & rèn luyện từ yếu (Bấm để tắt)`
                    : "Bật AI Adaptive để tự động điều chỉnh độ khó và huấn luyện viên thời gian thực"
                }
              >
                <Sparkle className={`w-3.5 h-3.5 ${adaptiveMode ? "animate-spin text-primary" : ""}`} />
                <span>AI Adaptive</span>
                {adaptiveMode && (
                  <span className="text-[10px] px-1 py-0.5 bg-primary/20 rounded font-normal uppercase leading-none">
                    {aiDifficulty}
                  </span>
                )}
              </button>
            </div>

            <ComboMeter
              combo={combo}
              bestCombo={Math.max(engagement?.bestCombo ?? 0, combo)}
              mode={dopamineMode}
            />

            {breakNudge ? (
              <div className="flex items-center gap-2.5 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-[11.5px] text-warning animate-in fade-in slide-in-from-top-1 duration-200">
                <Coffee className="size-4 shrink-0" aria-hidden />
                <p className="flex-1">
                  Bạn đã luyện {engagement?.todayMinutes ?? 25} phút hôm nay. Nghỉ mắt 20 giây nhé?
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setBreakNudge(false);
                    EngagementManager.markNudgeShown();
                  }}
                  className="shrink-0 rounded-md border border-warning/30 bg-background/40 px-2 py-0.5 text-[10.5px] font-semibold text-warning transition-colors hover:bg-warning/15"
                >
                  Đã hiểu
                </button>
              </div>
            ) : null}

            {/* Live Stats HUD (Realtime) */}
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <StatTile label="WPM" value={liveStats.wpm} tone="primary" />
              <StatTile label="Chính xác" value={`${liveStats.accuracy}%`} />
              <StatTile
                label={mode === "time" ? "Còn lại" : "Tiến độ"}
                value={mode === "time" ? `${timeLeft}s` : `${currentWordIndex}/${words.length}`}
              />
              <StatTile label="Độ ổn định" value={`${Math.round(liveStats.consistency)}%`} />
            </div>

            {/* AI Real-time Coach Alert Toast */}
            {adaptiveAlert && (
              <div
                data-state={alertLeaving ? "closed" : "open"}
                className="mx-auto flex max-w-md items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/12 p-3 text-xs font-medium text-primary animate-in fade-in slide-in-from-top-1 duration-200 ease-[cubic-bezier(0.2,0.9,0.4,1)] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-1"
              >
                <Brain className="size-4 shrink-0" aria-hidden />
                <span>{adaptiveAlert}</span>
              </div>
            )}

            {/* Typing Arena Box */}
            <div
              onClick={handleArenaClick}
              className={`relative rounded-3xl bg-card/90 border-2 transition-all duration-200 p-8 shadow-md cursor-text select-none min-h-[190px] flex items-center ${
                isFocused
                  ? "border-primary/60 shadow-primary/5 ring-4 ring-primary/10"
                  : "border-border hover:border-border/80"
              }`}
            >
              {/* Viền "flow" khi combo cao — chỉ DPM tối đa, chỉ opacity. */}
              {dopamineMode === "dpm" && !reducedMotion && comboTier(combo) >= 2 ? (
                <div
                  aria-hidden
                  className="dpm-vignette pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-primary/25"
                  style={{
                    boxShadow:
                      "inset 0 0 70px color-mix(in oklch, var(--primary) 16%, transparent)",
                  }}
                />
              ) : null}

              {/* Unfocused overlay prompt */}
              {!isFocused && !isActive && (
                <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] rounded-3xl flex items-center justify-center z-20 animate-in fade-in zoom-in-95 duration-200 ease-[cubic-bezier(0.2,0.9,0.4,1)]">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border shadow-sm text-sm font-semibold text-muted-foreground">
                    <Keyboard className="w-4 h-4 text-primary" />
                    <span>Nhấp chuột hoặc gõ bất kỳ phím nào để bắt đầu</span>
                  </div>
                </div>
              )}

              {/* Text Container with smooth auto-scroll */}
              <div
                ref={wordsContainerRef}
                className="w-full max-h-[140px] overflow-hidden text-2xl md:text-3xl font-mono leading-relaxed tracking-wide flex flex-wrap gap-x-3 gap-y-2 relative"
              >
                {words.map((word, wordIdx) => {
                  const isCurrent = wordIdx === currentWordIndex;
                  const isPast = wordIdx < currentWordIndex;
                  const status = wordStatuses[wordIdx];
                  const isGolden =
                    goldenFlags[wordIdx] === true && !isPast && dopamineMode !== "off";
                  const caretGlow =
                    dopamineMode === "dpm" && comboTier(combo) >= 2
                      ? "shadow-[0_0_10px_var(--primary)]"
                      : "";

                  return (
                    <span
                      key={wordIdx}
                      ref={isCurrent ? activeWordRef : null}
                      className={`relative inline-block transition-colors duration-100 ${
                        isGolden
                          ? "underline decoration-warning/50 decoration-dotted underline-offset-4 dpm-golden-word"
                          : ""
                      } ${
                        isCurrent
                          ? "text-foreground font-medium"
                          : isPast
                          ? status === "correct"
                            ? "text-muted-foreground/80 animate-word-settle"
                            : "text-destructive/90 underline decoration-destructive decoration-wavy underline-offset-4"
                          : isGolden
                            ? "text-warning/90"
                            : "text-muted-foreground/35"
                      }`}
                    >
                      {isCurrent ? (
                        // Render active word with character by character highlighting
                        <>
                          {word.split("").map((char, charIdx) => {
                            const isTyped = charIdx < userInput.length;
                            const isCorrect = isTyped && userInput[charIdx] === char;
                            const isMistake = isTyped && userInput[charIdx] !== char;
                            const isCaretHere = charIdx === userInput.length;
                            // Chỉ ký tự vừa gõ (cuối cùng đã gõ) mới nhận feedback động.
                            const isJustTyped = isTyped && charIdx === userInput.length - 1;

                            return (
                              <span
                                key={charIdx}
                                ref={isCaretHere ? activeCharRef : null}
                                className={`relative inline-block ${
                                  isCorrect
                                    ? "text-primary font-semibold"
                                    : isMistake
                                    ? "text-destructive bg-destructive/15 rounded-xs underline decoration-destructive"
                                    : "text-muted-foreground/60"
                                } ${
                                  isJustTyped
                                    ? isCorrect
                                      ? "animate-char-pop"
                                      : "animate-char-shake"
                                    : ""
                                }`}
                              >
                                {isCaretHere && (
                                  <span
                                    aria-hidden
                                    className={`absolute -left-[1px] top-0 bottom-0 w-[2.5px] bg-primary rounded-full caret-smooth ${caretGlow}`}
                                  />
                                )}
                                {char}
                              </span>
                            );
                          })}

                          {/* Extra characters typed beyond target word */}
                          {userInput.length > word.length &&
                            userInput
                              .slice(word.length)
                              .split("")
                              .map((extraChar, extraIdx) => (
                                <span
                                  key={`extra-${extraIdx}`}
                                  className="text-destructive bg-destructive/25 rounded-xs"
                                >
                                  {extraChar}
                                </span>
                              ))}

                          {/* Caret at end of word */}
                          {userInput.length >= word.length && (
                            <span
                              aria-hidden
                              className={`inline-block w-[2.5px] h-[1em] bg-primary rounded-full align-middle ml-[1px] caret-smooth ${caretGlow}`}
                            />
                          )}
                        </>
                      ) : (
                        word
                      )}
                    </span>
                  );
                })}
              </div>

              {/* Hidden text input capturing keystrokes and IME */}
              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="absolute opacity-0 pointer-events-none w-0 h-0"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
              />
            </div>

            {/* Restart & Action Controls */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="lg"
                onClick={initializeGame}
                className="group gap-2 px-6 rounded-xl hover:bg-primary hover:text-primary-foreground transition-all shadow-xs"
                title="Bắt đầu lại (Tab + Enter hoặc Esc)"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Bắt đầu lại</span>
                <kbd className="text-[10px] bg-muted px-1.5 py-0.5 rounded border font-mono transition-colors group-hover:border-primary-foreground/30 group-hover:bg-primary-foreground/20 group-hover:text-primary-foreground">
                  Esc
                </kbd>
              </Button>
            </div>
              </div>
            )}
          </div>

          {sidebarOpen ? (
            <aside className="hidden xl:sticky xl:top-20 xl:block xl:self-start animate-in fade-in slide-in-from-right-2 duration-200 ease-[cubic-bezier(0.2,0.9,0.4,1)]">
              <PracticeSidebar
                streakInfo={streakInfo}
                recentSessions={recentSessions}
                onOpenDashboard={openDashboard}
                engagement={engagement}
                onClaimQuest={handleClaimQuest}
              />
            </aside>
          ) : null}
        </div>

        {/* Màn hình nhỏ: các thẻ phụ xuống dưới khu gõ */}
        <div className="mt-6 xl:hidden">
          <PracticeSidebar
            streakInfo={streakInfo}
            recentSessions={recentSessions}
            onOpenDashboard={openDashboard}
            layout="grid"
            engagement={engagement}
            onClaimQuest={handleClaimQuest}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-5 text-xs text-muted-foreground">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-center sm:flex-row sm:text-left">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="font-semibold text-foreground">TypeFlow</span>
            <span aria-hidden>·</span>
            <span>Phím tắt</span>
            <kbd className="rounded border border-border/70 bg-muted px-1.5 py-0.5 font-mono text-[10px]">
              Tab + Enter / Esc
            </kbd>
            <span>để thử lại</span>
          </div>
          <div>
            <span>Hỗ trợ bộ gõ Telex / VNI và tiếng Anh chuẩn quốc tế</span>
          </div>
        </div>
      </footer>

      <FeedbackLayer />

      <Dashboard
        open={dashboardOpen}
        onOpenChange={setDashboardOpen}
        initialTab={dashboardTab}
        score={currentScore ?? undefined}
        newAchievements={newAchievements}
      />
    </div>
  );
}
