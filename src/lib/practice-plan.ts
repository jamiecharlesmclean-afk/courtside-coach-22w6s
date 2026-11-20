// Practice plan agenda: a list of block names saved on this device.
// The planner screen and the drill book both read and write this list.
import AsyncStorage from "@react-native-async-storage/async-storage";

export const PLAN_KEY = "courtside-coach:practice-plan";

export async function readPracticePlan(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(PLAN_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

// Adds a block to the end of the agenda. Returns false if it is already there.
export async function addToPracticePlan(name: string): Promise<boolean> {
  const clean = name.trim();
  const items = await readPracticePlan();
  if (!clean || items.includes(clean)) return false;
  await AsyncStorage.setItem(PLAN_KEY, JSON.stringify([...items, clean]));
  return true;
}
