// Dates: typed as dd-mm-yyyy, stored as YYYY-MM-DD, and month-first input is refused.
import { describe, expect, test } from "bun:test";
import { readDate, toDisplayDate } from "@/lib/games";

describe("dates", () => {
  test("reads dd-mm-yyyy into the stored format", () => {
    expect(readDate("21-11-2026")).toBe("2026-11-21");
  });

  test("reads the other day-first forms too", () => {
    expect(readDate("21/11/2026")).toBe("2026-11-21");
    expect(readDate("2026-11-21")).toBe("2026-11-21");
  });

  test("refuses month-first input instead of guessing", () => {
    expect(readDate("03/14/2026")).toBeNull();
  });

  test("shows the stored date as dd-mm-yyyy", () => {
    expect(toDisplayDate("2026-11-21")).toBe("21-11-2026");
  });
});
