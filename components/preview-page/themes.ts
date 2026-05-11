/**
 * Theme presets for the /preview page.
 *
 * Each preset is a full set of shadcn-style CSS custom properties for both
 * light and dark mode. We use the same variable names that the shaduler
 * component reads (`--background`, `--primary`, `--ring`, …), so applying
 * them on a wrapper element re-themes everything inside.
 *
 * Values are approximated from shadcn's standard themes — if you want exact
 * parity, copy the block from ui.shadcn.com and paste it into the "Paste"
 * field on /preview.
 */

export type ThemeMode = 'light' | 'dark'

export type ThemeVars = Record<string, string>

export type Palette = {
  id: string
  label: string
  light: ThemeVars
  dark: ThemeVars
}

export type Accent = {
  id: string
  label: string
  swatch: string
  light: ThemeVars
  dark: ThemeVars
}

const NEUTRAL_LIGHT: ThemeVars = {
  '--background': 'oklch(1 0 0)',
  '--foreground': 'oklch(0.145 0 0)',
  '--card': 'oklch(1 0 0)',
  '--card-foreground': 'oklch(0.145 0 0)',
  '--popover': 'oklch(1 0 0)',
  '--popover-foreground': 'oklch(0.145 0 0)',
  '--primary': 'oklch(0.205 0 0)',
  '--primary-foreground': 'oklch(0.985 0 0)',
  '--secondary': 'oklch(0.97 0 0)',
  '--secondary-foreground': 'oklch(0.205 0 0)',
  '--muted': 'oklch(0.97 0 0)',
  '--muted-foreground': 'oklch(0.556 0 0)',
  '--accent': 'oklch(0.97 0 0)',
  '--accent-foreground': 'oklch(0.205 0 0)',
  '--destructive': 'oklch(0.58 0.22 27)',
  '--border': 'oklch(0.922 0 0)',
  '--input': 'oklch(0.922 0 0)',
  '--ring': 'oklch(0.708 0 0)',
}

const NEUTRAL_DARK: ThemeVars = {
  '--background': 'oklch(0.145 0 0)',
  '--foreground': 'oklch(0.985 0 0)',
  '--card': 'oklch(0.205 0 0)',
  '--card-foreground': 'oklch(0.985 0 0)',
  '--popover': 'oklch(0.205 0 0)',
  '--popover-foreground': 'oklch(0.985 0 0)',
  '--primary': 'oklch(0.87 0 0)',
  '--primary-foreground': 'oklch(0.205 0 0)',
  '--secondary': 'oklch(0.269 0 0)',
  '--secondary-foreground': 'oklch(0.985 0 0)',
  '--muted': 'oklch(0.269 0 0)',
  '--muted-foreground': 'oklch(0.708 0 0)',
  '--accent': 'oklch(0.371 0 0)',
  '--accent-foreground': 'oklch(0.985 0 0)',
  '--destructive': 'oklch(0.704 0.191 22.216)',
  '--border': 'oklch(1 0 0 / 10%)',
  '--input': 'oklch(1 0 0 / 15%)',
  '--ring': 'oklch(0.556 0 0)',
}

/**
 * Helper — make a palette by tinting the neutral set with a single hue.
 * Only `--background`, `--card`, `--popover`, `--secondary`, `--muted`,
 * `--accent`, `--border`, `--input` get the tint; `--foreground`, `--primary`,
 * etc. stay the same so type contrast is preserved.
 */
function tintNeutral(
  base: ThemeVars,
  chroma: number,
  hue: number,
): ThemeVars {
  const tint = (v: string) =>
    v.replace(/oklch\(([\d.]+) 0 0\)/g, `oklch($1 ${chroma} ${hue})`)
  return Object.fromEntries(
    Object.entries(base).map(([k, v]) => [k, tint(v)]),
  )
}

export const PALETTES: Palette[] = [
  { id: 'neutral', label: 'Neutral', light: NEUTRAL_LIGHT, dark: NEUTRAL_DARK },
  {
    id: 'stone',
    label: 'Stone',
    light: tintNeutral(NEUTRAL_LIGHT, 0.008, 56),
    dark: tintNeutral(NEUTRAL_DARK, 0.008, 56),
  },
  {
    id: 'zinc',
    label: 'Zinc',
    light: tintNeutral(NEUTRAL_LIGHT, 0.005, 264),
    dark: tintNeutral(NEUTRAL_DARK, 0.005, 264),
  },
  {
    id: 'mauve',
    label: 'Mauve',
    light: tintNeutral(NEUTRAL_LIGHT, 0.012, 300),
    dark: tintNeutral(NEUTRAL_DARK, 0.012, 300),
  },
  {
    id: 'olive',
    label: 'Olive',
    light: tintNeutral(NEUTRAL_LIGHT, 0.012, 130),
    dark: tintNeutral(NEUTRAL_DARK, 0.012, 130),
  },
  {
    id: 'mist',
    label: 'Mist',
    light: tintNeutral(NEUTRAL_LIGHT, 0.012, 220),
    dark: tintNeutral(NEUTRAL_DARK, 0.012, 220),
  },
  {
    id: 'taupe',
    label: 'Taupe',
    light: tintNeutral(NEUTRAL_LIGHT, 0.014, 80),
    dark: tintNeutral(NEUTRAL_DARK, 0.014, 80),
  },
]

