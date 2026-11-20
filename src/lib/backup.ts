// Whole-app backup on this device: read every CourtSide key, and restore a backup over them.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { buildBackup, isCourtsideKey, type BackupData } from "@/lib/backup-format";

export { BACKUP_FORMAT, BACKUP_VERSION, buildBackup, isCourtsideKey, readBackup, type BackupData, type ReadBackup } from "@/lib/backup-format";

// Reads every CourtSide key on this device and returns the backup file text.
export async function currentBackupText(): Promise<string> {
  const keys = (await AsyncStorage.getAllKeys()).filter(isCourtsideKey);
  const pairs = keys.length ? await AsyncStorage.multiGet(keys) : [];
  return buildBackup(pairs as [string, string | null][]);
}

// Replaces all CourtSide data on this device with the backup. Other app data is not touched.
// Writes the backup first, then removes keys the backup does not have, so a failed write leaves the old data in place.
export async function restoreBackup(data: BackupData): Promise<void> {
  const entries = Object.entries(data) as [string, string][];
  if (entries.length) await AsyncStorage.multiSet(entries);
  const existing = (await AsyncStorage.getAllKeys()).filter(isCourtsideKey);
  const stale = existing.filter((key) => !(key in data));
  if (stale.length) await AsyncStorage.multiRemove(stale);
}
