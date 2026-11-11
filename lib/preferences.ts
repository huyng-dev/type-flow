export interface UserPreferences {
  theme: string;
  language: string;
  difficulty: string;
  contentType: string;
  wordCount: number;
  avoidRepeats: boolean;
  adaptiveMode: boolean;
  sidebarOpen: boolean;
}

export class PreferencesManager {
  private static readonly STORAGE_KEY = "typeflow-preferences";

  private static readonly DEFAULT_PREFERENCES: UserPreferences = {
    theme: "forest_green",
    language: "english",
    difficulty: "medium",
    contentType: "words",
    wordCount: 25,
    avoidRepeats: true,
    adaptiveMode: true,
    sidebarOpen: true,
  };

  // Fallback storage when localStorage is not available (SSR / tests)
  private static inMemoryPreferences: UserPreferences | null = null;

  private static getStorageAvailable(): boolean {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
  }

  static savePreferences(preferences: Partial<UserPreferences>): void {
    const current = this.getPreferences();
    const updated = { ...current, ...preferences };
    if (this.getStorageAvailable()) {
      try {
        window.localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        // Fallback to in-memory if write fails (e.g., storage quota)
        this.inMemoryPreferences = updated;
        console.warn("Preferences saved to in-memory fallback:", err);
      }
    } else {
      // SSR or test environment: keep in memory
      this.inMemoryPreferences = updated;
    }
  }

  static getPreferences(): UserPreferences {
    // If in-memory prefs exist (either SSR set or fallback), return merged with defaults
    if (this.inMemoryPreferences) {
      return { ...this.DEFAULT_PREFERENCES, ...this.inMemoryPreferences };
    }

    if (this.getStorageAvailable()) {
      try {
        const data = window.localStorage.getItem(this.STORAGE_KEY);
        if (data) {
          const parsed = JSON.parse(data);
          // Merge with defaults to handle new preference keys
          return { ...this.DEFAULT_PREFERENCES, ...parsed };
        }
      } catch (error) {
        console.warn("Failed to load preferences from localStorage:", error);
      }
    }

    return this.DEFAULT_PREFERENCES;
  }

  static resetPreferences(): void {
    if (this.getStorageAvailable()) {
      try {
        window.localStorage.removeItem(this.STORAGE_KEY);
      } catch {
        // ignore
      }
    }
    this.inMemoryPreferences = null;
  }

  static exportPreferences(): string {
    return JSON.stringify(this.getPreferences(), null, 2);
  }

  static importPreferences(jsonData: string): boolean {
    try {
      const preferences = JSON.parse(jsonData) as UserPreferences;
      this.savePreferences(preferences);
      return true;
    } catch {
      return false;
    }
  }
}
