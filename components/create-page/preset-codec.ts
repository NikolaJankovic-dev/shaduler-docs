/**
 * shadcn /create-compatible preset codec.
 *
 * Encodes a small subset of pickers (palette, accent, font, radius) into the
 * exact 51-bit "v2" format shadcn uses on its /create page, then base62-encodes
 * the bits with a "b" version prefix. The result is interoperable both ways:
 * a code generated here pastes cleanly into ui.shadcn.com/create, and a code
 * from there decodes here.
 *
 * Source spec:
 * https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/preset/preset.ts
 */

// ---------------------------------------------------------------------------
// shadcn v2 field definitions — order, bit widths, and enums are FIXED.
// Changing any of these breaks interop with ui.shadcn.com.
// ---------------------------------------------------------------------------

type ShadcnField = {
  key: string
  bits: number
  values: readonly string[]
}

const SHADCN_FONTS = [
  'inter',
  'noto-sans',
  'nunito-sans',
  'figtree',
  'roboto',
  'raleway',
  'dm-sans',
  'public-sans',
  'outfit',
  'jetbrains-mono',
  'geist',
  'geist-mono',
  'lora',
  'merriweather',
  'playfair-display',
  'noto-serif',
  'roboto-slab',
  'oxanium',
  'manrope',
  'space-grotesk',
  'montserrat',
  'ibm-plex-sans',
  'source-sans-3',
  'instrument-sans',
  'eb-garamond',
  'instrument-serif',
] as const

const SHADCN_THEMES = [
  'neutral',
  'stone',
  'zinc',
  'gray',
  'amber',
  'blue',
  'cyan',
  'emerald',
  'fuchsia',
  'green',
  'indigo',
  'lime',
  'orange',
  'pink',
  'purple',
  'red',
  'rose',
  'sky',
  'teal',
  'violet',
  'yellow',
  'mauve',
  'olive',
  'mist',
  'taupe',
] as const

const SHADCN_BASE_COLORS = [
  'neutral',
  'stone',
  'zinc',
  'gray',
  'mauve',
  'olive',
  'mist',
  'taupe',
] as const

const SHADCN_RADII = ['default', 'none', 'small', 'medium', 'large'] as const

const SHADCN_STYLES = [
  'nova',
  'vega',
  'maia',
  'lyra',
  'mira',
  'luma',
  'sera',
] as const

const SHADCN_HEADING_FONTS = ['inherit', ...SHADCN_FONTS] as const

const PRESET_FIELDS_V2: readonly ShadcnField[] = [
  {
    key: 'menuColor',
    bits: 3,
    values: [
      'default',
      'inverted',
      'default-translucent',
      'inverted-translucent',
    ],
  },
  { key: 'menuAccent', bits: 3, values: ['subtle', 'bold'] },
  { key: 'radius', bits: 4, values: SHADCN_RADII },
  { key: 'font', bits: 6, values: SHADCN_FONTS },
  {
    key: 'iconLibrary',
    bits: 6,
    values: ['lucide', 'hugeicons', 'tabler', 'phosphor', 'remixicon'],
  },
  { key: 'theme', bits: 6, values: SHADCN_THEMES },
  { key: 'baseColor', bits: 6, values: SHADCN_BASE_COLORS },
  { key: 'style', bits: 6, values: SHADCN_STYLES },
  { key: 'chartColor', bits: 6, values: SHADCN_THEMES },
  { key: 'fontHeading', bits: 5, values: SHADCN_HEADING_FONTS },
] as const

// ---------------------------------------------------------------------------
// base62 — same alphabet shadcn uses
// ---------------------------------------------------------------------------

const BASE62 =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

// 51 bits (v2 total) packs to ~2.25e15, well inside Number.MAX_SAFE_INTEGER
// (9e15), so plain Number arithmetic via multiplication/division avoids
// BigInt entirely — needed because tsconfig targets ES2017.

