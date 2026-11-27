import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'

// ---------- localStorage helpers (never throw) ----------
export function readStored(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? fallback : JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function writeStored(key, value) {
  try {
    if (value === undefined) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable (private mode etc.) */
  }
}

// State that is persisted in localStorage.
export function useStoredState(key, initial, validate) {
  const [value, setValue] = useState(() => {
    const v = readStored(key, initial)
    return validate && !validate(v) ? initial : v
  })
  useEffect(() => {
    writeStored(key, value)
  }, [key, value])
  return [value, setValue]
}

// ---------- media queries ----------
export function useMediaQuery(query) {
  const subscribe = useCallback(
    (cb) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', cb)
      return () => mql.removeEventListener('change', cb)
    },
    [query]
  )
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false
  )
}

// ---------- theme ----------
export const THEMES = ['system', 'light', 'dark']

export function useTheme() {
  const [theme, setTheme] = useStoredState('pdf3md-theme', 'system', (v) =>
    THEMES.includes(v)
  )
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)')

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', theme)
  }, [theme])

  const resolved = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', resolved === 'dark' ? '#0d0f17' : '#6366F1')
  }, [resolved])

  return { theme, setTheme, resolved }
}
