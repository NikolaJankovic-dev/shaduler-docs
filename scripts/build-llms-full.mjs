#!/usr/bin/env node

/**
 * Generate `public/llms-full.txt` — a single Markdown file containing every
 * docs page concatenated, ordered to match the sidebar (top-level
 * `content/docs/meta.json`, then `recipes/meta.json` for the nested group).
 *
 * Run automatically before `next build` via the `prebuild` npm script. Safe
 * to invoke directly during development: `node scripts/build-llms-full.mjs`.
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')
const docsRoot = path.join(repoRoot, 'content', 'docs')
const outPath = path.join(repoRoot, 'public', 'llms-full.txt')
const SITE_URL = 'https://shaduler.com'

/** Walk a meta.json's `pages` array and return resolved page paths in order. */
async function readMeta(dir) {
  const metaPath = path.join(dir, 'meta.json')
  try {
    const raw = await fs.readFile(metaPath, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return null
  }
}

/** Strip leading frontmatter block `---\n…\n---\n` and return { meta, body }. */
function splitFrontmatter(src) {
  const match = src.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/)
  if (!match) return { meta: {}, body: src }
  const meta = {}
  for (const line of match[1].split(/\r?\n/)) {
    const m = line.match(/^(\w+):\s*(.+)$/)
    if (m) meta[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
  }
  return { meta, body: src.slice(match[0].length) }
}

/**
 * Resolve a page name (from meta.json `pages`) to an absolute path.
 *
 * - `"index"` → `<dir>/index.mdx`
 * - `"installation"` → `<dir>/installation.mdx`
 * - `"recipes"` (no extension and a subdirectory exists) → recurse into it
 */
async function resolvePages(dir, baseUrlSegments) {
  const meta = await readMeta(dir)
  if (!meta) return []
  const out = []
  for (const name of meta.pages) {
    const subdir = path.join(dir, name)
    const file = path.join(dir, `${name}.mdx`)
    try {
      const stat = await fs.stat(subdir)
      if (stat.isDirectory()) {
        out.push(...(await resolvePages(subdir, [...baseUrlSegments, name])))
        continue
      }
    } catch {
      // not a directory — fall through to file case
    }
    try {
      await fs.access(file)
      const url =
        name === 'index'
          ? `/${baseUrlSegments.join('/')}`
          : `/${[...baseUrlSegments, name].join('/')}`
      out.push({ file, url: url.replace(/\/+/g, '/') })
    } catch {
      // missing file — skip silently; the docs build would catch it anyway
    }
  }
  return out
}

const HEADER = `# shaduler — full documentation

> A composable scheduler grid for shadcn/ui. Single \`.tsx\` file, opt-in headless hooks, theme tokens that follow your existing shadcn variables.
>
> This file concatenates every page on ${SITE_URL}/docs in sidebar order, intended for LLM ingestion. Each section starts with the page URL so you can cite it. The shorter summary lives at ${SITE_URL}/llms.txt.

`

async function main() {
  const pages = await resolvePages(docsRoot, ['docs'])
  const parts = [HEADER]
  for (const { file, url } of pages) {
    const raw = await fs.readFile(file, 'utf-8')
    const { meta, body } = splitFrontmatter(raw)
    const title = meta.title ?? path.basename(file, '.mdx')
    const description = meta.description ?? ''
    parts.push(`---\n\n# ${title}\n\nSource: ${SITE_URL}${url}\n`)
    if (description) parts.push(`\n_${description}_\n`)
    parts.push(`\n${body.trim()}\n\n`)
  }
  await fs.mkdir(path.dirname(outPath), { recursive: true })
  await fs.writeFile(outPath, parts.join(''), 'utf-8')
  const wordCount = parts.join('').split(/\s+/).length
  console.log(
    `Wrote ${path.relative(repoRoot, outPath)} (${pages.length} pages, ~${wordCount.toLocaleString()} words)`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
