import { create } from 'zustand'

type Theme = 'light' | 'dark' | 'system'
type ResolvedTheme = 'light' | 'dark'

const STORAGE_KEY = 'cojunta-theme'

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(resolved: ResolvedTheme) {
  const root = document.documentElement
  if (resolved === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

function resolveTheme(theme: Theme): ResolvedTheme {
  return theme === 'system' ? getSystemTheme() : theme
}

interface ThemeState {
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
  initTheme: () => void
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'system',
  resolvedTheme: 'light',

  setTheme: (theme: Theme) => {
    const resolved = resolveTheme(theme)
    localStorage.setItem(STORAGE_KEY, theme)
    applyTheme(resolved)
    set({ theme, resolvedTheme: resolved })
  },

  initTheme: () => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
    const theme = stored ?? 'system'
    const resolved = resolveTheme(theme)
    applyTheme(resolved)
    set({ theme, resolvedTheme: resolved })

    // Listen for system theme changes
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    mql.addEventListener('change', () => {
      const current = get().theme
      if (current === 'system') {
        const newResolved = getSystemTheme()
        applyTheme(newResolved)
        set({ resolvedTheme: newResolved })
      }
    })
  },
}))
