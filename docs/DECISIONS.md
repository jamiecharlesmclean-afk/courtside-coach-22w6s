# Decision log

Newest first. Each entry: decision, reason, where it lives.

- **Whole-app backup (Settings → Backup).** One JSON file of all CourtSide keys on the device. Restore replaces CourtSide data after a two-tap confirm. Reason: the app is local-first, so the backup is the only copy. Code: `src/lib/backup-format.ts`, `src/lib/backup.ts`.
- **Check command.** `bun run check` runs type check, tests and build in order. Reason: one command to verify before reporting. Code: `scripts/check.sh`.
- **Type check scope.** Vite starter files are excluded from `tsconfig.json`; route types are generated from `src/app` by `scripts/gen-route-types.cjs`. Reason: the starter files are unused and caused unrelated errors.
- **Lucide icons imported per file.** Keeps the web bundle near 1.4 MB. Reason: the named import form grew the bundle to 3.6 MB, above the preview limit. Declarations in `src/types/lucide-icons.d.ts`.
- **Medical information removed.** Reason: user request. Legacy key `courtside:medical-records` is cleared on load and never backed up.
- **Parents and all team members may read roster details; coaches and owners edit.** Recorded in `docs/SIGN_IN_PROPOSAL.md`; compliance review needed before real records.
- **Dates shown and typed as dd-mm-yyyy; stored as YYYY-MM-DD.** Month-first input is refused. Reason: the team's usual format; avoids silent misreads.
- **Two-tap confirm for every delete and restore.** Reason: data is local and cannot be recovered.
- **Calendar games live in the games store.** Reason: Home "Next game" must stay correct.
- **Calendar "Open" links.** Practice → practice plan; game or tournament → game schedule; meeting, team activity, social event → Home announcements (no announcements screen yet).
- **Whiteboard court on 280×150 (FIBA 28 m × 15 m).** Views: full, half (attacking), other half (defending); vertical is a rotate toggle.
- **AI coach removed.** Reason: user request. Not to return unless asked.
- **Recommended 5-minute drill removed.** Reason: user request.
- **Route `/training` kept; name shown as "Drill book".** Reason: changing routes breaks saved links.
- **Settings and all data stored per device.** No shared backend yet; sign-in is a separate decision.
- **Player evaluation saved on the device.** Skills are fixed in `src/lib/evaluation-format.ts`; each rating is 1–5 and maps to 0–100%. The overall score averages rated skills only. Evaluations are stored under `courtside:evaluations` and included in backups. Reason: local-first like the rest of the app; shared evaluation needs the sign-in work.
