'use client'

import * as React from 'react'
import { useTheme } from 'next-themes'
import { PREVIEW_FONTS } from './fonts'
import {
  ACCENTS,
  PALETTES,
  composeThemeVars,
  exportThemeCSS,
  parseThemeCSS,
  type ThemeMode,
  type ThemeVars,
} from './themes'
import { PasteDialog, PreviewControls } from './preview-controls'
import { PreviewCanvas } from './preview-canvas'

export function PreviewPage() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  const mode: ThemeMode =
    mounted && resolvedTheme === 'dark' ? 'dark' : 'light'

  const [palette, setPalette] = React.useState(PALETTES[0])
  const [accent, setAccent] = React.useState(ACCENTS[0])
  const [radius, setRadius] = React.useState('0.625rem')
  const [font, setFont] = React.useState(PREVIEW_FONTS[0])
  const [pastedOverrides, setPastedOverrides] = React.useState<{
    light: ThemeVars
    dark: ThemeVars
  } | null>(null)
  const [pasteRaw, setPasteRaw] = React.useState('')
  const [pasteOpen, setPasteOpen] = React.useState(false)

  const lightVars = composeThemeVars({
    palette,
    accent,
    radius,
    mode: 'light',
    pastedOverrides: pastedOverrides ?? undefined,
  })
  const darkVars = composeThemeVars({
    palette,
    accent,
    radius,
    mode: 'dark',
    pastedOverrides: pastedOverrides ?? undefined,
  })
  const activeVars = mode === 'light' ? lightVars : darkVars

  const handleApplyPaste = (text: string) => {
    const parsed = parseThemeCSS(text)
    const total =
      Object.keys(parsed.light).length + Object.keys(parsed.dark).length
    if (total === 0) {
      return {
        ok: false,
        message:
          'No --variables found. Paste a block with :root { --foo: bar; } or .dark { … }.',
      }
    }
    setPastedOverrides(parsed)
    setPasteRaw(text)
    return { ok: true }
  }

  const handleCopy = async () => {
    const css = exportThemeCSS({ light: lightVars, dark: darkVars })
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(css)
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Preview</h1>
        <p className="max-w-2xl text-sm text-fd-muted-foreground">
          Pick a base palette, accent, and radius — or paste your own shadcn
          theme block — to see how shaduler looks against your project's
          tokens. Light/dark follows the site theme. Copy the resulting CSS
          back into your app when you're happy.
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
          mode={mode}
          pastedOverrides={pastedOverrides}
          hasPasted={pastedOverrides !== null}
          onPasteOpen={() => setPasteOpen(true)}
          onResetPaste={() => {
            setPastedOverrides(null)
            setPasteRaw('')
          }}
          onCopy={handleCopy}
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
            <PreviewCanvas />
          </div>
        </div>
      </div>

      <PasteDialog
        open={pasteOpen}
        onClose={() => setPasteOpen(false)}
        onApply={handleApplyPaste}
        initialValue={pasteRaw}
      />
    </main>
  )
}
