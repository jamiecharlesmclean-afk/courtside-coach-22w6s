// Central roster: players and staff in one list, with profile, contact, status and archive fields.
// Also holds CSV import/export and the stat-preparation templates.

import { csvCell, parseCsv } from "@/lib/csv";

export const AVAILABILITY = ["Available", "Limited", "Out"] as const;
export type Availability = (typeof AVAILABILITY)[number];

export const POSITIONS = ["Point guard", "Shooting guard", "Small forward", "Power forward", "Center", "Other"] as const;
export const DOMINANT_HANDS = ["Right", "Left", "Both"] as const;
export const ENTRY_KINDS = ["Player", "Staff"] as const;
export type EntryKind = (typeof ENTRY_KINDS)[number];
export const STATUSES = ["Active", "Inactive"] as const;
export type RosterStatus = (typeof STATUSES)[number];

// Roles for staff members. Permissions are reference only until sign-in accounts exist.
export const STAFF_ROLES = ["Head coach", "Assistant coach", "Statistician", "Trainer", "Team parent"] as const;
export const STAFF_PERMISSIONS: Record<(typeof STAFF_ROLES)[number], string> = {
  "Head coach": "Everything: roster, plans, games and settings.",
  "Assistant coach": "Roster, plans, drills and whiteboard. Cannot change settings.",
  Statistician: "Games and live stats, plus roster names and numbers.",
  Trainer: "Roster availability and contact details. Cannot change plans.",
  "Team parent": "Schedule, documents and their own player's details.",
};

export type PlayerProfile = {
  id: string;
  first_name: string;
  last_name: string;
  name: string; // full name, kept in step with first and last name
  number: string;
  position: string;
  height: string;
  weight: string;
  dominant_hand: string;
  phone: string;
  address: string;
  availability?: Availability;
  date_of_birth?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  coach_notes: string;
  status: RosterStatus;
  archived: boolean;
  kind: EntryKind;
  staff_role: string;
};

export function fullName(first: string, last: string): string {
  return `${first.trim()} ${last.trim()}`.trim();
}

// Fills in fields that older saved records do not have, and splits a single name into first and last.
export function normalizePlayer(raw: Partial<PlayerProfile>, index = 0): PlayerProfile {
  // Medical fields were removed from the app. Drop any left in older saved records.
  const { allergies: _a, conditions: _c, medications: _m, medical_notes: _n, ...rest } = raw as Partial<PlayerProfile> & Record<string, unknown>;
  const legacy = (raw.name ?? "").trim().split(/\s+/);
  const first = raw.first_name ?? (legacy.length > 1 ? legacy.slice(0, -1).join(" ") : legacy[0] ?? "");
  const last = raw.last_name ?? (legacy.length > 1 ? legacy[legacy.length - 1] : "");
  return {
    ...rest,
    id: raw.id ?? `saved-${index}`,
    first_name: first,
    last_name: last,
    name: fullName(first, last),
    number: raw.number || "-",
    position: raw.position ?? "",
    height: raw.height ?? "",
    weight: raw.weight ?? "",
    dominant_hand: raw.dominant_hand ?? "",
    phone: raw.phone ?? "",
    address: raw.address ?? "",
    coach_notes: raw.coach_notes ?? "",
    availability: raw.kind === "Staff" ? undefined : raw.availability ?? "Available",
    status: raw.status === "Inactive" ? "Inactive" : "Active",
    archived: raw.archived === true,
    kind: raw.kind === "Staff" ? "Staff" : "Player",
    staff_role: raw.staff_role ?? "",
  } as PlayerProfile;
}

// Players who take part in practice, games and attendance.
export function isRosterPlayer(player: PlayerProfile): boolean {
  return player.kind === "Player" && !player.archived && player.status === "Active";
}

export function sortByJersey(players: PlayerProfile[]): PlayerProfile[] {
  const jersey = (p: PlayerProfile) => {
    const n = parseInt(p.number, 10);
    return Number.isNaN(n) ? Number.MAX_SAFE_INTEGER : n;
  };
  return [...players].sort((a, b) => jersey(a) - jersey(b) || a.name.localeCompare(b.name));
}

export function sortByName(players: PlayerProfile[]): PlayerProfile[] {
  return [...players].sort((a, b) => a.last_name.localeCompare(b.last_name) || a.first_name.localeCompare(b.first_name));
}

// ---------- CSV ----------

export const CSV_COLUMNS = [
  "first_name", "last_name", "jersey_number", "position", "height", "weight", "dominant_hand",
  "date_of_birth", "phone", "address", "status", "kind", "staff_role", "coach_notes",
] as const;

