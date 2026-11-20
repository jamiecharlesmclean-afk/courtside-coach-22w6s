// Player evaluation: each skill is rated 1 to 5 for one player. Pure functions, no storage access.
import type { Base } from "@/lib/store";

export const EVALUATIONS_KEY = "courtside:evaluations";
export const RATING_MIN = 1;
export const RATING_MAX = 5;

export type Skill = { id: string; name: string };
export type SkillCategory = { id: string; name: string; skills: Skill[] };

// The skills every player is rated on. Ids stay fixed so saved ratings keep their meaning.
export const SKILL_CATEGORIES: SkillCategory[] = [
  {
    id: "shooting", name: "Shooting",
    skills: [
      { id: "shooting-form", name: "Shooting form" },
      { id: "shooting-off-dribble", name: "Shot off the dribble" },
      { id: "shooting-free-throws", name: "Free throws" },
      { id: "shooting-three", name: "Three-point shot" },
    ],
  },
  {
    id: "ball-handling", name: "Ball handling",
    skills: [
      { id: "handling-both-hands", name: "Dribbling with both hands" },
      { id: "handling-protect", name: "Protecting the ball" },
      { id: "handling-pace", name: "Change of pace" },
    ],
  },
  {
    id: "passing", name: "Passing",
    skills: [
      { id: "passing-accuracy", name: "Accurate passing" },
      { id: "passing-pressure", name: "Passing under pressure" },
      { id: "passing-vision", name: "Vision and reads" },
    ],
  },
  {
    id: "defence", name: "Defence",
    skills: [
      { id: "defence-on-ball", name: "On-ball defence" },
      { id: "defence-help", name: "Help defence" },
      { id: "defence-rebounding", name: "Rebounding position" },
      { id: "defence-closeout", name: "Closeouts" },
    ],
  },
  {
    id: "athleticism", name: "Athleticism",
    skills: [
      { id: "athletic-speed", name: "Speed" },
      { id: "athletic-agility", name: "Agility" },
      { id: "athletic-stamina", name: "Stamina" },
    ],
  },
  {
    id: "basketball-iq", name: "Basketball IQ",
    skills: [
      { id: "iq-awareness", name: "Court awareness" },
      { id: "iq-decisions", name: "Decision making" },
      { id: "iq-communication", name: "Team communication" },
    ],
  },
];

export const ALL_SKILLS: Skill[] = SKILL_CATEGORIES.flatMap((category) => category.skills);

export type EvaluationRecord = Base & {
  player_id: string;
  player_name: string; // kept even if the player is later removed from the roster
  evaluated_on: string; // YYYY-MM-DD
  ratings: Record<string, number>; // skill id to 1-5
  notes: string;
};

export function isRating(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= RATING_MIN && value <= RATING_MAX;
}

// Keeps only valid ratings for skills that still exist.
export function cleanRatings(raw: Record<string, unknown> | null | undefined, skills: Skill[] = ALL_SKILLS): Record<string, number> {
  const out: Record<string, number> = {};
  for (const skill of skills) {
    const value = raw?.[skill.id];
    if (isRating(value)) out[skill.id] = value;
  }
  return out;
}

// 1 is 0% and 5 is 100%, with the steps in between spread evenly.
export function percentFor(rating: number): number {
  return ((rating - RATING_MIN) / (RATING_MAX - RATING_MIN)) * 100;
}

export type ScoreResult = {
  overall: number | null; // average over rated skills, 0-100; null when nothing is rated
  rated: number;
  total: number;
  categories: { id: string; name: string; score: number | null }[];
};

// Averages the rated skills only, so an unrated skill does not count as zero.
export function scoreRatings(ratings: Record<string, number>, categories: SkillCategory[] = SKILL_CATEGORIES): ScoreResult {
  const total = categories.reduce((count, category) => count + category.skills.length, 0);
  const allPercents: number[] = [];
  const scored = categories.map((category) => {
    const percents = category.skills
      .map((skill) => ratings[skill.id])
      .filter(isRating)
      .map(percentFor);
    allPercents.push(...percents);
    return { id: category.id, name: category.name, score: percents.length ? Math.round(average(percents)) : null };
  });
  return {
    overall: allPercents.length ? Math.round(average(allPercents)) : null,
    rated: allPercents.length,
    total,
    categories: scored,
  };
}

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
