---
name: vibes-v2-orchestrate
description: Manage Vibes V2 sandbox orchestration — start, resume, check status, kill, reset, and inspect chunks. Use when the user asks about vibes v2, sandbox execution, orchestration status, goals progress, chunk execution, or snapshot state. NOTE — this is a legacy experiment; production uses Firecracker via infra.omg.dev.
allowed-tools: Bash(bun run vibes-v2/orchestrate.ts:*), Read(vibes-v2/*), Edit(vibes-v2/*), Write(vibes-v2/*)
---

# Vibes V2 Sandbox Orchestration (legacy)

> **Deprecated.** Production sandboxes run on self-hosted Firecracker
> (`VIBES_SANDBOX_PROVIDER=firecracker`). This `vibes-v2/` orchestrator is a
> historical experiment — only use it when explicitly working on V2 goals.

Manage the V2 app build via the orchestrator script.

## Key Files

| File | Purpose |
|------|---------|
| `vibes-v2/orchestrate.ts` | Main orchestrator — CLI for all operations |
| `vibes-v2/GOALS.md` | Full architecture, phases, tasks, success criteria |
| `vibes-v2/STATUS.md` | Human-readable status notes |
| `vibes-v2/NOTES.md` | Running decisions and blockers |
| `vibes-v2/.state.json` | Machine-readable execution state (auto-managed) |
| `vibes-v2/.orchestrate.log` | Execution log |

## Commands

### Check status
```bash
bun run vibes-v2/orchestrate.ts status
```
Returns JSON with phase, progress, chunk states, snapshot IDs, errors.

### Watch status (live polling)
```bash
bun run vibes-v2/orchestrate.ts status --watch --interval 10
```

### Preview parsed chunks (dry run)
```bash
bun run vibes-v2/orchestrate.ts chunks --goals vibes-v2/GOALS.md
```

### Start execution
```bash
bun run vibes-v2/orchestrate.ts start --goals vibes-v2/GOALS.md
```
Parses goals into chunks (S0–S9), executes each in order inside a remote
sandbox, snapshots after each chunk.

### Start from specific chunk
```bash
bun run vibes-v2/orchestrate.ts start --goals vibes-v2/GOALS.md --from 3
```

### Resume after failure
```bash
bun run vibes-v2/orchestrate.ts resume
```
Picks up from the last incomplete chunk, resets failed chunks to pending.

### Kill running orchestrator
```bash
bun run vibes-v2/orchestrate.ts kill
```

### Reset all state
```bash
bun run vibes-v2/orchestrate.ts reset
```

## Execution Model

```
Goals file → parse chunks → for each chunk:
  1. Fork sandbox from last snapshot (or create fresh)
  2. For S0: install toolchain (bun, Go) directly
  3. For S1+: install pi agent → run agent with chunk tasks
  4. Snapshot sandbox → save snapshot ID to state
  5. Next chunk forks from this snapshot
```

Each chunk is isolated — if one fails, you can fix the issue and `resume`.

## State Structure

`.state.json` contains:
- `phase`: "idle" | "running" | "paused" | "completed" | "failed"
- `chunks[]`: each with id, label, status, snapshotId, error, agentSummary
- `sandboxId`: current/last sandbox
- `currentChunkIndex`: which chunk is executing
- `error`: last error if failed

## Workflow for the Agent

1. **Before starting**: Run `chunks` to verify goals parse correctly
2. **Start execution**: Run `start` — this blocks and runs all chunks sequentially
3. **Monitor**: In another session, use `status` to check progress
4. **On failure**: Read the error, check `.orchestrate.log`, fix the issue in GOALS.md or orchestrate.ts, then `resume`
5. **Track notes**: Update `vibes-v2/NOTES.md` with decisions and blockers
6. **Update STATUS.md**: After milestones, update the human-readable status file

## Modifying Goals

If tasks need adjustment:
1. Edit `vibes-v2/GOALS.md`
2. Run `chunks` to verify parsing
3. `reset` if the chunk structure changed fundamentally
4. `start` or `resume` as appropriate