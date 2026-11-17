---
name: vibes-create-app
description: Bootstrap a new app in the Vibes sandbox. Use this skill at the START of every new app build — before writing any components or features. Confirms the pre-baked shadcn/ui scaffold (Tailwind v4, components.json, cn(), nova theme) is in place and walks you through adding the components you need. Triggers on any first-turn creation request like "build a todo app", "create a dashboard", "make me an app that...", or any request to build something new from scratch.
---

# Vibes App Setup

**Use this skill first — before writing any component or feature code.**

The sandbox forks from a template snapshot that already has shadcn/ui initialized
(Tailwind v4 wired into vite, `components.json`, `src/lib/utils.ts`, theme tokens
in `src/index.css`). Your job is to confirm what's there, add the components the
app needs, and start building.

---

## Sandbox Environment

| Thing | Value |
|-------|-------|
| Project dir | `/home/user/project` |
| Package manager | **bun** (`bun add`, `bunx --bun shadcn@latest`) |
| Dev server | **already running** with HMR on port 5173 — do NOT start another one |
| `vite.config.ts` | **already configured** — `host: '0.0.0.0'`, `allowedHosts: true`, `cors: true`, `hmr.overlay: false`, `@/*` → `./src`, Tailwind plugin loaded — **do NOT modify it** |
| Project scaffold | Vite + React + TypeScript with shadcn/ui pre-initialized (preset: `nova`) |

---

## Step 1 — Confirm scaffold + check installed components

The template already shipped `components.json`, `src/lib/utils.ts`, and the
Tailwind theme. Don't re-run `shadcn init` — it overwrites theme tokens and
can clobber `vite.config.ts`'s sandbox settings.

Just check what's already there:

```bash
ls /home/user/project/components.json /home/user/project/src/lib/utils.ts
bunx --bun shadcn@latest info --json
```

Read the `shadcn` skill for component rules, patterns, and the full component
reference. Always read it before adding or composing components.

> **User asked for a different theme/preset?** Switching presets is the only
> reason to re-run init. Use `--force` so it overwrites the existing tokens:
> ```bash
> bunx --bun shadcn@latest init --preset <code> --force
> ```
> After re-init, **verify** `vite.config.ts` still has `host: '0.0.0.0'`,
> `allowedHosts: true`, `cors: true`, the `hmr.overlay: false` block, and
> the `@` alias. Restore them if shadcn dropped any:
>
> ```ts
> server: {
>   host: '0.0.0.0',
>   allowedHosts: true,
>   cors: true,
>   hmr: { overlay: false },
> },
> ```
>
> Preset codes are opaque — never try to decode them, pass them directly to
> the CLI. Named presets: `nova` (default), `vega`, `maia`, `lyra`, `mira`,
> `luma`, `sera`. Custom theme codes from ui.shadcn.com look like `a2r6bw`.

---

## Step 2 — Use the pre-baked inventory; add only what's missing

The template already ships the full common inventory in `src/components/ui/`:

`tabs` `dialog` `sheet` `popover` `tooltip` `dropdown-menu` `select` `input`
`textarea` `label` `checkbox` `radio-group` `switch` `slider` `toggle-group`
`badge` `separator` `skeleton` `progress` `avatar` `scroll-area` `accordion`
— plus vendored delight primitives (`button`, `card`, `bottom-nav`,
`otp-input`, `animated-number`, `animated-text`, `scroll-affordance`,
`transitions`, `sound`). **Import and use these — never hand-roll a tab bar,
toggle, slider, dropdown, or modal with divs.**

Only `add` when something is genuinely missing:

```bash
# For data-heavy apps
yes n | bunx --bun shadcn@latest add table

# For confirmations
yes n | bunx --bun shadcn@latest add alert-dialog

# Search the registry first when unsure
bunx --bun shadcn@latest search -q "sidebar"
```

Always pipe `yes n` so overwrite prompts are answered No — the vendored
primitives (button.tsx, card.tsx, …) must never be replaced by stock ones.

The rootfs ships with a warm bun cache for the common shadcn deps (Radix
primitives, lucide-react, cva, clsx, tailwind-merge, react-hook-form, etc.),
so `add` resolves locally without network for the standard set.

---

## Step 3 — Build the app

Start from `src/App.tsx` — it is the `/` route's component. HMR auto-reloads on
every file save — no need to restart anything.

### File layout

```
src/
  routes/
    __root.tsx      ← shell every route renders inside (app-wide chrome)
    index.tsx       ← "/" — renders App.tsx
    <name>.tsx      ← "/<name>" — add a file, get a route
  routeTree.gen.ts  ← GENERATED from src/routes/ — never edit by hand
  App.tsx           ← the home view (kept as "/" so the SSG prerender works)
  main.tsx          ← entry point, keep minimal
  index.css         ← global CSS + shadcn theme vars (do NOT delete @theme block)
  lib/
    utils.ts        ← cn() helper (pre-baked)
  components/
    ui/             ← shadcn components (managed by CLI, do not hand-edit)
    <feature>.tsx   ← your app components go here
```

### Routing — TanStack Router, file-based

More than one screen? Add a file to `src/routes/`, don't add a `useState`
view-switcher inside `App.tsx`.

```tsx
// src/routes/pricing.tsx  →  /pricing
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/pricing")({
  component: Pricing,
})

function Pricing() {
  return <main>...</main>
}
```

- Nesting is dots or dirs: `posts.$postId.tsx` → `/posts/$postId`, read it with
  `Route.useParams()`.
- Navigate with `<Link to="/pricing">`, never a raw `<a href>` (a raw anchor
  triggers a full page reload and drops app state).
- `routeTree.gen.ts` regenerates on save — if an import of it looks stale, save
  a route file rather than editing the generated tree.
- **Static routes get prerendered to their own HTML at build time**
  (`dist/pricing/index.html`), so real URLs are good for SEO. Param routes
  (`$id`) can't be — they fall back to the SPA shell, which is fine.

### Import alias

The project uses `@/` as the src alias. Always import like:

```ts
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
```

### Adding dependencies

```bash
bun add <package>
# e.g.
bun add date-fns
bun add @tanstack/react-query
```

---

## Core Rules

| Rule | Detail |
|------|--------|
| ✅ Use what's already there | shadcn is pre-initialized — skip `shadcn init` unless switching presets |
| ✅ Use `bunx --bun shadcn@latest add` | For every component before using it |
| ✅ Use `bun add` for npm packages | Not `npm install` or `pnpm add` |
| ✅ Use semantic color tokens | `bg-background`, `text-muted-foreground` — the default Tailwind palette is REMOVED; raw classes like `bg-indigo-600` compile to nothing |
| ✅ Theme changes go through presets | `shadcn init --preset <code> --force` — never hand-edit token values in `src/index.css`, never force `.dark` unprompted |
| ✅ Use `cn()` for conditional classes | From `@/lib/utils` |
| ❌ Never run `bun dev` / `npm run dev` | Dev server is already running |
| ❌ Never re-run `create-vite` | Project already exists |
| ❌ Never remove `allowedHosts`/`cors`/`hmr` from vite config | Sandbox preview depends on them |
| ❌ Never install Tailwind manually | Template ships with `@tailwindcss/vite` already wired |
| ❌ Never hand-edit `src/components/ui/` files | Use the shadcn CLI to update them |

---

## Definition of Done

The setup is complete when:
1. You've confirmed `components.json` and `src/lib/utils.ts` already exist (template ships them)
2. You've added the components your feature needs via `shadcn add`
3. The preview URL shows your app (HMR is live)
