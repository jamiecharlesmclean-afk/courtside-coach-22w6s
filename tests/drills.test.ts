// Drill book CSV: a book exported and imported again keeps its drills, and rows are matched by name.
import { describe, expect, test } from "bun:test";
import type { Drill } from "@/lib/drills";
import { drillsToCsv, planDrillImport } from "@/lib/drill-io";

const drill = {
  id: "d1",
  created_at: "2026-11-17T00:00:00.000Z",
  updated_at: "2026-11-17T00:00:00.000Z",
  name: "Give and go",
  category: "Passing",
  duration_min: "10",
  players: "4",
  equipment: "Ball",
  court_area: "Half court",
  coaching_points: "Move after the pass, then cut",
  description: "Two lines, one ball",
  difficulty: "Beginner",
  favourite: true,
} as Drill;

describe("drill book CSV", () => {
  test("a new drill in the file is created", () => {
    const plan = planDrillImport(drillsToCsv([drill]), []);
    expect(plan.changes).toHaveLength(1);
    expect(plan.changes[0]?.kind).toBe("create");
    expect(plan.changes[0]?.draft.name).toBe("Give and go");
    expect(plan.changes[0]?.draft.favourite).toBe(true);
  });

  test("a drill with the same name is updated, not duplicated", () => {
    const plan = planDrillImport(drillsToCsv([drill]), [drill]);
    expect(plan.changes[0]?.kind).toBe("update");
  });

  test("rows without a name are skipped and counted", () => {
    const text = "name,category\n,Passing\nGive and go,Passing\n";
    const plan = planDrillImport(text, []);
    expect(plan.skipped).toBe(1);
    expect(plan.changes).toHaveLength(1);
  });
});
