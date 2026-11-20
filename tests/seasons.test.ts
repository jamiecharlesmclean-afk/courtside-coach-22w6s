// Season archive: ending a season keeps its games and calendar items, and bad archive data is ignored.
import { describe, expect, test } from "bun:test";
import { archiveSeason, archiveSummary, parseArchive, parseStatus, seasonName } from "@/lib/seasons-format";
import type { Game } from "@/lib/games";

const game = { id: "g1" } as Game;

describe("season archive", () => {
  test("ending a season keeps its games and calendar items", () => {
    const season = archiveSeason("2025/26", [game, game], [], "2026-03-20", "s1");
    expect(season.name).toBe("2025/26");
    expect(season.games).toHaveLength(2);
    expect(season.ended_on).toBe("2026-03-20");
    expect(archiveSummary(season)).toBe("2 games, 0 calendar items");
  });

  test("a season with no name is labelled Season", () => {
    expect(seasonName("   ")).toBe("Season");
  });

  test("the archive ignores entries that are not seasons", () => {
    const good = JSON.stringify([{ id: "s1", name: "2025/26", ended_on: "2026-03-20", games: [], events: [] }, { nope: true }]);
    expect(parseArchive(good)).toHaveLength(1);
    expect(parseArchive("not json")).toEqual([]);
    expect(parseArchive(null)).toEqual([]);
  });

  test("the ended label reads back and bad status data is ignored", () => {
    expect(parseStatus(JSON.stringify({ name: "2025/26", ended_on: "2026-03-20" }))).toEqual({ name: "2025/26", ended_on: "2026-03-20" });
    expect(parseStatus("{bad")).toBeNull();
  });
});
