#!/usr/bin/env node
/**
 * Records the landing-hero animation as a GIF, no manual screen capture.
 *
 * Pre-reqs (once):
 *   pnpm add -D playwright
 *   pnpm exec playwright install chromium
 *   # ffmpeg on PATH
 *
 * Usage:
 *   # in one terminal — host the site
 *   pnpm build && pnpm start
 *
 *   # in another
 *   pnpm record:hero                 # light theme → hero.gif
 *   pnpm record:hero --dark          # dark theme  → hero-dark.gif
 *   pnpm record:hero --url <full>    # record against any URL (e.g. prod)
 *   pnpm record:hero --out my.gif    # custom output filename
 *   pnpm record:hero --fps 20        # default 15
 */
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdir, rm } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const argv = process.argv.slice(2)
const flag = (name) => argv.includes(`--${name}`)
const val = (name, fallback) => {
  const i = argv.indexOf(`--${name}`)
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback
}

const isDark = flag('dark')
const fps = Number(val('fps', 15))
const url = val('url', 'http://localhost:3000/embed/hero')
const outGif = path.resolve(val('out', isDark ? 'hero-dark.gif' : 'hero.gif'))

// 16 frames × 2500 ms per FRAME_MS in landing-hero.tsx
const DURATION_S = 40
const FRAMES_DIR = path.resolve('.hero-frames')

await rm(FRAMES_DIR, { recursive: true, force: true })
await mkdir(FRAMES_DIR, { recursive: true })

console.log(`▶ recording ${url} (theme=${isDark ? 'dark' : 'light'}, fps=${fps})`)
const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 1024, height: 720 },
  deviceScaleFactor: 1,
  colorScheme: isDark ? 'dark' : 'light',
})

// next-themes reads `theme` from localStorage on mount. Pre-seed it before
// the page script runs so the demo renders in the requested mode without a
// hydration flash.
await context.addInitScript(({ theme }) => {
  try { localStorage.setItem('theme', theme) } catch {}
}, { theme: isDark ? 'dark' : 'light' })

const page = await context.newPage()
await page.goto(url, { waitUntil: 'networkidle' })

const demo = page.locator('[data-shaduler-embed="hero"]')
await demo.waitFor({ state: 'visible' })

// Let fonts settle + first animation frame land before we start clicking
// the shutter. Without this the first ~10 frames are mid-fade-in only.
await page.waitForTimeout(500)

const box = await demo.boundingBox()
if (!box) throw new Error('Could not measure [data-shaduler-embed="hero"].')
const clip = {
  x: Math.floor(box.x),
  y: Math.floor(box.y),
  width: Math.ceil(box.width),
  height: Math.ceil(box.height),
}

const totalFrames = Math.round(fps * DURATION_S)
const frameInterval = 1000 / fps
const start = Date.now()
for (let i = 0; i < totalFrames; i++) {
  const targetTime = start + i * frameInterval
  const wait = targetTime - Date.now()
  if (wait > 0) await page.waitForTimeout(wait)
  const file = path.join(FRAMES_DIR, `f-${String(i).padStart(4, '0')}.png`)
  await page.screenshot({ path: file, clip })
  if (i % fps === 0) {
    const secs = (i / fps).toFixed(0).padStart(2, ' ')
    process.stdout.write(`  captured ${secs}s / ${DURATION_S}s\r`)
  }
}
process.stdout.write(`  captured ${DURATION_S}s / ${DURATION_S}s\n`)
await browser.close()

const ffmpegBin = await findFfmpeg()
console.log(`▶ encoding GIF (two-pass palette) using ${ffmpegBin}`)
const palette = path.join(FRAMES_DIR, 'palette.png')
const inputPattern = path.join(FRAMES_DIR, 'f-%04d.png')

await ffmpeg([
  '-y',
  '-framerate', String(fps),
  '-i', inputPattern,
  '-vf', 'palettegen=stats_mode=full',
  palette,
])
await ffmpeg([
  '-y',
  '-framerate', String(fps),
  '-i', inputPattern,
  '-i', palette,
  '-lavfi', 'paletteuse=dither=bayer:bayer_scale=5',
  outGif,
])

await rm(FRAMES_DIR, { recursive: true, force: true })
console.log(`✔ wrote ${outGif}`)

function ffmpeg(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegBin, args, { stdio: ['ignore', 'ignore', 'inherit'] })
    child.on('error', reject)
    child.on('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}`)),
    )
  })
}

/**
 * Resolve a usable ffmpeg binary. The Playwright-bundled ffmpeg is a
 * stripped-down build (MJPEG decoder, WebM encoder only — no PNG decoder,
 * no GIF encoder) so we deliberately skip it. Preference order:
 *
 *   1. Full ffmpeg on PATH (anything a user installed via choco/brew/apt).
 *   2. `@ffmpeg-installer/ffmpeg` — devDep that ships a full binary per OS,
 *      so contributors get GIF encoding without a manual install.
 */
async function findFfmpeg() {
  const onPath = await new Promise((resolve) => {
    const probe = spawn(process.platform === 'win32' ? 'where' : 'which', ['ffmpeg'], {
      stdio: 'ignore',
    })
    probe.on('error', () => resolve(false))
    probe.on('exit', (code) => resolve(code === 0))
  })
  if (onPath) return 'ffmpeg'

  try {
    const mod = await import('@ffmpeg-installer/ffmpeg')
    return mod.default.path
  } catch {
    throw new Error(
      `ffmpeg not found on PATH and \`@ffmpeg-installer/ffmpeg\` is not installed. Run \`pnpm install\`.`,
    )
  }
}
