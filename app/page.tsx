"use client";

import { ThemeSelector } from "@/components/theme-selector";
import { PreferencesManager } from "@/lib/preferences";
import React from "react";

import { StatisticsDashboard } from "@/components/statistics-dashboard";
import { adaptiveAlgorithm } from "@/lib/adaptive-algorithm";
import { languageManager, type ContentType, type DifficultyType, type LanguageType } from "@/lib/languages";
import type { Achievement, ScoreEntry } from "@/lib/scoring-system";
import { StatisticsManager, type GameSession } from "@/lib/statistics";
import { useCallback, useRef, useState } from "react";

interface GameStats {
  wpm: number;
  accuracy: number;
  correctChars: number;
  totalChars: number;
  timeElapsed: number;
  consistency: number;
}

interface GameState {
  isActive: boolean;
  isComplete: boolean;
  currentWordIndex: number;
  currentCharIndex: number;
  userInput: string;
  words: string[];
  startTime: number | null;
  errors: Set<number>;
  perfectWords: number;
}

export default function TypingGame() {
  const [preferences, setPreferences] = useState(() => PreferencesManager.getPreferences());

  const [language, setLanguage] = useState<LanguageType>(preferences.language as LanguageType);
  const [difficulty, setDifficulty] = useState<DifficultyType>(preferences.difficulty as DifficultyType);
  const [contentType, setContentType] = useState<ContentType>(preferences.contentType as ContentType);
  const [wordCount, setWordCount] = useState(preferences.wordCount);
  const [avoidRepeats, setAvoidRepeats] = useState(preferences.avoidRepeats);
  const [adaptiveMode, setAdaptiveMode] = useState(preferences.adaptiveMode);

  const [gameState, setGameState] = useState<GameState>({
    isActive: false,
    isComplete: false,
    currentWordIndex: 0,
    currentCharIndex: 0,
    userInput: "",
    words: [],
    startTime: null,
    errors: new Set(),
    perfectWords: 0,
  });
  const [stats, setStats] = useState<GameStats>({
    wpm: 0,
    accuracy: 100,
    correctChars: 0,
    totalChars: 0,
    timeElapsed: 0,
    consistency: 100,
  });
  const [typingHints, setTypingHints] = useState<string[]>([]);
  const [adaptiveAlert, setAdaptiveAlert] = useState<string | null>(null);
  const [currentScore, setCurrentScore] = useState<ScoreEntry | null>(null);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
  const [wpmHistory, setWpmHistory] = useState<number[]>([]);
  const [showStats, setShowStats] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const generateWords = useCallback(() => {
    let selectedDifficulty = difficulty;

    if (adaptiveMode) {
      const skillAssessment = adaptiveAlgorithm.assessSkill();
      selectedDifficulty = skillAssessment.recommendedDifficulty;

      const weights = adaptiveAlgorithm.getWordSelectionWeights(language);

      if (Object.keys(weights).length > 0) {
        return languageManager.generateContent({
          language,
          difficulty: selectedDifficulty,
          contentType,
          count: wordCount,
          avoidRepeats,
        });
      }
    }

    return languageManager.generateContent({
      language,
      difficulty: selectedDifficulty,
      contentType,
      count: wordCount,
      avoidRepeats,
    });
  }, [language, difficulty, contentType, wordCount, avoidRepeats, adaptiveMode]);

  const initializeGame = useCallback(() => {
    const words = generateWords();
    setGameState({
      isActive: false,
      isComplete: false,
      currentWordIndex: 0,
      currentCharIndex: 0,
      userInput: "",
      words,
      startTime: null,
      errors: new Set(),
      perfectWords: 0,
    });
    setStats({
      wpm: 0,
      accuracy: 100,
      correctChars: 0,
      totalChars: 0,
      timeElapsed: 0,
      consistency: 100,
    });
    setTypingHints(languageManager.getTypingHints(language));
    setAdaptiveAlert(null);
    setCurrentScore(null);
    setNewAchievements([]);
    setWpmHistory([]);

    if (adaptiveMode) {
      adaptiveAlgorithm.startSession(language, difficulty, contentType, wordCount);
    }
  }, [generateWords, language, difficulty, contentType, wordCount, adaptiveMode]);

  const calculateStats = useCallback(
    (state: GameState) => {
      if (!state.startTime) return stats;

      const timeElapsed = (Date.now() - state.startTime) / 1000 / 60; // minutes

      // Calculate correctly typed characters more accurately
      let correctChars = 0;

      // Count all completed words (they were typed correctly to advance)
      for (let i = 0; i < state.currentWordIndex; i++) {
        correctChars += state.words[i].length + 1; // +1 for space
      }

      // For current word, only count correctly typed characters
      if (state.currentWordIndex < state.words.length) {
        const currentWord = state.words[state.currentWordIndex];
        const userInput = state.userInput;

        for (let i = 0; i < Math.min(userInput.length, currentWord.length); i++) {
          if (userInput[i] === currentWord[i]) {
            correctChars++;
          }
        }
      }

      // Remove the extra space from the last word if we're at the end
      if (state.currentWordIndex > 0) {
        correctChars -= 1;
      }

      // Calculate total attempted characters for accuracy
      const totalAttemptedChars = state.words.slice(0, state.currentWordIndex).join(" ").length + state.currentCharIndex;

      // WPM based on correctly typed characters only (standard: 5 characters = 1 word)
      const wpm = timeElapsed > 0 ? Math.round(correctChars / 5 / timeElapsed) : 0;

      // Accuracy based on correct vs attempted characters
      const accuracy = totalAttemptedChars > 0 ? Math.round((correctChars / totalAttemptedChars) * 100) : 100;

      // Calculate consistency (based on WPM variance)
      const recentWpmHistory = [...wpmHistory, wpm].slice(-10);
      let consistency = 100;
      if (recentWpmHistory.length > 1) {
        const avgWpm = recentWpmHistory.reduce((a, b) => a + b, 0) / recentWpmHistory.length;
        const variance = recentWpmHistory.reduce((acc, w) => acc + Math.pow(w - avgWpm, 2), 0) / recentWpmHistory.length;
        consistency = Math.max(0, 100 - Math.sqrt(variance));
      }

      return {
        wpm,
        accuracy,
        correctChars,
        totalChars: totalAttemptedChars,
        timeElapsed: timeElapsed * 60, // convert back to seconds
        consistency,
      };
    },
    [stats, wpmHistory]
  );

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;

      setGameState((prevState) => {
        if (!prevState.isActive && !prevState.startTime) {
          return {
            ...prevState,
            isActive: true,
            startTime: Date.now(),
            userInput: value,
          };
        }

        const currentWord = prevState.words[prevState.currentWordIndex];

        const newErrors = new Set<number>();

        // Only track errors in current word
        for (let i = 0; i < value.length && i < currentWord.length; i++) {
          if (value[i] !== currentWord[i]) {
            newErrors.add(prevState.currentWordIndex * 1000 + i);
          }
        }

        // Add error for typing beyond word length
        if (value.length > currentWord.length) {
          newErrors.add(prevState.currentWordIndex * 1000 + currentWord.length);
        }

        // Check if word is completed
        if (value.endsWith(" ") && value.trim() === currentWord) {
          const nextWordIndex = prevState.currentWordIndex + 1;
          const perfectWords = value.trim() === currentWord ? prevState.perfectWords + 1 : prevState.perfectWords;

          if (nextWordIndex >= prevState.words.length) {
            // Game completed
            const finalState = {
              ...prevState,
              isComplete: true,
              isActive: false,
              currentWordIndex: nextWordIndex,
              currentCharIndex: 0,
              userInput: "",
              errors: new Set<number>(), // Clear errors for final calculation
              perfectWords,
            };

            // Calculate final stats and score
            const finalStats = calculateStats(finalState);
            setStats(finalStats);
            setWpmHistory((prev) => [...prev, finalStats.wpm]);

            if (finalState.startTime) {
              const scoreData = {
                wpm: finalStats.wpm,
                accuracy: finalStats.accuracy,
                consistency: finalStats.consistency,
                timeElapsed: finalStats.timeElapsed,
                wordCount,
                difficulty,
                language,
                perfectWords,
                totalWords: prevState.words.length,
                errorCount: newErrors.size,
              };

              const { score, achievements } = adaptiveAlgorithm.calculateScore(scoreData);
              setCurrentScore(score);
              setNewAchievements(achievements);

              const session: GameSession = {
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                timestamp: Date.now(),
                language,
                difficulty,
                contentType,
                wordCount,
                wpm: finalStats.wpm,
                accuracy: finalStats.accuracy,
                consistency: finalStats.consistency,
                totalScore: score.totalScore,
                rating: score.rating,
                timeElapsed: finalStats.timeElapsed,
                perfectWords,
                totalWords: prevState.words.length,
                errorCount: newErrors.size,
                achievements: achievements.map((a) => a.name),
              };
              StatisticsManager.saveSession(session);

              // Track performance for adaptive algorithm
              if (adaptiveMode) {
                adaptiveAlgorithm.recordPerformance({
                  wpm: finalStats.wpm,
                  accuracy: finalStats.accuracy,
                  consistency: finalStats.consistency,
                  difficulty,
                  language,
                  contentType,
                  wordCount,
                  errorPatterns: Array.from(newErrors),
                  timestamp: Date.now(),
                });
              }
            }

            return finalState;
          }

          return {
            ...prevState,
            currentWordIndex: nextWordIndex,
            currentCharIndex: 0,
            userInput: "",
            errors: new Set<number>(), // Clear errors when moving to next word
            perfectWords,
          };
        }

        return {
          ...prevState,
          currentCharIndex: value.length,
          userInput: value,
          errors: newErrors,
        };
      });

      // Update stats in real-time
      setStats((prevStats) => {
        const newStats = calculateStats({
          ...gameState,
          userInput: value,
        });

        if (newStats.wpm > prevStats.wpm && newStats.wpm > 0) {
          setWpmHistory((prev) => [...prev.slice(-9), newStats.wpm]);
        }

        return newStats;
      });

      if (adaptiveMode && gameState.startTime) {
        const currentPerformance = {
          wpm: stats.wpm,
          accuracy: stats.accuracy,
          consistency: stats.consistency,
        };

        const feedback = adaptiveAlgorithm.getRealtimeFeedback(currentPerformance);
        if (feedback) {
          setAdaptiveAlert(feedback);
          setTimeout(() => setAdaptiveAlert(null), 3000);
        }
      }
    },
    [gameState, calculateStats, stats, wordCount, difficulty, language, adaptiveMode, contentType]
  );

  const resetGame = useCallback(() => {
    initializeGame();
    inputRef.current?.focus();
  }, [initializeGame]);

  const clearAllData = useCallback(() => {
    const confirmed = window.confirm(
      "Bạn có chắc chắn muốn xóa tất cả dữ liệu? Điều này sẽ xóa:\n\n" +
        "• Tất cả thống kê và lịch sử\n" +
        "• Cài đặt theme và preferences\n" +
        "• Dữ liệu adaptive algorithm\n\n" +
        "Hành động này không thể hoàn tác!"
    );

    if (confirmed) {
      // Clear all localStorage data
      const keysToRemove = ["typeflow-sessions", "typeflow-preferences", "typeflow-theme", "typeflow-adaptive-data"];

      keysToRemove.forEach((key) => {
        localStorage.removeItem(key);
      });

      // Reset all state to defaults
      const defaultPrefs = PreferencesManager.getPreferences();
      setPreferences(defaultPrefs);
      setLanguage(defaultPrefs.language as LanguageType);
      setDifficulty(defaultPrefs.difficulty as DifficultyType);
      setContentType(defaultPrefs.contentType as ContentType);
      setWordCount(defaultPrefs.wordCount);
      setAvoidRepeats(defaultPrefs.avoidRepeats);
      setAdaptiveMode(defaultPrefs.adaptiveMode);

      // Reset game state
      initializeGame();

      alert("Đã xóa tất cả dữ liệu thành công!");
    }
  }, [initializeGame]);

  // Initialize game on mount and when settings change
  React.useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  React.useEffect(() => {
    const savedTheme = preferences.theme;
    if (savedTheme) {
      // Apply theme by dispatching custom event
      window.dispatchEvent(new CustomEvent("apply-theme", { detail: savedTheme }));
    }
  }, [preferences.theme]);

  const renderWord = (word: string, wordIndex: number) => {
    const isCurrentWord = wordIndex === gameState.currentWordIndex;
    const isCompletedWord = wordIndex < gameState.currentWordIndex;

    if (isCurrentWord) {
      return (
        <span
          key={wordIndex}
          className="relative"
        >
          {word.split("").map((char, charIndex) => {
            const isTyped = charIndex < gameState.currentCharIndex;
            const isCorrect = isTyped && gameState.userInput[charIndex] === char;
            const isIncorrect = isTyped && gameState.userInput[charIndex] !== char;
            const isCursor = charIndex === gameState.currentCharIndex;

            return (
              <span
                key={charIndex}
                className={`relative ${
                  isCorrect
                    ? "text-green-400 bg-green-400/10"
                    : isIncorrect
                    ? "text-red-400 bg-red-400/20"
                    : isCursor
                    ? "bg-primary/30 animate-pulse"
                    : "text-muted-foreground"
                }`}
              >
                {char}
              </span>
            );
          })}
          {gameState.currentCharIndex === word.length && <span className="bg-primary/30 animate-pulse ml-1">|</span>}
        </span>
      );
    }

    return (
      <span
        key={wordIndex}
        className={isCompletedWord ? "text-green-400" : "text-muted-foreground"}
      >
        {word}
      </span>
    );
  };

  const updateLanguage = (newLanguage: LanguageType) => {
    setLanguage(newLanguage);
    PreferencesManager.savePreferences({ language: newLanguage });
  };

  const updateDifficulty = (newDifficulty: DifficultyType) => {
    setDifficulty(newDifficulty);
    PreferencesManager.savePreferences({ difficulty: newDifficulty });
  };

  const updateContentType = (newContentType: ContentType) => {
    setContentType(newContentType);
    PreferencesManager.savePreferences({ contentType: newContentType });
  };

  const updateWordCount = (newWordCount: number) => {
    setWordCount(newWordCount);
    PreferencesManager.savePreferences({ wordCount: newWordCount });
  };

  const updateAvoidRepeats = (newAvoidRepeats: boolean) => {
    setAvoidRepeats(newAvoidRepeats);
    PreferencesManager.savePreferences({ avoidRepeats: newAvoidRepeats });
  };

  const updateAdaptiveMode = (newAdaptiveMode: boolean) => {
    setAdaptiveMode(newAdaptiveMode);
    PreferencesManager.savePreferences({ adaptiveMode: newAdaptiveMode });
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-primary">TypeFlow</h1>
          <p className="text-muted-foreground">Master typing in multiple languages</p>
          <div className="flex justify-center space-x-4 mt-4">
            <button
              onClick={() => setShowStats(true)}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
            >
              View Statistics
            </button>
            <ThemeSelector />
            <button
              onClick={clearAllData}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
              title="Clear all saved data"
            >
              Clear Data
            </button>
          </div>
        </div>

        {/* Game Controls */}
        <div className="bg-card border rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Language</label>
              <select
                value={language}
                onChange={(e) => updateLanguage(e.target.value as LanguageType)}
                className="w-full p-2 bg-background border rounded-md"
                disabled={gameState.isActive}
              >
                <option value="english">English</option>
                <option value="vietnamese">Tiếng Việt</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Difficulty
                {adaptiveMode && <span className="text-xs text-muted-foreground ml-1">(AI will adjust)</span>}
              </label>
              <select
                value={difficulty}
                onChange={(e) => updateDifficulty(e.target.value as DifficultyType)}
                className={`w-full p-2 bg-background border rounded-md ${adaptiveMode ? "opacity-75" : ""}`}
                disabled={gameState.isActive}
                title={adaptiveMode ? "Base difficulty - AI will adjust automatically" : "Select difficulty level"}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Content</label>
              <select
                value={contentType}
                onChange={(e) => updateContentType(e.target.value as ContentType)}
                className="w-full p-2 bg-background border rounded-md"
                disabled={gameState.isActive}
              >
                <option value="words">Words</option>
                <option value="phrases">Phrases</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Word Count</label>
              <select
                value={wordCount}
                onChange={(e) => updateWordCount(Number(e.target.value))}
                className="w-full p-2 bg-background border rounded-md"
                disabled={gameState.isActive}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={avoidRepeats}
                onChange={(e) => updateAvoidRepeats(e.target.checked)}
                disabled={gameState.isActive}
                className="rounded"
              />
              <span className="text-sm">Avoid repeats</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={adaptiveMode}
                onChange={(e) => updateAdaptiveMode(e.target.checked)}
                disabled={gameState.isActive}
                className="rounded"
              />
              <span className="text-sm">
                Adaptive mode
                <span className="text-xs text-muted-foreground block">
                  {adaptiveMode ? "AI adjusts difficulty automatically" : "Manual difficulty selection"}
                </span>
              </span>
            </label>
          </div>
        </div>

        {/* Stats Display */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-primary">{stats.wpm}</div>
            <div className="text-sm text-muted-foreground">WPM</div>
          </div>
          <div className="bg-card border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-primary">{stats.accuracy}%</div>
            <div className="text-sm text-muted-foreground">Accuracy</div>
          </div>
          <div className="bg-card border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-primary">{Math.round(stats.consistency)}%</div>
            <div className="text-sm text-muted-foreground">Consistency</div>
          </div>
          <div className="bg-card border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-primary">{Math.round(stats.timeElapsed)}</div>
            <div className="text-sm text-muted-foreground">Seconds</div>
          </div>
        </div>

        {/* Typing Area */}
        <div className="bg-card border rounded-lg p-6">
          <div className="text-lg leading-relaxed mb-4 font-mono min-h-[120px] p-4 bg-background rounded-md">
            {gameState.words.map((word, index) => (
              <span key={index}>
                {renderWord(word, index)}
                {index < gameState.words.length - 1 && " "}
              </span>
            ))}
          </div>

          <input
            ref={inputRef}
            type="text"
            value={gameState.userInput}
            onChange={handleInput}
            disabled={gameState.isComplete}
            className="w-full p-3 bg-background border rounded-md text-lg font-mono focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder={gameState.isComplete ? "Test completed!" : "Start typing..."}
            autoFocus
          />
        </div>

        {/* Adaptive Alert */}
        {adaptiveAlert && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-blue-400 font-medium">AI Coach:</span>
              <span className="text-blue-300">{adaptiveAlert}</span>
            </div>
          </div>
        )}

        {/* Language-specific Hints */}
        {typingHints.length > 0 && (
          <div className="bg-card border rounded-lg p-4">
            <h3 className="font-medium mb-2">Typing Tips for {language === "english" ? "English" : "Vietnamese"}:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              {typingHints.map((hint, index) => (
                <li key={index}>• {hint}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Score Display */}
        {currentScore && (
          <div className="bg-card border rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4 text-center">Final Score</h3>
            <div className="text-center space-y-2">
              <div className="text-4xl font-bold text-primary">{currentScore.totalScore}</div>
              <div className="text-lg text-muted-foreground">
                Rating: <span className="text-primary font-medium">{currentScore.rating}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                <div>Speed: {currentScore.speedScore}</div>
                <div>Accuracy: {currentScore.accuracyScore}</div>
                <div>Consistency: {currentScore.consistencyScore}</div>
                <div>Bonus: {currentScore.bonusScore}</div>
              </div>
            </div>
          </div>
        )}

        {/* Achievements */}
        {newAchievements.length > 0 && (
          <div className="bg-card border rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4 text-center">New Achievements! 🎉</h3>
            <div className="space-y-2">
              {newAchievements.map((achievement, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-3 bg-primary/10 rounded-md"
                >
                  <span className="text-2xl">{achievement.icon}</span>
                  <div>
                    <div className="font-medium">{achievement.name}</div>
                    <div className="text-sm text-muted-foreground">{achievement.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reset Button */}
        <div className="text-center">
          <button
            onClick={resetGame}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            {gameState.isComplete ? "Start New Test" : "Reset Test"}
          </button>
        </div>

        {/* Statistics Dashboard */}
        <StatisticsDashboard
          isOpen={showStats}
          onClose={() => setShowStats(false)}
        />
      </div>
    </div>
  );
}