/**
 * Accents only override `--primary`, `--primary-foreground`, `--ring`. Default
 * keeps the neutral primary (black-on-white / white-on-black).
 *
 * Light/dark values come from Tailwind v4's 500 / 400 shades respectively —
 * the same scale shadcn picks from on its /create page. The list is
 * alphabetised with the Neutral default pinned to the top.
 */
const FG_LIGHT = 'oklch(0.985 0 0)'
const FG_DARK = 'oklch(0.205 0 0)'

function mkAccent(
  id: string,
  label: string,
  light: string,
  dark: string,
  lightFg: string = FG_LIGHT,
  darkFg: string = FG_DARK,
): Accent {
  return {
    id,
    label,
    swatch: light,
    light: {
      '--primary': light,
      '--primary-foreground': lightFg,
      '--ring': light,
    },
    dark: {
      '--primary': dark,
      '--primary-foreground': darkFg,
      '--ring': dark,
    },
  }
}

export const ACCENTS: Accent[] = [
  {
    id: 'default',
    label: 'Neutral',
    swatch: 'oklch(0.205 0 0)',
    light: {},
    dark: {},
  },
  mkAccent('amber', 'Amber', 'oklch(0.769 0.188 70.08)', 'oklch(0.828 0.189 84.429)', FG_DARK, FG_DARK),
  mkAccent('blue', 'Blue', 'oklch(0.623 0.214 259.815)', 'oklch(0.707 0.165 254.624)'),
  mkAccent('cyan', 'Cyan', 'oklch(0.715 0.143 215.221)', 'oklch(0.789 0.154 211.53)', FG_DARK, FG_DARK),
  mkAccent('emerald', 'Emerald', 'oklch(0.696 0.17 162.48)', 'oklch(0.765 0.177 163.223)', FG_LIGHT, FG_DARK),
  mkAccent('fuchsia', 'Fuchsia', 'oklch(0.667 0.295 322.15)', 'oklch(0.74 0.238 322.16)'),
  mkAccent('green', 'Green', 'oklch(0.723 0.219 149.579)', 'oklch(0.792 0.209 151.711)', FG_DARK, FG_DARK),
  mkAccent('indigo', 'Indigo', 'oklch(0.585 0.233 277.117)', 'oklch(0.673 0.182 276.935)'),
  mkAccent('lime', 'Lime', 'oklch(0.768 0.233 130.85)', 'oklch(0.841 0.238 128.85)', FG_DARK, FG_DARK),
  mkAccent('orange', 'Orange', 'oklch(0.705 0.213 47.604)', 'oklch(0.75 0.183 55.934)', FG_LIGHT, FG_DARK),
  mkAccent('pink', 'Pink', 'oklch(0.656 0.241 354.308)', 'oklch(0.718 0.202 349.761)'),
  mkAccent('purple', 'Purple', 'oklch(0.627 0.265 303.9)', 'oklch(0.714 0.203 305.504)'),
  mkAccent('red', 'Red', 'oklch(0.637 0.237 25.331)', 'oklch(0.704 0.191 22.216)'),
  mkAccent('rose', 'Rose', 'oklch(0.645 0.246 16.439)', 'oklch(0.712 0.194 13.428)'),
  mkAccent('sky', 'Sky', 'oklch(0.685 0.169 237.323)', 'oklch(0.746 0.16 232.661)', FG_LIGHT, FG_DARK),
  mkAccent('teal', 'Teal', 'oklch(0.704 0.14 182.503)', 'oklch(0.777 0.152 181.912)', FG_LIGHT, FG_DARK),
  mkAccent('violet', 'Violet', 'oklch(0.606 0.25 292.717)', 'oklch(0.702 0.183 293.541)'),
  mkAccent('yellow', 'Yellow', 'oklch(0.795 0.184 86.047)', 'oklch(0.852 0.199 91.936)', FG_DARK, FG_DARK),
]

export const RADIUS_OPTIONS = [
  { id: 'default', label: 'Default', value: '0.625rem' },
  { id: 'none', label: 'None', value: '0rem' },
  { id: 'sm', label: 'Small', value: '0.3rem' },
  { id: 'md', label: 'Medium', value: '0.5rem' },
  { id: 'lg', label: 'Large', value: '0.75rem' },
] as const

/**
 * Local mapping of shadcn's seven style IDs onto a 3-tier density. Their
 * styles control component-level details we don't render (button shapes,
 * borders, elevation) — we surface them as a row-height / header-padding
 * choice so the picker still produces a visible difference, while the URL
 * preset code keeps the exact shadcn ID for cross-site interop.
 */
