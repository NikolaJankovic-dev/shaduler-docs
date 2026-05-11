@AGENTS.md

# shaduler-docs — project state

Single-repo home of the shaduler component, its tests, the shadcn registry
artifact, and the Fumadocs documentation site. Live at
**https://shaduler.vercel.app/** — auto-deploys on push to `main`.

Install URL: `https://shaduler.vercel.app/r/shaduler.json`.

## Repo layout (key paths)

```
app/                          Next.js 16 App Router (docs, preview, home)
content/docs/                 MDX content (one file per page)
  recipes/                    11+ recipe pages with live demos
components/
  ui/
    shaduler.tsx              the component itself — source of truth
    __tests__/                vitest specs (128 specs)
    {button,popover,dialog,…} shadcn pieces installed via CLI
  demos/                      live <Shaduler /> previews used inside MDX
  preview-page/               /preview controls + canvas
registry.json                 shadcn registry source (build → public/r/shaduler.json)
public/r/shaduler.json        generated registry artifact (commit it)
```

## Editing the component

Edit `components/ui/shaduler.tsx` directly, then run:

```bash
pnpm test             # 128 specs should pass
pnpm registry:build   # regenerate public/r/shaduler.json
```

Commit both files. There is no sync step anymore (was deprecated 2026-05-10
when the separate `../shaduler` repo was folded in).

## Open work (TODO)

### Marketing / positioning

- **Landing page live demo** — `app/(home)/page.tsx` is hero + buttons only.
  Embed a live `<Shaduler />` (probably one of the `components/demos/` ones)
  above the fold so the value is visible without clicking into `/docs`.
- **GitHub README imagery** — `README.md` is text-only. Add screenshots / GIFs
  near the top (full-customization demo + a plain grid) so the GitHub landing
  has visual proof of what the thing looks like.
- **Scope page** (`content/docs/comparison.mdx`, sidebar label "Scope") —
  positions shaduler as a resource × time grid with a *bring-your-own*
  philosophy. **Don't name or recommend competing libraries** (FullCalendar,
  RBC, Schedule-X, etc.) anywhere in the copy — user explicitly cut that.
  Out-of-scope items (month view, recurring, timezones) are reframed as
  "you handle this upstream", not "use library X". Real gaps go under
  "Still to come".

### `/preview` page (theme picker)

- **Shuffle button** — random combination of palette / accent / font / radius,
  next to Copy CSS in the sidebar bottom block. Skip index 0 (the pinned
  Neutral/Default entries) when picking. State setters already exist on
  `<PreviewControls>` props.

### Full-customization recipe (`components/demos/full-customization.tsx`)

Premium kitchen-sink demo. Built around four `GLASS_*` constants at the top
of the file (panel / button / input / ghost) — change them and the whole UI
updates. Light theme = blue/sky gradient, dark = navy. Spotlight follows
pointer.

Pending polish:

1. **Drop the top border-radius on the Shaduler element** inside this demo
   so the toolbar sits flush against the grid top. Only the bottom corners
   stay rounded.
2. **Outer drop shadow** around the whole demo preview wrapper.
3. **Locale Select** in the Settings popover (next to View / Working hours /
   Snap interval) — forward to `ShadulerTimeColumn.locale` + `formatTime`.
   Pattern already used in the `locales` recipe.
4. **Cross-midnight events** — bring in `splitAcrossMidnight` helper from the
   `cross-midnight` recipe. Visual: pre-midnight half gets `rounded-t-lg`,
   post-midnight half gets `rounded-b-lg` only on the inner glass card.

## Memory across machines

This CLAUDE.md is the cross-machine source of truth — Claude reads it on
session start, so any continuation on a different workstation picks up the
same context. The `~/.claude/.../memory/*.md` files are local-only convenience
caches and don't sync.
