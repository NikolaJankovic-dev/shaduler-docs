'use client'

import * as React from 'react'
import { useTheme } from 'next-themes'

export function ThemeShortcut() {
  const { resolvedTheme, setTheme } = useTheme()

  React.useEffect(() => {
    const isTextInput = (el: EventTarget | null): boolean => {
      if (!(el instanceof HTMLElement)) return false
      const tag = el.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
      return el.isContentEditable
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return
      if (isTextInput(e.target)) return
      if (e.key.toLowerCase() !== 'd') return
      e.preventDefault()
      setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [resolvedTheme, setTheme])

  return null
}
