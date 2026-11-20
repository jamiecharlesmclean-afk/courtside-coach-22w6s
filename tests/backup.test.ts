// Backup files: data survives a round trip, and files that could damage data are rejected.
import { describe, expect, test } from "bun:test";
import { BACKUP_FORMAT, buildBackup, readBackup } from "@/lib/backup-format";

describe("backup file", () => {
  test("keeps CourtSide data and drops other apps and the legacy medical key", () => {
    const text = buildBackup([
      ["courtside:drills", "[]"],
      ["courtside-coach:settings", "{\"team_name\":\"Wolves\"}"],
      ["other-app:token", "secret"],
      ["courtside:medical-records", "[]"],
      ["courtside:games", null],
    ], new Date("2026-11-17T10:00:00Z"));
    const result = readBackup(text);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(Object.keys(result.data).sort()).toEqual(["courtside-coach:settings", "courtside:drills"]);
    expect(result.data["courtside-coach:settings"]).toBe("{\"team_name\":\"Wolves\"}");
    expect(result.keyCount).toBe(2);
  });

  test("rejects a file that is not a backup", () => {
    expect(readBackup("not json").ok).toBe(false);
    expect(readBackup(JSON.stringify({ format: "something-else", version: 1, data: {} })).ok).toBe(false);
  });

  test("rejects a backup from a newer version of the app", () => {
    expect(readBackup(JSON.stringify({ format: BACKUP_FORMAT, version: 2, data: {} })).ok).toBe(false);
  });

  test("rejects keys outside CourtSide, so a file cannot overwrite other data", () => {
    const text = JSON.stringify({ format: BACKUP_FORMAT, version: 1, data: { "other-app:token": "x" } });
    expect(readBackup(text).ok).toBe(false);
  });

  test("rejects values that are not text", () => {
    const text = JSON.stringify({ format: BACKUP_FORMAT, version: 1, data: { "courtside:drills": [] } });
    expect(readBackup(text).ok).toBe(false);
  });
});
