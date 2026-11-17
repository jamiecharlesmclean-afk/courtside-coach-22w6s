---
name: vibes-platform
description: Pointer to the authoritative platform docs at docs.omg.dev. Read this whenever you start a task that touches schema, routes, deploys, the runtime, sandbox layout, or anything else load-bearing for how Vibes apps run. The docs site is the source of truth; this skill exists only to remind you to fetch it.
---

# Vibes Platform — Defer to the docs

**The authoritative reference is `https://docs.omg.dev/llms-full.txt`.**
Fetch it once at the start of any platform-touching task. It is plain text,
includes every page from the docs site (architecture, deploy flow, SDK,
schema, useCollection, runbooks, auth, service tokens, static deploys), and
is regenerated on every docs build, so it always reflects current
behaviour. The repo's `apps/docs/content/docs/` directory is its source.

Per-topic anchors:

| Need | URL |
| --- | --- |
| Architecture, request path | `https://docs.omg.dev/docs/architecture` |
| Deploy classification, static vs runtime | `https://docs.omg.dev/docs/deploy-flow` |
| Static-only deploys | `https://docs.omg.dev/docs/static-deploys` |
| Auth model | `https://docs.omg.dev/docs/auth` |
| Service tokens | `https://docs.omg.dev/docs/service-tokens` |
| SDK overview, minimum viable DB-backed app | `https://docs.omg.dev/docs/sdk` |
| `schema.ts` contract — root-level, default-exported | `https://docs.omg.dev/docs/sdk/schema` |
| `useCollection` return type, REST + SSE contract | `https://docs.omg.dev/docs/sdk/use-collection` |
| Runbooks | `https://docs.omg.dev/docs/runbooks` |

## Initial response

When this skill is invoked without a specific question, respond only with:

> Loaded the platform pointer. Fetching `https://docs.omg.dev/llms-full.txt` for the current platform reference before I touch anything.

Then fetch it. Do not produce code or describe behaviour from memory — the
docs are short and current; an LLM's recollection of platform contracts is
not.

## Why this skill is thin

This file used to duplicate the platform contract. That meant two sources
of truth — the docs site and the skill — and the skill drifted. The fix is
to keep one source of truth (the docs) and have the skill carry only the
URL to it. If a contract changes, the docs change in the same PR as the
code, and the next agent run pulls the new behaviour automatically.

If the docs site is down, fall back to reading the MDX directly from
`apps/docs/content/docs/` in this repo.
