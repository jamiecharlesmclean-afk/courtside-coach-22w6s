// Team calendar: practices, tournaments, meetings, team activities and social events, plus games.
// Games are stored in the games schedule (GAMES_KEY) so Home's "Next game" stays correct; the calendar shows and edits them there.
import type { Base } from "@/lib/store";
import { isValidGameDate, localDateKey, readDate, toDisplayDate, type Game } from "@/lib/games";
export { readDate, toDisplayDate };
import { parseCsv, csvCell } from "@/lib/csv";

export const CALENDAR_KEY = "courtside:calendar";

export const EVENT_TYPES = ["Practice", "Game", "Tournament", "Meeting", "Team activity", "Social event"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

// Events stored by the calendar. Games are not stored here.
export type CalendarEvent = Base & {
  date: string; // YYYY-MM-DD
  start: string; // stored as h:mm AM/PM, or "" for all day
  end: string;
  type: EventType;
  title: string;
  location: string;
  notes: string;
};

export type EventDraft = Omit<CalendarEvent, keyof Base>;

export const emptyEventDraft: EventDraft = {
  date: "",
  start: "",
  end: "",
  type: "Practice",
  title: "",
  location: "",
  notes: "",
};

// One row on the calendar, whether it is an event or a game.
export type CalendarItem = {
  key: string;
  source: "event" | "game";
  id: string;
  date: string;
  start: string;
  end: string;
  type: EventType;
  title: string;
  location: string;
  notes: string;
  venue: string; // games only: Home or Away
};

// Parses "18:30", "6:30 PM", "6pm" or "6 pm" into minutes from midnight. Returns null when unreadable.
export function parseClock(text: string): number | null {
  const match = text.trim().toLowerCase().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm|a|p)?$/);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2] ?? "0");
  const suffix = match[3];
  if (minutes > 59) return null;
  if (suffix) {
    if (hours < 1 || hours > 12) return null;
    if (suffix.startsWith("p") && hours !== 12) hours += 12;
    if (suffix.startsWith("a") && hours === 12) hours = 0;
  } else if (hours > 23) {
    return null;
  }
  return hours * 60 + minutes;
}

export function formatClock(minutes: number): string {
  const h24 = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const suffix = h24 < 12 ? "AM" : "PM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

// Returns the normalised display time, or "" for blank input. Returns null when the text is not a time.
export function normalizeClock(text: string): string | null {
  if (!text.trim()) return "";
  const minutes = parseClock(text);
  return minutes === null ? null : formatClock(minutes);
}

function startMinutes(item: { start: string }): number {
  const value = parseClock(item.start);
  return value === null ? -1 : value;
}

export function sortItems(items: CalendarItem[]): CalendarItem[] {
  return [...items].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    const diff = startMinutes(a) - startMinutes(b);
    if (diff !== 0) return diff;
    return a.title.localeCompare(b.title);
  });
}

export function toItems(events: CalendarEvent[], games: Game[]): CalendarItem[] {
  const fromEvents: CalendarItem[] = events.map((event) => ({
    key: `event-${event.id}`,
    source: "event",
    id: event.id,
    date: event.date,
    start: event.start,
    end: event.end,
    type: event.type,
    title: event.title,
    location: event.location,
    notes: event.notes,
    venue: "",
  }));
  const fromGames: CalendarItem[] = games
    .filter((game) => isValidGameDate(game.date))
    .map((game) => ({
      key: `game-${game.id}`,
      source: "game",
      id: game.id,
      date: game.date,
      start: game.time,
      end: "",
      type: "Game",
      title: game.opponent || "Game",
      location: game.location,
      notes: game.notes,
      venue: game.venue,
    }));
  return sortItems([...fromEvents, ...fromGames]);
}

