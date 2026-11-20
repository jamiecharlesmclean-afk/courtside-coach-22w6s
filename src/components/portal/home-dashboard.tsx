// Home screen: what the coach needs before and during a game day.
// Every figure comes from saved data; empty areas say so instead of showing sample numbers.
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import Activity from "lucide-react-native/dist/esm/icons/activity.mjs";
import BookOpen from "lucide-react-native/dist/esm/icons/book-open.mjs";
import ClipboardList from "lucide-react-native/dist/esm/icons/clipboard-list.mjs";
import Crosshair from "lucide-react-native/dist/esm/icons/crosshair.mjs";
import Dumbbell from "lucide-react-native/dist/esm/icons/dumbbell.mjs";
import FileText from "lucide-react-native/dist/esm/icons/file-text.mjs";
import Users from "lucide-react-native/dist/esm/icons/users.mjs";
import { Button, Section, palette, styles as ui } from "@/components/portal/ui";
import type { PlayerProfile } from "@/lib/roster";
import type { TeamSettings } from "@/lib/settings";
import { formatGameDate, type Game } from "@/lib/games";
import { timeRange, type CalendarItem } from "@/lib/calendar";

export type HomeTab = "Whiteboard" | "Playbook" | "Team" | "Stats" | "Planner";

export type RecentDocument = { id: string; title: string; category: string };

type Props = {
  wide: boolean;
  dateLabel: string;
  settings: TeamSettings;
  roster: PlayerProfile[];
  planned: string[];
  plays: { name: string; type: string }[];
  selectedPlay: number;
  drillCount: number;
  recentDocuments: RecentDocument[];
  nextGame: Game | null;
  upcoming: CalendarItem[];
  court: ReactNode;
  onTab: (tab: HomeTab) => void;
  onRoute: (path: "/training" | "/documents" | "/games" | "/calendar") => void;
};

// Temporary placeholder shown until a team name is saved in Settings.
const PLACEHOLDER_TEAM_NAME = "Sideline Kings";

function heading(teamName: string): string {
  return teamName || PLACEHOLDER_TEAM_NAME;
}

