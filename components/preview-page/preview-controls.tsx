'use client'

import * as React from 'react'
import { Check } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PREVIEW_FONTS, type PreviewFont } from './fonts'
import {
  ACCENTS,
  PALETTES,
  RADIUS_OPTIONS,
  pickerOverrides,
  type Accent,
  type Palette,
  type ThemeMode,
  type ThemeVars,
} from './themes'

interface PreviewControlsProps {
  palette: Palette
  onPaletteChange: (p: Palette) => void
  accent: Accent
  onAccentChange: (a: Accent) => void
  radius: string
  onRadiusChange: (r: string) => void
  font: PreviewFont
  onFontChange: (f: PreviewFont) => void
  mode: ThemeMode
  pastedOverrides: { light: ThemeVars; dark: ThemeVars } | null
  hasPasted: boolean
  onPasteOpen: () => void
  onResetPaste: () => void
  onCopy: () => Promise<void> | void
}

export function PreviewControls({
  palette,
  onPaletteChange,
  accent,
  onAccentChange,
  radius,
  onRadiusChange,
  font,
  onFontChange,
  mode,
  pastedOverrides,
  hasPasted,
  onPasteOpen,
  onResetPaste,
  onCopy,
}: PreviewControlsProps) {
  const [copied, setCopied] = React.useState(false)
  const handleCopy = async () => {
    await onCopy()
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  const radiusOption =
    RADIUS_OPTIONS.find((r) => r.value === radius) ?? RADIUS_OPTIONS[0]
  const overrides = pickerOverrides(pastedOverrides)

  return (
    <aside className="flex w-full shrink-0 flex-col overflow-hidden rounded-lg border bg-fd-card lg:h-[640px] lg:w-64">
      {hasPasted && (
        <div className="m-3 mb-0 flex items-center justify-between gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          <span>Paste is overriding pickers</span>
          <button
            type="button"
            onClick={onResetPaste}
            className="font-medium underline-offset-2 hover:underline"
          >
            Clear
          </button>
        </div>
      )}
      <div className="flex flex-col gap-2 p-3">
        <PickerButton
          label="Base Color"
          value={palette.label}
          overridden={overrides.palette}
          indicator={
            <span
              className="size-4 shrink-0 rounded-full border"
              style={{
                background: palette[mode]['--background'],
                borderColor: palette[mode]['--border'],
              }}
            />
          }
        >
          {(close) => (
            <PickerList>
              {PALETTES.map((p, i) => (
                <PickerItem
                  key={p.id}
                  active={palette.id === p.id}
                  divider={i === 0}
                  onSelect={() => {
                    onPaletteChange(p)
                    close()
                  }}
                >
                  {p.label}
                </PickerItem>
              ))}
            </PickerList>
          )}
        </PickerButton>

        <PickerButton
          label="Accent"
          value={accent.label}
          overridden={overrides.accent}
          indicator={
            <span
              className="size-4 shrink-0 rounded-full border"
              style={{ background: accent.swatch }}
            />
          }
        >
          {(close) => (
            <PickerList>
              {ACCENTS.map((a, i) => (
                <PickerItem
                  key={a.id}
                  active={accent.id === a.id}
                  divider={i === 0}
                  onSelect={() => {
                    onAccentChange(a)
                    close()
                  }}
                >
                  {a.label}
                </PickerItem>
              ))}
            </PickerList>
          )}
        </PickerButton>

        <PickerButton
          label="Font"
          value={font.label}
          indicator={
            <span
              className="text-base font-semibold leading-none"
              style={{ fontFamily: font.cssVar || undefined }}
            >
              Aa
            </span>
          }
        >
          {(close) => (
            <PickerList>
              {PREVIEW_FONTS.map((f, i) => {
                const prev = PREVIEW_FONTS[i - 1]
                const showGroup =
                  f.group !== 'default' && f.group !== prev?.group
                return (
                  <React.Fragment key={f.id}>
                    {showGroup && <PickerLabel>{f.group}</PickerLabel>}
                    <PickerItem
                      active={font.id === f.id}
                      divider={i === 0}
                      onSelect={() => {
                        onFontChange(f)
                        close()
                      }}
                    >
                      {f.label}
                    </PickerItem>
                  </React.Fragment>
                )
              })}
            </PickerList>
          )}
        </PickerButton>

        <PickerButton
          label="Radius"
          value={radiusOption.label}
          overridden={overrides.radius}
          indicator={
            <span
              aria-hidden
              className="size-4 shrink-0 border-t border-r border-fd-foreground"
              style={{ borderTopRightRadius: radius }}
            />
          }
        >
          {(close) => (
            <PickerList>
              {RADIUS_OPTIONS.map((r, i) => (
                <PickerItem
                  key={r.id}
                  active={radius === r.value}
                  divider={i === 0}
                  onSelect={() => {
                    onRadiusChange(r.value)
                    close()
                  }}
                >
                  {r.label}
                </PickerItem>
              ))}
            </PickerList>
          )}
        </PickerButton>
      </div>

      <div className="flex-1" />

      <div className="flex flex-col gap-2 border-t bg-fd-muted/40 p-3">
        <button
          type="button"
          onClick={onPasteOpen}
          className="rounded-md border bg-fd-card px-3 py-2 text-sm transition hover:bg-fd-muted"
        >
          {hasPasted ? 'Edit pasted theme' : 'Paste shadcn theme…'}
        </button>
        {hasPasted && (
          <button
            type="button"
            onClick={onResetPaste}
            className="rounded-md border border-fd-border bg-fd-card px-3 py-1.5 text-xs text-fd-muted-foreground transition hover:bg-fd-muted"
          >
            Clear paste
          </button>
        )}
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-md bg-fd-foreground px-3 py-2 text-sm font-medium text-fd-background transition hover:opacity-90"
        >
          {copied ? 'Copied' : 'Copy CSS'}
        </button>
      </div>
    </aside>
  )
}

/**
 * Single picker — a stacked-label button (small caption above, value below)
 * with a per-picker indicator on the right (color swatch, "Aa", radius
 * preview, etc.). Clicking opens a popover with options. Mirrors the shadcn
 * /create sidebar look.
 */
function PickerButton({
  label,
  value,
  indicator,
  overridden,
  children,
}: {
  label: string
  value: string
  indicator: React.ReactNode
  overridden?: boolean
  children: (close: () => void) => React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-md border bg-fd-card px-3 py-2 text-left transition hover:bg-fd-muted"
        >
          <span className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wide text-fd-muted-foreground">
              {label}
            </span>
            <span className="flex items-center gap-1.5 text-sm font-medium">
              <span
                className={cn(
                  overridden && 'text-fd-muted-foreground line-through',
                )}
              >
                {value}
              </span>
              {overridden && (
                <span className="rounded bg-amber-500/15 px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                  custom
                </span>
              )}
            </span>
          </span>
          <span className="ml-2 flex size-5 shrink-0 items-center justify-center text-fd-muted-foreground">
            {indicator}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        sideOffset={8}
        className="w-56 max-h-72 overflow-y-auto border bg-fd-card p-1 text-fd-foreground shadow-lg [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {children(() => setOpen(false))}
      </PopoverContent>
    </Popover>
  )
}

function PickerList({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col">{children}</div>
}

function PickerLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-2 pt-2 pb-1 text-[11px] font-medium uppercase tracking-wide text-fd-muted-foreground">
      {children}
    </div>
  )
}