// Six-week grid starting on Sunday. Days outside the month are null.
export function monthGrid(year: number, month: number): (string | null)[][] {
  const first = new Date(year, month, 1);
  const offset = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(localDateKey(new Date(year, month, day)));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export function formatDayLabel(date: string): string {
  const d = new Date(`${date}T00:00`);
  const weekday = d.toLocaleDateString("en-US", { weekday: "long" });
  return `${weekday} ${toDisplayDate(date)}`;
}

export function timeRange(item: { start: string; end: string }): string {
  if (!item.start) return "All day";
  return item.end ? `${item.start} to ${item.end}` : item.start;
}


export const CALENDAR_COLUMNS = ["date", "start", "end", "type", "title", "location", "venue", "notes"] as const;

export function calendarToCsv(items: CalendarItem[]): string {
  const lines = [CALENDAR_COLUMNS.join(",")];
  for (const item of sortItems(items)) {
    lines.push([
      toDisplayDate(item.date),
      item.start,
      item.end,
      item.type,
      item.title,
      item.location,
      item.venue,
      item.notes,
    ].map(csvCell).join(","));
  }
  return lines.join("\n") + "\n";
}

export const EXAMPLE_CALENDAR_CSV = [
  "date,start,end,type,title,location,venue,notes",
  "20-11-2026,6:00 PM,7:30 PM,Practice,Main practice,Riverside Gym,,Bring water",
  "22-11-2026,9:00 AM,5:00 PM,Tournament,Winter Classic,Lakeside Arena,,Arrive 30 minutes early",
  "24-11-2026,7:00 PM,,Meeting,Parents meeting,Clubhouse,,Season plan and fees",
  "28-11-2026,10:00 AM,12:00 PM,Team activity,Team service day,Community Park,,Dress for outdoors",
  "05-12-2026,5:30 PM,8:00 PM,Social event,Team pizza night,Coach's house,,Bring a dish to share",
  "27-11-2026,6:30 PM,,Game,Riverside Hawks,Riverside Gym,Home,Wear white",
].join("\n");

export type CalendarImportChange =
  | { target: "event"; kind: "create"; draft: EventDraft }
  | { target: "event"; kind: "update"; id: string; draft: EventDraft }
  | { target: "game"; kind: "create"; draft: Omit<Game, keyof Base> }
  | { target: "game"; kind: "update"; id: string; draft: Omit<Game, keyof Base> };

export type CalendarImportPlan = {
  changes: CalendarImportChange[];
  skipped: string[]; // one reason per skipped row, with its row number
  created: number;
  updated: number;
};

function matchKey(date: string, start: string, title: string, type: string): string {
  return `${date}|${parseClock(start) ?? ""}|${title.trim().toLowerCase()}|${type}`;
}

// Plans an import. Rows match an existing item by date, start time, title and type; matches are updated, others added.
export function planCalendarImport(
  text: string,
  events: CalendarEvent[],
  games: Game[],
): CalendarImportPlan {
  const rows = parseCsv(text);
  const plan: CalendarImportPlan = { changes: [], skipped: [], created: 0, updated: 0 };
  if (rows.length < 2) return plan;

  const header = rows[0]!.map((h) => h.trim().toLowerCase());
  const col = (name: string) => header.indexOf(name);

  const existing = new Map<string, { target: "event" | "game"; id: string }>();
  for (const event of events) {
    existing.set(matchKey(event.date, event.start, event.title, event.type), { target: "event", id: event.id });
  }
  for (const game of games) {
    existing.set(matchKey(game.date, game.time, game.opponent, "Game"), { target: "game", id: game.id });
  }

  rows.slice(1).forEach((cells, index) => {
    const rowNo = index + 2;
    const get = (name: string) => {
      const i = col(name);
      return i >= 0 ? (cells[i] ?? "").trim() : "";
    };
    const title = get("title");
    if (!title && !get("date") && !get("type")) return;
    if (!title) {
      plan.skipped.push(`Row ${rowNo}: no title.`);
      return;
    }
    const date = readDate(get("date"));
    if (!date) {
      plan.skipped.push(`Row ${rowNo}: date must be dd-mm-yyyy, for example 21-11-2026.`);
      return;
    }
    const start = normalizeClock(get("start"));
    const end = normalizeClock(get("end"));
    if (start === null || end === null) {
      plan.skipped.push(`Row ${rowNo}: start or end time is not a time like 6:30 PM or 18:30.`);
      return;
    }
    const typeName = get("type").toLowerCase();
    const type = EVENT_TYPES.find((t) => t.toLowerCase() === typeName);
    if (!type) {
      plan.skipped.push(`Row ${rowNo}: type must be one of ${EVENT_TYPES.join(", ")}.`);
      return;
    }
    const location = get("location");
    const notes = get("notes");

    if (type === "Game") {
      const venueText = get("venue").toLowerCase();
      const venue = venueText === "away" ? "Away" : "Home";
      const draft = { date, time: start, opponent: title, venue, location, notes };
      const hit = existing.get(matchKey(date, start, title, "Game"));
      if (hit?.target === "game") {
        plan.changes.push({ target: "game", kind: "update", id: hit.id, draft });
        plan.updated++;
      } else {
        plan.changes.push({ target: "game", kind: "create", draft });
        plan.created++;
      }
      return;
    }

    const draft: EventDraft = { date, start, end, type, title, location, notes };
    const hit = existing.get(matchKey(date, start, title, type));
    if (hit?.target === "event") {
      plan.changes.push({ target: "event", kind: "update", id: hit.id, draft });
      plan.updated++;
    } else {
      plan.changes.push({ target: "event", kind: "create", draft });
      plan.created++;
    }
  });
  return plan;
}

// Where each kind of calendar item opens. Games and tournaments go to the game schedule (game entries).
// Practices go to the practice plan. Team activities, meetings and social events go to team announcements on Home.
export type CalendarLink = { label: string; route: { path: "/games" } | { tab: "Planner" | "Home" } };

export function linkFor(type: EventType): CalendarLink {
  if (type === "Game" || type === "Tournament") return { label: "Open game schedule", route: { path: "/games" } };
  if (type === "Practice") return { label: "Open practice plan", route: { tab: "Planner" } };
  return { label: "Open announcements", route: { tab: "Home" } };
}
