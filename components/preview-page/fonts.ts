/**
 * Fonts available in the /preview page font picker.
 *
 * Each Google font is loaded via `next/font/google` so Next.js handles
 * preloading, fallback, and self-hosting at build time. Each gets its own
 * CSS variable; we apply all variables on the preview layout wrapper, and
 * the picker swaps which one the canvas's `fontFamily` resolves to.
 *
 * The list and grouping (Sans / Mono / Serif) match shadcn's /create page.
 *
 * This file is server-only — keep it out of `'use client'` modules. The
 * `PREVIEW_FONTS` metadata array is plain data and safe to import from
 * client components.
 */
import {
  DM_Sans,
  EB_Garamond,
  Figtree,
  Geist,
  Geist_Mono,
  IBM_Plex_Sans,
  Instrument_Sans,
  Instrument_Serif,
  Inter,
  JetBrains_Mono,
  Lora,
  Manrope,
  Merriweather,
  Montserrat,
  Noto_Sans,
  Noto_Serif,
  Nunito_Sans,
  Outfit,
  Oxanium,
  Playfair_Display,
  Public_Sans,
  Raleway,
  Roboto,
  Roboto_Slab,
  Source_Sans_3,
  Space_Grotesk,
} from 'next/font/google'

// Sans
const inter = Inter({ subsets: ['latin'], variable: '--font-preview-inter' })
const geist = Geist({ subsets: ['latin'], variable: '--font-preview-geist' })
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-preview-dm-sans' })
const figtree = Figtree({ subsets: ['latin'], variable: '--font-preview-figtree' })
const notoSans = Noto_Sans({ subsets: ['latin'], variable: '--font-preview-noto-sans' })
const nunitoSans = Nunito_Sans({ subsets: ['latin'], variable: '--font-preview-nunito-sans' })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-preview-outfit' })
const publicSans = Public_Sans({ subsets: ['latin'], variable: '--font-preview-public-sans' })
const raleway = Raleway({ subsets: ['latin'], variable: '--font-preview-raleway' })
const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-preview-roboto',
})
const oxanium = Oxanium({ subsets: ['latin'], variable: '--font-preview-oxanium' })
const manrope = Manrope({ subsets: ['latin'], variable: '--font-preview-manrope' })
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-preview-space-grotesk',
})
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-preview-montserrat' })
const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-preview-ibm-plex-sans',
})
const sourceSans3 = Source_Sans_3({
  subsets: ['latin'],
  variable: '--font-preview-source-sans-3',
})
const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-preview-instrument-sans',
})

// Mono
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-preview-geist-mono' })
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-preview-jetbrains-mono',
})

// Serif
const notoSerif = Noto_Serif({ subsets: ['latin'], variable: '--font-preview-noto-serif' })
const robotoSlab = Roboto_Slab({ subsets: ['latin'], variable: '--font-preview-roboto-slab' })
const merriweather = Merriweather({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-preview-merriweather',
})
const lora = Lora({ subsets: ['latin'], variable: '--font-preview-lora' })
const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-preview-playfair-display',
})
const ebGaramond = EB_Garamond({
  subsets: ['latin'],
  variable: '--font-preview-eb-garamond',
})
const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-preview-instrument-serif',
})

/** Joined `.variable` className string — apply to a wrapper to load all fonts. */
export const PREVIEW_FONT_VARIABLES = [
  inter.variable,
  geist.variable,
  dmSans.variable,
  figtree.variable,
  notoSans.variable,
  nunitoSans.variable,
  outfit.variable,
  publicSans.variable,
  raleway.variable,
  roboto.variable,
  oxanium.variable,
  manrope.variable,
  spaceGrotesk.variable,
  montserrat.variable,
  ibmPlexSans.variable,
  sourceSans3.variable,
  instrumentSans.variable,
  geistMono.variable,
  jetbrainsMono.variable,
  notoSerif.variable,
  robotoSlab.variable,
  merriweather.variable,
  lora.variable,
  playfairDisplay.variable,
  ebGaramond.variable,
  instrumentSerif.variable,
].join(' ')

export type PreviewFontGroup = 'default' | 'Sans' | 'Mono' | 'Serif'