function toBase62(n: number): string {
  if (n === 0) return '0'
  let out = ''
  let x = n
  while (x > 0) {
    out = BASE62[x % 62] + out
    x = Math.floor(x / 62)
  }
  return out
}

function fromBase62(s: string): number {
  let n = 0
  for (const ch of s) {
    const idx = BASE62.indexOf(ch)
    if (idx < 0) throw new Error(`Invalid base62 character: ${ch}`)
    n = n * 62 + idx
  }
  return n
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Decoded preset — only the keys we surface in pickers. Others are dropped. */
export type DecodedPreset = {
  baseColor: (typeof SHADCN_BASE_COLORS)[number]
  theme: (typeof SHADCN_THEMES)[number]
  font: (typeof SHADCN_FONTS)[number]
  radius: (typeof SHADCN_RADII)[number]
  style: (typeof SHADCN_STYLES)[number]
  fontHeading: (typeof SHADCN_HEADING_FONTS)[number]
}

/** Input to the encoder — same shape as the decoded one. */
export type EncodableState = {
  baseColor: string
  theme: string
  font: string
  radius: string
  style: string
  fontHeading: string
}

// ---------------------------------------------------------------------------
// Encode / decode
// ---------------------------------------------------------------------------

/**
 * Encode a 4-field state into shadcn's v2 preset code. Fields we don't track
 * (menuColor, menuAccent, iconLibrary, style, chartColor, fontHeading) fall
 * back to their first enum value, which matches shadcn's own defaults — and
 * keeps the resulting code valid when pasted into ui.shadcn.com.
 */
export function encodePreset(state: EncodableState): string {
  const lookup: Record<string, string> = {
    radius: state.radius,
    font: state.font,
    theme: state.theme,
    baseColor: state.baseColor,
    style: state.style,
    fontHeading: state.fontHeading,
    // chartColor mirrors theme by default so the generated /create preview
    // doesn't show grey charts against a coloured palette.
    chartColor: state.theme,
  }
  let bits = 0
  let offset = 0
  for (const field of PRESET_FIELDS_V2) {
    const value = lookup[field.key] ?? field.values[0]
    let idx = field.values.indexOf(value)
    if (idx < 0) idx = 0
    bits += idx * Math.pow(2, offset)
    offset += field.bits
  }
  return 'b' + toBase62(bits)
}

/**
 * Decode a v1 ("a") or v2 ("b") preset code into the four fields we care
 * about. Throws on a malformed code; an empty string passed in returns null.
 */
export function decodePreset(code: string | null | undefined): DecodedPreset | null {
  if (!code) return null
  const version = code[0]
  if (version !== 'a' && version !== 'b') return null
  const body = code.slice(1)
  if (!body) return null
  let bits: number
  try {
    bits = fromBase62(body)
  } catch {
    return null
  }
  // V1 lacked chartColor + fontHeading — the trailing two fields. The first 8
  // fields' offsets and bit widths are identical to v2, so we just walk the
  // shared prefix and stop early when we've decoded everything we need.
  const result: Record<string, string> = {}
  let offset = 0
  for (const field of PRESET_FIELDS_V2) {
    const span = Math.pow(2, field.bits)
    const idx = Math.floor(bits / Math.pow(2, offset)) % span
    result[field.key] = field.values[idx] ?? field.values[0]
    offset += field.bits
  }
  return {
    baseColor: result.baseColor as DecodedPreset['baseColor'],
    theme: result.theme as DecodedPreset['theme'],
    font: result.font as DecodedPreset['font'],
    radius: result.radius as DecodedPreset['radius'],
    style: result.style as DecodedPreset['style'],
    fontHeading: result.fontHeading as DecodedPreset['fontHeading'],
  }
}

// ---------------------------------------------------------------------------
// Mapping between shadcn IDs and our local picker IDs.
//
// Our PALETTES omit "gray"; our ACCENTS use "default" for shadcn's neutral
// family; our PREVIEW_FONTS prepend a synthetic "default" entry; our RADIUS
// uses short labels ("sm","md","lg"). The maps below paper over those gaps in
// both directions, with explicit fallbacks for entries we don't represent.
// ---------------------------------------------------------------------------

const OUR_RADIUS_TO_SHADCN: Record<string, (typeof SHADCN_RADII)[number]> = {
  default: 'default',
  none: 'none',
  sm: 'small',
  md: 'medium',
  lg: 'large',
}

const SHADCN_RADIUS_TO_OUR: Record<(typeof SHADCN_RADII)[number], string> = {
  default: 'default',
  none: 'none',
  small: 'sm',
  medium: 'md',
  large: 'lg',
}

/** Set of shadcn theme values that map to our "default" (neutral) accent. */
const NEUTRAL_THEMES = new Set<string>([
  'neutral',
  'stone',
  'zinc',
  'gray',
  'mauve',
  'olive',
  'mist',
  'taupe',
])

export function ourPaletteToShadcn(id: string): string {
  // Our palette IDs already match shadcn baseColor IDs 1:1 except we don't
  // have "gray". Anything we don't recognise falls back to neutral.
  return (SHADCN_BASE_COLORS as readonly string[]).includes(id)
    ? id
    : 'neutral'
}

export function shadcnPaletteToOur(id: string): string {
  // "gray" doesn't exist locally — fold it into neutral (closest neutral tone).
  if (id === 'gray') return 'neutral'
  return (SHADCN_BASE_COLORS as readonly string[]).includes(id) ? id : 'neutral'
}

export function ourAccentToShadcn(id: string): string {
  // Our "default" maps to shadcn's "neutral" (theme index 0); coloured accents
  // share the same name in both lists.
  if (id === 'default') return 'neutral'
  return (SHADCN_THEMES as readonly string[]).includes(id) ? id : 'neutral'
}

export function shadcnAccentToOur(id: string): string {
  // shadcn's neutral-family themes collapse to our "default" accent.
  if (NEUTRAL_THEMES.has(id)) return 'default'
  return id
}

export function ourFontToShadcn(id: string): string {
  // Our synthetic "default" entry maps to shadcn's first font (inter).
  if (id === 'default') return 'inter'
  return (SHADCN_FONTS as readonly string[]).includes(id) ? id : 'inter'
}

export function shadcnFontToOur(id: string): string {
  // No reverse mapping for "default" — shadcn always emits a concrete font ID.
  return (SHADCN_FONTS as readonly string[]).includes(id) ? id : 'inter'
}

export function ourRadiusToShadcn(id: string): (typeof SHADCN_RADII)[number] {
  return OUR_RADIUS_TO_SHADCN[id] ?? 'default'
}

export function shadcnRadiusToOur(id: string): string {
  return SHADCN_RADIUS_TO_OUR[id as (typeof SHADCN_RADII)[number]] ?? 'default'
}

export function ourStyleToShadcn(id: string): (typeof SHADCN_STYLES)[number] {
  // We use the exact shadcn style IDs locally — anything we don't recognise
  // falls back to nova (their index 0).
  return (SHADCN_STYLES as readonly string[]).includes(id)
    ? (id as (typeof SHADCN_STYLES)[number])
    : 'nova'
}

export function shadcnStyleToOur(id: string): string {
  return (SHADCN_STYLES as readonly string[]).includes(id) ? id : 'nova'
}

export function ourHeadingFontToShadcn(
  id: string,
): (typeof SHADCN_HEADING_FONTS)[number] {
  // Our synthetic "default" entry maps to shadcn's "inherit" (heading uses
  // the body font when nothing's set explicitly).
  if (id === 'default') return 'inherit'
  return (SHADCN_FONTS as readonly string[]).includes(id)
    ? (id as (typeof SHADCN_HEADING_FONTS)[number])
    : 'inherit'
}

export function shadcnHeadingFontToOur(id: string): string {
  // Shadcn's "inherit" maps back to our synthetic "default" entry.
  if (id === 'inherit') return 'default'
  return (SHADCN_FONTS as readonly string[]).includes(id) ? id : 'default'
}
