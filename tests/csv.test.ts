// CSV: quoted commas and quotes survive export and import.
import { describe, expect, test } from "bun:test";
import { csvCell, parseCsv } from "@/lib/csv";

describe("CSV", () => {
  test("reads quoted commas and doubled quotes", () => {
    expect(parseCsv("a,b\n\"x, y\",\"say \"\"hi\"\"\"\n")).toEqual([
      ["a", "b"],
      ["x, y", "say \"hi\""],
    ]);
  });

  test("a row written with csvCell reads back unchanged", () => {
    const row = ["Give and go", "Passing, moving", "say \"go\"", "line one"];
    const text = row.map((cell) => csvCell(cell)).join(",");
    expect(parseCsv(text)[0]).toEqual(row);
  });
});
