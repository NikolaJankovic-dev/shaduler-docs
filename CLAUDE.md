@AGENTS.md

# shaduler-docs — project state

Single-repo home of the shaduler component, its tests, the shadcn registry
artifact, and the Fumadocs documentation site. Live at
**https://shaduler.vercel.app/** — auto-deploys on push to `main`.

Install URL: `https://shaduler.vercel.app/r/shaduler.json`.

## Repo layout (key paths)

```
app/                          Next.js 16 App Router (docs, create, home, embed/hero, api/search)
content/docs/                 MDX content (one file per page)
  recipes/                    14 recipe pages with live demos
components/
  ui/
    shaduler.tsx              the component itself — source of truth
    __tests__/                vitest specs (141 specs)
    {button,popover,dialog,…} shadcn pieces installed via CLI
  demos/                      live <Shaduler /> previews used inside MDX
  create-page/                /create controls + canvas
registry.json                 shadcn registry source (build → public/r/shaduler.json)
public/r/shaduler.json        generated registry artifact (commit it)
```

## Editing the component

Edit `components/ui/shaduler.tsx` directly, then run:

```bash
pnpm test             # 141 specs should pass
pnpm registry:build   # regenerate public/r/shaduler.json
```

Commit both files. There is no sync step anymore (was deprecated 2026-05-10
when the separate `../shaduler` repo was folded in).

## Standing constraint — Scope page

`content/docs/comparison.mdx` (sidebar label "Scope") positions shaduler as a
resource × time grid with a *bring-your-own* philosophy. **Don't name or
recommend competing libraries** (FullCalendar, RBC, Schedule-X, etc.) anywhere
in the copy — user explicitly cut that. Out-of-scope items (month view,
recurring, timezones) are reframed as "you handle this upstream", not "use
library X". Real gaps go under "Still to come". Applies to any future edit of
that page.

## Notes

### Full-customization recipe (`components/demos/full-customization.tsx`)

Premium kitchen-sink demo. Built around four `GLASS_*` constants at the top
of the file (panel / button / input / ghost) — change them and the whole UI
updates. Light theme = blue/sky gradient, dark = navy. Spotlight follows
pointer. Cross-midnight is currently pre-split via `crossMidnightHalf:
'top'|'bottom'` on the task objects (not the `splitAcrossMidnight` helper).

### Hero GIF (`hero.gif`, `hero-dark.gif`)

Embedded at the top of README via a `<picture>` element that swaps based on
GitHub's prefers-color-scheme. Regenerate with `pnpm record:hero` (light) or
`pnpm record:hero --dark`. Requires the site running locally
(`pnpm build && pnpm start`). Playwright + ffmpeg come in via devDeps — no
system install needed. See `scripts/record-hero.mjs`.

## Memory across machines

This CLAUDE.md is the cross-machine source of truth — Claude reads it on
session start, so any continuation on a different workstation picks up the
same context. The `~/.claude/.../memory/*.md` files are local-only convenience
caches and don't sync.
