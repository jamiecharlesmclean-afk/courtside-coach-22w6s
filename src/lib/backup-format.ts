// Backup file format: pure functions, no storage access, so they can be tested without a device.
export const BACKUP_FORMAT = "courtside-backup";
export const BACKUP_VERSION = 1;
// Every CourtSide storage key starts with this prefix ("courtside-coach:..." and "courtside:...").
const KEY_PREFIX = "courtside";
// Legacy key cleared on load; never written to a backup or restored.
const EXCLUDED_KEYS = new Set(["courtside:medical-records"]);

export type BackupData = Record<string, string>;

export function isCourtsideKey(key: string): boolean {
  return key.startsWith(KEY_PREFIX) && !EXCLUDED_KEYS.has(key);
}

// Builds the backup file text from stored key/value pairs. Keys that are not CourtSide keys are left out.
export function buildBackup(entries: [string, string | null][], exportedAt = new Date()): string {
  const data: BackupData = {};
  for (const [key, value] of entries) {
    if (value !== null && isCourtsideKey(key)) data[key] = value;
  }
  return JSON.stringify({ format: BACKUP_FORMAT, version: BACKUP_VERSION, exported_at: exportedAt.toISOString(), data }, null, 2);
}

export type ReadBackup = { ok: true; data: BackupData; keyCount: number; exportedAt: string } | { ok: false; error: string };

// Checks a backup file before anything is changed. Rejects other files and keys outside CourtSide.
export function readBackup(text: string): ReadBackup {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: "This file is not a CourtSide backup. Choose a file saved with Download backup." };
  }
  const file = parsed as { format?: unknown; version?: unknown; exported_at?: unknown; data?: unknown };
  if (!file || typeof file !== "object" || file.format !== BACKUP_FORMAT) {
    return { ok: false, error: "This file is not a CourtSide backup." };
  }
  if (file.version !== BACKUP_VERSION) {
    return { ok: false, error: `This backup is version ${String(file.version)}. This app reads version ${BACKUP_VERSION}.` };
  }
  if (!file.data || typeof file.data !== "object" || Array.isArray(file.data)) {
    return { ok: false, error: "The backup has no data." };
  }
  const data: BackupData = {};
  for (const [key, value] of Object.entries(file.data as Record<string, unknown>)) {
    if (!isCourtsideKey(key) || typeof value !== "string") {
      return { ok: false, error: `The backup contains an unexpected entry: ${key}` };
    }
    data[key] = value;
  }
  return { ok: true, data, keyCount: Object.keys(data).length, exportedAt: typeof file.exported_at === "string" ? file.exported_at : "" };
}
