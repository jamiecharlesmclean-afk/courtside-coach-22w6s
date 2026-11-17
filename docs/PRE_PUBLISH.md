# Pre-publish checklist: CourtSide Coach

Checked on the current build. Items marked **Open** need action before real records are entered.

## Automated checks

| Check | Result |
|---|---|
| `bun run build` (static Expo Web export) | Passes. Output in `dist/`, about 1.6 MB. |
| `bun run typecheck`, app code only | Passes except known items below. |
| Leftover medical files (`src/app/medical.tsx`, `src/lib/medical.ts`) | Removed. |
| Leftover AI coach files (`functions/`, `src/lib/ai-coach.ts`) | Removed. |
| Server calls (`/api/`) in the app | None. All data is on the device. |
| Automated tests | None in the project. |

## Fixed in this pass

- Duplicate `Play` name between the playbook type and the lucide icon import (aliased).
- New plays created in the playbook now have a coaching point.
- Drill category list is a plain string list, so the Dropdown accepts it.

## Known type-only issues (no runtime effect)

- `.expo/types/router.d.ts` is stale and does not list `/games`, `/training`, `/settings`, `/documents` or `/calendar`. Those routes exist and work. Expo regenerates the file when the dev server runs.
- `focused` in Pressable style callbacks is not in the installed React Native type definitions. It works at runtime.
- Vite starter files (`src/App.tsx`, `src/main.tsx`, `src/routes/`, `vite.config.ts`, `src/components/ui/`) are not used by the Expo preview and produce type errors. They can be removed.

## Open before publishing

- **Sign-in and team sharing are not built.** Each device holds its own data. Every visitor starts empty.
- **Compliance review.** The app stores players' date of birth, phone, address and emergency contacts. The team's compliance contact should review before real records are entered. This is not a compliance statement.
- **Phone tests not yet done:** logo, document and CSV file pickers; rotating the vertical whiteboard court (the stacked-layout fix is untested); calendar items after a full reload; dd-mm-yyyy dates on a populated game or calendar entry.
- **Playbook shapes:** the defence and offence starter diagrams are simplified and should be checked by a coach.
- **Starter drills:** 200 drills are sample content. Coaches should review the wording.
- **Console 404** on first load. Source not yet identified.

## How to publish

From `docs/` and the project README:
- **Web:** the omg.dev web deployment is the static Expo Web build (`bun run build`, output `dist/`).
- **Android:** an installable comes from the omg.dev Android build workflow.
- The preview link is temporary and is not a published address.

## Sign-off

- [ ] Compliance contact has reviewed the data fields and access rules.
- [ ] Phone checks above are done.
- [ ] Coach has reviewed starter plays and drills.
- [ ] Team understands that data stays on each device until sign-in is built.
