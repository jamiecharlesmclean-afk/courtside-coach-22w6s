// End of season on this device: archive the games and calendar items, label the season as ended, and start a new one.
// The roster, drill book, playbook, documents and team details carry over.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CALENDAR_KEY, type CalendarEvent } from "@/lib/calendar";
import { GAMES_KEY, type Game } from "@/lib/games";
import { loadSettings, saveSettings } from "@/lib/settings";
import { archiveSeason, parseArchive, parseStatus, seasonName, type ArchivedSeason, type SeasonStatus } from "@/lib/seasons-format";

export const SEASONS_KEY = "courtside:seasons";
export const SEASON_STATUS_KEY = "courtside:season-status";

export { archiveSummary, type ArchivedSeason, type SeasonStatus } from "@/lib/seasons-format";

async function readRows<T>(key: string): Promise<T[]> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return [];
  try {
    const rows: unknown = JSON.parse(raw);
    return Array.isArray(rows) ? (rows as T[]) : [];
  } catch {
    return [];
  }
}

export async function loadArchive(): Promise<ArchivedSeason[]> {
  return parseArchive(await AsyncStorage.getItem(SEASONS_KEY));
}

export async function loadSeasonStatus(): Promise<SeasonStatus | null> {
  return parseStatus(await AsyncStorage.getItem(SEASON_STATUS_KEY));
}

// Archives this season's games and calendar items, clears them from the active lists, and labels the season as ended.
export async function endSeason(endedOn: string): Promise<ArchivedSeason> {
  const settings = await loadSettings();
  const games = await readRows<Game>(GAMES_KEY);
  const events = await readRows<CalendarEvent>(CALENDAR_KEY);
  const season = archiveSeason(settings.season, games, events, endedOn, `${Date.now()}`);
  const archive = [season, ...(await loadArchive())];
  await AsyncStorage.multiSet([
    [SEASONS_KEY, JSON.stringify(archive)],
    [SEASON_STATUS_KEY, JSON.stringify({ name: season.name, ended_on: endedOn })],
    [GAMES_KEY, "[]"],
    [CALENDAR_KEY, "[]"],
  ]);
  return season;
}

// Starts the next season: sets the season name in team details and removes the ended label.
export async function startNewSeason(name: string): Promise<void> {
  const settings = await loadSettings();
  await saveSettings({ ...settings, season: seasonName(name) });
  await AsyncStorage.removeItem(SEASON_STATUS_KEY);
}
