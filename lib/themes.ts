export interface Theme {
  id: string
  name: string
  description: string
  category: "minimalist" | "nature" | "dark" | "accessibility" | "retro"
  colors: {
    background: string
    foreground: string
    card: string
    cardForeground: string
    popover: string
    popoverForeground: string
    primary: string
    primaryForeground: string
    secondary: string
    secondaryForeground: string
    muted: string
    mutedForeground: string
    accent: string
    accentForeground: string
    destructive: string
    destructiveForeground: string
    border: string
    input: string
    ring: string
  }
  fonts?: {
    sans?: string
    mono?: string
  }
  backgroundPattern?: string
  customCSS?: string
}

/**
 * Màu ngữ nghĩa (success / warning / info) không khai báo riêng cho từng theme
 * mà suy ra từ độ sáng của nền, nên mọi theme — kể cả theme thêm sau này —
 * đều có bộ màu trạng thái tương phản đúng.
 */
const SEMANTIC_LIGHT = {
  success: "oklch(0.52 0.14 150)",
  successForeground: "oklch(0.99 0.01 150)",
  warning: "oklch(0.6 0.14 65)",
  warningForeground: "oklch(1 0.01 65)",
  info: "oklch(0.55 0.12 250)",
  infoForeground: "oklch(0.99 0.01 250)",
}

const SEMANTIC_DARK = {
  success: "oklch(0.76 0.15 150)",
  successForeground: "oklch(0.16 0.03 150)",
  warning: "oklch(0.8 0.14 75)",
  warningForeground: "oklch(0.2 0.04 75)",
  info: "oklch(0.75 0.12 250)",
  infoForeground: "oklch(0.15 0.03 250)",
}

