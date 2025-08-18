"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Palette, Check } from "lucide-react"
import { themeManager, THEMES, type ThemeId, type Theme } from "@/lib/themes"
import { PreferencesManager } from "@/lib/preferences"

interface ThemeSelectorProps {
  className?: string
}

export function ThemeSelector({ className }: ThemeSelectorProps) {
  const [currentTheme, setCurrentTheme] = useState<Theme>(themeManager.getCurrentTheme())
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const savedPreferences = PreferencesManager.getPreferences()
    if (savedPreferences.theme) {
      themeManager.setTheme(savedPreferences.theme as ThemeId)
    }

    themeManager.initialize()
    const unsubscribe = themeManager.subscribe(setCurrentTheme)
    return unsubscribe
  }, [])

  const handleThemeChange = (themeId: ThemeId) => {
    themeManager.setTheme(themeId)
    PreferencesManager.savePreferences({ theme: themeId })
    setIsOpen(false)
  }

  const categories = [
    { id: "minimalist", name: "Minimalist", description: "Clean and focused" },
    { id: "nature", name: "Nature", description: "Inspired by natural elements" },
    { id: "dark", name: "Dark", description: "Easy on the eyes" },
    { id: "accessibility", name: "Accessibility", description: "High contrast and readable" },
    { id: "retro", name: "Retro", description: "Classic computing aesthetics" },
  ] as const

  return (
    <div className={className}>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 bg-transparent">
            <Palette className="h-4 w-4" />
            {currentTheme.name}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Choose Your Theme</DialogTitle>
            <DialogDescription>Select a theme that matches your typing style and preferences</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {categories.map((category) => {
              const categoryThemes = themeManager.getThemesByCategory(category.id)
              if (categoryThemes.length === 0) return null

              return (
                <div key={category.id}>
                  <div className="mb-3">
                    <h3 className="text-lg font-semibold">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {categoryThemes.map((theme) => (
                      <ThemePreviewCard
                        key={theme.id}
                        theme={theme}
                        isSelected={currentTheme.id === theme.id}
                        onSelect={() => handleThemeChange(theme.id as ThemeId)}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface ThemePreviewCardProps {
  theme: Theme
  isSelected: boolean
  onSelect: () => void
}

function ThemePreviewCard({ theme, isSelected, onSelect }: ThemePreviewCardProps) {
  return (
    <Card
      className={`relative cursor-pointer transition-all duration-200 hover:scale-105 ${
        isSelected ? "ring-2 ring-primary" : ""
      }`}
      onClick={onSelect}
    >
      {isSelected && (
        <div className="absolute top-2 right-2 z-10">
          <div className="bg-primary text-primary-foreground rounded-full p-1">
            <Check className="h-3 w-3" />
          </div>
        </div>
      )}

      <div className="p-4">
        <div className="mb-3">
          <h4 className="font-medium">{theme.name}</h4>
          <p className="text-xs text-muted-foreground">{theme.description}</p>
        </div>

        {/* Color Preview */}
        <div className="mb-3">
          <div className="flex gap-1 mb-2">
            <div
              className="w-4 h-4 rounded-full border"
              style={{ backgroundColor: theme.colors.background }}
              title="Background"
            />
            <div
              className="w-4 h-4 rounded-full border"
              style={{ backgroundColor: theme.colors.primary }}
              title="Primary"
            />
            <div
              className="w-4 h-4 rounded-full border"
              style={{ backgroundColor: theme.colors.secondary }}
              title="Secondary"
            />
            <div
              className="w-4 h-4 rounded-full border"
              style={{ backgroundColor: theme.colors.accent }}
              title="Accent"
            />
          </div>
        </div>

        {/* Mini Preview */}
        <div
          className="text-xs p-2 rounded border"
          style={{
            backgroundColor: theme.colors.background,
            color: theme.colors.foreground,
            borderColor: theme.colors.border,
          }}
        >
          <div className="mb-1">
            <span style={{ color: theme.colors.primary }}>The quick</span>{" "}
            <span style={{ color: theme.colors.foreground }}>brown fox</span>
          </div>
          <div
            className="text-xs px-1 rounded"
            style={{
              backgroundColor: theme.colors.muted,
              color: theme.colors.mutedForeground,
            }}
          >
            WPM: 65 | Accuracy: 98%
          </div>
        </div>

        <Badge variant="outline" className="mt-2 text-xs">
          {theme.category}
        </Badge>
      </div>
    </Card>
  )
}

// Simple theme selector for quick access
export function QuickThemeSelector({ className }: ThemeSelectorProps) {
  const [currentTheme, setCurrentTheme] = useState<Theme>(themeManager.getCurrentTheme())

  useEffect(() => {
    const unsubscribe = themeManager.subscribe(setCurrentTheme)
    return unsubscribe
  }, [])

  const handleThemeChange = (themeId: string) => {
    themeManager.setTheme(themeId as ThemeId)
    PreferencesManager.savePreferences({ theme: themeId })
  }

  return (
    <Select value={currentTheme.id} onValueChange={handleThemeChange}>
      <SelectTrigger className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.values(THEMES).map((theme) => (
          <SelectItem key={theme.id} value={theme.id}>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: theme.colors.primary }} />
              {theme.name}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
