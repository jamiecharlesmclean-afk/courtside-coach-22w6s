// Game schedule: date, time, opponent and venue of each game. Stored on this device.
import type { Base } from "@/lib/store";

export const GAMES_KEY = "courtside:games";

export const VENUES = ["Home", "Away"] as const;

export type Game = Base & {
  date: string; // YYYY-MM-DD
  time: string; // free text, e.g. 6:30 PM
  opponent: string;
  venue: string; // "Home" or "Away"
  location: string;
  notes: string;
};

export type GameDraft = Omit<Game, keyof Base>;

export const emptyGameDraft: GameDraft = {
  date: "",
  time: "",
  opponent: "",
  venue: VENUES[0],
  location: "",
  notes: "",
};

export function localDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function isValidGameDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00`);
  return !Number.isNaN(d.getTime()) && localDateKey(d) === value;
}

// The earliest game on or after today.
export function nextGame(games: Game[], now: Date = new Date()): Game | null {
  const today = localDateKey(now);
  const upcoming = games
    .filter((game) => game.date >= today && game.opponent.trim())
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  return upcoming[0] ?? null;
}

// Shows a stored YYYY-MM-DD date as dd-mm-yyyy.
export function toDisplayDate(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y}`;
}

// Accepts dd-mm-yyyy (also dd/mm/yyyy, and YYYY-MM-DD). Returns the stored YYYY-MM-DD form, or null.
export function readDate(text: string): string | null {
  const value = text.trim();
  if (isValidGameDate(value)) return value;
  const match = value.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (!match) return null;
  const iso = `${match[3]}-${String(Number(match[2])).padStart(2, "0")}-${String(Number(match[1])).padStart(2, "0")}`;
  return isValidGameDate(iso) ? iso : null;
}

export function formatGameDate(date: string, time: string): string {
  const d = new Date(`${date}T00:00`);
  const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
  const day = `${weekday} ${toDisplayDate(date)}`;
  return time ? `${day} · ${time}` : day;
}
