# shaduler

A composable scheduler grid for shadcn/ui — primitives + opt-in headless
hooks. This repo holds **everything**: the component source, its tests, the
shadcn registry artifact, and the documentation site (Next.js 16 + Fumadocs).
Users install the component via the published registry URL; nothing else needs
to be hosted elsewhere.

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
  (home)/             marketing landing
  docs/               docs router (fumadocs DocsLayout)
  preview/            interactive theme picker
  layout.tsx          root <html>, RootProvider
  layout.config.tsx   shared nav / links options
content/docs/         MDX content (one file per page)
components/
  ui/
    shaduler.tsx      ★ the component itself — source of truth
    __tests__/        vitest specs (128 tests)
    {button,popover,select,…}.tsx   shadcn pieces installed via CLI
  demos/              live <Shaduler /> previews used inside MDX
  preview-page/       /preview controls + canvas
mdx-components.tsx    MDX component map
registry.json         shadcn registry source (build → public/r/shaduler.json)
public/r/shaduler.json  generated registry artifact (commit this)
test-setup.ts         vitest setup (PointerEvent polyfill, RTL cleanup)
vitest.config.ts      isolated test config (jsdom, no Next.js plugins)
```

## Editing the component

Edit `components/ui/shaduler.tsx` directly, then:

```bash
pnpm test             # 128 tests should pass
pnpm registry:build   # regenerates public/r/shaduler.json so installs pick up the new code
```

Commit both files together. The `pnpm registry:build` step is what users
install via:

```bash
pnpm dlx shadcn@latest add https://shaduler.dev/r/shaduler.json
```

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
is live (e.g. `https://shaduler.dev/r/shaduler.json`).
# shaduler-docs
