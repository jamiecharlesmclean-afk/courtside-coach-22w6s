// Drill book import, export and PDF. Drills are matched by name when importing.
import { csvCell, parseCsv } from "@/lib/csv";
import { buildPdf, type PdfLine } from "@/lib/pdf";
import { DIFFICULTIES, DRILL_CATEGORIES, emptyDrillDraft, type Drill, type DrillDraft } from "@/lib/drills";

export const DRILL_CSV_COLUMNS = [
  "name", "category", "duration_min", "players", "equipment", "court_area",
  "coaching_points", "description", "difficulty", "favourite",
] as const;

export function drillsToCsv(drills: Drill[]): string {
  const rows = [...drills]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((d) => [
      d.name, d.category, d.duration_min, d.players, d.equipment, d.court_area,
      d.coaching_points, d.description, d.difficulty, d.favourite ? "yes" : "no",
    ]);
  return [DRILL_CSV_COLUMNS.join(","), ...rows.map((r) => r.map((c) => csvCell(c)).join(","))].join("\n");
}

export type DrillChange = { kind: "create"; draft: DrillDraft } | { kind: "update"; id: string; draft: DrillDraft };

export type DrillImportPlan = {
  changes: DrillChange[];
  skipped: number;   // rows without a name
  defaulted: number; // rows with an unknown category or difficulty, which used the first choice
};

// Reads CSV text into create and update steps. Rows without a name are skipped.
export function planDrillImport(text: string, existing: Drill[]): DrillImportPlan {
  const [header, ...body] = parseCsv(text);
  if (!header) return { changes: [], skipped: 0, defaulted: 0 };
  const cols = header.map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const at = (row: string[], key: string) => {
    const i = cols.indexOf(key);
    return i >= 0 ? (row[i] ?? "").trim() : "";
  };
  const changes: DrillChange[] = [];
  let skipped = 0;
  let defaulted = 0;
  for (const row of body) {
    const name = at(row, "name");
    if (!name) { skipped++; continue; }
    let category = at(row, "category");
    if (!(DRILL_CATEGORIES as readonly string[]).includes(category)) { category = DRILL_CATEGORIES[0]; defaulted++; }
    let difficulty = at(row, "difficulty");
    if (!(DIFFICULTIES as readonly string[]).includes(difficulty)) { difficulty = DIFFICULTIES[0]; defaulted++; }
    const favourite = ["yes", "true", "1"].includes(at(row, "favourite").toLowerCase());
    const draft: DrillDraft = {
      ...emptyDrillDraft,
      name,
      category,
      difficulty,
      favourite,
      duration_min: at(row, "duration_min"),
      players: at(row, "players"),
      equipment: at(row, "equipment"),
      court_area: at(row, "court_area"),
      coaching_points: at(row, "coaching_points"),
      description: at(row, "description"),
    };
    const match = existing.find((d) => d.name.trim().toLowerCase() === name.toLowerCase());
    changes.push(match ? { kind: "update", id: match.id, draft } : { kind: "create", draft });
  }
  return { changes, skipped, defaulted };
}

export function drillBookPdf(drills: Drill[]): Uint8Array {
  const date = new Date().toISOString().slice(0, 10);
  const lines: PdfLine[] = [
    { text: "Drill book", bold: true, size: 20, gapAfter: 4 },
    { text: `Exported ${date}. ${drills.length} ${drills.length === 1 ? "drill" : "drills"}.`, size: 10, gapAfter: 14 },
  ];
  if (drills.length === 0) lines.push({ text: "The drill book is empty." });
  for (const d of [...drills].sort((a, b) => a.name.localeCompare(b.name))) {
    const facts = [d.category, d.difficulty, d.duration_min ? `${d.duration_min} min` : "", d.players ? `${d.players} players` : ""]
      .filter(Boolean)
      .join("  |  ");
    lines.push({ text: d.name, bold: true, size: 13 });
    lines.push({ text: facts, size: 10 });
    if (d.equipment) lines.push({ text: `Equipment: ${d.equipment}`, size: 10 });
    if (d.court_area) lines.push({ text: `Court area: ${d.court_area}`, size: 10 });
    if (d.coaching_points) lines.push({ text: `Coaching points: ${d.coaching_points}`, size: 10 });
    if (d.description) lines.push({ text: `Description: ${d.description}`, size: 10 });
    lines.push({ text: "", gapAfter: 10 });
  }
  return buildPdf(lines);
}