export function HomeDashboard({
  wide, dateLabel, settings, roster, planned, plays, selectedPlay, drillCount, recentDocuments, nextGame, upcoming, court, onTab, onRoute,
}: Props) {
  const unavailable = roster.filter((player) => (player.availability ?? "Available") !== "Available");
  const attention: string[] = [];
  unavailable.forEach((player) => attention.push(`${player.name} (#${player.number}) is ${(player.availability ?? "").toLowerCase()}`));
  if (roster.length === 0) attention.push("No players on the roster yet");
  if (planned.length === 0) attention.push("No practice items planned");

  const teamLine = [settings.age_group, settings.competition, settings.season]
    .filter(Boolean)
    .join(" · ") || "Your team";
  const play = plays[selectedPlay] ?? plays[0];

  const tiles: { key: string; label: string; value: string; detail: string; Icon: typeof Users; onPress: () => void }[] = [
    { key: "roster", label: "Roster", value: `${roster.length} players`, detail: unavailable.length ? `${unavailable.length} unavailable` : "All available", Icon: Users, onPress: () => onTab("Team") },
    { key: "training", label: "Drill book", value: `${drillCount} drills`, detail: "Shared drill book", Icon: Dumbbell, onPress: () => onRoute("/training") },
    { key: "board", label: "Whiteboard", value: "Draw a play", detail: "Court and player moves", Icon: Crosshair, onPress: () => onTab("Whiteboard") },
    { key: "plays", label: "Playbook", value: `${plays.length} plays`, detail: "Saved plays and systems", Icon: BookOpen, onPress: () => onTab("Playbook") },
    { key: "plan", label: "Practice plan", value: `${planned.length} items`, detail: "Build and time sessions", Icon: ClipboardList, onPress: () => onTab("Planner") },
    { key: "stats", label: "Live stats", value: "Box score", detail: "Log the game", Icon: Activity, onPress: () => onTab("Stats") },
  ];

  return (
    <View style={{ width: "100%", maxWidth: 980, alignSelf: "center", padding: 16, gap: 14 }}>
      <View style={{ gap: 4, paddingTop: 4 }}>
        <Text style={ui.meta}>{dateLabel}</Text>
        <Text accessibilityRole="header" style={{ fontSize: 26, fontWeight: "700", color: palette.ink }}>{heading(settings.team_name.trim())}</Text>
        <Text style={ui.meta}>{teamLine}</Text>
      </View>

      <View style={{ flexDirection: wide ? "row" : "column", gap: 14, alignItems: "flex-start" }}>
        <View style={{ flex: 1, width: "100%", gap: 14 }}>
          <Section title="Next game">
            {nextGame ? (
              <>
                <Text style={ui.name}>{`${nextGame.venue === "Away" ? "At" : "vs"} ${nextGame.opponent}`}</Text>
                <Text style={ui.meta}>{[formatGameDate(nextGame.date, nextGame.time), nextGame.location].filter(Boolean).join(" · ")}</Text>
              </>
            ) : (
              <Text style={ui.meta}>No game scheduled yet. Add games in the schedule.</Text>
            )}
            <View style={ui.actions}>
              <Button label="Game schedule" variant="secondary" onPress={() => onRoute("/games")} />
              <Button label="Open live stats" variant="secondary" onPress={() => onTab("Stats")} />
            </View>
          </Section>

          <Section title="Calendar">
            {upcoming.length === 0 ? (
              <Text style={ui.meta}>Nothing on the calendar yet. Add practices, games and events.</Text>
            ) : (
              upcoming.map((item) => (
                <View key={item.key} style={{ gap: 2 }}>
                  <Text style={ui.name}>{item.type === "Game" ? `${item.venue === "Away" ? "At" : "vs"} ${item.title}` : item.title}</Text>
                  <Text style={ui.meta}>{[formatGameDate(item.date, ""), item.type, item.start ? timeRange(item) : "All day"].join(" · ")}</Text>
                </View>
              ))
            )}
            <View style={ui.actions}>
              <Button label="Open calendar" variant="secondary" onPress={() => onRoute("/calendar")} />
            </View>
          </Section>

          {attention.length ? (
            <Section title="Needs attention">
              {attention.map((line) => (
                <Text key={line} style={{ fontSize: 15, color: palette.ink }}>• {line}</Text>
              ))}
            </Section>
          ) : null}

          <Section title="Next practice">
            {planned.length ? (
              <>
                {planned.slice(0, 3).map((item, index) => (
                  <Text key={`${item}-${index}`} style={{ fontSize: 15, color: palette.ink }}>{index + 1}. {item}</Text>
                ))}
                {planned.length > 3 ? <Text style={ui.meta}>+ {planned.length - 3} more</Text> : null}
              </>
            ) : (
              <Text style={ui.meta}>Nothing planned yet.</Text>
            )}
            <View style={ui.actions}>
              <Button label="Open practice plan" variant="secondary" onPress={() => onTab("Planner")} />
            </View>
          </Section>
        </View>

        <View style={{ flex: 1, width: "100%", gap: 14 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, paddingHorizontal: 0 }}>
            {tiles.map(({ key, label, value, detail, Icon, onPress }) => (
              <Pressable
                key={key}
                accessibilityRole="button"
                accessibilityLabel={`${label}: ${value}. ${detail}`}
                onPress={onPress}
                style={({ focused, pressed }: { focused?: boolean; pressed: boolean }) => [
                  { width: wide ? "31%" : "48%", minHeight: 96, padding: 12, gap: 6, borderRadius: 14, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface },
                  focused && { outlineWidth: 3, outlineColor: palette.focus, outlineStyle: "solid" } as any,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Icon color={palette.deep} size={20} />
                <Text style={ui.name}>{label}</Text>
                <Text style={ui.meta}>{value}</Text>
                <Text style={[ui.meta, { fontSize: 12 }]}>{detail}</Text>
              </Pressable>
            ))}
          </View>

          <Section title="Last whiteboard play">
            {play ? (
              <>
                <Text style={ui.name}>{play.name}</Text>
                <Text style={ui.meta}>{play.type}</Text>
                <View pointerEvents="none">{court}</View>
              </>
            ) : (
              <Text style={ui.meta}>No plays saved yet.</Text>
            )}
            <View style={ui.actions}>
              <Button label="Open whiteboard" variant="secondary" onPress={() => onTab("Whiteboard")} />
            </View>
          </Section>

          <Section title="Recent documents">
            {recentDocuments.length ? (
              recentDocuments.map((doc) => (
                <View key={doc.id} style={{ gap: 2 }}>
                  <Text style={{ fontSize: 15, fontWeight: "600", color: palette.ink }}>{doc.title}</Text>
                  <Text style={ui.meta}>{doc.category}</Text>
                </View>
              ))
            ) : (
              <Text style={ui.meta}>No documents yet. Save forms, schedules and policies in the library.</Text>
            )}
            <View style={ui.actions}>
              <Button label="Open document library" variant="secondary" onPress={() => onRoute("/documents")} />
            </View>
          </Section>

          <Section title="Team announcements">
            <Text style={ui.meta}>No announcements yet.</Text>
          </Section>
        </View>
      </View>
    </View>
  );
}
