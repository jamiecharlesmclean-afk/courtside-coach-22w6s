---
name: vibes-pricing
description: Add pricing plans, a pricing table, paywalls, subscriptions, or per-user usage metering/credits to a Vibes app with @omg-dev/billing + @omg-dev/server. Triggers on "add pricing", "pricing page", "$N plan", "Pro plan", "subscription", "paywall", "upgrade", "charge users", "monetize", "credits", "usage limits", "free vs paid tier".
---

# Vibes Pricing & Billing

Use this when the user wants pricing tiers, a pricing table, a paywall, a
subscription/upgrade flow, or per-user credits / usage metering for **their
app's own end-users**. This is real code — write it directly (Build mode), not
a design mockup.

Two layers, use what the request needs:

1. **Pricing config + table** (display + plan definitions) — `@omg-dev/billing`.
2. **Metering / entitlement / credits** (gate a feature per end-user, grant &
   spend credits) — `@omg-dev/server`'s `billing` client, called from a
   `functions/*.ts` route.

---

## 0. Install the config SDK first

`@omg-dev/billing` is not in the base template — add it before importing it:

```bash
bun add @omg-dev/billing
```

(`@omg-dev/server` is already present; it carries the runtime `billing` client.)

Put the declaration in **`src/billing.ts`** with a **`export const billing`**.
At publish, `@omg-dev/vite-plugin` scans for this `defineBilling()` call,
serializes it, and ships it as the deploy's catalog (`deploys.catalog_json`) —
that's what makes the server-side enforcer honor your default plan, overage
policy, and lifecycle grants. Keep it in a plain `.ts` file (not `.tsx`).

---

## 1. Pricing config + table

Define the plans once in `src/billing.ts`, render with `<PricingTable>`.

```ts
// src/billing.ts
import { defineBilling, plan, limit, overage, polar, usd } from "@omg-dev/billing"

export const billing = defineBilling({
  provider: polar(),                       // user apps bill via Polar
  credit: { unit: "usd", peg: usd(1) },    // 1 credit = $1
  features: {
    pro_access: { kind: "boolean", label: "Pro features" },
  },
  plans: {
    free: plan({
      price: usd(0),
      default: true,                       // exactly ONE plan is default:true
      label: "Free",
      includes: { pro_access: false },
    }),
    pro: plan({
      price: usd(20),
      interval: "month",
      label: "Pro",
      includes: { pro_access: true },
    }),
  },
})
```

```tsx
// in a component (e.g. src/App.tsx)
import { PricingTable } from "@omg-dev/billing/react"
import { billing } from "./billing"

<PricingTable
  billing={billing}
  currentPlan="free"
  onSelectPlan={(planKey) => {/* start checkout for planKey */}}
/>
```

- `usd(20)` → a $20 plan. `interval: "month"` for subscriptions.
- Omit `onSelectPlan` for a read-only marketing table.
- For metered tiers (e.g. "25 of X included, then pay-as-you-go"): add the
  feature as `kind: "metered"` and use `includes: { x: limit(usd(25)) }` +
  `usage: { x: overage({ allow: true }) }` on the plan.

## 2. Metering / entitlement / credits (per end-user)

Gate a feature or spend credits **per the app's own logged-in user**. These
call the platform billing engine through the in-VM agent — so the route MUST
live in `functions/` (see vibes-sdk) and the calls only succeed on a
**published deploy** (a preview sandbox has no billing identity and returns a
503 — that's expected; publish to test for real).

```ts
// functions/use-feature.ts  → POST /api/use-feature
import { billing } from "@omg-dev/server"

export async function POST(ctx: { userId: string }) {
  const ref = ctx.userId                       // the app's end-user id
  // first call mints the customer on the default plan + fires signup grants
  await billing.ensureCustomer(ref)
  const gate = await billing.check("pro_access", ref)   // { allow, balanceMicros, plan }
  if (!gate.allow) return Response.json({ error: "upgrade required" }, { status: 402 })
  // ... do the paid work ...
  await billing.track("pro_access", ref, 1_000_000, crypto.randomUUID())  // spend $1
  return Response.json({ ok: true })
}
```

`@omg-dev/server` `billing` API (amounts are integer **micros**; `usd(5)` =
`5_000_000`, re-exported from `@omg-dev/server`):

- `billing.ensureCustomer(ref, plan?)` → `{ customerId, plan, created }`
- `billing.check(feature, ref)` → `{ allow, balanceMicros, plan, reason? }`
- `billing.track(feature, ref, amountMicros, idempotencyKey, reason?)` → `{ balanceMicros }`
- `billing.grant(ref, feature, amountMicros, { idempotencyKey, grantKey?, source?, reason? })` → `{ balanceMicros }`
- `billing.balance(ref, feature)` → `{ exists, plan, balanceMicros }`

Paid top-ups come from a Polar checkout → webhook → grant (platform-handled);
you do not call Stripe/Polar SDKs from app code.

---

## Gotchas (these silently break billing — do not skip)

- **Build mode, not Design.** Write real files (`src/billing.ts`,
  `functions/*.ts`, `src/App.tsx`). A design-mode HTML mockup never registers a
  route and deploys as the base template.
- **Routes go in `functions/`.** A handler anywhere else yields
  `.vibes/routes.json with 0 route(s)` → the app deploys as a static site with
  no server, and every `billing.*` call 404s.
- **`billing.*` needs a published deploy.** In preview it returns
  `503 agent not provisioned (no identity file)` — that's expected. Verify the
  full round-trip after publishing.
- **Verify before finishing:** confirm the route is in `.vibes/routes.json` and
  `curl <preview>/api/<route>` returns JSON (a 402/503 still proves the route
  registered; an HTML page / 404 means it did NOT).
