// Playbook starter plays and calendar links: each item opens the screen a coach expects.
import { describe, expect, test } from "bun:test";
import { STARTER_PLAYS, mergeSavedPlays, type Play } from "@/lib/playbook";
import { linkFor, parseClock } from "@/lib/calendar";

describe("playbook", () => {
  test("starter plays come first and the coach's own plays are kept", () => {
    const own: Play = { name: "Corner set", type: "OUT OF BOUNDS", time: "0:10", color: "#fff", tag: "CUSTOM", players: "5 players", coaching: "Set up on the baseline." };
    const merged = mergeSavedPlays([own]);
    expect(merged.slice(0, STARTER_PLAYS.length)).toEqual(STARTER_PLAYS);
    expect(merged.at(-1)?.name).toBe("Corner set");
  });

  test("the four old placeholder plays are dropped, so they do not appear twice", () => {
    const old: Play = { name: "Spain PnR", type: "HALF COURT", time: "0:22", color: "#fff", tag: "OLD", players: "5 players", coaching: "" };
    const merged = mergeSavedPlays([old]);
    expect(merged.filter((play) => play.name === "Spain PnR")).toHaveLength(0);
  });

  test("no saved plays gives the starter set", () => {
    expect(mergeSavedPlays(null)).toEqual(STARTER_PLAYS);
  });
});

describe("calendar links", () => {
  test("games and tournaments open the game schedule", () => {
    expect(linkFor("Game").route).toEqual({ path: "/games" });
    expect(linkFor("Tournament").route).toEqual({ path: "/games" });
  });

  test("practices open the practice plan", () => {
    expect(linkFor("Practice").route).toEqual({ tab: "Planner" });
  });

  test("meetings, team activities and social events open announcements on Home", () => {
    for (const type of ["Meeting", "Team activity", "Social event"] as const) {
      expect(linkFor(type).route).toEqual({ tab: "Home" });
    }
  });

  test("clock times read as minutes from midnight", () => {
    expect(parseClock("6:30 PM")).toBe(18 * 60 + 30);
    expect(parseClock("18:30")).toBe(18 * 60 + 30);
    expect(parseClock("nonsense")).toBeNull();
  });
});

describe("starter plays", () => {
  test("every starter play has a diagram inside the court and a coaching point", () => {
    for (const play of STARTER_PLAYS) {
      expect(play.coaching.length).toBeGreaterThan(0);
      expect(play.diagram).toBeDefined();
      for (const token of play.diagram?.tokens ?? []) {
        expect(token.x).toBeGreaterThanOrEqual(0);
        expect(token.x).toBeLessThanOrEqual(280);
        expect(token.y).toBeGreaterThanOrEqual(0);
        expect(token.y).toBeLessThanOrEqual(150);
      }
    }
  });

  test("the set includes offence and defence plays", () => {
    expect(STARTER_PLAYS.some((play) => play.type.includes("OFFENCE"))).toBe(true);
    expect(STARTER_PLAYS.some((play) => play.type === "DEFENCE")).toBe(true);
  });
});
