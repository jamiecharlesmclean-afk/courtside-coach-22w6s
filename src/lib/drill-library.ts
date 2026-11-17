// Starter drill library: 200 drills, 20 in each drill category. Seeded once, on first launch,
// into an empty drill book. Deleting drills later never brings the starter set back.
import AsyncStorage from "@react-native-async-storage/async-storage"
import { DRILLS_KEY, type Drill } from "@/lib/drills"
import { BALL_HANDLING } from "@/lib/drill-data/ball-handling"
import { SHOOTING } from "@/lib/drill-data/shooting"
import { PASSING } from "@/lib/drill-data/passing"
import { DEFENCE } from "@/lib/drill-data/defence"
import { REBOUNDING } from "@/lib/drill-data/rebounding"
import { TRANSITION } from "@/lib/drill-data/transition"
import { CONDITIONING } from "@/lib/drill-data/conditioning"
import { SMALL_SIDED } from "@/lib/drill-data/small-sided"
import { TEAM_OFFENCE } from "@/lib/drill-data/team-offence"
import { TEAM_DEFENCE } from "@/lib/drill-data/team-defence"

export const STARTER_SEEDED_KEY = "courtside:drills-seeded"

const SOURCES: [string, string][] = [
  ["Ball Handling", BALL_HANDLING],
  ["Shooting", SHOOTING],
  ["Passing", PASSING],
  ["Defence", DEFENCE],
  ["Rebounding", REBOUNDING],
  ["Transition", TRANSITION],
  ["Conditioning", CONDITIONING],
  ["Small-Sided Games", SMALL_SIDED],
  ["Team Offence", TEAM_OFFENCE],
  ["Team Defence", TEAM_DEFENCE],
]

type StarterDrill = Omit<Drill, "id" | "created_at" | "updated_at">

function parseLibrary(): StarterDrill[] {
  const drills: StarterDrill[] = []
  for (const [category, block] of SOURCES) {
    for (const line of block.split("\n")) {
      const fields = line.split("|").map((field) => field.trim())
      if (fields.length !== 8 || !fields[0]) continue
      const [name, minutes, players, equipment, court, difficulty, points, description] = fields
      drills.push({
        name: name!,
        category,
        duration_min: minutes!,
        players: players!,
        equipment: equipment!,
        court_area: court!,
        difficulty: difficulty!,
        coaching_points: points!,
        description: description!,
        favourite: false,
      })
    }
  }
  return drills
}

export const STARTER_DRILLS = parseLibrary()

// Adds the starter drills once. Existing drills are kept; starter drills whose names are not already in the book are added. Returns how many were added.
export async function seedStarterDrills(): Promise<number> {
  try {
    if (await AsyncStorage.getItem(STARTER_SEEDED_KEY)) return 0
    const raw = await AsyncStorage.getItem(DRILLS_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    const existing: Drill[] = Array.isArray(parsed) ? (parsed as Drill[]) : []
    const names = new Set(existing.map((drill) => drill.name.trim().toLowerCase()))
    const now = new Date().toISOString()
    const rows = STARTER_DRILLS
      .map((drill, index) => ({ ...drill, id: `starter-${index + 1}`, created_at: now, updated_at: now }))
      .filter((drill) => !names.has(drill.name.trim().toLowerCase()))
    await AsyncStorage.setItem(DRILLS_KEY, JSON.stringify([...existing, ...rows]))
    await AsyncStorage.setItem(STARTER_SEEDED_KEY, "1")
    return rows.length
  } catch {
    return 0
  }
}