function PickerItem({
  active,
  onSelect,
  divider,
  children,
}: {
  active: boolean
  onSelect: () => void
  divider?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition',
        'hover:bg-fd-muted',
        divider && 'mb-1 rounded-none border-b border-fd-border pb-2',
      )}
    >
      <span className="flex-1">{children}</span>
      {active && <Check className="size-4" />}
    </button>
  )
}

export function PasteDialog({
  open,
  onClose,
  onApply,
  initialValue,
}: {
  open: boolean
  onClose: () => void
  onApply: (text: string) => { ok: boolean; message?: string }
  initialValue?: string
}) {
  const [text, setText] = React.useState(initialValue ?? '')
  const [error, setError] = React.useState<string | null>(null)
  React.useEffect(() => {
    if (open) {
      setText(initialValue ?? '')
      setError(null)
    }
  }, [open, initialValue])
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Paste shadcn theme</DialogTitle>
          <DialogDescription>
            Paste a shadcn theme block. We read variables from{' '}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">:root</code>{' '}
            and{' '}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">.dark</code>.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={14}
          spellCheck={false}
          className="font-mono text-xs"
          placeholder=":root {&#10;  --primary: oklch(0.6 0.166 252);&#10;  --ring: oklch(0.6 0.166 252);&#10;  --radius: 0.5rem;&#10;}&#10;.dark {&#10;  --primary: oklch(0.7 0.166 252);&#10;}"
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              const result = onApply(text)
              if (result.ok) {
                onClose()
              } else {
                setError(result.message ?? 'No CSS variables found.')
              }
            }}
          >
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
