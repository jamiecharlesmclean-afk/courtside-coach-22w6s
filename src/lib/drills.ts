import type { Base } from "@/lib/store"

export const DRILLS_KEY = "courtside:drills"

export const DRILL_CATEGORIES: string[] = [
  "Ball Handling",
  "Shooting",
  "Passing",
  "Defence",
  "Rebounding",
  "Transition",
  "Conditioning",
  "Small-Sided Games",
  "Team Offence",
  "Team Defence",
]

export const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"] as const

export type Drill = Base & {
  name: string
  category: string
  duration_min: string
  players: string
  equipment: string
  court_area: string
  coaching_points: string
  description: string
  difficulty: string
  favourite: boolean
}

export type DrillDraft = Omit<Drill, keyof Base>

export const emptyDrillDraft: DrillDraft = {
  name: "",
  category: DRILL_CATEGORIES[0],
  duration_min: "",
  players: "",
  equipment: "",
  court_area: "",
  coaching_points: "",
  description: "",
  difficulty: DIFFICULTIES[0],
  favourite: false,
}
