'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <button
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 shrink-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 shrink-0" />
      <span>{resolvedTheme === 'dark' ? 'Modo claro' : 'Modo escuro'}</span>
    </button>
  )
}
