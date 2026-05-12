# shaduler

A composable scheduler grid for shadcn/ui — primitives plus opt-in headless hooks.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="hero-dark.gif">
  <img alt="Animated demo of the shaduler scheduler grid — tasks fade in, change status, slide between time slots" src="hero.gif">
</picture>

**[Live docs →](https://shaduler.vercel.app/)** · **[Theme picker →](https://shaduler.vercel.app/create)**

## Install

Inside any shadcn/ui project:

```bash
pnpm dlx shadcn@latest add https://shaduler.vercel.app/r/shaduler.json
```

One file lands at `components/ui/shaduler.tsx`. No NPM package, no extra
build step, and the component inherits your shadcn theme automatically.

## What you get

- **15 primitives** that compose into the layout you want (`Shaduler`, `ShadulerGrid`, `ShadulerTask`, …). No black-box monolith.
- **3 opt-in hooks** for drag, resize, and range-select. Display-only mode is one render away.
- **shadcn-native theming.** Every colour is a CSS variable; tasks render as `default` / `secondary` / `outline` / `destructive` variants.
- **Time-of-day grid.** Y axis is always time. Multi-day events go in the separate `ShadulerAllDayStrip`; cross-midnight splits at the data layer.

Built for React 19 + Tailwind v4. Works on touch.

## Local development

```bash
pnpm install
pnpm dev              # docs site at http://localhost:3000
pnpm test             # vitest run (shaduler component tests)
pnpm registry:build   # regenerate public/r/shaduler.json
```

## Project layout

```
app/
  (home)/                       marketing landing
  docs/                         docs router (fumadocs DocsLayout)
  create/                       interactive theme picker (shadcn-style)
  embed/hero/                   chrome-free render target for GIF recording
  api/search/                   fumadocs search index
  r/themed.json/                preset-aware registry endpoint
  layout.tsx                    root <html>, RootProvider, ThemeShortcut
  layout.config.tsx             shared nav / links options
content/docs/                   MDX content (one file per page)
components/
  ui/
    shaduler.tsx                ★ the component itself — source of truth
    __tests__/                  vitest specs (141 tests)
    {button,popover,select,…}.tsx   shadcn pieces installed via CLI
  demos/                        live <Shaduler /> previews used inside MDX
  create-page/                  /create controls + canvas
  theme-shortcut.tsx            site-wide D-key theme toggle
mdx-components.tsx              MDX component map
registry.json                   shadcn registry source (build → public/r/shaduler.json)
public/r/shaduler.json          generated registry artifact (commit this)
scripts/record-hero.mjs         Playwright + ffmpeg → hero GIF (pnpm record:hero)
test-setup.ts                   vitest setup (PointerEvent polyfill, RTL cleanup)
vitest.config.ts                isolated test config (jsdom, no Next.js plugins)
```

## Editing the component

Edit `components/ui/shaduler.tsx` directly, then:

```bash
pnpm test             # 141 tests should pass
pnpm registry:build   # regenerates public/r/shaduler.json so installs pick up the new code
```

Commit both files together.

## Recording the hero GIF

If you tweak the landing demo and want a fresh GIF:

```bash
pnpm build && pnpm start          # in one terminal
pnpm record:hero                  # in another → hero.gif (light)
pnpm record:hero --dark           # → hero-dark.gif
```

Playwright + ffmpeg come in via devDependencies — no system install required.

## Adding a new docs page

1. Create `content/docs/my-page.mdx` with frontmatter:
   ```mdx
   ---
   title: My Page
   description: One-line description for SEO and search.
   ---
   ```
2. (Optional) Update `content/docs/meta.json` to position it in the sidebar.
3. Page is live at `/docs/my-page` immediately (no restart needed).

## Adding a new live demo

1. Create a `'use client'` component under `components/demos/<name>.tsx`.
2. Register it in `mdx-components.tsx`.
3. Reference it inside MDX: `<MyDemo />`.

## Deploy

Vercel — connect the repo, framework auto-detects as Next.js. The registry
artifact at `public/r/shaduler.json` becomes the install URL once the domain
is live (e.g. `https://shaduler.vercel.app/r/shaduler.json`).
