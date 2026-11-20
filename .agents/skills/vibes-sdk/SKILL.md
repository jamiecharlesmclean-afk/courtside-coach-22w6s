---
name: vibes-sdk
description: Pointer to the SDK docs at docs.omg.dev/docs/sdk. Read this before adding any persistence, list, form, "track-things-in-a-DB" feature, OR any AI / chat / agent feature. Triggers on requests like "build a tasks app", "store in a db", "persist", "tracker", "list of …", "chat app", "AI agent", "use Claude / GPT", or any feature where state must survive a refresh OR that calls an LLM.
---

# Vibes SDK

The authoritative reference is the SDK section of the docs. **Always
fetch the relevant URL before producing code** — the contract has
silently broken in the past when an agent paraphrased it from memory.

| Need | URL |
| --- | --- |
| Whole platform reference (plain text) | `https://docs.omg.dev/llms-full.txt` |
| AI / chat / agents | `https://docs.omg.dev/docs/sdk/ai` |
| `schema.ts` + DB-backed CRUD | `https://docs.omg.dev/docs/sdk/schema` |
| `useCollection` hook contract | `https://docs.omg.dev/docs/sdk/use-collection` |
| Multi-user auth (`<VibesAuthGuard>`, `useUser`) | `https://docs.omg.dev/docs/sdk/auth` |
| Media gen: images / video / speech (TTS) / transcription | `https://docs.omg.dev/docs/sdk/media` |

## Initial response

When invoked, branch on the request:

**LLM / chat / agent** (anything that streams text from a model):

> Ready to wire up the LLM. Fetching `https://docs.omg.dev/docs/sdk/ai`. The chat endpoint will live at `functions/api/chat.ts`, starting with:
>
> ```ts
> import { streamText, anthropic } from "@omg-dev/ai"
> ```

**DB-backed feature** (list, form, persist, tracker, anything stateful):

> Ready to wire up persistence. Fetching `https://docs.omg.dev/llms-full.txt`, then I'll add `schema.ts` + a `useCollection` view.

Then fetch the URL.

---

## AI / chat / agents

The sandbox has **no direct internet access**. Every LLM call goes
through the per-VM proxy, which injects the real key, applies spend
caps, and writes the usage_logs row. `@omg-dev/ai` is the only correct
entry point — it pre-binds the proxy URL, the placeholder key, and
the `runWithEndUser` AsyncLocalStorage attribution.

Streaming endpoints live in `functions/api/<name>.ts` next to your
CRUD handlers. The platform routes them automatically — no separate
`Bun.serve`, no `.vibes/server.mjs`, dev preview matches prod.

### Steps to build a chat app

A chat UI only needs an input and a send button — both are five-line
plain-Tailwind elements. **Do not run `bunx shadcn@latest init` for
the chat skeleton** — the CLI's tsconfig path-alias detection trips on
this template's `tsconfig.json` (which only has `references`, not
`paths`), and pi has burned 25-minute runs trying to patch
`components.json` `resolvedPaths`. If a later iteration genuinely
needs Card / Avatar / Dialog / etc., follow the shadcn rule below.
For a basic chat: skip it.

1. **Write `functions/api/chat.ts`** — the file's exported `POST`
   becomes `POST /api/chat`. Wrap the body in `runWithEndUser(ctx.userId, …)`
   so every upstream LLM call gets `X-OMG-User` attribution:

   ```ts
   import {
     streamText, anthropic, runWithEndUser, convertToModelMessages,
   } from "@omg-dev/ai"
   import { ctx } from "@omg-dev/server"

   export async function POST(req: Request) {
     const { messages } = await req.json()
     return runWithEndUser(ctx.userId, async () => {
       const result = streamText({
         model: anthropic("claude-sonnet-4-6"),
         messages: await convertToModelMessages(messages),
       })
       return result.toUIMessageStreamResponse()
     })
   }
   ```

   `ctx.userId` comes from the auth middleware that already ran on the
   request. The wrap propagates it into `@omg-dev/ai`'s AsyncLocalStorage,
   which the provider's fetch interceptor reads to stamp the upstream
   header. Anonymous request → `ctx.userId` is `null` and the call is
   unattributed (the proxy still bills the app creator).

   `useChat` (step 3) sends `UIMessage[]` with `parts`; `streamText`
   expects `ModelMessage[]` with `content` strings. Passing UI messages
   directly silently produces empty completions, so always wrap with
   `convertToModelMessages(messages)`. Pair with
   `toUIMessageStreamResponse()` so the data-stream protocol matches
   what `useChat` parses on the client.

