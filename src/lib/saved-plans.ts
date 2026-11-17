// Named practice plans the coach has saved on this device.
// Each saved plan keeps a copy of the agenda blocks and the coach's notes.
import AsyncStorage from "@react-native-async-storage/async-storage";

export const SAVED_PLANS_KEY = "courtside:saved-plans";

export type SavedPlan = { id: string; name: string; items: string[]; notes: string; saved_at: string };

export async function readSavedPlans(): Promise<SavedPlan[]> {
  const raw = await AsyncStorage.getItem(SAVED_PLANS_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((p): p is SavedPlan =>
      !!p && typeof p.id === "string" && typeof p.name === "string" && Array.isArray(p.items) && typeof p.notes === "string" && typeof p.saved_at === "string");
  } catch {
    return [];
  }
}

export async function writeSavedPlans(plans: SavedPlan[]): Promise<void> {
  await AsyncStorage.setItem(SAVED_PLANS_KEY, JSON.stringify(plans));
}
