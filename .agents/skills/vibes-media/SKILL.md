---
name: vibes-media
description: Generate images, video, speech audio (text-to-speech), or transcripts (speech-to-text) from a Vibes app via @omg-dev/media — zero keys, billed to platform credits, durable CDN results. Triggers on requests like "generate an image", "AI images/avatars/thumbnails", "make a video", "read this aloud", "voice / narration / text to speech", "transcribe", "speech to text", "voice notes", "dictation".
---

# Vibes media generation (image · video · speech · transcription)

The authoritative reference is `https://docs.omg.dev/docs/sdk/media` —
**fetch it before producing code**. Quick contract:

```ts
import { generateImage, generateSpeech, transcribe, submit, getJob } from "@omg-dev/media"

const { url }  = await generateImage({ model: "wavespeed-ai/flux-dev", input: { prompt } })
const { url }  = await generateSpeech({ text: "Welcome!" })              // CDN mp3, ~seconds
const { text } = await transcribe({ audioUrl, durationSeconds: 42 })     // durationSeconds REQUIRED
```

## Hard rules

1. **Never block a server route on a slow job.** The edge times out at
   ~100 s. Video (1–5 min) MUST use `submit` → return `{ jobId }` → a
   separate `getJob` status route (client: `useMediaJob` from
   `@omg-dev/media/react`), or complete the job in an `on()` event handler
   and render reactively via `useCollection`. Speech/TTS finishes in
   seconds — calling `generateSpeech` inline in a route is fine.
2. **Only curated model ids** (see the docs page table). Unknown ids are
   rejected at submit. Speech default: `elevenlabs/eleven_turbo_v2_5`;
   transcription: `elevenlabs/scribe_v1`.
3. **Transcription input is a URL, not bytes.** Upload the recording first
   (public URL), pass `audioUrl` + `durationSeconds` (the billing basis —
   read it from the recorder/file metadata; never guess low).
4. No keys, no baseURL, no env setup — the platform injects everything.
   Costs bill to the app creator's credits (pass-through provider price).
5. Attribute per end user by wrapping handlers in
   `runWithEndUser(userId, fn)` — same pattern as `@omg-dev/ai`.