export type PreviewFont = {
  id: string
  label: string
  /** CSS expression to use as `fontFamily` (e.g. `var(--font-preview-inter)`). */
  cssVar: string
  group: PreviewFontGroup
}

/**
 * Order matches shadcn's /create page exactly: Default first (separator), then
 * Sans, Mono, Serif groups. The picker reads `group` to insert section labels.
 */
export const PREVIEW_FONTS: PreviewFont[] = [
  { id: 'default', label: 'Default', cssVar: '', group: 'default' },
  // Sans
  { id: 'geist', label: 'Geist', cssVar: 'var(--font-preview-geist)', group: 'Sans' },
  { id: 'inter', label: 'Inter', cssVar: 'var(--font-preview-inter)', group: 'Sans' },
  { id: 'noto-sans', label: 'Noto Sans', cssVar: 'var(--font-preview-noto-sans)', group: 'Sans' },
  { id: 'nunito-sans', label: 'Nunito Sans', cssVar: 'var(--font-preview-nunito-sans)', group: 'Sans' },
  { id: 'figtree', label: 'Figtree', cssVar: 'var(--font-preview-figtree)', group: 'Sans' },
  { id: 'roboto', label: 'Roboto', cssVar: 'var(--font-preview-roboto)', group: 'Sans' },
  { id: 'raleway', label: 'Raleway', cssVar: 'var(--font-preview-raleway)', group: 'Sans' },
  { id: 'dm-sans', label: 'DM Sans', cssVar: 'var(--font-preview-dm-sans)', group: 'Sans' },
  { id: 'public-sans', label: 'Public Sans', cssVar: 'var(--font-preview-public-sans)', group: 'Sans' },
  { id: 'outfit', label: 'Outfit', cssVar: 'var(--font-preview-outfit)', group: 'Sans' },
  { id: 'oxanium', label: 'Oxanium', cssVar: 'var(--font-preview-oxanium)', group: 'Sans' },
  { id: 'manrope', label: 'Manrope', cssVar: 'var(--font-preview-manrope)', group: 'Sans' },
  { id: 'space-grotesk', label: 'Space Grotesk', cssVar: 'var(--font-preview-space-grotesk)', group: 'Sans' },
  { id: 'montserrat', label: 'Montserrat', cssVar: 'var(--font-preview-montserrat)', group: 'Sans' },
  { id: 'ibm-plex-sans', label: 'IBM Plex Sans', cssVar: 'var(--font-preview-ibm-plex-sans)', group: 'Sans' },
  { id: 'source-sans-3', label: 'Source Sans 3', cssVar: 'var(--font-preview-source-sans-3)', group: 'Sans' },
  { id: 'instrument-sans', label: 'Instrument Sans', cssVar: 'var(--font-preview-instrument-sans)', group: 'Sans' },
  // Mono
  { id: 'geist-mono', label: 'Geist Mono', cssVar: 'var(--font-preview-geist-mono)', group: 'Mono' },
  { id: 'jetbrains-mono', label: 'JetBrains Mono', cssVar: 'var(--font-preview-jetbrains-mono)', group: 'Mono' },
  // Serif
  { id: 'noto-serif', label: 'Noto Serif', cssVar: 'var(--font-preview-noto-serif)', group: 'Serif' },
  { id: 'roboto-slab', label: 'Roboto Slab', cssVar: 'var(--font-preview-roboto-slab)', group: 'Serif' },
  { id: 'merriweather', label: 'Merriweather', cssVar: 'var(--font-preview-merriweather)', group: 'Serif' },
  { id: 'lora', label: 'Lora', cssVar: 'var(--font-preview-lora)', group: 'Serif' },
  { id: 'playfair-display', label: 'Playfair Display', cssVar: 'var(--font-preview-playfair-display)', group: 'Serif' },
  { id: 'eb-garamond', label: 'EB Garamond', cssVar: 'var(--font-preview-eb-garamond)', group: 'Serif' },
  { id: 'instrument-serif', label: 'Instrument Serif', cssVar: 'var(--font-preview-instrument-serif)', group: 'Serif' },
]
