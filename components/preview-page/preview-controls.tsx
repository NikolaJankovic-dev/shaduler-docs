'use client'

import * as React from 'react'
import {
  Check,
  Clipboard,
  Code,
  Menu as MenuIcon,
  Moon,
  RotateCcw,
  Shuffle,
  Sun,
  Upload,
} from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { PREVIEW_FONTS, type PreviewFont } from './fonts'
import {
  ACCENTS,
  PALETTES,
  RADIUS_OPTIONS,
  STYLES,
  type Accent,
  type Palette,
  type StylePreset,
  type ThemeMode,
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
  style: StylePreset
  onStyleChange: (s: StylePreset) => void
  headingFont: PreviewFont
  onHeadingFontChange: (f: PreviewFont) => void
  mode: ThemeMode
  /** Encoded shadcn preset code reflecting the current picker state. */
  presetCode: string
  onOpenPreset: () => void
  onCopyPreset: () => Promise<void> | void
  onCopyCSS: () => Promise<void> | void
  onReset: () => void
  onToggleTheme: () => void
  onCreateProject: () => void
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
  style,
  onStyleChange,
  headingFont,
  onHeadingFontChange,
  mode,
  presetCode,
  onOpenPreset,
  onCopyPreset,
  onCopyCSS,
  onReset,
  onToggleTheme,
  onCreateProject,
}: PreviewControlsProps) {
  const [copiedTarget, setCopiedTarget] = React.useState<
    'preset' | 'css' | null
  >(null)
  const handleCopyPreset = async () => {
    await onCopyPreset()
    setCopiedTarget('preset')
    setTimeout(() => setCopiedTarget(null), 1500)
  }
  const handleCopyCSS = async () => {
    await onCopyCSS()
    setCopiedTarget('css')
    setTimeout(() => setCopiedTarget(null), 1500)
  }
  const handleShuffle = () => {
    const pickFrom = <T,>(arr: readonly T[]) => {
      // Skip index 0 — that's the pinned Neutral/Default entry. Without
      // skipping it, ~25% of shuffles would land back on the boring default.
      if (arr.length <= 1) return arr[0]
      const i = 1 + Math.floor(Math.random() * (arr.length - 1))
      return arr[i]
    }
    onPaletteChange(pickFrom(PALETTES))
    onAccentChange(pickFrom(ACCENTS))
    onFontChange(pickFrom(PREVIEW_FONTS))
    onRadiusChange(pickFrom(RADIUS_OPTIONS).value)
    // Styles have no pinned default at index 0, so we pick across the full
    // list — every shuffle should noticeably change row density.
    onStyleChange(STYLES[Math.floor(Math.random() * STYLES.length)])
    onHeadingFontChange(pickFrom(PREVIEW_FONTS))
  }
  const radiusOption =
    RADIUS_OPTIONS.find((r) => r.value === radius) ?? RADIUS_OPTIONS[0]

  return (
    <aside className="flex w-full shrink-0 flex-col overflow-hidden rounded-lg border bg-fd-card lg:h-[640px] lg:w-64">
      <div className="p-3">
        <MenuButton
          onOpenPreset={onOpenPreset}
          onShuffle={handleShuffle}
          onToggleTheme={onToggleTheme}
          onReset={onReset}
          onCopyCSS={handleCopyCSS}
          mode={mode}
        />
      </div>

      <Separator />

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-3">
          <PickerButton
            label="Style"
          value={style.label}
          indicator={
            <span
              aria-hidden
              className="size-4 shrink-0 rounded-sm border border-fd-foreground"
            />
          }
        >
          {(close) => (
            <PickerList>
              {STYLES.map((s, i) => (
                <PickerItem
                  key={s.id}
                  active={style.id === s.id}
                  divider={i === 0}
                  onSelect={() => {
                    onStyleChange(s)
                    close()
                  }}
                >
                  {s.label}
                </PickerItem>
              ))}
            </PickerList>
          )}
        </PickerButton>
        </div>

        <Separator />

        <div className="flex flex-col gap-2 p-3">
        <PickerButton
          label="Base Color"
          value={palette.label}
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
          label="Theme"
          value={accent.label}
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
        </div>

        <Separator />

        <div className="flex flex-col gap-2 p-3">
        <PickerButton
          label="Heading"
          value={headingFont.id === 'default' ? font.label : headingFont.label}
          indicator={
            <span
              className="text-base font-semibold leading-none"
              style={{ fontFamily: headingFont.cssVar || undefined }}
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
                      active={headingFont.id === f.id}
                      divider={i === 0}
                      onSelect={() => {
                        onHeadingFontChange(f)
                        close()
                      }}
                    >
                      {f.id === 'default' ? 'Inherit' : f.label}
                    </PickerItem>
                  </React.Fragment>
                )
              })}
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
        </div>

        <Separator />

        <div className="p-3">
        <PickerButton
          label="Radius"
          value={radiusOption.label}
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
      </ScrollArea>

      <div className="flex flex-col gap-2 border-t bg-fd-muted/40 p-3">
        <button
          type="button"
          onClick={handleCopyPreset}
          title="Copy preset code"
          className="truncate rounded-md border bg-fd-card px-3 py-2 text-left font-mono text-xs transition hover:bg-fd-muted"
        >
          {copiedTarget === 'preset' ? 'Copied' : `--preset ${presetCode}`}
        </button>
        <button
          type="button"
          onClick={onOpenPreset}
          className="rounded-md border bg-fd-card px-3 py-2 text-sm transition hover:bg-fd-muted"
        >
          Open Preset
        </button>
        <button
          type="button"
          onClick={handleShuffle}
          className="flex items-center justify-center gap-2 rounded-md border bg-fd-card px-3 py-2 text-sm transition hover:bg-fd-muted"
        >
          <Shuffle className="size-4" />
          Shuffle
        </button>
        <button
          type="button"
          onClick={onCreateProject}
          className="mt-1 rounded-md bg-fd-foreground px-3 py-2 text-sm font-medium text-fd-background transition hover:opacity-90"
        >
          Create Project
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
  children,
}: {
  label: string
  value: string
  indicator: React.ReactNode
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
            <span className="text-sm font-medium">{value}</span>
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

/**
 * Picker-styled menu trigger. Same visual as `PickerButton` (right-opening
 * popover, full-width row with caption + hamburger indicator) but the popover
 * body is a list of action items — Open Preset, Shuffle, Light/Dark, Reset.
 */
function MenuButton({
  onOpenPreset,
  onShuffle,
  onToggleTheme,
  onReset,
  onCopyCSS,
  mode,
}: {
  onOpenPreset: () => void
  onShuffle: () => void
  onToggleTheme: () => void
  onReset: () => void
  onCopyCSS: () => Promise<void> | void
  mode: ThemeMode
}) {
  const [open, setOpen] = React.useState(false)
  const close = () => setOpen(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-md border bg-fd-card px-3 py-2.5 text-left text-sm font-medium transition hover:bg-fd-muted"
        >
          <span>Menu</span>
          <MenuIcon className="size-4 text-fd-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        sideOffset={8}
        className="w-56 max-h-72 overflow-y-auto border bg-fd-card p-1 text-fd-foreground shadow-lg [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex flex-col">
          <MenuAction
            icon={<Upload className="size-4" />}
            shortcut="O"
            onSelect={() => {
              close()
              onOpenPreset()
            }}
          >
            Open Preset
          </MenuAction>
          <MenuAction
            icon={<Shuffle className="size-4" />}
            shortcut="R"
            onSelect={() => {
              close()
              onShuffle()
            }}
          >
            Shuffle
          </MenuAction>
          <MenuAction
            icon={
              mode === 'dark' ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )
            }
            shortcut="D"
            onSelect={() => {
              close()
              onToggleTheme()
            }}
          >
            Light/Dark
          </MenuAction>
          <div className="my-1 border-b border-fd-border" />
          <MenuAction
            icon={<Code className="size-4" />}
            onSelect={() => {
              close()
              void onCopyCSS()
            }}
          >
            Copy CSS
          </MenuAction>
          <MenuAction
            icon={<RotateCcw className="size-4" />}
            shortcut="⇧R"
            onSelect={() => {
              close()
              onReset()
            }}
          >
            Reset
          </MenuAction>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function MenuAction({
  icon,
  shortcut,
  onSelect,
  children,
}: {
  icon: React.ReactNode
  shortcut?: string
  onSelect: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition hover:bg-fd-muted"
    >
      <span className="text-fd-muted-foreground">{icon}</span>
      <span className="flex-1">{children}</span>
      {shortcut && (
        <span className="text-[11px] tracking-wide text-fd-muted-foreground">
          {shortcut}
        </span>
      )}
    </button>
  )
}

/**
 * "Create Project" dialog — shows the shadcn-CLI command that installs
 * shaduler with the current preset baked in. Mirrors the Installation docs
 * page (pnpm / npm / yarn / bun tabs) but adds `?preset=<code>` so the user
 * gets the theme tokens written into their `globals.css` automatically.
 */
export function CreateProjectDialog({
  open,
  onClose,
  presetCode,
}: {
  open: boolean
  onClose: () => void
  presetCode: string
}) {
  const [copied, setCopied] = React.useState(false)
  const baseUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://shaduler.vercel.app'
  const registryUrl = `${baseUrl}/r/themed.json?preset=${presetCode}`
  const commands: Record<string, string> = {
    pnpm: `pnpm dlx shadcn@latest add ${registryUrl}`,
    npm: `npx shadcn@latest add ${registryUrl}`,
    yarn: `yarn dlx shadcn@latest add ${registryUrl}`,
    bun: `bunx --bun shadcn@latest add ${registryUrl}`,
  }
  const [pm, setPm] = React.useState<keyof typeof commands>('pnpm')
  const cmd = commands[pm]
  const handleCopy = async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return
    await navigator.clipboard.writeText(cmd)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  React.useEffect(() => {
    if (open) setCopied(false)
  }, [open])
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
          <DialogDescription>
            Run this command in an existing shadcn project to add shaduler
            with the theme you picked. The CLI will write the CSS variables
            into your <code className="rounded bg-muted px-1 py-0.5 text-xs">globals.css</code>{' '}
            and drop the component into{' '}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              components/ui/shaduler.tsx
            </code>
            .
          </DialogDescription>
        </DialogHeader>
        <Tabs value={pm} onValueChange={(v) => setPm(v as keyof typeof commands)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pnpm">pnpm</TabsTrigger>
            <TabsTrigger value="npm">npm</TabsTrigger>
            <TabsTrigger value="yarn">yarn</TabsTrigger>
            <TabsTrigger value="bun">bun</TabsTrigger>
          </TabsList>
          {(Object.keys(commands) as Array<keyof typeof commands>).map((id) => (
            <TabsContent key={id} value={id} className="mt-3">
              <div className="relative">
                <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-md border bg-muted/40 p-3 pr-12 font-mono text-xs">
                  {commands[id]}
                </pre>
              </div>
            </TabsContent>
          ))}
        </Tabs>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button type="button" onClick={handleCopy}>
            <Clipboard className="size-4" />
            {copied ? 'Copied' : 'Copy command'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Single-input dialog for pasting a shadcn preset code. Accepts the bare code
 * (`b<base62>`) or the CLI form (`--preset b<base62>`); parent handles the
 * decoding + state application.
 */
export function OpenPresetDialog({
  open,
  onClose,
  onApply,
}: {
  open: boolean
  onClose: () => void
  onApply: (code: string) => { ok: boolean; message?: string }
}) {
  const [code, setCode] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  React.useEffect(() => {
    if (open) {
      setCode('')
      setError(null)
    }
  }, [open])
  const submit = () => {
    if (!code.trim()) {
      setError('Paste a preset code first.')
      return
    }
    const result = onApply(code)
    if (result.ok) {
      onClose()
    } else {
      setError(result.message ?? 'Invalid preset code.')
    }
  }
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Open Preset</DialogTitle>
          <DialogDescription>
            Paste a preset code to load a saved configuration. Codes from
            ui.shadcn.com/create work here too.
          </DialogDescription>
        </DialogHeader>
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoFocus
          spellCheck={false}
          className="font-mono text-sm"
          placeholder="b2D0wqNxT or --preset b2D0wqNxT"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              submit()
            }
          }}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={submit}>
            Open
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
