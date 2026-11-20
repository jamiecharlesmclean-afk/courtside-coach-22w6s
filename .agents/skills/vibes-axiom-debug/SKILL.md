---
name: vibes-axiom-debug
description: Debug Vibes using Axiom-backed Convex cloud logs. Use when investigating run planner or run executor failures, missing agent callbacks, sandbox resume issues, auth fallback behavior, or any bug where recent cloud logs will explain what happened faster than reading code first.
---

# Vibes Axiom Debug

Use Axiom as the **first stop** for debugging Vibes backend behavior.

This repo streams **Convex cloud logs** to Axiom. For this product, that is the best source when debugging:

- planner failures
- executor kickoff / poll / resume failures
- missing callbacks
- auth fallback behavior
- cloud-only behavior that does not reproduce locally

## Preconditions

- Prefer reproducing the issue against the **cloud Convex deployment** (`bun run dev:cloud`), not local Convex.
- The Axiom token must be available in one of:
  - `AXIOM_TOKEN` in the shell
  - `.env.local`
  - `.env.cloud.local`
  - `.env.development.local`
- Dataset defaults to `ai` unless `AXIOM_DATASET` is set.

## Key Files

| File | Purpose |
|------|---------|
| `scripts/axiom-query.sh` | Runs APL queries against Axiom using local env files automatically |
| `references/common-queries.md` | Product-specific APL queries for Vibes debugging |
| `convex/runPlanner.ts` | Planner action logs |
| `convex/runExecutor.ts` | Executor lifecycle logs |
| `convex/auth.ts` | Auth fallback log |
| `convex/lib/log.ts` | Structured Vibes log format |

## Quick Start

Run any APL query with:

```bash
bash .agents/skills/vibes-axiom-debug/scripts/axiom-query.sh 'ai | where data.topic == "function_execution" | limit 10'
```

If `AXIOM_DATASET` is set, you can use it explicitly or still keep `ai` in the query.

## Workflow

1. **Reproduce or identify the failing flow**
   - planner
   - kickoff
   - poll
   - resume
   - tool answer delivery
   - auth

   If a real user hit this and you can't reproduce it, don't guess at the flow —
   **watch their recorded session** instead of reproducing:
   `.claude/skills/user-sessions/scripts/replay.sh list` then `summary <visit_id>`
   (Umami session replay covers omg.dev + app.omg.dev; `distinct_id` is the
   better-auth user id). It tells you which flow and which minute to query here.

2. **Query Axiom before editing code**
   - Start with the queries in `references/common-queries.md`
   - Look for both:
     - `data.topic == "function_execution"` failures
     - `data.topic == "console"` structured Vibes log lines

3. **Narrow by function and event**
   Common function paths:
   - `runPlanner:planInitial`
   - `runPlanner:planAfterAnswer`
   - `runExecutor:kickoff`
   - `runExecutor:pollAgentStatus`
   - `runExecutor:sendFollowUp`
   - `runExecutor:deliverToolAnswer`

   Common structured event names inside `data.message`:
   - `run_planner.started`
   - `run_planner.finished`
   - `run_planner.failed`
   - `run_executor.kickoff_failed`
   - `run_executor.poll_failed`
   - `run_executor.poll_paused_after_failures`
   - `run_executor.resume_failed`
   - `run_executor.deliver_tool_answer_failed`
   - `auth.magic_link.dev_fallback`

4. **Search by runId, toolCallId, snapshotId, sandboxId, or prompt fragments**
   Use `where * has "..."` for quick broad searches.

5. **Summarize findings before code changes**
   State:
   - what failed
   - which Convex function failed
   - the most relevant timestamps
   - the exact log lines or function execution failures that support the diagnosis

6. **Only then edit code**

## Important Notes

- In the Convex → Axiom integration, event-specific fields are typically under the `data` field.
- Structured Vibes logs are emitted as JSON strings in `data.message` for `data.topic == "console"` events.
- If Axiom has no relevant data, fall back to:
  - `bunx convex logs --success`
  - local code inspection
  - `.evlog/logs/` only if you are debugging non-Convex local runtime behavior

## Common Commands

Recent failures:
```bash
bash .agents/skills/vibes-axiom-debug/scripts/axiom-query.sh 'ai | where data.topic == "function_execution" | where data.status == "failure" | sort by data.timestamp desc | limit 50'
```

Recent executor errors:
```bash
bash .agents/skills/vibes-axiom-debug/scripts/axiom-query.sh 'ai | where data.topic == "console" | where data.message has "run_executor" | sort by data.timestamp desc | limit 100'
```

Search by run id / any token:
```bash
bash .agents/skills/vibes-axiom-debug/scripts/axiom-query.sh 'ai | where * has "<run-id-or-fragment>" | sort by data.timestamp desc | limit 100'
```

See `references/common-queries.md` for more.
