---
name: realtime-transport
description: Design, review, or optimize Vibes realtime transports, live-query clients, WebSocket/SSE protocols, subscription managers, and reactive data flows. Use when changing files such as subscribe.ts, subscriptions.ts, realtime.ts, use-run-live.ts, @omg-dev/sdk live queries, or any code involving shared WebSockets, server-pushed deltas, resume tokens, fan-out, polling replacement, batching, or transport performance.
---

# Realtime Transport

## Overview

Use one shared realtime transport per backend/auth scope, then multiplex logical subscriptions over it. Optimize by making stale or duplicate states structurally impossible: one socket owner, one subscription registry, one delta path, one reconnect/resume loop.

## Workflow

1. Locate the transport boundary before editing.
   - Client socket creation usually belongs in one manager module, not in each hook.
   - Server subscription state should be keyed by connection then `subId`.
   - Writes should flow through one notification path that emits both legacy invalidation and WS deltas when both still exist.

2. Preserve the protocol contract.
   - Subscribe: `{ op: "sub", subId, collection, where?, resumeFromSeq? }`.
   - Unsubscribe: `{ op: "unsub", subId }`.
   - Server frames: `snapshot`, `delta`, `resumed`, `error`.
   - Deltas must be row-level and predicate-aware; snapshots should be initial load or gap recovery only.

3. Share sockets.
   - Keep one WebSocket per URL/auth token/session.
   - Register many logical subscriptions on that socket.
   - Do not open one socket per React hook unless isolation is explicitly required.
   - When auth changes, close the manager socket and resubscribe from each sub's latest seq.

4. Batch same-tick work.
   - Queue new sub frames and flush them in one microtask or macrotask.
   - Coalesce UI publishes with `requestAnimationFrame` or a short timer for high-frequency streams.
   - Keep unsubscribe immediate enough to avoid delivering stale rows after unmount.

5. Bound memory and backpressure.
   - Cap subscriptions per connection.
   - Cap ring buffers and fall back to snapshot when the resume gap is too large.
   - Drop or resync slow/broken clients instead of buffering without limit.

6. Verify behavior with tests around:
   - many subs sharing one socket
   - same-tick sub batching
   - reconnect with `resumeFromSeq`
   - predicate and scope isolation
   - fallback snapshot after ring gap
   - no duplicate publishes after unsubscribe

## Vibes-Specific Checks

- `packages/server/src/subscriptions.ts` is the server contract and already supports multiple subs per connection.
- `packages/sdk/src/index.ts` and `apps/web/src/lib/data/controlplane/subscribe.ts` are client transport surfaces; avoid placing `new WebSocket(...)` in per-subscription code.
- `control-plane/lib/db-write.ts`, `packages/server/src/db.ts`, and `packages/server/src/auto-crud.ts` are write notification paths. Keep them aligned so raw writes, custom functions, and auto-CRUD all emit deltas.
- `apps/web/src/lib/data/controlplane/realtime.ts` is legacy SSE invalidation. Do not remove it until every caller has a scoped WS replacement.
- `apps/web/src/lib/data/controlplane/use-run-live.ts` is a hot dashboard path. It should subscribe to run, messages, tools, and media over the shared socket, not four independent sockets.

## Done Criteria

- A page with N live queries opens one WebSocket for the same backend/auth scope.
- Initial snapshots are scoped and indexed where possible.
- Steady-state writes are deltas, not full query refetches.
- Reconnect resumes from the last seen seq when the ring can cover the gap.
- Tests prove the transport contract and the high-traffic call site.