export type StyleDensity = 'compact' | 'default' | 'comfortable'

export type StylePreset = {
  id: string
  label: string
  density: StyleDensity
}

export const STYLES: readonly StylePreset[] = [
  // Nova is shadcn's index-0 default — keeping it at our "default" density so
  // an untouched /preview lands on the familiar 60-px grid instead of a
  // compact one.
  { id: 'nova', label: 'Nova', density: 'default' },
  { id: 'vega', label: 'Vega', density: 'compact' },
  { id: 'maia', label: 'Maia', density: 'comfortable' },
  { id: 'lyra', label: 'Lyra', density: 'default' },
  { id: 'mira', label: 'Mira', density: 'compact' },
  { id: 'luma', label: 'Luma', density: 'comfortable' },
  { id: 'sera', label: 'Sera', density: 'default' },
]

/** Concrete tokens each density tier applies inside `<PreviewCanvas />`. */
export const DENSITY_TOKENS: Record<
  StyleDensity,
  { hourHeight: number; headerPadding: string; cellPadding: string }
> = {
  compact: {
    hourHeight: 48,
    headerPadding: 'py-2',
    cellPadding: '',
  },
  default: {
    hourHeight: 60,
    headerPadding: 'py-3',
    cellPadding: '',
  },
  comfortable: {
    hourHeight: 72,
    headerPadding: 'py-4',
    cellPadding: '',
  },
}

/**
 * Compose the final variable set for a chosen palette + accent + radius +
 * mode, plus optional pasted overrides that win over everything else.
 */
export function composeThemeVars({
  palette,
  accent,
  radius,
  mode,
  pastedOverrides,
}: {
  palette: Palette
  accent: Accent
  radius: string
  mode: ThemeMode
  pastedOverrides?: { light: ThemeVars; dark: ThemeVars }
}): ThemeVars {
  const base = palette[mode]
  const accentVars = accent[mode]
  const pasted = pastedOverrides?.[mode] ?? {}
  return {
    ...base,
    ...accentVars,
    '--radius': radius,
    ...pasted,
  }
}

/**
 * Parse a shadcn-style CSS theme block. Returns variables grouped by mode,
 * keyed off the top-level selector (`:root` → light, `.dark` → dark).
 *
 * Tolerates trailing semicolons, comments, and either single- or multi-line
 * formatting. Unknown selectors are ignored.
 */
export function parseThemeCSS(input: string): {
  light: ThemeVars
  dark: ThemeVars
} {
  const stripped = input.replace(/\/\*[\s\S]*?\*\//g, '')
  const result: { light: ThemeVars; dark: ThemeVars } = {
    light: {},
    dark: {},
  }
  const blockRe = /([^{]+)\{([^}]*)\}/g
  let match: RegExpExecArray | null
  while ((match = blockRe.exec(stripped))) {
    const [, selectorRaw, body] = match
    const selector = selectorRaw.trim()
    const target =
      selector === ':root' || selector === 'html'
        ? result.light
        : selector === '.dark' || selector === 'html.dark'
          ? result.dark
          : null
    if (!target) continue
    const declRe = /(--[a-z0-9-]+)\s*:\s*([^;]+);?/gi
    let decl: RegExpExecArray | null
    while ((decl = declRe.exec(body))) {
      target[decl[1].trim()] = decl[2].trim()
    }
  }
  return result
}

const ACCENT_VAR_NAMES = ['--primary', '--primary-foreground', '--ring']
const RADIUS_VAR_NAMES = ['--radius']

/**
 * Given a parsed paste, work out which pickers are at least partially
 * overridden by the pasted CSS — anything in `accent`/`radius` is keyed off
 * its dedicated variable list; everything else falls under `palette`.
 */
export function pickerOverrides(
  pastedOverrides: { light: ThemeVars; dark: ThemeVars } | null,
): { palette: boolean; accent: boolean; radius: boolean } {
  if (!pastedOverrides) {
    return { palette: false, accent: false, radius: false }
  }
  const keys = new Set([
    ...Object.keys(pastedOverrides.light),
    ...Object.keys(pastedOverrides.dark),
  ])
  const accent = ACCENT_VAR_NAMES.some((v) => keys.has(v))
  const radius = RADIUS_VAR_NAMES.some((v) => keys.has(v))
  const palette = [...keys].some(
    (v) => !ACCENT_VAR_NAMES.includes(v) && !RADIUS_VAR_NAMES.includes(v),
  )
  return { palette, accent, radius }
}

/** Format the current variable set as a copy-pastable shadcn theme block. */
export function exportThemeCSS(vars: {
  light: ThemeVars
  dark: ThemeVars
}): string {
  const fmt = (set: ThemeVars) =>
    Object.entries(set)
      .map(([k, v]) => `  ${k}: ${v};`)
      .join('\n')
  return `:root {\n${fmt(vars.light)}\n}\n\n.dark {\n${fmt(vars.dark)}\n}\n`
}