function isDarkBackground(color: string): boolean {
  const match = /oklch\(\s*([\d.]+)/i.exec(color)
  if (!match) return false
  return Number.parseFloat(match[1]) < 0.55
}

export const THEMES: Record<string, Theme> = {
  // Minimalist Themes
  minimal_light: {
    id: "minimal_light",
    name: "Minimal Light",
    description: "Clean and simple with maximum focus",
    category: "minimalist",
    colors: {
      background: "oklch(1 0 0)", // Pure white
      foreground: "oklch(0.15 0 0)", // Almost black
      card: "oklch(0.99 0 0)", // Off-white
      cardForeground: "oklch(0.15 0 0)",
      popover: "oklch(1 0 0)",
      popoverForeground: "oklch(0.15 0 0)",
      primary: "oklch(0.15 0 0)", // Black primary
      primaryForeground: "oklch(1 0 0)",
      secondary: "oklch(0.95 0 0)", // Light gray
      secondaryForeground: "oklch(0.15 0 0)",
      muted: "oklch(0.97 0 0)",
      mutedForeground: "oklch(0.45 0 0)",
      accent: "oklch(0.92 0 0)",
      accentForeground: "oklch(0.15 0 0)",
      destructive: "oklch(0.55 0.22 25)",
      destructiveForeground: "oklch(1 0 0)",
      border: "oklch(0.92 0 0)",
      input: "oklch(0.99 0 0)",
      ring: "oklch(0.15 0 0 / 0.3)",
    },
  },

  minimal_dark: {
    id: "minimal_dark",
    name: "Minimal Dark",
    description: "Dark minimalism for focused typing",
    category: "minimalist",
    colors: {
      background: "oklch(0.05 0 0)", // Almost black
      foreground: "oklch(0.95 0 0)", // Almost white
      card: "oklch(0.08 0 0)",
      cardForeground: "oklch(0.95 0 0)",
      popover: "oklch(0.05 0 0)",
      popoverForeground: "oklch(0.95 0 0)",
      primary: "oklch(0.95 0 0)", // White primary
      primaryForeground: "oklch(0.05 0 0)",
      secondary: "oklch(0.15 0 0)",
      secondaryForeground: "oklch(0.95 0 0)",
      muted: "oklch(0.12 0 0)",
      mutedForeground: "oklch(0.65 0 0)",
      accent: "oklch(0.18 0 0)",
      accentForeground: "oklch(0.95 0 0)",
      destructive: "oklch(0.55 0.22 25)",
      destructiveForeground: "oklch(0.95 0 0)",
      border: "oklch(0.18 0 0)",
      input: "oklch(0.08 0 0)",
      ring: "oklch(0.95 0 0 / 0.3)",
    },
  },

  // Nature-Inspired Themes
  forest_green: {
    id: "forest_green",
    name: "Forest Green",
    description: "Inspired by deep forest tranquility",
    category: "nature",
    colors: {
      background: "oklch(0.98 0.01 142)", // Very light green
      foreground: "oklch(0.2 0.05 142)", // Dark forest green
      card: "oklch(0.96 0.02 142)",
      cardForeground: "oklch(0.2 0.05 142)",
      popover: "oklch(0.98 0.01 142)",
      popoverForeground: "oklch(0.2 0.05 142)",
      primary: "oklch(0.35 0.12 142)", // Forest green
      primaryForeground: "oklch(0.98 0.01 142)",
      secondary: "oklch(0.75 0.08 85)", // Light green
      secondaryForeground: "oklch(0.2 0.05 142)",
      muted: "oklch(0.94 0.02 142)",
      mutedForeground: "oklch(0.45 0.05 142)",
      accent: "oklch(0.65 0.15 85)", // Bright green accent
      accentForeground: "oklch(0.98 0.01 142)",
      destructive: "oklch(0.55 0.22 25)",
      destructiveForeground: "oklch(0.98 0.01 142)",
      border: "oklch(0.88 0.03 142)",
      input: "oklch(0.96 0.02 142)",
      ring: "oklch(0.35 0.12 142 / 0.4)",
    },
    backgroundPattern:
      "radial-gradient(circle at 20% 80%, oklch(0.96 0.02 142) 0%, transparent 50%), radial-gradient(circle at 80% 20%, oklch(0.94 0.03 85) 0%, transparent 50%)",
  },

  ocean_blue: {
    id: "ocean_blue",
    name: "Ocean Blue",
    description: "Calm and flowing like ocean waves",
    category: "nature",
    colors: {
      background: "oklch(0.98 0.01 220)", // Very light blue
      foreground: "oklch(0.2 0.05 220)", // Dark ocean blue
      card: "oklch(0.96 0.02 220)",
      cardForeground: "oklch(0.2 0.05 220)",
      popover: "oklch(0.98 0.01 220)",
      popoverForeground: "oklch(0.2 0.05 220)",
      primary: "oklch(0.45 0.15 220)", // Ocean blue
      primaryForeground: "oklch(0.98 0.01 220)",
      secondary: "oklch(0.75 0.08 200)", // Light blue
      secondaryForeground: "oklch(0.2 0.05 220)",
      muted: "oklch(0.94 0.02 220)",
      mutedForeground: "oklch(0.45 0.05 220)",
      accent: "oklch(0.65 0.15 200)", // Bright blue accent
      accentForeground: "oklch(0.98 0.01 220)",
      destructive: "oklch(0.55 0.22 25)",
      destructiveForeground: "oklch(0.98 0.01 220)",
      border: "oklch(0.88 0.03 220)",
      input: "oklch(0.96 0.02 220)",
      ring: "oklch(0.45 0.15 220 / 0.4)",
    },
    backgroundPattern:
      "radial-gradient(circle at 30% 70%, oklch(0.96 0.02 220) 0%, transparent 50%), radial-gradient(circle at 70% 30%, oklch(0.94 0.03 200) 0%, transparent 50%)",
  },

  sunset_warm: {
    id: "sunset_warm",
    name: "Sunset Warm",
    description: "Warm and energizing like a sunset",
    category: "nature",
    colors: {
      background: "oklch(0.98 0.01 50)", // Very light orange
      foreground: "oklch(0.2 0.05 30)", // Dark brown
      card: "oklch(0.96 0.02 50)",
      cardForeground: "oklch(0.2 0.05 30)",
      popover: "oklch(0.98 0.01 50)",
      popoverForeground: "oklch(0.2 0.05 30)",
      primary: "oklch(0.55 0.18 40)", // Sunset orange
      primaryForeground: "oklch(0.98 0.01 50)",
      secondary: "oklch(0.75 0.08 60)", // Light orange
      secondaryForeground: "oklch(0.2 0.05 30)",
      muted: "oklch(0.94 0.02 50)",
      mutedForeground: "oklch(0.45 0.05 30)",
      accent: "oklch(0.65 0.15 25)", // Warm red accent
      accentForeground: "oklch(0.98 0.01 50)",
      destructive: "oklch(0.55 0.22 25)",
      destructiveForeground: "oklch(0.98 0.01 50)",
      border: "oklch(0.88 0.03 50)",
      input: "oklch(0.96 0.02 50)",
      ring: "oklch(0.55 0.18 40 / 0.4)",
    },
    backgroundPattern:
      "radial-gradient(circle at 10% 90%, oklch(0.96 0.02 50) 0%, transparent 50%), radial-gradient(circle at 90% 10%, oklch(0.94 0.03 25) 0%, transparent 50%)",
  },

  cherry_blossom: {
    id: "cherry_blossom",
    name: "Cherry Blossom",
    description: "Soft and delicate like spring flowers",
    category: "nature",
    colors: {
      background: "oklch(0.98 0.01 340)", // Very light pink
      foreground: "oklch(0.25 0.05 340)", // Dark pink-brown
      card: "oklch(0.96 0.02 340)",
      cardForeground: "oklch(0.25 0.05 340)",
      popover: "oklch(0.98 0.01 340)",
      popoverForeground: "oklch(0.25 0.05 340)",
      primary: "oklch(0.55 0.15 340)", // Cherry pink
      primaryForeground: "oklch(0.98 0.01 340)",
      secondary: "oklch(0.75 0.08 320)", // Light pink
      secondaryForeground: "oklch(0.25 0.05 340)",
      muted: "oklch(0.94 0.02 340)",
      mutedForeground: "oklch(0.45 0.05 340)",
      accent: "oklch(0.65 0.15 320)", // Bright pink accent
      accentForeground: "oklch(0.98 0.01 340)",
      destructive: "oklch(0.55 0.22 25)",
      destructiveForeground: "oklch(0.98 0.01 340)",
      border: "oklch(0.88 0.03 340)",
      input: "oklch(0.96 0.02 340)",
      ring: "oklch(0.55 0.15 340 / 0.4)",
    },
    backgroundPattern:
      "radial-gradient(circle at 25% 75%, oklch(0.96 0.02 340) 0%, transparent 50%), radial-gradient(circle at 75% 25%, oklch(0.94 0.03 320) 0%, transparent 50%)",
  },

  arctic_frost: {
    id: "arctic_frost",
    name: "Arctic Frost",
    description: "Cool and crisp like winter morning",
    category: "nature",
    colors: {
      background: "oklch(0.98 0.01 200)", // Very light blue-white
      foreground: "oklch(0.2 0.05 200)", // Dark blue-gray
      card: "oklch(0.96 0.02 200)",
      cardForeground: "oklch(0.2 0.05 200)",
      popover: "oklch(0.98 0.01 200)",
      popoverForeground: "oklch(0.2 0.05 200)",
      primary: "oklch(0.4 0.12 200)", // Ice blue
      primaryForeground: "oklch(0.98 0.01 200)",
      secondary: "oklch(0.75 0.06 180)", // Light cyan
      secondaryForeground: "oklch(0.2 0.05 200)",
      muted: "oklch(0.94 0.02 200)",
      mutedForeground: "oklch(0.45 0.05 200)",
      accent: "oklch(0.6 0.12 180)", // Bright cyan accent
      accentForeground: "oklch(0.98 0.01 200)",
      destructive: "oklch(0.55 0.22 25)",
      destructiveForeground: "oklch(0.98 0.01 200)",
      border: "oklch(0.88 0.03 200)",
      input: "oklch(0.96 0.02 200)",
      ring: "oklch(0.4 0.12 200 / 0.4)",
    },
    backgroundPattern:
      "radial-gradient(circle at 40% 60%, oklch(0.96 0.02 200) 0%, transparent 50%), radial-gradient(circle at 60% 40%, oklch(0.94 0.03 180) 0%, transparent 50%)",
  },

  lavender_dream: {
    id: "lavender_dream",
    name: "Lavender Dream",
    description: "Soft purple tones for peaceful typing",
    category: "nature",
    colors: {
      background: "oklch(0.98 0.01 280)", // Very light purple
      foreground: "oklch(0.25 0.05 280)", // Dark purple
      card: "oklch(0.96 0.02 280)",
      cardForeground: "oklch(0.25 0.05 280)",
      popover: "oklch(0.98 0.01 280)",
      popoverForeground: "oklch(0.25 0.05 280)",
      primary: "oklch(0.5 0.15 280)", // Lavender purple
      primaryForeground: "oklch(0.98 0.01 280)",
      secondary: "oklch(0.75 0.08 260)", // Light purple
      secondaryForeground: "oklch(0.25 0.05 280)",
      muted: "oklch(0.94 0.02 280)",
      mutedForeground: "oklch(0.45 0.05 280)",
      accent: "oklch(0.65 0.15 260)", // Bright purple accent
      accentForeground: "oklch(0.98 0.01 280)",
      destructive: "oklch(0.55 0.22 25)",
      destructiveForeground: "oklch(0.98 0.01 280)",
      border: "oklch(0.88 0.03 280)",
      input: "oklch(0.96 0.02 280)",
      ring: "oklch(0.5 0.15 280 / 0.4)",
    },
    backgroundPattern:
      "radial-gradient(circle at 35% 65%, oklch(0.96 0.02 280) 0%, transparent 50%), radial-gradient(circle at 65% 35%, oklch(0.94 0.03 260) 0%, transparent 50%)",
  },

  // Dark Themes
  midnight: {
    id: "midnight",
    name: "Midnight",
    description: "Deep dark theme for night typing",
    category: "dark",
    colors: {
      background: "oklch(0.08 0.02 240)", // Dark blue-black
      foreground: "oklch(0.92 0.01 60)", // Warm white
      card: "oklch(0.12 0.02 240)",
      cardForeground: "oklch(0.92 0.01 60)",
      popover: "oklch(0.08 0.02 240)",
      popoverForeground: "oklch(0.92 0.01 60)",
      primary: "oklch(0.65 0.15 200)", // Bright blue
      primaryForeground: "oklch(0.08 0.02 240)",
      secondary: "oklch(0.25 0.03 240)",
      secondaryForeground: "oklch(0.92 0.01 60)",
      muted: "oklch(0.15 0.02 240)",
      mutedForeground: "oklch(0.65 0.01 60)",
      accent: "oklch(0.75 0.18 280)", // Purple accent
      accentForeground: "oklch(0.08 0.02 240)",
      destructive: "oklch(0.55 0.22 25)",
      destructiveForeground: "oklch(0.92 0.01 60)",
      border: "oklch(0.22 0.02 240)",
      input: "oklch(0.12 0.02 240)",
      ring: "oklch(0.65 0.15 200 / 0.4)",
    },
  },

  cyberpunk_neon: {
    id: "cyberpunk_neon",
    name: "Cyberpunk Neon",
    description: "Futuristic neon colors for night coding",
    category: "dark",
    colors: {
      background: "oklch(0.08 0.02 280)", // Dark purple-black
      foreground: "oklch(0.9 0.1 300)", // Bright magenta-white
      card: "oklch(0.12 0.03 280)",
      cardForeground: "oklch(0.9 0.1 300)",
      popover: "oklch(0.08 0.02 280)",
      popoverForeground: "oklch(0.9 0.1 300)",
      primary: "oklch(0.7 0.25 300)", // Neon magenta
      primaryForeground: "oklch(0.08 0.02 280)",
      secondary: "oklch(0.25 0.05 280)",
      secondaryForeground: "oklch(0.9 0.1 300)",
      muted: "oklch(0.15 0.03 280)",
      mutedForeground: "oklch(0.65 0.08 300)",
      accent: "oklch(0.75 0.25 180)", // Neon cyan accent
      accentForeground: "oklch(0.08 0.02 280)",
      destructive: "oklch(0.65 0.25 25)", // Neon red
      destructiveForeground: "oklch(0.08 0.02 280)",
      border: "oklch(0.3 0.08 280)",
      input: "oklch(0.12 0.03 280)",
      ring: "oklch(0.7 0.25 300 / 0.5)",
    },
    customCSS: `
      .cyberpunk-glow {
        text-shadow: 0 0 5px currentColor, 0 0 10px currentColor;
        box-shadow: 0 0 5px currentColor;
      }
    `,
  },

  // High Contrast for Accessibility
  high_contrast: {
    id: "high_contrast",
    name: "High Contrast",
    description: "Maximum contrast for accessibility",
    category: "accessibility",
    colors: {
      background: "oklch(1 0 0)", // Pure white
      foreground: "oklch(0 0 0)", // Pure black
      card: "oklch(1 0 0)",
      cardForeground: "oklch(0 0 0)",
      popover: "oklch(1 0 0)",
      popoverForeground: "oklch(0 0 0)",
      primary: "oklch(0 0 0)", // Pure black
      primaryForeground: "oklch(1 0 0)",
      secondary: "oklch(0.9 0 0)",
      secondaryForeground: "oklch(0 0 0)",
      muted: "oklch(0.95 0 0)",
      mutedForeground: "oklch(0.3 0 0)",
      accent: "oklch(0.85 0 0)",
      accentForeground: "oklch(0 0 0)",
      destructive: "oklch(0.4 0.3 25)", // High contrast red
      destructiveForeground: "oklch(1 0 0)",
      border: "oklch(0.8 0 0)",
      input: "oklch(1 0 0)",
      ring: "oklch(0 0 0 / 0.5)",
    },
  },

  // Retro Theme
  retro_terminal: {
    id: "retro_terminal",
    name: "Retro Terminal",
    description: "Classic green-on-black terminal aesthetic",
    category: "retro",
    colors: {
      background: "oklch(0.05 0 0)", // Almost black
      foreground: "oklch(0.8 0.15 142)", // Bright green
      card: "oklch(0.08 0 0)",
      cardForeground: "oklch(0.8 0.15 142)",
      popover: "oklch(0.05 0 0)",
      popoverForeground: "oklch(0.8 0.15 142)",
      primary: "oklch(0.8 0.15 142)", // Bright green
      primaryForeground: "oklch(0.05 0 0)",
      secondary: "oklch(0.15 0 0)",
      secondaryForeground: "oklch(0.8 0.15 142)",
      muted: "oklch(0.12 0 0)",
      mutedForeground: "oklch(0.6 0.12 142)",
      accent: "oklch(0.9 0.18 85)", // Brighter green
      accentForeground: "oklch(0.05 0 0)",
      destructive: "oklch(0.7 0.25 25)", // Bright red
      destructiveForeground: "oklch(0.05 0 0)",
      border: "oklch(0.3 0.1 142)",
      input: "oklch(0.08 0 0)",
      ring: "oklch(0.8 0.15 142 / 0.5)",
    },
    fonts: {
      mono: "ui-monospace, 'Courier New', monospace",
    },
    customCSS: `
      .retro-glow {
        text-shadow: 0 0 5px currentColor, 0 0 10px currentColor, 0 0 15px currentColor;
      }
      .retro-border {
        box-shadow: 0 0 0 1px currentColor, inset 0 0 0 1px currentColor;
      }
    `,
  },

  sepia_vintage: {
    id: "sepia_vintage",
    name: "Sepia Vintage",
    description: "Warm vintage tones like old photographs",
    category: "retro",
    colors: {
      background: "oklch(0.95 0.02 60)", // Warm cream
      foreground: "oklch(0.25 0.05 40)", // Dark brown
      card: "oklch(0.93 0.03 60)",
      cardForeground: "oklch(0.25 0.05 40)",
      popover: "oklch(0.95 0.02 60)",
      popoverForeground: "oklch(0.25 0.05 40)",
      primary: "oklch(0.4 0.1 40)", // Sepia brown
      primaryForeground: "oklch(0.95 0.02 60)",
      secondary: "oklch(0.7 0.06 50)", // Light tan
      secondaryForeground: "oklch(0.25 0.05 40)",
      muted: "oklch(0.88 0.03 60)",
      mutedForeground: "oklch(0.45 0.05 60)",
      accent: "oklch(0.55 0.12 30)", // Warm brown accent
      accentForeground: "oklch(0.95 0.02 60)",
      destructive: "oklch(0.5 0.15 25)",
      destructiveForeground: "oklch(0.95 0.02 60)",
      border: "oklch(0.8 0.04 60)",
      input: "oklch(0.93 0.03 60)",
      ring: "oklch(0.4 0.1 40 / 0.4)",
    },
  },
}

export type ThemeId = keyof typeof THEMES

export class ThemeManager {
  private currentTheme: ThemeId = "forest_green"
  private listeners: ((theme: Theme) => void)[] = []

  constructor() {
    // Load theme from localStorage if available
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("typeflow-theme") as ThemeId
      if (savedTheme && THEMES[savedTheme]) {
        this.currentTheme = savedTheme
      }
    }
  }

  getCurrentTheme(): Theme {
    return THEMES[this.currentTheme]
  }

  getCurrentThemeId(): ThemeId {
    return this.currentTheme
  }

  setTheme(themeId: ThemeId) {
    if (THEMES[themeId]) {
      this.currentTheme = themeId
      if (typeof window !== "undefined") {
        localStorage.setItem("typeflow-theme", themeId)
      }
      this.withThemeCrossfade(themeId, () => this.applyTheme(THEMES[themeId]))
      this.notifyListeners(THEMES[themeId])
    }
  }

  /**
   * Bọc việc đổi theme trong một lớp crossfade ngắn.
   * Bỏ qua với theme tương phản cao (flash sẽ khó chịu) và khi người dùng
   * đã yêu cầu giảm chuyển động.
   */
  private withThemeCrossfade(themeId: ThemeId, apply: () => void) {
    if (typeof document === "undefined") {
      apply()
      return
    }

    const reduced =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches

    if (reduced || themeId === "high_contrast") {
      apply()
      return
    }

    const root = document.documentElement
    root.classList.add("theme-transition")
    apply()
    window.setTimeout(() => root.classList.remove("theme-transition"), 300)
  }

  private applyTheme(theme: Theme) {
    if (typeof document === "undefined") return

    const root = document.documentElement

    // Apply color variables
    Object.entries(theme.colors).forEach(([key, value]) => {
      const cssVar = key.replace(/([A-Z])/g, "-$1").toLowerCase()
      root.style.setProperty(`--${cssVar}`, value)
    })

    // Semantic colors: derive from the background lightness of this theme
    const semantic = isDarkBackground(theme.colors.background) ? SEMANTIC_DARK : SEMANTIC_LIGHT
    Object.entries(semantic).forEach(([key, value]) => {
      const cssVar = key.replace(/([A-Z])/g, "-$1").toLowerCase()
      root.style.setProperty(`--${cssVar}`, value)
    })

    // Apply background pattern if exists
    if (theme.backgroundPattern) {
      root.style.setProperty("--background-pattern", theme.backgroundPattern)
      document.body.style.backgroundImage = `var(--background-pattern), var(--background)`
    } else {
      document.body.style.backgroundImage = ""
    }

    // Apply custom CSS if exists
    if (theme.customCSS) {
      let styleElement = document.getElementById("theme-custom-css")
      if (!styleElement) {
        styleElement = document.createElement("style")
        styleElement.id = "theme-custom-css"
        document.head.appendChild(styleElement)
      }
      styleElement.textContent = theme.customCSS
    }

    // Apply theme class to body for additional styling
    document.body.className = document.body.className.replace(/theme-\w+/g, "")
    document.body.classList.add(`theme-${theme.id}`)
  }

  subscribe(listener: (theme: Theme) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  private notifyListeners(theme: Theme) {
    this.listeners.forEach((listener) => listener(theme))
  }

  getThemesByCategory(category?: Theme["category"]): Theme[] {
    const themes = Object.values(THEMES)
    return category ? themes.filter((theme) => theme.category === category) : themes
  }

  // Initialize theme on mount
  initialize() {
    this.applyTheme(this.getCurrentTheme())
  }
}

export const themeManager = new ThemeManager()
