'use client'

import * as React from 'react'
import { useTheme } from 'next-themes'
import { parseAsString, useQueryState } from 'nuqs'
import { PREVIEW_FONTS } from './fonts'
import {
  ACCENTS,
  PALETTES,
  RADIUS_OPTIONS,
  STYLES,
  composeThemeVars,
  exportThemeCSS,
  type ThemeMode,
} from './themes'
import {
  CreateProjectDialog,
  OpenPresetDialog,
  PreviewControls,
} from './preview-controls'
import { PreviewCanvas } from './preview-canvas'
import {
  decodePreset,
  encodePreset,
  ourAccentToShadcn,
  ourFontToShadcn,
  ourHeadingFontToShadcn,
  ourPaletteToShadcn,
  ourRadiusToShadcn,
  ourStyleToShadcn,
  shadcnAccentToOur,
  shadcnFontToOur,
  shadcnHeadingFontToOur,
  shadcnPaletteToOur,
  shadcnRadiusToOur,
  shadcnStyleToOur,
} from './preset-codec'

export function PreviewPage() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  const mode: ThemeMode =
    mounted && resolvedTheme === 'dark' ? 'dark' : 'light'

  const [palette, setPalette] = React.useState(PALETTES[0])
  const [accent, setAccent] = React.useState(ACCENTS[0])
  const [radius, setRadius] = React.useState('0.625rem')
  const [font, setFont] = React.useState(PREVIEW_FONTS[0])
  const [style, setStyle] = React.useState(STYLES[0])
  const [headingFont, setHeadingFont] = React.useState(PREVIEW_FONTS[0])
  const [presetDialogOpen, setPresetDialogOpen] = React.useState(false)
  const [createProjectOpen, setCreateProjectOpen] = React.useState(false)

  const handleReset = () => {
    setPalette(PALETTES[0])
    setAccent(ACCENTS[0])
    setRadius('0.625rem')
    setFont(PREVIEW_FONTS[0])
    setStyle(STYLES[0])
    setHeadingFont(PREVIEW_FONTS[0])
  }

  const handleToggleTheme = () => {
    setTheme(mode === 'dark' ? 'light' : 'dark')
  }

  // Global keyboard shortcuts mirroring the Menu items. Suppressed while the
  // user is typing in an input / textarea / contentEditable to avoid eating
  // their keystrokes (e.g. the Open Preset code field).
  React.useEffect(() => {
    const isTextInput = (el: EventTarget | null): boolean => {
      if (!(el instanceof HTMLElement)) return false
      const tag = el.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
      return el.isContentEditable
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (isTextInput(e.target)) return
      const k = e.key.toLowerCase()
      if (k === 'o' && !e.shiftKey) {
        e.preventDefault()
        setPresetDialogOpen(true)
      } else if (k === 'r' && e.shiftKey) {
        e.preventDefault()
        handleReset()
      } else if (k === 'r' && !e.shiftKey) {
        e.preventDefault()
        // Inline shuffle so it stays in sync with PreviewControls' version.
        const pick = <T,>(arr: readonly T[]) =>
          arr.length <= 1
            ? arr[0]
            : arr[1 + Math.floor(Math.random() * (arr.length - 1))]
        setPalette(pick(PALETTES))
        setAccent(pick(ACCENTS))
        setFont(pick(PREVIEW_FONTS))
        setRadius(pick(RADIUS_OPTIONS).value)
        setStyle(STYLES[Math.floor(Math.random() * STYLES.length)])
        setHeadingFont(pick(PREVIEW_FONTS))
      } else if (k === 'd' && !e.shiftKey) {
        e.preventDefault()
        handleToggleTheme()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  // shadcn-compatible ?preset= URL state. Codes generated here paste into
  // ui.shadcn.com/create cleanly, and codes from there decode here.
  const [preset, setPreset] = useQueryState(
    'preset',
    parseAsString.withDefault(''),
  )

  /**
   * Apply a decoded preset to the four pickers in a single render. Used by
   * the mount-time URL bootstrap and by the Open Preset dialog. Pure setState
   * — does NOT touch the URL, that's the caller's job.
   */
  const applyDecodedPreset = React.useCallback(
    (code: string): boolean => {
      const decoded = decodePreset(code)
      if (!decoded) return false
      const matchedPalette = PALETTES.find(
        (p) => p.id === shadcnPaletteToOur(decoded.baseColor),
      )
      const matchedAccent = ACCENTS.find(
        (a) => a.id === shadcnAccentToOur(decoded.theme),
      )
      const matchedFont = PREVIEW_FONTS.find(
        (f) => f.id === shadcnFontToOur(decoded.font),
      )
      const matchedRadius = RADIUS_OPTIONS.find(
        (r) => r.id === shadcnRadiusToOur(decoded.radius),
      )
      const matchedStyle = STYLES.find(
        (s) => s.id === shadcnStyleToOur(decoded.style),
      )
      const matchedHeading = PREVIEW_FONTS.find(
        (f) => f.id === shadcnHeadingFontToOur(decoded.fontHeading),
      )
      if (matchedPalette) setPalette(matchedPalette)
      if (matchedAccent) setAccent(matchedAccent)
      if (matchedFont) setFont(matchedFont)
      if (matchedRadius) setRadius(matchedRadius.value)
      if (matchedStyle) setStyle(matchedStyle)
      if (matchedHeading) setHeadingFont(matchedHeading)
      return true
    },
    [],
  )

  // Bootstrap from URL exactly once on mount. We deliberately avoid a
  // continuous URL→state sync — that caused the encode/decode cycle to
  // ping-pong and trigger "Maximum update depth exceeded" on Shuffle.
  const bootstrapped = React.useRef(false)
  React.useEffect(() => {
    if (bootstrapped.current) return
    bootstrapped.current = true
    if (preset) applyDecodedPreset(preset)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // After bootstrap, every picker change pushes a fresh code to the URL. One
  // way only, so there's no loop to guard against. `history: 'replace'` keeps
  // picker fiddling out of the browser history stack.
  const currentPresetCode = React.useMemo(() => {
    const radiusId =
      RADIUS_OPTIONS.find((r) => r.value === radius)?.id ?? 'default'
    return encodePreset({
      baseColor: ourPaletteToShadcn(palette.id),
      theme: ourAccentToShadcn(accent.id),
      font: ourFontToShadcn(font.id),
      radius: ourRadiusToShadcn(radiusId),
      style: ourStyleToShadcn(style.id),
      fontHeading: ourHeadingFontToShadcn(headingFont.id),
    })
  }, [palette.id, accent.id, font.id, radius, style.id, headingFont.id])

  React.useEffect(() => {
    if (!bootstrapped.current) return
    if (currentPresetCode === preset) return
    setPreset(currentPresetCode, { history: 'replace' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPresetCode])

  const lightVars = composeThemeVars({
    palette,
    accent,
    radius,
    mode: 'light',
  })
  const darkVars = composeThemeVars({
    palette,
    accent,
    radius,
    mode: 'dark',
  })
  const activeVars = mode === 'light' ? lightVars : darkVars

  const handleCopyCSS = async () => {
    const css = exportThemeCSS({ light: lightVars, dark: darkVars })
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(css)
    }
  }

  const handleCopyPreset = async () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(currentPresetCode)
    }
  }

  const handleApplyPreset = (code: string): { ok: boolean; message?: string } => {
    // Tolerate "--preset b<code>" CLI form as well as the bare code.
    const cleaned = code.trim().replace(/^--preset\s+/i, '')
    const ok = applyDecodedPreset(cleaned)
    if (!ok) {
      return {
        ok: false,
        message:
          'That doesn\'t look like a valid preset code. Expected something like "bX9k…".',
      }
    }
    return { ok: true }
  }

  return (
    <main className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Preview</h1>
        <p className="max-w-2xl text-sm text-fd-muted-foreground">
          Pick a base palette, accent, font, and radius to see how shaduler
          looks against your project's tokens. The URL stays a shareable preset
          code — paste codes from ui.shadcn.com/create here, or copy ours back
          into yours. Light/dark follows the site theme.
        </p>
      </header>

      <div className="flex flex-col gap-6 lg:flex-row">
        <PreviewControls
          palette={palette}
          onPaletteChange={setPalette}
          accent={accent}
          onAccentChange={setAccent}
          radius={radius}
          onRadiusChange={setRadius}
          font={font}
          onFontChange={setFont}
          style={style}
          onStyleChange={setStyle}
          headingFont={headingFont}
          onHeadingFontChange={setHeadingFont}
          mode={mode}
          presetCode={currentPresetCode}
          onOpenPreset={() => setPresetDialogOpen(true)}
          onCopyPreset={handleCopyPreset}
          onCopyCSS={handleCopyCSS}
          onReset={handleReset}
          onToggleTheme={handleToggleTheme}
          onCreateProject={() => setCreateProjectOpen(true)}
        />

        <div className="flex-1">
          <div
            data-shaduler-preview
            style={
              {
                ...activeVars,
                ...(font.cssVar ? { fontFamily: font.cssVar } : {}),
              } as React.CSSProperties
            }
            className="rounded-lg"
          >
            <PreviewCanvas
              density={style.density}
              headingFontCssVar={headingFont.cssVar}
            />
          </div>
        </div>
      </div>

      <OpenPresetDialog
        open={presetDialogOpen}
        onClose={() => setPresetDialogOpen(false)}
        onApply={handleApplyPreset}
      />

      <CreateProjectDialog
        open={createProjectOpen}
        onClose={() => setCreateProjectOpen(false)}
        presetCode={currentPresetCode}
      />
    </main>
  )
}
