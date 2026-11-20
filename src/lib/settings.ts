// Team configuration, stored on this device.
import AsyncStorage from "@react-native-async-storage/async-storage";

export const SETTINGS_KEY = "courtside-coach:settings";

export type TeamSettings = {
  team_name: string;
  coaching_staff: string; // one name per line
  season: string;
  competition: string;
  age_group: string;
  logo_url: string; // web address of the team logo image
};

export const emptySettings: TeamSettings = {
  team_name: "",
  coaching_staff: "",
  season: "",
  competition: "",
  age_group: "",
  logo_url: "",
};

export async function loadSettings(): Promise<TeamSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    return raw ? { ...emptySettings, ...(JSON.parse(raw) as Partial<TeamSettings>) } : emptySettings;
  } catch {
    return emptySettings;
  }
}

export async function saveSettings(settings: TeamSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
