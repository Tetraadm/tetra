'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <button
      onClick={toggleTheme}
      className={`theme-toggle ${className}`}
      aria-label={theme === 'dark' ? 'Bytt til lys modus' : 'Bytt til mørk modus'}
      title={theme === 'dark' ? 'Lys modus' : 'Mørk modus'}
    >
      {theme === 'dark' ? (
        <Sun size={18} aria-hidden="true" />
      ) : (
        <Moon size={18} aria-hidden="true" />
      )}
    </button>
  )
}