2. **Write `src/App.tsx`** with `useChat` from `@omg-dev/ai/react`. The
   hook talks to `/api/chat` by default, manages messages + input
   state, and parses the data-stream protocol that
   `toUIMessageStreamResponse()` emits on the server. Plain `<input>` /
   `<button>` with Tailwind classes — no shadcn:

   ```tsx
   import { useState } from "react"
   import { useChat } from "@omg-dev/ai/react"

   export default function App() {
     const { messages, sendMessage, status } = useChat()
     const [input, setInput] = useState("")
     const streaming = status === "streaming" || status === "submitted"

     function send() {
       const text = input.trim()
       if (!text || streaming) return
       sendMessage({ text })
       setInput("")
     }

     return (
       <div className="flex h-dvh flex-col p-4 gap-4 bg-neutral-50">
         <div className="flex-1 overflow-y-auto space-y-2">
           {messages.map((m) => (
             <div key={m.id} className={m.role === "user" ? "text-right" : ""}>
               <span className={`inline-block rounded-lg px-3 py-2 ${
                 m.role === "user" ? "bg-blue-500 text-white" : "bg-white border"
               }`}>
                 {m.parts.map((p, i) => p.type === "text" ? <span key={i}>{p.text}</span> : null)}
               </span>
             </div>
           ))}
         </div>
         <div className="flex gap-2">
           <input
             value={input}
             onChange={(e) => setInput(e.target.value)}
             onKeyDown={(e) => e.key === "Enter" && send()}
             className="flex-1 rounded-md border px-3 py-2"
             placeholder="Say something…"
           />
           <button
             onClick={send}
             disabled={streaming || !input.trim()}
             className="rounded-md bg-black text-white px-4 py-2 disabled:opacity-50"
           >Send</button>
         </div>
       </div>
     )
   }
   ```

   `useChat` is browser-safe — it lives at the `/react` subpath because
   the root `@omg-dev/ai` entry imports `node:async_hooks` for the ALS
   attribution and would fail to bundle in the browser. Server code
   keeps using `from "@omg-dev/ai"`; client code uses `from "@omg-dev/ai/react"`.

### Rules — pi has gotten each of these wrong on past runs

