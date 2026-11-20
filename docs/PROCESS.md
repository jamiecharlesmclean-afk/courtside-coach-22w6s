# Working process

How changes are built, checked and reported. Written after the process review.

## 1. Verify with exit codes
- Run `bun run check` before saying a change is done. It runs the type check, the tests and the web build, and stops at the first failure.
- Report the exit code. Do not claim "type check clean" without a real run.

## 2. Test before reporting
- Automated tests live in `tests/` and run with `bun test`. Each test checks a user outcome: data survives a round trip, bad files are refused, dates and CSV are read correctly.
- Browser smoke path: open home, open Settings, add one item, reopen the screen. Run it after any change to navigation or storage.

## 3. Report every change one way
- **Verified on screen**: checked in the browser or on a phone.
- **Build only**: type check and build passed; not used on screen.
- **Not checked**: not verified. Say so.

## 4. Storage versions
- Each stored item keeps its key name. Changing the shape of stored data needs a new key, or a reader that accepts the old shape.
- Backup files carry a `version` number. The app refuses backups from a newer version.

## 5. Confirm ambiguous requests
- When a request could mean two things (for example "the button at the bottom"), state the assumption in one line before building.

## 6. One decision log
- Decisions are recorded in `docs/DECISIONS.md`. Add to it when a decision changes behaviour or data.

## 7. One name per concept
- "Drill book" is the name shown to users; the route stays `/training`. "Playbook" and "Whiteboard" are separate screens.

## 8. Keep starter code separate
- Vite starter files (`src/App.tsx`, `src/main.tsx`, `src/routes/`, `src/components/ui/`, `vite.config.ts`) are excluded from the app's type check in `tsconfig.json`. Do not build on them.

## 9. Docs move with features
- Each feature change updates the user manual and, if data or access changes, `docs/BUILD_OUTLINE.md` and `docs/PRE_PUBLISH.md`.

## 10. Backup before publishing
- Settings → Backup → Download backup. Keep one file per release somewhere safe.
- Test restore on a second device before relying on it.

## Open backlog
- Lucide icon export warnings in the preview log: harmless, from per-icon imports that keep the web bundle small (about 1.4 MB).
- Sign-in and shared team data: waiting for the compliance and consent decision (`docs/SIGN_IN_PROPOSAL.md`).
