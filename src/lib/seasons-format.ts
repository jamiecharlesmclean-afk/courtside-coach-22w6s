// Season archive: pure functions (no storage), so they can be tested without a device.
import type { CalendarEvent } from "@/lib/calendar";
import type { Game } from "@/lib/games";

export const SEASON_NAME_FALLBACK = "Season";

export type ArchivedSeason = {
  id: string;
  name: string;
  ended_on: string; // YYYY-MM-DD
  games: Game[];
  events: CalendarEvent[];
};

// Stored while the season is ended. Cleared when a new season starts.
export type SeasonStatus = { name: string; ended_on: string };

export function seasonName(name: string): string {
  return name.trim() || SEASON_NAME_FALLBACK;
}

// Copies the season's games and calendar events into an archive entry.
export function archiveSeason(name: string, games: Game[], events: CalendarEvent[], endedOn: string, id: string): ArchivedSeason {
  return { id, name: seasonName(name), ended_on: endedOn, games: [...games], events: [...events] };
}

export function archiveSummary(season: ArchivedSeason): string {
  const games = season.games.length === 1 ? "1 game" : `${season.games.length} games`;
  const events = season.events.length === 1 ? "1 calendar item" : `${season.events.length} calendar items`;
  return `${games}, ${events}`;
}

// Reads the stored archive. Anything that is not an archive entry is dropped.
export function parseArchive(text: string | null): ArchivedSeason[] {
  if (!text) return [];
  try {
    const rows: unknown = JSON.parse(text);
    if (!Array.isArray(rows)) return [];
    return rows.filter((row): row is ArchivedSeason => {
      const r = row as Partial<ArchivedSeason> | null;
      return !!r && typeof r.id === "string" && typeof r.name === "string" && typeof r.ended_on === "string" && Array.isArray(r.games) && Array.isArray(r.events);
    });
  } catch {
    return [];
  }
}

export function parseStatus(text: string | null): SeasonStatus | null {
  if (!text) return null;
  try {
    const row = JSON.parse(text) as Partial<SeasonStatus> | null;
    if (row && typeof row.name === "string" && typeof row.ended_on === "string") return { name: row.name, ended_on: row.ended_on };
    return null;
  } catch {
    return null;
  }
}
