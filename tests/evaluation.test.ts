// Player evaluation scoring: unrated skills do not count as zero, and only valid ratings are saved.
import { describe, expect, test } from "bun:test";
import { ALL_SKILLS, cleanRatings, percentFor, scoreRatings, SKILL_CATEGORIES } from "@/lib/evaluation-format";

describe("player evaluation scoring", () => {
  test("1 is 0% and 5 is 100%, with 3 in the middle", () => {
    expect(percentFor(1)).toBe(0);
    expect(percentFor(3)).toBe(50);
    expect(percentFor(5)).toBe(100);
  });

  test("the overall score averages only the rated skills", () => {
    const result = scoreRatings({ "shooting-form": 5, "handling-pace": 3 });
    expect(result.rated).toBe(2);
    expect(result.overall).toBe(75);
  });

  test("a player with nothing rated has no overall score", () => {
    const result = scoreRatings({});
    expect(result.overall).toBeNull();
    expect(result.total).toBe(ALL_SKILLS.length);
  });

  test("each category gets its own average, or null when none of its skills are rated", () => {
    const result = scoreRatings({ "shooting-form": 4 });
    const shooting = result.categories.find((c) => c.id === "shooting");
    const passing = result.categories.find((c) => c.id === "passing");
    expect(shooting?.score).toBe(75);
    expect(passing?.score).toBeNull();
    expect(result.categories).toHaveLength(SKILL_CATEGORIES.length);
  });

  test("only whole numbers from 1 to 5 for skills that exist are kept", () => {
    const cleaned = cleanRatings({ "shooting-form": 4, "handling-pace": 9, "passing-accuracy": 2.5, "not-a-skill": 3, "defence-help": "5" });
    expect(cleaned).toEqual({ "shooting-form": 4 });
  });
});
