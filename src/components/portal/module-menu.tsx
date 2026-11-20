// The app's module menu: one entry for every module, reachable from any screen.
import { router } from "expo-router";
import type { ComponentType } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import Activity from "lucide-react-native/dist/esm/icons/activity.mjs";
import ClipboardList from "lucide-react-native/dist/esm/icons/clipboard-list.mjs";
import CalendarDays from "lucide-react-native/dist/esm/icons/calendar-days.mjs";
import Crosshair from "lucide-react-native/dist/esm/icons/crosshair.mjs";
import Dumbbell from "lucide-react-native/dist/esm/icons/dumbbell.mjs";
import House from "lucide-react-native/dist/esm/icons/house.mjs";
import FileText from "lucide-react-native/dist/esm/icons/file-text.mjs";
import Settings from "lucide-react-native/dist/esm/icons/settings.mjs";
import Users from "lucide-react-native/dist/esm/icons/users.mjs";
import X from "lucide-react-native/dist/esm/icons/x.mjs";
import { palette, styles as ui } from "@/components/portal/ui";

// Tab modules open the home screen on that tab; route modules open their own screen.
export const MODULES: {
  id: string;
  label: string;
  detail: string;
  Icon: ComponentType<{ color?: string; size?: number }>;
  tab?: string;
  path?: "/training" | "/documents" | "/settings" | "/games" | "/calendar" | "/evaluation";
}[] = [
  { id: "home", label: "Home", detail: "Next game, attention and practice at a glance", Icon: House, tab: "Home" },
  { id: "whiteboard", label: "Whiteboard", detail: "Draw and run plays on the court", Icon: Crosshair, tab: "Whiteboard" },
  { id: "playbook", label: "Playbook", detail: "Your saved plays and systems", Icon: Crosshair, tab: "Playbook" },
  { id: "team", label: "Team roster", detail: "Players, availability and contacts", Icon: Users, tab: "Team" },
  { id: "stats", label: "Live stats", detail: "Log the game and box score", Icon: Activity, tab: "Stats" },
  { id: "planner", label: "Practice plan", detail: "Build and time practice sessions", Icon: CalendarDays, tab: "Planner" },
  { id: "evaluation", label: "Player evaluation", detail: "Rate each player on skills and save on this device", Icon: ClipboardList, path: "/evaluation" },
  { id: "games", label: "Games", detail: "Season schedule: dates, opponents and venues", Icon: CalendarDays, path: "/games" },
  { id: "calendar", label: "Calendar", detail: "Practices, games, tournaments, meetings and events", Icon: CalendarDays, path: "/calendar" },
  { id: "training", label: "Drill book", detail: "Shared drills, categories and favourites", Icon: Dumbbell, path: "/training" },
  { id: "documents", label: "Documents", detail: "Forms, schedules, policies and handouts", Icon: FileText, path: "/documents" },
  { id: "settings", label: "Settings", detail: "Team name, staff, season, competition, age group", Icon: Settings, path: "/settings" },
];

export function ModuleMenu({
  visible,
  onClose,
  currentTab,
  currentPath,
}: {
  visible: boolean;
  onClose: () => void;
  currentTab?: string;
  currentPath?: string;
}) {
  const open = (m: (typeof MODULES)[number]) => {
    onClose();
    if (m.path) router.push(m.path);
    else router.push({ pathname: "/", params: { tab: m.tab, t: String(Date.now()) } });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} accessibilityViewIsModal>
      <View style={{ flex: 1, backgroundColor: "rgba(23,35,30,0.45)", justifyContent: "flex-start", alignItems: "center", paddingTop: 72, paddingHorizontal: 16 }}>
        <View
          accessibilityRole="menu"
          accessibilityLabel="Modules"
          style={{ width: "100%", maxWidth: 420, maxHeight: "80%", backgroundColor: palette.surface, borderRadius: 16, borderWidth: 1, borderColor: palette.line, overflow: "hidden" }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: palette.line }}>
            <Text accessibilityRole="header" style={ui.name}>Modules</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close menu" onPress={onClose} style={{ minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" }}>
              <X color={palette.ink} size={20} />
            </Pressable>
          </View>
          <ScrollView>
            {MODULES.map((m) => {
              const selected = (m.tab && m.tab === currentTab) || (m.path && m.path === currentPath);
              return (
                <Pressable
                  key={m.id}
                  accessibilityRole="menuitem"
                  accessibilityLabel={m.label}
                  accessibilityHint={m.detail}
                  accessibilityState={{ selected: !!selected }}
                  onPress={() => open(m)}
                  style={({ focused, pressed }: { focused?: boolean; pressed: boolean }) => [
                    { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 64, paddingHorizontal: 16, paddingVertical: 10 },
                    selected && { backgroundColor: "#edfac4" },
                    focused && { outlineWidth: 3, outlineColor: palette.focus, outlineStyle: "solid" } as any,
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <m.Icon color={palette.deep} size={22} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={ui.name}>{m.label}</Text>
                    <Text style={ui.meta}>{m.detail}</Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
