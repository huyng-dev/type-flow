"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ThemeSelector } from "@/components/theme-selector";
import { PracticeSidebar } from "@/components/practice-sidebar";
import { Dashboard } from "@/components/dashboard";
import type { DashboardTab } from "@/components/dashboard/data";
import { TestResult } from "@/components/test-result";
import { StatTile } from "@/components/data-display";
import { SegmentedHighlight } from "@/components/ui/segmented";

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

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const wordsContainerRef = useRef<HTMLDivElement>(null);
  const activeCharRef = useRef<HTMLSpanElement>(null);
  const activeWordRef = useRef<HTMLSpanElement>(null);
  const statsRef = useRef<GameStats | null>(null);
  const timeUpHandledRef = useRef<boolean>(false);

  // Streak & lịch sử gần đây (chỉ đọc localStorage khi cần, không đọc mỗi lần gõ phím)
  const [streakInfo, setStreakInfo] = useState<StreakData | null>(null);
  const [recentSessions, setRecentSessions] = useState<GameSession[]>([]);

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

  useEffect(() => {
    setStreakInfo(scoringSystem.getStreakInfo());
    setRecentSessions(StatisticsManager.getRecentSessions(7).slice(0, 3));
  }, [isComplete]);

  // Generate words
  const generateWordsList = useCallback(() => {
    let effectiveDifficulty = difficulty;
    if (adaptiveMode) {
      const assessment = adaptiveAlgorithm.assessSkill();
      effectiveDifficulty = assessment.recommendedDifficulty;
    }

    const countToGenerate = mode === "time" ? 100 : wordCount;
    const contentType: ContentType = mode === "phrases" ? "phrases" : "words";

    const generated = languageManager.generateContent({
      language,
      difficulty: effectiveDifficulty,
      contentType,
      count: countToGenerate,
      avoidRepeats,
    });

    return generated;
  }, [language, difficulty, mode, wordCount, avoidRepeats, adaptiveMode]);

  // Initialize or Reset test
  const initializeGame = useCallback(() => {
    const newWords = generateWordsList();
    setWords(newWords);
    setCurrentWordIndex(0);
    setUserInput("");
    setWordStatuses(new Array(newWords.length).fill("pending"));
    setWordInputs(new Array(newWords.length).fill(""));
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

    if (adaptiveMode) {
      adaptiveAlgorithm.startSession(language, difficulty, mode === "phrases" ? "phrases" : "words", wordCount);
    }

    // Scroll word container back to top
    if (wordsContainerRef.current) {
      wordsContainerRef.current.scrollTop = 0;
    }

    // Focus input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  }, [generateWordsList, adaptiveMode, language, difficulty, mode, wordCount]);

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
  }, []);

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
      };

      const userSummary = StatisticsManager.calculateSummary();
      const langStats = StatisticsManager.getLanguageStats();

      const { scoreEntry, newAchievements: unlocked } = scoringSystem.recordScore(sessionData, {
        ...userSummary,
        languagesUsed: langStats.length,
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
        adaptiveAlgorithm.recordPerformance({
          wpm: computed.wpm,
          accuracy: computed.accuracy,
          consistency: computed.consistency,
          difficulty,
          language,
          contentType: mode,
          wordCount: finalWordIdx,
          errorPatterns: [],
          timestamp: Date.now(),
        });
      }
    },
    [
      calculateCurrentStats,
      language,
      difficulty,
      mode,
      perfectWordsCount,
      errorCount,
      adaptiveMode,
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

    const feedback = adaptiveAlgorithm.getRealtimeFeedback({
      wpm: snapshot.wpm,
      accuracy: snapshot.accuracy,
      consistency: snapshot.consistency,
    });

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
  }, [elapsedSeconds, adaptiveMode, isActive, isComplete]);

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
      soundManager.playKeypress(true, !isCorrect);

      const nextStatuses = [...wordStatuses];
      nextStatuses[currentWordIndex] = isCorrect ? "correct" : "incorrect";
      setWordStatuses(nextStatuses);

      const nextInputs = [...wordInputs];
      nextInputs[currentWordIndex] = typedWord;
      setWordInputs(nextInputs);

      if (isCorrect) {
        setPerfectWordsCount((prev) => prev + 1);
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

    soundManager.playKeypress(false, isErrorChar);
    setUserInput(value);

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

    // If Backspace pressed on empty input and not on first word, go back to previous word
    if (e.key === "Backspace" && userInput === "" && currentWordIndex > 0) {
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
    const sequence: SwitchType[] = ["blue", "brown", "linear", "off"];
    const nextIdx = (sequence.indexOf(soundSwitch) + 1) % sequence.length;
    setSoundSwitch(sequence[nextIdx]);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-primary/20 selection:text-primary">
      {/* Top Header Navigation */}
      <header className="border-b border-border/60 bg-card/40 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">
                  TypeFlow
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-md bg-primary/15 text-primary">
                  2.0
                </span>
              </div>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Luyện gõ tiếng Việt & English thông minh
              </p>
            </div>
          </div>

          {/* Quick Stats & Controls */}
          <div className="flex items-center gap-2">
            {/* Streak */}
            {streakInfo && streakInfo.current > 0 && (
              <Badge
                variant="outline"
                className="hidden items-center gap-1 border-warning/30 bg-warning/10 text-warning sm:flex"
              >
                <Flame className="size-3.5" aria-hidden />
                <span className="font-bold">{streakInfo.current} ngày</span>
              </Badge>
            )}

            {/* Sound Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={cycleSoundSwitch}
              className="h-9 gap-1.5 px-2.5 text-xs font-medium"
              title={`Âm thanh phím: ${soundSwitch}`}
              aria-label={`Âm thanh phím: ${soundSwitch}`}
            >
              {soundSwitch === "off" ? (
                <VolumeX className="size-4 text-muted-foreground" aria-hidden />
              ) : (
                <Volume2 className="size-4 text-primary" aria-hidden />
              )}
              <span className="hidden capitalize md:inline">{soundSwitch}</span>
            </Button>

            {/* Dashboard */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => openDashboard("overview")}
              className="h-9 gap-1.5 px-2.5 text-xs font-medium"
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
              className="hidden h-9 w-9 px-0 xl:inline-flex"
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
                onRetry={initializeGame}
                onOpenDashboard={openDashboard}
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
                  {(["easy", "medium", "hard"] as DifficultyType[]).map((d) => (
                    <button
                      key={d}
                      onClick={() => handleDifficultyChange(d)}
                      data-segment-active={difficulty === d}
                      className={`relative z-10 px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-colors duration-150 ${
                        difficulty === d
                          ? "text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
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
                title="Tự động điều chỉnh độ khó và huấn luyện viên thời gian thực"
              >
                <Sparkle className={`w-3.5 h-3.5 ${adaptiveMode ? "animate-spin text-primary" : ""}`} />
                <span>AI Adaptive</span>
              </button>
            </div>

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

                  return (
                    <span
                      key={wordIdx}
                      ref={isCurrent ? activeWordRef : null}
                      className={`relative inline-block transition-colors duration-100 ${
                        isCurrent
                          ? "text-foreground font-medium"
                          : isPast
                          ? status === "correct"
                            ? "text-muted-foreground/80 animate-word-settle"
                            : "text-destructive/90 underline decoration-destructive decoration-wavy underline-offset-4"
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
                                    className="absolute -left-[1px] top-0 bottom-0 w-[2.5px] bg-primary rounded-full caret-smooth"
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
                              className="inline-block w-[2.5px] h-[1em] bg-primary rounded-full align-middle ml-[1px] caret-smooth"
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
                className="gap-2 px-6 rounded-xl hover:bg-primary hover:text-primary-foreground transition-all shadow-xs"
                title="Bắt đầu lại (Tab + Enter hoặc Esc)"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Bắt đầu lại</span>
                <kbd className="text-[10px] bg-muted px-1.5 py-0.5 rounded border font-mono">
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
