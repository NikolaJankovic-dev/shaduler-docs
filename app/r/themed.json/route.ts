import { promises as fs } from 'fs'
import path from 'path'
import { type NextRequest } from 'next/server'
import {
  decodePreset,
  shadcnAccentToOur,
  shadcnPaletteToOur,
  shadcnRadiusToOur,
} from '@/components/create-page/preset-codec'
import {
  ACCENTS,
  PALETTES,
  RADIUS_OPTIONS,
  composeThemeVars,
  type ThemeVars,
} from '@/components/create-page/themes'

/**
 * Themed shaduler registry endpoint. Reads the static `shaduler.json` artifact,
 * decodes the `?preset=` query param into our four theme tokens (palette,
 * accent, radius — font/style/heading don't affect CSS variables), and merges
 * the resulting light + dark variable maps into the registry item's `cssVars`
 * field. shadcn's CLI consumes `cssVars` and writes them into the user's
 * `globals.css` during `shadcn add`, so a single install command lays down
 * both the component and the chosen theme.
 *
 * Without `?preset=`, returns the base registry artifact unchanged.
 */

// shadcn's registry schema uses CSS variable names WITHOUT the `--` prefix
// (the CLI prepends `--` when writing the file).
function stripPrefix(vars: ThemeVars): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(vars)) {
    out[k.startsWith('--') ? k.slice(2) : k] = v
  }
  return out
}

export async function GET(req: NextRequest) {
  const filePath = path.join(process.cwd(), 'public', 'r', 'shaduler.json')
  const raw = await fs.readFile(filePath, 'utf-8')
  const base = JSON.parse(raw)

  const preset = req.nextUrl.searchParams.get('preset')
  if (preset) {
    const decoded = decodePreset(preset)
    if (decoded) {
      const palette =
        PALETTES.find(
          (p) => p.id === shadcnPaletteToOur(decoded.baseColor),
        ) ?? PALETTES[0]
      const accent =
        ACCENTS.find((a) => a.id === shadcnAccentToOur(decoded.theme)) ??
        ACCENTS[0]
      const radius =
        RADIUS_OPTIONS.find(
          (r) => r.id === shadcnRadiusToOur(decoded.radius),
        ) ?? RADIUS_OPTIONS[0]
      const lightVars = composeThemeVars({
        palette,
        accent,
        radius: radius.value,
        mode: 'light',
      })
      const darkVars = composeThemeVars({
        palette,
        accent,
        radius: radius.value,
        mode: 'dark',
      })
      base.cssVars = {
        light: stripPrefix(lightVars),
        dark: stripPrefix(darkVars),
      }
    }
  }

  return Response.json(base)
}