| ❌ Don't | ✅ Do |
| --- | --- |
| `import { streamText } from "ai"` | `import { streamText } from "@omg-dev/ai"` |
| `import { anthropic } from "@ai-sdk/anthropic"` | `import { anthropic } from "@omg-dev/ai"` |
| `createAnthropic({ baseURL })` / `createOpenAI({ baseURL })` | Use the pre-configured `anthropic` / `openai` from `@omg-dev/ai` |
| `apiKey: …`, `baseURL: …` on the model | Omit both — the proxy injects them |
| Hand-rolling a `Bun.serve` in `.vibes/server.mjs` | Just export `POST` from `functions/api/chat.ts` — the platform routes it |
| Naming the export `handler` / `chat` / `default` | Export must be `POST` (or `GET` / `PUT` / `PATCH` / `DELETE`) — the scanner routes by exported name |
| `streamText({ ..., headers: { "X-OMG-User": id } })` | Wrap the body in `runWithEndUser(ctx.userId, () => …)` — `ctx` from `@omg-dev/server` carries the auth-middleware-verified user id |
| `import { useChat } from "ai/react"` or `"@ai-sdk/react"` | `import { useChat } from "@omg-dev/ai/react"` — browser-safe subpath, no `node:async_hooks` |
| `import { useChat } from "@omg-dev/ai"` (root) in a `.tsx` component | Root entry pulls in `node:async_hooks` and won't bundle. Use `@omg-dev/ai/react` from client code |
| Hand-rolled `fetch("/api/chat")` + `getReader()` loop on the client | Use `useChat()` — handles state, streaming, parts, errors. Pair with `toUIMessageStreamResponse()` server-side |
| `result.toTextStreamResponse()` when the client uses `useChat` | `result.toUIMessageStreamResponse()` — `useChat` parses the data-stream protocol, not raw text |
| Passing `messages` straight to `streamText` when client uses `useChat` | Wrap with `await convertToModelMessages(messages)` — `useChat` sends `UIMessage[]` (parts), `streamText` wants `ModelMessage[]` (content strings) |
| `convertToModelMessages(messages)` without `await` (ai SDK v6) | `await convertToModelMessages(messages)` — it became async in ai@6. Forgetting the await passes `Promise` to `streamText`, which throws "messages.some is not a function" inside the stream |
| `fetch("http://localhost:3000/api/chat")` (client) | `fetch("/api/chat")` — relative URL hits the same origin in dev preview AND prod |
| Importing `@/components/ui/<x>` without first running `bunx shadcn@latest add <x>` | Run `add` for every shadcn component before using it |
| Running `bunx shadcn@latest init` for a basic chat / form / list when plain Tailwind would do | The CLI's tsconfig path-alias detection trips on this template's split tsconfig. Skip shadcn unless the design *needs* Card / Avatar / Dialog / Popover / etc. |

### Models

Default `claude-sonnet-4-6`. Use `claude-haiku-4-5-20251001` for
cost-sensitive paths, `claude-opus-4-7` only on explicit request.
Cost is billed to the app creator regardless of whether the end-user
is authenticated.

### Tools / agents

Standard AI SDK shape — `tool({ description, inputSchema:
z.object({...}), execute })`, multi-step with `stopWhen: stepCountIs(5)`.

---

## DB-backed apps (schema.ts + useCollection)

`schema.ts` lives at **project root** (not `src/`), default-exported.
Static-vs-runtime deploy classification is decided here: if the build
can't read collections from `default.collections`, the deploy goes
static and every mutation 405s.

`useCollection<T>("name")` returns `{ data: T[], loading, error,
create, update, remove, refresh }`. `data` is always `T[]`, never
undefined.

Imports come from the root `@omg-dev/sdk` package only:

```ts
import {
  useCollection,
  VibesAuthProvider, VibesAuthGuard,
  useUser, useAuth, VibesLogin,
} from "@omg-dev/sdk"
```

Do **not** use `@omg-dev/sdk/auth` — that subpath only resolves locally
during dev; production deploys publish with `exports` rewritten to
`"."` only, and the build fails with `"./auth" is not exported`.

For full schema field types, scope, indexes — fetch
`https://docs.omg.dev/docs/sdk/schema`. For the hook contract, fetch
`https://docs.omg.dev/docs/sdk/use-collection`.

## Multi-user auth

Deployed apps at `<slug>.apps.omg.dev` get auth for free — JWKS-verified
JWTs from `auth.omg.dev`, attached automatically by `useCollection`,
filtered server-side by `_owner` for any collection marked
`.scoped("user")`. Wrap the app in `<VibesAuthProvider>` +
`<VibesAuthGuard>` and read the current user with `useUser()`.

For a polished login UI, install the OMG-registry block:
`bunx shadcn@latest add https://docs.omg.dev/r/vibes-login.json` and
pass it to the guard via `fallback={<VibesLogin />}`.

---

If anything here disagrees with the docs site, the docs win.