export const EXAMPLE_CSV = "first_name,last_name,jersey_number,position,height,weight,dominant_hand,date_of_birth,phone,address,status,kind,staff_role,coach_notes\nAlex,Johnson,8,Point guard,1.78 m,70 kg,Right,2010-04-12,(555) 010-1234,\"12 Oak St, Springfield\",Active,Player,,Strong left-hand finisher\nSam,Lee,21,Center,1.95 m,88 kg,Left,2009-09-30,,,Active,Player,,\nPat,Morgan,,,,,,,(555) 010-9876,,Active,Staff,Assistant coach,Runs warm-ups";

export function csvFromPlayers(players: PlayerProfile[]): string {
  const rows = players.map((p) => [
    p.first_name, p.last_name, p.number === "-" ? "" : p.number, p.position, p.height, p.weight, p.dominant_hand,
    p.date_of_birth ?? "", p.phone, p.address, p.archived ? "Archived" : p.status, p.kind, p.staff_role,
    p.coach_notes,
  ]);
  return [CSV_COLUMNS.join(","), ...rows.map((r) => r.map(csvCell).join(","))].join("\n");
}

export type ImportResult = { players: PlayerProfile[]; added: number; updated: number; skipped: number };

// Reads CSV text into the roster. Rows match existing people by first and last name and update them;
// other rows are added. Rows without a first and last name are skipped.
export function importCsv(text: string, existing: PlayerProfile[]): ImportResult {
  const [header, ...body] = parseCsv(text);
  if (!header) return { players: existing, added: 0, updated: 0, skipped: 0 };
  const cols = header.map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const at = (row: string[], key: string) => {
    const i = cols.indexOf(key);
    return i >= 0 ? (row[i] ?? "").trim() : "";
  };
  let players = [...existing];
  let added = 0, updated = 0, skipped = 0;
  body.forEach((row, index) => {
    const first = at(row, "first_name");
    const last = at(row, "last_name");
    if (!first || !last) { skipped++; return; }
    const hand = at(row, "dominant_hand");
    const kind = at(row, "kind").toLowerCase() === "staff" ? "Staff" : "Player";
    const fields = {
      number: at(row, "jersey_number") || "-",
      position: at(row, "position"),
      height: at(row, "height"),
      weight: at(row, "weight"),
      dominant_hand: DOMINANT_HANDS.includes(hand as never) ? hand : "",
      date_of_birth: at(row, "date_of_birth") || undefined,
      phone: at(row, "phone"),
      address: at(row, "address"),
      status: at(row, "status").toLowerCase() === "inactive" ? "Inactive" as const : "Active" as const,
      archived: at(row, "status").toLowerCase() === "archived",
      kind: kind as EntryKind,
      staff_role: at(row, "staff_role"),
      coach_notes: at(row, "coach_notes"),
    };
    const match = players.find((p) => p.first_name.toLowerCase() === first.toLowerCase() && p.last_name.toLowerCase() === last.toLowerCase());
    if (match) {
      const patch = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== "" && v !== undefined && v !== "-"));
      players = players.map((p) => (p.id === match.id ? normalizePlayer({ ...p, ...patch, first_name: first, last_name: last }) : p));
      updated++;
    } else {
      players.push(normalizePlayer({ ...fields, id: `csv-${Date.now()}-${index}`, first_name: first, last_name: last, availability: "Available" }));
      added++;
    }
  });
  return { players, added, updated, skipped };
}

// ---------- Stat-preparation templates ----------

export type StatTemplate = { id: string; name: string; description: string; stats: string[] };

export const STAT_TEMPLATES: StatTemplate[] = [
  { id: "box", name: "Basic box score", description: "Minutes, points, rebounds, assists and fouls.", stats: ["MIN", "PTS", "REB", "AST", "STL", "BLK", "TOV", "PF"] },
  { id: "shooting", name: "Shooting", description: "Field goals, threes and free throws made and attempted.", stats: ["FGM", "FGA", "3PM", "3PA", "FTM", "FTA"] },
  { id: "defence", name: "Defence", description: "Steals, blocks, defensive rebounds and fouls.", stats: ["STL", "BLK", "DREB", "PF"] },
];

// A blank stat sheet for the active players, with one column per stat in the template.
export function statSheetCsv(template: StatTemplate, players: PlayerProfile[]): string {
  const header = ["jersey_number", "name", "position", ...template.stats];
  const rows = sortByJersey(players.filter(isRosterPlayer)).map((p) => [
    p.number === "-" ? "" : p.number, p.name, p.position, ...template.stats.map(() => ""),
  ]);
  return [header.join(","), ...rows.map((r) => r.map(csvCell).join(","))].join("\n");
}
