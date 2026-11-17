import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import Menu from "lucide-react-native/dist/esm/icons/menu.mjs";
import { ModuleMenu } from "@/components/portal/module-menu";
import { BOARD_VIEWS, PlayBoard, STARTING_FORMATION, ToolButtons, type BoardDiagram, type BoardOrientation, type BoardTool, type BoardView } from "@/components/portal/play-board";
import { Dropdown } from "@/components/portal/dropdown";
import { AvailabilityBadge, PlayerEditor } from "@/components/portal/player-editor";
import { isRosterPlayer, normalizePlayer, type PlayerProfile } from "@/lib/roster";
import { RosterManager } from "@/components/portal/roster-manager";
import { readSavedPlans, writeSavedPlans, type SavedPlan } from "@/lib/saved-plans";
import { HomeDashboard } from "@/components/portal/home-dashboard";
import { LEGACY_PLAYS_KEY, PLAYBOOK_KEY, STARTER_PLAYS, mergeSavedPlays, type Play as SavedPlay } from "@/lib/playbook";
import { emptySettings, loadSettings, type TeamSettings } from "@/lib/settings";
import { DRILLS_KEY, type Drill } from "@/lib/drills";
import { seedStarterDrills } from "@/lib/drill-library";
import { DOCUMENTS_KEY, type Document } from "@/lib/documents";
import { GAMES_KEY, localDateKey, nextGame as nextGameOf, type Game } from "@/lib/games";
import { CALENDAR_KEY, sortItems, toItems, type CalendarEvent } from "@/lib/calendar";
import FileText from "lucide-react-native/dist/esm/icons/file-text.mjs";
import Activity from "lucide-react-native/dist/esm/icons/activity.mjs";
import ArrowRight from "lucide-react-native/dist/esm/icons/arrow-right.mjs";
import ArrowUpRight from "lucide-react-native/dist/esm/icons/arrow-up-right.mjs";
import BarChart3 from "lucide-react-native/dist/esm/icons/chart-column.mjs";
import CalendarDays from "lucide-react-native/dist/esm/icons/calendar-days.mjs";
import Check from "lucide-react-native/dist/esm/icons/check.mjs";
import ChevronRight from "lucide-react-native/dist/esm/icons/chevron-right.mjs";
import Circle from "lucide-react-native/dist/esm/icons/circle.mjs";
import ClipboardList from "lucide-react-native/dist/esm/icons/clipboard-list.mjs";
import Clock3 from "lucide-react-native/dist/esm/icons/clock-3.mjs";
import Crosshair from "lucide-react-native/dist/esm/icons/crosshair.mjs";
import Dumbbell from "lucide-react-native/dist/esm/icons/dumbbell.mjs";
import Filter from "lucide-react-native/dist/esm/icons/funnel.mjs";
import Minus from "lucide-react-native/dist/esm/icons/minus.mjs";
import MoreHorizontal from "lucide-react-native/dist/esm/icons/ellipsis.mjs";
import Pause from "lucide-react-native/dist/esm/icons/pause.mjs";
import Play from "lucide-react-native/dist/esm/icons/play.mjs";
import Plus from "lucide-react-native/dist/esm/icons/plus.mjs";
import RotateCcw from "lucide-react-native/dist/esm/icons/rotate-ccw.mjs";
import Search from "lucide-react-native/dist/esm/icons/search.mjs";
import Settings2 from "lucide-react-native/dist/esm/icons/settings-2.mjs";
import Share2 from "lucide-react-native/dist/esm/icons/share-2.mjs";
import Shield from "lucide-react-native/dist/esm/icons/shield.mjs";
import Timer from "lucide-react-native/dist/esm/icons/timer.mjs";
import Trophy from "lucide-react-native/dist/esm/icons/trophy.mjs";
import Users from "lucide-react-native/dist/esm/icons/users.mjs";
import X from "lucide-react-native/dist/esm/icons/x.mjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Image,
  Pressable,
  Share,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import Svg, { Circle as SvgCircle, Path } from "react-native-svg";

const BG = "#f5f5f1";
const INK = "#17231e";
const MUTED = "#818a84";
const GREEN = "#d8fc58";
const DEEP = "#193e32";
const LINE = "#e6e9e2";
const STORE_KEY = "courtside-coach:box-score";
import { PLAN_KEY, readPracticePlan } from "@/lib/practice-plan";
const CLOCK_KEY = "courtside-coach:game-clock";
const QUARTER_KEY = "courtside-coach:quarter";
const TEAM_KEY = "courtside-coach:team-roster";

type Tab = "Home" | "Playbook" | "Whiteboard" | "Team" | "Stats" | "Planner";
type BoxScore = { fg: number; fga: number; three: number; threeA: number; ft: number; fta: number; reb: number; ast: number; tov: number };
const ZERO_SCORE: BoxScore = { fg: 0, fga: 0, three: 0, threeA: 0, ft: 0, fta: 0, reb: 0, ast: 0, tov: 0 };
type TeamPlayer = PlayerProfile;
const DEFAULT_TEAM: TeamPlayer[] = [];

const PLAY_LIST = STARTER_PLAYS;

const DRILLS = [
  { title: "3-Man Weave", kind: "WARM UP", duration: "8 min", focus: "Passing · transition" },
  { title: "Closeout to Contain", kind: "DEFENSE", duration: "12 min", focus: "Footwork · help side" },
  { title: "Paint Touch Finishing", kind: "FINISHING", duration: "10 min", focus: "Contact · both hands" },
];

export default function HomeScreen() {
  const [tab, setTab] = useState<Tab>("Home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [settings, setSettings] = useState<TeamSettings>(emptySettings);
  const [drillCount, setDrillCount] = useState(0);
  const [drillList, setDrillList] = useState<Drill[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  // Reload team settings and the drill count whenever this screen comes back into focus.
  useFocusEffect(useCallback(() => {
    loadSettings().then(setSettings);
    readPracticePlan().then(setPlanned).catch(() => {});
    seedStarterDrills().then(() => AsyncStorage.getItem(DRILLS_KEY)).then((raw) => {
      try { const list = raw ? (JSON.parse(raw) as Drill[]) : []; setDrillList(list); setDrillCount(list.length); } catch { setDrillList([]); setDrillCount(0); }
    }).catch(() => {});
    AsyncStorage.getItem(DOCUMENTS_KEY).then((raw) => {
      try { setDocuments(raw ? (JSON.parse(raw) as Document[]) : []); } catch { setDocuments([]); }
    }).catch(() => {});
    AsyncStorage.getItem(GAMES_KEY).then((raw) => {
      try { setGames(raw ? (JSON.parse(raw) as Game[]) : []); } catch { setGames([]); }
    }).catch(() => {});
    AsyncStorage.getItem(CALENDAR_KEY).then((raw) => {
      try { setCalendarEvents(raw ? (JSON.parse(raw) as CalendarEvent[]) : []); } catch { setCalendarEvents([]); }
    }).catch(() => {});
  }, []));
  // The module menu opens this screen on a tab by passing ?tab=<name>&t=<stamp>.
  const params = useLocalSearchParams<{ tab?: string; t?: string }>();
  useEffect(() => {
    if (params.tab) setTab(params.tab as Tab);
  }, [params.tab, params.t]);
  const [score, setScore] = useState<BoxScore>(ZERO_SCORE);
  const [quarter, setQuarter] = useState(1);
  const [selectedPlay, setSelectedPlay] = useState(0);
  const [query, setQuery] = useState("");
  const [planned, setPlanned] = useState<string[]>([]);
  const [plannerReady, setPlannerReady] = useState(false);
  const [newItem, setNewItem] = useState("");
  const [notes, setNotes] = useState("");
  const [plays, setPlays] = useState(PLAY_LIST);
  const [newPlayName, setNewPlayName] = useState("");
  const [clock, setClock] = useState(600);
  const [running, setRunning] = useState(false);
  const [practiceRunning, setPracticeRunning] = useState(false);
  const [roster, setRoster] = useState(DEFAULT_TEAM);
  const [rosterReady, setRosterReady] = useState(false);
  const rosterPlayers = useMemo(() => roster.filter(isRosterPlayer), [roster]);
  const { width } = useWindowDimensions();
  const wide = width >= 760;
  const today = new Date();
  const dateLabel = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).toUpperCase();
  const tomorrowLabel = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }).toUpperCase();

  useEffect(() => {
    AsyncStorage.getItem(STORE_KEY).then((raw) => {
      if (raw) {
        try { setScore({ ...ZERO_SCORE, ...JSON.parse(raw) }); } catch { /* Keep the defaults if local data is malformed. */ }
      }
    }).catch(() => {});
    AsyncStorage.multiGet([CLOCK_KEY, QUARTER_KEY]).then((values) => {
      const savedClock = Number(values[0]?.[1]);
      const savedQuarter = Number(values[1]?.[1]);
      if (Number.isFinite(savedClock) && savedClock >= 0) setClock(savedClock);
      if (Number.isInteger(savedQuarter) && savedQuarter >= 1 && savedQuarter <= 4) setQuarter(savedQuarter);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(TEAM_KEY).then((raw) => {
      if (raw) {
        try {
          const saved = JSON.parse(raw) as Partial<TeamPlayer>[];
          setRoster(saved.map((player, index) => normalizePlayer(player, index)));
        } catch { /* Keep the sample roster if saved data is malformed. */ }
      }
      setRosterReady(true);
    }).catch(() => setRosterReady(true));
  }, []);

  useEffect(() => {
    if (rosterReady) AsyncStorage.setItem(TEAM_KEY, JSON.stringify(roster)).catch(() => {});
  }, [roster, rosterReady]);

  // Medical information was removed from the app. Clear any copy left on this device.
  useEffect(() => {
    AsyncStorage.removeItem("courtside:medical-records").catch(() => {});
  }, []);

  useEffect(() => {
    AsyncStorage.multiGet(["courtside-coach:notes", PLAYBOOK_KEY, LEGACY_PLAYS_KEY]).then((values) => {
      const noteValue = values[0]?.[1];
      const playsValue = values[1]?.[1];
      const legacyValue = values[2]?.[1];
      if (noteValue) setNotes(noteValue);
      if (playsValue) {
        try { setPlays(JSON.parse(playsValue)); } catch { /* Keep the starter playbook if saved data is malformed. */ }
      } else {
        // First run of the new playbook: keep the coach's own plays from the old list and add the starter set.
        let saved: SavedPlay[] | null = null;
        try { saved = legacyValue ? JSON.parse(legacyValue) : null; } catch { saved = null; }
        const merged = mergeSavedPlays(saved);
        setPlays(merged);
        AsyncStorage.setItem(PLAYBOOK_KEY, JSON.stringify(merged)).catch(() => {});
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => setClock((value) => {
      const next = Math.max(0, value - 1);
      AsyncStorage.setItem(CLOCK_KEY, String(next)).catch(() => {});
      if (next === 0) setRunning(false);
      return next;
    }), 1000);
    return () => clearInterval(interval);
  }, [running]);

  useEffect(() => { AsyncStorage.setItem(CLOCK_KEY, String(clock)).catch(() => {}); }, [clock]);
  useEffect(() => { AsyncStorage.setItem(QUARTER_KEY, String(quarter)).catch(() => {}); }, [quarter]);

  useEffect(() => {
    AsyncStorage.getItem(PLAN_KEY).then((raw) => {
      if (raw) {
        try { setPlanned(JSON.parse(raw)); } catch { /* Keep the starter agenda if local data is malformed. */ }
      }
      setPlannerReady(true);
    }).catch(() => setPlannerReady(true));
  }, []);

  useEffect(() => {
    if (plannerReady) AsyncStorage.setItem(PLAN_KEY, JSON.stringify(planned)).catch(() => {});
  }, [planned, plannerReady]);

  useEffect(() => { AsyncStorage.setItem(STORE_KEY, JSON.stringify(score)).catch(() => {}); }, [score]);

  function updateScore(key: keyof BoxScore, amount: number) {
    setScore((current) => ({ ...current, [key]: Math.max(0, current[key] + amount) }));
  }

  function addPlanItem(value = newItem) {
    const clean = value.trim();
    if (!clean || planned.includes(clean)) return;
    setPlanned((items) => [...items, clean]);
    setNewItem("");
  }

  function saveCoachNotes(value: string) {
    setNotes(value);
    AsyncStorage.setItem("courtside-coach:notes", value).catch(() => {});
  }

  function createPlay() {
    const name = newPlayName.trim();
    if (!name || name === "New play") return;
    const play = { name, type: "HALF COURT", time: "0:18", color: "#dcebe5", tag: "CUSTOM PLAY", players: "5 players", coaching: "Add the coaching point for this play." };
    const next = [...plays, play];
    setPlays(next);
    setSelectedPlay(next.length - 1);
    setNewPlayName("");
    AsyncStorage.setItem(PLAYBOOK_KEY, JSON.stringify(next)).catch(() => {});
  }


  function deletePlay(index: number) {
    const next = plays.filter((_, position) => position !== index);
    if (next.length === 0) return;
    setPlays(next);
    setSelectedPlay(0);
    AsyncStorage.setItem(PLAYBOOK_KEY, JSON.stringify(next)).catch(() => {});
  }

  function updatePlayDiagram(index: number, diagram: BoardDiagram) {
    const next = plays.map((play, position) => (position === index ? { ...play, diagram } : play));
    setPlays(next);
    AsyncStorage.setItem(PLAYBOOK_KEY, JSON.stringify(next)).catch(() => {});
  }

  const visiblePlays = plays.filter((play) => play.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={s.app}>
        <View style={s.topbar}>
          <View style={s.brandRow}>
            <View style={s.brandMark}>{settings.logo_url ? <Image source={{ uri: settings.logo_url }} accessibilityLabel="Team logo" resizeMode="contain" style={{ width: "100%", height: "100%" }} /> : <Activity color={INK} size={21} strokeWidth={2.5} />}</View>
            <Text style={s.brand}>COURTSIDE<Text style={s.brandLight}> / COACH</Text></Text>
          </View>
          <View style={s.topActions}>
            <Pressable accessibilityRole="button" accessibilityLabel="Open module menu" onPress={() => setMenuOpen(true)} style={{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "#ffffff", borderWidth: 1, borderColor: LINE }}><Menu color={INK} size={18} /></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Open team settings" onPress={() => router.push("/settings")} style={s.seasonPill}><View style={s.greenDot} /><Text style={s.seasonText}>{settings.season ? settings.season.toUpperCase() : "SET UP SEASON"}</Text></Pressable>
          </View>
        </View>

        <View style={[s.body, wide && s.bodyWide]}>
          <View style={[s.sidebar, !wide && s.sidebarMobile]}>
            <View style={s.navGroup}>
              <Text style={s.navCaption}>WORKSPACE</Text>
              <NavItem icon={BarChart3} label="Home" active={tab === "Home"} onPress={() => setTab("Home")} />
              <NavItem icon={Crosshair} label="Whiteboard" active={tab === "Whiteboard"} onPress={() => setTab("Whiteboard")} />
              <NavItem icon={Crosshair} label="Playbook" active={tab === "Playbook"} onPress={() => setTab("Playbook")} />
              <NavItem icon={Users} label="Team" active={tab === "Team"} onPress={() => setTab("Team")} />
              <NavItem icon={Activity} label="Live stats" active={tab === "Stats"} onPress={() => setTab("Stats")} badge="LIVE" />
              <NavItem icon={CalendarDays} label="Practice plan" active={tab === "Planner"} onPress={() => setTab("Planner")} />
              <NavItem icon={Dumbbell} label="Drill book" active={false} onPress={() => router.push("/training")} />
              <NavItem icon={CalendarDays} label="Games" active={false} onPress={() => router.push("/games")} /><NavItem icon={FileText} label="Documents" active={false} onPress={() => router.push("/documents")} />
            </View>
            <View style={s.sidebarBottom}>
              <View style={s.teamCard}>
                <View style={s.teamIcon}>{settings.logo_url ? <Image source={{ uri: settings.logo_url }} accessibilityLabel="Team logo" resizeMode="contain" style={{ width: "100%", height: "100%" }} /> : <Shield color={GREEN} size={18} />}</View>
                <View style={{ flex: 1 }}><Text style={s.teamName}>{settings.team_name || "Set up your team"}</Text><Text style={s.teamMeta}>{[settings.age_group, `${rosterPlayers.length} players`].filter(Boolean).join(" · ")}</Text></View>
                <Pressable accessibilityLabel="Open team roster" onPress={() => setTab("Team")}><ChevronRight color="#81948a" size={16} /></Pressable>
              </View>
              <Pressable onPress={() => router.push("/settings")} style={s.settingsLink}><Settings2 color="#89928c" size={17} /><Text style={s.settingsText}>Settings</Text></Pressable>
            </View>
          </View>

          <ScrollView contentContainerStyle={s.mainScroll} showsVerticalScrollIndicator={false}>
            {tab === "Home" ? <HomeDashboard upcoming={sortItems(toItems(calendarEvents, games).filter((item) => item.date >= localDateKey(new Date()))).slice(0, 3)} nextGame={nextGameOf(games)} wide={wide} dateLabel={dateLabel} settings={settings} roster={rosterPlayers} planned={planned} plays={plays} selectedPlay={selectedPlay} drillCount={drillCount} recentDocuments={[...documents].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 3)} court={<CourtDiagram compact />} onTab={setTab} onRoute={(path) => router.push(path)} /> : null}
            {tab === "Whiteboard" ? <WhiteboardScreen wide={wide} plays={plays} planned={planned} onAddToPractice={addPlanItem} onChangePlay={updatePlayDiagram} /> : null}
            {tab === "Playbook" ? <Playbook wide={wide} query={query} setQuery={setQuery} plays={plays} selected={selectedPlay} setSelected={setSelectedPlay} onAdd={() => addPlanItem(plays[selectedPlay]?.name)} planned={planned} newPlayName={newPlayName} setNewPlayName={setNewPlayName} createPlay={createPlay} deletePlay={deletePlay} drillCount={drillCount} drills={drillList} /> : null}
            {tab === "Team" ? <RosterManager settings={settings} wide={wide} roster={roster} setRoster={setRoster} /> : null}
            {tab === "Stats" ? <StatsScreen settings={settings} wide={wide} score={score} quarter={quarter} setQuarter={setQuarter} updateScore={updateScore} clock={clock} setClock={setClock} running={running} setRunning={setRunning} resetScore={() => { setScore(ZERO_SCORE); setClock(600); setQuarter(1); setRunning(false); AsyncStorage.setItem(STORE_KEY, JSON.stringify(ZERO_SCORE)).catch(() => {}); }} /> : null}
            {tab === "Planner" ? <Planner wide={wide} planned={planned} setPlanned={setPlanned} newItem={newItem} setNewItem={setNewItem} addItem={addPlanItem} running={practiceRunning} setRunning={setPracticeRunning} notes={notes} setNotes={saveCoachNotes} dateLabel={tomorrowLabel} roster={rosterPlayers} teamName={settings.team_name} /> : null}
          </ScrollView>
        </View>
        {!wide ? <View style={s.mobileNav}>
          <MobileNavItem icon={BarChart3} label="Home" active={tab === "Home"} onPress={() => setTab("Home")} />
          <MobileNavItem icon={Crosshair} label="Board" active={tab === "Whiteboard"} onPress={() => setTab("Whiteboard")} />
          <MobileNavItem icon={Users} label="Team" active={tab === "Team"} onPress={() => setTab("Team")} />
          <MobileNavItem icon={Activity} label="Stats" active={tab === "Stats"} onPress={() => setTab("Stats")} />
          <MobileNavItem icon={CalendarDays} label="Plan" active={tab === "Planner"} onPress={() => setTab("Planner")} />
          <MobileNavItem icon={Menu} label="More" active={menuOpen} onPress={() => setMenuOpen(true)} />
        </View> : null}
      </View>
      <ModuleMenu visible={menuOpen} onClose={() => setMenuOpen(false)} currentTab={tab} />
    </SafeAreaView>
  );
}

function NavItem({ icon: Icon, label, active, onPress, badge }: { icon: typeof BarChart3; label: string; active: boolean; onPress: () => void; badge?: string }) {
  return <Pressable onPress={onPress} style={[s.navItem, active && s.navItemActive]}><Icon color={active ? INK : "#879089"} size={18} strokeWidth={2.1} /><Text style={[s.navLabel, active && s.navLabelActive]}>{label}</Text>{badge ? <View style={s.liveBadge}><Text style={s.liveBadgeText}>{badge}</Text></View> : null}</Pressable>;
}

function MobileNavItem({ icon: Icon, label, active, onPress }: { icon: typeof BarChart3; label: string; active: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={s.mobileNavItem}><Icon color={active ? DEEP : "#89928c"} size={19} strokeWidth={active ? 2.5 : 2} /><Text style={[s.mobileNavLabel, active && { color: DEEP }]}>{label}</Text></Pressable>;
}

function PageHeader({ eyebrow, title, detail, right }: { eyebrow: string; title: string; detail: string; right?: React.ReactNode }) {
  return <View style={s.pageHeader}><View><Text style={s.eyebrow}>{eyebrow}</Text><Text style={s.pageTitle}>{title}</Text><Text style={s.pageDetail}>{detail}</Text></View>{right}</View>;
}

function SectionHeader({ title, subtitle, action, onAction }: { title: string; subtitle: string; action: string; onAction: () => void }) {
  return <View style={s.sectionHeader}><View><Text style={s.sectionTitle}>{title}</Text><Text style={s.sectionSubtitle}>{subtitle}</Text></View><Pressable onPress={onAction} style={s.sectionAction}><Text style={s.sectionActionText}>{action}</Text><ArrowRight color={DEEP} size={14} /></Pressable></View>;
}

function WhiteboardScreen({ wide, plays, planned, onAddToPractice, onChangePlay }: { wide: boolean; plays: typeof PLAY_LIST; planned: string[]; onAddToPractice: (item: string) => void; onChangePlay: (index: number, diagram: BoardDiagram) => void }) {
  const [selectedPlay, setSelectedPlay] = useState(0);
  const [tool, setTool] = useState<BoardTool>("Select & move");
  const [courtView, setCourtView] = useState<BoardView>("Full court");
  const [orientation, setOrientation] = useState<BoardOrientation>("horizontal");
  const [boardKey, setBoardKey] = useState(0);
  const [animateKey, setAnimateKey] = useState(0);
  const currentPlay = plays[selectedPlay] ?? plays[0]!;
  const diagram = currentPlay.diagram ?? STARTING_FORMATION;
  const vertical = orientation === "vertical";
  const chip = (active: boolean) => ({ minHeight: 44, paddingHorizontal: 12, justifyContent: "center" as const, borderRadius: 10, borderWidth: 1, borderColor: LINE, backgroundColor: active ? DEEP : "#fff" });
  const chipText = (active: boolean) => ({ fontSize: 12, fontWeight: "800" as const, color: active ? "#fff" : INK });
  return <View style={s.page}>
    <PageHeader eyebrow="TACTICAL WORKSPACE" title="Coaching whiteboard" detail="Draw each play, then add it to your practice." right={<Pressable onPress={() => onAddToPractice(currentPlay.name)} style={s.darkButton}><Plus color={GREEN} size={15} /><Text style={s.darkButtonText}>{planned.includes(currentPlay.name) ? "Added to practice" : "Add to practice"}</Text></Pressable>} />
    <View style={s.whiteboardToolbar}><View style={s.whiteboardPlaySelect}><Text style={s.whiteboardLabel}>CURRENT PLAY</Text><View style={s.playPicker}>{plays.map((play, index) => <Pressable key={play.name} onPress={() => { setSelectedPlay(index); setBoardKey((key) => key + 1); }} style={[s.playPickerItem, index === selectedPlay && s.playPickerItemActive]}><Text style={[s.playPickerText, index === selectedPlay && s.playPickerTextActive]}>{play.name}</Text></Pressable>)}</View></View><Pressable accessibilityRole="button" accessibilityLabel="Animate this play" onPress={() => setAnimateKey((key) => key + 1)} style={s.outlineButton}><Play color={INK} size={14} /><Text style={s.outlineButtonText}>Animate</Text></Pressable></View>
    <View style={[s.whiteboardWorkspace, !wide && { flexDirection: "column" }]}>
      <View style={[s.whiteboardStage, !wide && { flexGrow: 0, flexShrink: 0, flexBasis: "auto" }]}><View style={s.boardStageHeader}><View style={s.playTitleBlock}><View style={[s.playIcon, { backgroundColor: "#edfac4" }]}><Crosshair color={DEEP} size={18} /></View><View><Text style={s.playTitle}>{currentPlay.name}</Text><Text style={s.playSubtitle}>{currentPlay.type} · {currentPlay.players} · {currentPlay.time}</Text></View></View><View style={s.boardLiveTag}><View style={s.hintDot} /><Text style={s.boardLiveText}>EDITING</Text></View></View>
        <Text style={s.boardSectionLabel}>COURT VIEW</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>{BOARD_VIEWS.map((view) => <Pressable key={view} accessibilityRole="button" accessibilityLabel={`Show ${view}`} accessibilityState={{ selected: view === courtView }} onPress={() => setCourtView(view)} style={chip(view === courtView)}><Text style={chipText(view === courtView)}>{view}</Text></Pressable>)}<Pressable accessibilityRole="button" accessibilityLabel="Rotate court to vertical" accessibilityState={{ selected: vertical }} onPress={() => setOrientation(vertical ? "horizontal" : "vertical")} style={chip(vertical)}><Text style={chipText(vertical)}>{vertical ? "Vertical court: on" : "Rotate court"}</Text></Pressable></View>
        <Text style={s.boardSectionLabel}>DRAWING TOOLS</Text>
        <View style={{ marginBottom: 12 }}><ToolButtons tool={tool} onSelect={setTool} /></View>
        <PlayBoard key={`${currentPlay.name}-${boardKey}`} diagram={diagram} view={courtView} orientation={orientation} editable actionsAbove tool={tool} onChange={(next) => onChangePlay(selectedPlay, next)} animateKey={animateKey} />
      </View>
      <View style={s.boardControls}><View style={s.boardControlCard}><Text style={s.boardSectionLabel}>PLAY DETAILS</Text><Text style={s.boardDetailLabel}>FORMATION</Text><Text style={s.boardDetailValue}>{currentPlay.type}</Text><Text style={s.boardDetailLabel}>PLAY DURATION</Text><Text style={s.boardDetailValue}>{currentPlay.time}</Text><Text style={s.boardDetailLabel}>PLAYERS</Text><Text style={s.boardDetailValue}>{currentPlay.players}</Text></View>
        <View style={s.boardCoachNote}><ClipboardList color={DEEP} size={16} /><Text style={s.boardCoachText}>Changes save as you draw. Each play keeps its own diagram, and the playbook shows it.</Text></View>
      </View>
    </View>
  </View>;
}

function TeamOverviewStat({ label, value }: { label: string; value: string }) {
  return <View style={s.teamOverviewStat}><Text style={s.teamOverviewStatValue}>{value}</Text><Text style={s.teamOverviewStatLabel}>{label}</Text></View>;
}

function FocusItem({ number, title, subtitle, done }: { number: string; title: string; subtitle: string; done?: boolean }) {
  return <View style={s.focusItem}><View style={[s.focusCheck, done && s.focusCheckDone]}>{done ? <Check color={DEEP} size={13} strokeWidth={3} /> : <Text style={s.focusNumber}>{number}</Text>}</View><View style={{ flex: 1 }}><Text style={s.focusTitle}>{title}</Text><Text style={s.focusSub}>{subtitle}</Text></View></View>;
}

// Court views: the window of the 280 x 150 court that is shown. Front court is the attacking half, back court the defending half.
const COURT_VIEWS = ["Full court", "Front court", "Back court"] as const;
type CourtView = (typeof COURT_VIEWS)[number];
const COURT_WINDOW: Record<CourtView, { x0: number; w: number }> = {
  "Full court": { x0: 0, w: 280 },
  "Front court": { x0: 140, w: 140 },
  "Back court": { x0: 0, w: 140 },
};

function CourtDiagram({ compact = false, large = false, selectedAction = "Move", view = "Full court", animateKey = 0 }: { compact?: boolean; large?: boolean; selectedAction?: string; view?: CourtView; animateKey?: number }) {
  const { x0, w } = COURT_WINDOW[view];
  const starts = [[31, 38], [120, 23], [164, 23], [49, 107], [226, 100]];
  const [moves, setMoves] = useState([0, 0, 0, 0, 0]);
  const destinations = [[49, 55], [140, 44], [224, 14], [99, 90], [226, 55]];
  const positions = moves.map((step, player) => (step === 0 ? starts[player]! : destinations[(step + player) % destinations.length]!));
  function movePlayer(index: number) {
    setMoves((current) => current.map((count, player) => player === index ? (count + 1) % destinations.length : count));
  }
  useEffect(() => {
    if (!animateKey) return;
    let steps = 0;
    const timer = setInterval(() => {
      setMoves((current) => current.map((count) => (count + 1) % destinations.length));
      steps += 1;
      if (steps >= 4) clearInterval(timer);
    }, 700);
    return () => clearInterval(timer);
  }, [animateKey]);
  return <View style={[s.court, compact && s.courtCompact, large && extra.courtLarge, { aspectRatio: w / 150 }]}>
    <Svg viewBox={`${x0} 0 ${w} 150`} preserveAspectRatio="xMidYMid meet" style={StyleSheet.absoluteFill}>
      {/* FIBA court, 28 m x 15 m drawn at 10 units per metre. */}
      <Path d="M0 0 H280 V150 H0 Z M140 0 V150 M0 50.5 H58 V99.5 H0 M280 50.5 H222 V99.5 H280 M58 57 A18 18 0 0 1 58 93 M222 57 A18 18 0 0 0 222 93 M12 66 V84 M268 66 V84 M15.75 62.5 A12.5 12.5 0 0 1 15.75 87.5 M264.25 62.5 A12.5 12.5 0 0 0 264.25 87.5 M0 9 H29.9 A67.5 67.5 0 0 1 29.9 141 H0 M280 9 H250.1 A67.5 67.5 0 0 0 250.1 141 H280" fill="none" stroke="#c4cdc1" strokeWidth="1.4" />
      <Path d="M58 57 A18 18 0 0 0 58 93 M222 57 A18 18 0 0 1 222 93" fill="none" stroke="#c4cdc1" strokeDasharray="3 3" strokeWidth="1.2" />
      <SvgCircle cx="140" cy="75" r="18" fill="none" stroke="#c4cdc1" strokeWidth="1.4" />
      <SvgCircle cx="15.75" cy="75" r="2.25" fill="none" stroke="#e0873f" strokeWidth="1.2" />
      <SvgCircle cx="264.25" cy="75" r="2.25" fill="none" stroke="#e0873f" strokeWidth="1.2" />
      <Path d="M140 44 C165 36 195 24 224 14" fill="none" stroke="#779087" strokeDasharray="5 5" strokeWidth="1.6" />
      <Path d="M224 14 l-6 2 3 5" fill="none" stroke="#779087" strokeWidth="1.6" />
      <Path d="M224 14 C240 22 248 36 246 55" fill="none" stroke="#a0a99f" strokeDasharray="4 4" strokeWidth="1.4" />
      <SvgCircle cx="224" cy="14" r="4" fill="#d7fa58" stroke="#fff" strokeWidth="1.5" />
    </Svg>
    {positions.map(([x, y], index) => x! >= x0 && x! <= x0 + w ? <CourtToken key={index} x={x!} y={y!} x0={x0} w={w} label={String(index + 1)} dark onPress={() => movePlayer(index)} /> : null)}
    <View style={s.ball}><Text style={s.ballLines}>⌁</Text></View>
    {!compact ? <View pointerEvents="none" style={s.courtHint}><View style={s.hintDot} /><Text style={s.courtHintText}>{selectedAction.toUpperCase()} · TAP A PLAYER TO MOVE</Text></View> : null}
  </View>;
}

function CourtToken({ x, y, x0 = 0, w = 280, label, dark, onPress }: { x: number; y: number; x0?: number; w?: number; label: string; dark?: boolean; onPress: () => void }) {
  return <Pressable accessibilityLabel={`Move player ${label} to the next position`} onPress={onPress} style={[s.courtToken, dark && s.courtTokenDark, { left: `${((x - x0) / w) * 100}%`, top: `${y / 1.5}%` }]}><Text style={[s.tokenText, dark && s.tokenTextDark]}>{label}</Text></Pressable>;
}

function Playbook({ wide, query, setQuery, plays, selected, setSelected, onAdd, planned, newPlayName, setNewPlayName, createPlay, deletePlay, drillCount, drills }: { wide: boolean; query: string; setQuery: (value: string) => void; plays: typeof PLAY_LIST; selected: number; setSelected: (value: number) => void; onAdd: () => void; planned: string[]; newPlayName: string; setNewPlayName: (value: string) => void; createPlay: () => void; deletePlay: (index: number) => void; drillCount: number; drills: Drill[] }) {
  const [typeFilter, setTypeFilter] = useState("All categories");
  const [boardView, setBoardView] = useState<BoardView>("Full court");
  const [boardOrientation, setBoardOrientation] = useState<BoardOrientation>("horizontal");
  const [animateKey, setAnimateKey] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [note, setNote] = useState("");
  const playTypes = Array.from(new Set(plays.map((play) => play.type)));
  const filteredPlays = plays.filter((play) => play.name.toLowerCase().includes(query.toLowerCase()) && (typeFilter === "All categories" || play.type === typeFilter));
  const selectedItem = filteredPlays.find((item) => item.name === plays[selected]?.name) ?? filteredPlays[0];
  // Shelf: favourite drills first, then the drill category that suits the selected play.
  const shelfCategory = selectedItem?.type === "DEFENCE" ? "Team Defence" : selectedItem?.type === "PRESS BREAK" ? "Passing" : "Team Offence";
  const shelfDrills = [...drills.filter((drill) => drill.category === shelfCategory)]
    .sort((a, b) => Number(b.favourite) - Number(a.favourite))
    .slice(0, 3)
    .map((drill) => ({ title: drill.name, kind: drill.difficulty.toUpperCase(), focus: drill.coaching_points || drill.category, duration: `${drill.duration_min} min` }));

  async function sharePlay(item: (typeof PLAY_LIST)[number]) {
    try {
      await Share.share({ title: item.name, message: `${item.name} · ${item.type} · ${item.players} · ${item.time}` });
      setNote("Play shared.");
    } catch {
      setNote("Sharing is not available on this device.");
    }
  }

  function removeSelected() {
    if (!selectedItem) return;
    if (plays.length <= 1) { setNote("Keep at least one play in the playbook."); return; }
    if (!confirmDelete) {
      setConfirmDelete(true);
      setNote(`Press Confirm delete to remove ${selectedItem.name}.`);
      return;
    }
    deletePlay(plays.findIndex((play) => play.name === selectedItem.name));
    setConfirmDelete(false);
    setMenuOpen(false);
    setNote(`Deleted ${selectedItem.name}.`);
  }

  return <View style={s.page}>
    <PageHeader eyebrow="THE X'S & O'S" title="Playbook" detail="Your system, organized and game-ready." right={<Pressable onPress={() => setNewPlayName(newPlayName ? "" : "New play")} style={s.darkButton}><Plus color={GREEN} size={16} /><Text style={s.darkButtonText}>Create play</Text></Pressable>} />
    <View style={s.libraryToolbar}><View style={s.searchBox}><Search color="#8b958e" size={17} /><TextInput value={query} onChangeText={setQuery} placeholder="Search plays and sets..." placeholderTextColor="#929b95" style={s.searchInput} /></View><View style={s.libraryCount}><Text style={s.libraryCountText}>{plays.length} PLAYS</Text></View></View>
    <View style={{ maxWidth: 320 }}><Dropdown label="Category" value={typeFilter} options={["All categories", ...playTypes]} onChange={setTypeFilter} /></View>
    {newPlayName ? <View style={extra.newPlayRow as any}><TextInput value={newPlayName === "New play" ? "" : newPlayName} onChangeText={setNewPlayName} placeholder="Name your play..." placeholderTextColor="#929b95" style={extra.newPlayInput as any} autoFocus /><Pressable onPress={createPlay} style={s.darkButton}><Check color={GREEN} size={15} /><Text style={s.darkButtonText}>Save play</Text></Pressable><Pressable onPress={() => setNewPlayName("")} style={s.moreBtn}><X color="#78847c" size={17} /></Pressable></View> : null}
    <View style={[s.playbookLayout, { flexDirection: wide ? "row" : "column" }]}>
      <View style={s.playListPane}>{filteredPlays.length ? filteredPlays.map((item) => {
        const originalIndex = plays.findIndex((p) => p.name === item.name);
        const active = selectedItem?.name === item.name;
        return <Pressable key={item.name} onPress={() => { setSelected(originalIndex); setNote(""); setMenuOpen(false); setConfirmDelete(false); }} style={[s.playListRow, active && s.playListRowActive]}><View style={[s.listPlaySwatch, { backgroundColor: item.color }]}><Crosshair color={DEEP} size={17} /></View><View style={{ flex: 1 }}><Text style={s.listPlayTitle}>{item.name}</Text><Text style={s.listPlayMeta}>{item.type} · {item.time}</Text></View><ChevronRight color={active ? DEEP : "#a1aaa4"} size={16} /></Pressable>;
      }) : <Text style={s.noResults}>No plays match that search.</Text>}
        <Pressable accessibilityRole="button" accessibilityLabel="Open the drill book" onPress={() => router.push("/training")} style={s.drillLibraryRow}><View style={[s.listPlaySwatch, { backgroundColor: "#e7edf0" }]}><Dumbbell color="#526b61" size={17} /></View><View style={{ flex: 1 }}><Text style={s.listPlayTitle}>Drill Library</Text><Text style={s.listPlayMeta}>{drillCount} {drillCount === 1 ? "drill" : "drills"} in the drill book</Text></View><ChevronRight color="#a1aaa4" size={16} /></Pressable>
      </View>
      <View style={s.playDetailPane}>
        {selectedItem ? <>
          <View style={s.detailHeading}><View><View style={s.detailTag}><Text style={s.detailTagText}>{selectedItem.tag}</Text></View><Text style={s.detailTitle}>{selectedItem.name}</Text><Text style={s.detailMeta}>{selectedItem.type} · {selectedItem.players} · {selectedItem.time}</Text></View></View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>{BOARD_VIEWS.map((view) => <Pressable key={view} accessibilityRole="button" accessibilityLabel={`Show ${view}`} accessibilityState={{ selected: view === boardView }} onPress={() => setBoardView(view)} style={[s.playPickerItem, { minHeight: 44, justifyContent: "center" }, view === boardView && s.playPickerItemActive]}><Text style={[s.playPickerText, view === boardView && s.playPickerTextActive]}>{view}</Text></Pressable>)}<Pressable accessibilityRole="button" accessibilityLabel={boardOrientation === "vertical" ? "Rotate court back to horizontal" : "Rotate court to vertical"} accessibilityState={{ selected: boardOrientation === "vertical" }} onPress={() => setBoardOrientation(boardOrientation === "vertical" ? "horizontal" : "vertical")} style={[s.playPickerItem, { minHeight: 44, justifyContent: "center" }, boardOrientation === "vertical" && s.playPickerItemActive]}><Text style={[s.playPickerText, boardOrientation === "vertical" && s.playPickerTextActive]}>{boardOrientation === "vertical" ? "Vertical court: on" : "Rotate court"}</Text></Pressable></View>
          <PlayBoard key={selectedItem.name} diagram={selectedItem.diagram ?? STARTING_FORMATION} view={boardView} orientation={boardOrientation} animateKey={animateKey} />
          <View style={s.playActions}><Pressable onPress={onAdd} style={s.darkButton}><Plus color={GREEN} size={16} /><Text style={s.darkButtonText}>{planned.includes(selectedItem.name) ? "Added to practice" : "Add to practice"}</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Animate ${selectedItem.name}`} onPress={() => setAnimateKey((key) => key + 1)} style={s.outlineButton}><Play color={INK} size={15} /><Text style={s.outlineButtonText}>Animate</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Share ${selectedItem.name}`} onPress={() => sharePlay(selectedItem)} style={s.moreBtn}><Share2 color="#78847c" size={17} /></Pressable><Pressable accessibilityRole="button" accessibilityLabel="More play actions" accessibilityState={{ expanded: menuOpen }} onPress={() => { setMenuOpen((open) => !open); setConfirmDelete(false); }} style={s.moreBtn}><MoreHorizontal color="#78847c" size={19} /></Pressable></View>
          {menuOpen ? <View style={s.playActions}><Pressable accessibilityRole="button" onPress={removeSelected} style={s.outlineButton}><X color="#9b2c2c" size={15} /><Text style={s.outlineButtonText}>{confirmDelete ? `Confirm delete ${selectedItem.name}` : `Delete ${selectedItem.name}`}</Text></Pressable></View> : null}
          {note ? <Text accessibilityLiveRegion="polite" style={s.boardHint}>{note}</Text> : null}
          <View style={s.coachNote}><Text style={s.noteEyebrow}>COACHING POINT</Text><Text style={s.noteText}>{selectedItem.coaching}</Text></View>
        </> : null}
      </View>
    </View>
    <View style={s.drillShelf}><View style={s.drillShelfHeading}><View><Text style={s.sectionTitle}>DRILL LIBRARY</Text><Text style={s.sectionSubtitle}>Purpose-built for the way you play</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Browse the drill book" onPress={() => router.push("/training")} style={s.sectionAction}><Text style={s.sectionActionText}>BROWSE ALL</Text><ArrowRight color={DEEP} size={14} /></Pressable></View><View style={s.drillCards}>{shelfDrills.map((drill, i) => <Pressable accessibilityRole="button" accessibilityLabel={`Open the drill book for ${drill.title}`} key={drill.title} onPress={() => router.push("/training")} style={s.drillCard}><View style={[s.drillCardIcon, { backgroundColor: ["#e7f1ce", "#dcebe5", "#f6e7db"][i] }]}><Dumbbell color={DEEP} size={18} /></View><Text style={s.drillKind}>{drill.kind}</Text><Text style={s.drillCardTitle}>{drill.title}</Text><Text style={s.drillCardMeta}>{drill.focus}</Text><View style={s.drillDuration}><Timer color="#76837b" size={13} /><Text style={s.drillDurationText}>{drill.duration}</Text></View></Pressable>)}</View></View>
  </View>;
}

function StatsScreen({ settings, wide, score, quarter, setQuarter, updateScore, clock, setClock, running, setRunning, resetScore }: { settings: TeamSettings; wide: boolean; score: BoxScore; quarter: number; setQuarter: (q: number) => void; updateScore: (key: keyof BoxScore, amount: number) => void; clock: number; setClock: (value: number) => void; running: boolean; setRunning: (value: boolean) => void; resetScore: () => void }) {
  const clockLabel = `${String(Math.floor(clock / 60)).padStart(2, "0")}:${String(clock % 60).padStart(2, "0")}`;
  return <View style={s.page}>
    <PageHeader eyebrow="GAME NIGHT · LIVE TRACKER" title="Live stats" detail="Log the game as it happens. Box score saves on this device." right={<View style={s.liveStatus}><View style={s.liveDot} /><Text style={s.liveStatusText}>TRACKING</Text></View>} />
    <View style={s.gameScoreCard}><View><Text style={s.scoreTeamLabel}>{(settings.team_name || "Your team").toUpperCase()}</Text><Text style={s.bigScore}>{score.fg * 2 + score.three + score.ft}</Text></View><View style={s.scoreCenter}><Text style={s.scoreVs}>VS</Text><Text style={s.quarterLabel}>QUARTER</Text><View style={s.quarterControl}><Pressable onPress={() => setQuarter(Math.max(1, quarter - 1))} style={s.quarterButton}><Minus color={INK} size={14} /></Pressable><Text style={s.quarterNumber}>Q{quarter}</Text><Pressable onPress={() => setQuarter(Math.min(4, quarter + 1))} style={s.quarterButton}><Plus color={INK} size={14} /></Pressable></View><Pressable onPress={() => { if (!running && clock === 0) setClock(600); setRunning(!running); }}><Text style={s.gameClock}>{clockLabel} {running ? "Ⅱ" : "▶"}</Text></Pressable></View><View style={s.opponentScoreBlock}><Text style={s.scoreTeamLabel}>OPPONENT</Text><Text style={s.bigScore}>0</Text></View></View>
    <View style={[s.statsGrid, !wide && { flexDirection: "column" }]}><View style={s.statGroup}><Text style={s.statGroupTitle}>SHOOTING</Text><StatControl label="Field goals" made={score.fg} attempted={score.fga} madeKey="fg" attemptKey="fga" update={updateScore} /><StatControl label="Three pointers" made={score.three} attempted={score.threeA} madeKey="three" attemptKey="threeA" update={updateScore} /><StatControl label="Free throws" made={score.ft} attempted={score.fta} madeKey="ft" attemptKey="fta" update={updateScore} /></View><View style={s.statGroup}><Text style={s.statGroupTitle}>HUSTLE & FLOW</Text><CounterControl label="Rebounds" value={score.reb} icon={Circle} onChange={(n) => updateScore("reb", n)} /><CounterControl label="Assists" value={score.ast} icon={ArrowRight} onChange={(n) => updateScore("ast", n)} /><CounterControl label="Turnovers" value={score.tov} icon={RotateCcw} onChange={(n) => updateScore("tov", n)} /></View></View>
    <View style={s.statFooter}><Text style={s.statFooterText}>LAST UPDATED JUST NOW · SAVED ON THIS DEVICE</Text><Pressable style={s.resetButton} onPress={resetScore}><RotateCcw color="#77837a" size={14} /><Text style={s.resetText}>Reset game</Text></Pressable></View>
  </View>;
}

function StatControl({ label, made, attempted, madeKey, attemptKey, update }: { label: string; made: number; attempted: number; madeKey: keyof BoxScore; attemptKey: keyof BoxScore; update: (key: keyof BoxScore, amount: number) => void }) {
  return <View style={s.statControl}><View style={{ flex: 1 }}><Text style={s.counterLabel}>{label}</Text><Text style={s.counterPercent}>{attempted ? Math.round((made / attempted) * 100) : 0}%</Text></View><CounterButtons value={`${made}/${attempted}`} onMinus={() => { update(madeKey, -1); update(attemptKey, -1); }} onPlus={() => { update(madeKey, 1); update(attemptKey, 1); }} /><Pressable accessibilityLabel={`Log missed ${label}`} onPress={() => update(attemptKey, 1)} style={s.missButton}><X color="#6e7a72" size={15} /></Pressable></View>;
}

function CounterControl({ label, value, icon: Icon, onChange }: { label: string; value: number; icon: typeof Circle; onChange: (n: number) => void }) {
  return <View style={s.statControl}><View style={s.counterIcon}><Icon color={DEEP} size={15} /></View><Text style={[s.counterLabel, { flex: 1 }]}>{label}</Text><CounterButtons value={`${value}`} onMinus={() => onChange(-1)} onPlus={() => onChange(1)} /></View>;
}

function CounterButtons({ value, onMinus, onPlus }: { value: string; onMinus: () => void; onPlus: () => void }) {
  return <View style={s.counterButtons}><Pressable onPress={onMinus} style={s.stepButton}><Minus color="#69776e" size={14} /></Pressable><Text style={s.counterValue}>{value}</Text><Pressable onPress={onPlus} style={[s.stepButton, s.stepButtonAdd]}><Plus color={DEEP} size={14} /></Pressable></View>;
}

function Planner({ wide, planned, setPlanned, newItem, setNewItem, addItem, running, setRunning, notes, setNotes, dateLabel, roster, teamName }: { wide: boolean; planned: string[]; setPlanned: (items: string[]) => void; newItem: string; setNewItem: (value: string) => void; addItem: (value?: string) => void; running: boolean; setRunning: (value: boolean) => void; notes: string; setNotes: (value: string) => void; dateLabel: string; roster: TeamPlayer[]; teamName: string }) {
  const [checked, setChecked] = useState<string[]>([]);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [clearArmed, setClearArmed] = useState(false);
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [planName, setPlanName] = useState("");
  const [planStatus, setPlanStatus] = useState("");
  const [deletePlanId, setDeletePlanId] = useState<string | null>(null);
  useEffect(() => { readSavedPlans().then(setSavedPlans).catch(() => {}); }, []);
  const savePlan = () => {
    if (planned.length === 0) { setPlanStatus("Add at least one block before saving."); return; }
    const name = planName.trim() || `Practice ${dateLabel}`;
    const plan: SavedPlan = { id: String(Date.now()), name, items: planned, notes, saved_at: new Date().toISOString() };
    const next = [plan, ...savedPlans];
    setSavedPlans(next);
    writeSavedPlans(next).catch(() => {});
    setPlanName("");
    setPlanStatus(`Saved ${name}.`);
  };
  const loadPlan = (plan: SavedPlan) => {
    setPlanned(plan.items);
    setNotes(plan.notes);
    setDeletePlanId(null);
    setPlanStatus(`Loaded ${plan.name}. The agenda was replaced.`);
  };
  const deletePlan = (id: string) => {
    if (deletePlanId !== id) { setDeletePlanId(id); return; }
    const next = savedPlans.filter((p) => p.id !== id);
    setSavedPlans(next);
    writeSavedPlans(next).catch(() => {});
    setDeletePlanId(null);
    setPlanStatus("Deleted the saved plan.");
  };
  const savePanel = <View style={s.asideCard}>
    <View style={s.asideHeader}><ClipboardList color={DEEP} size={18} /><Text style={s.asideTitle}>SAVED PLANS</Text></View>
    <Text style={{ color: "#55605a", fontSize: 13, marginBottom: 6 }}>Name this plan</Text>
    <TextInput value={planName} onChangeText={setPlanName} placeholder={`Practice ${dateLabel}`} placeholderTextColor="#929b95" accessibilityLabel="Plan name" style={{ minHeight: 44, borderWidth: 1, borderColor: "#dce2da", borderRadius: 8, paddingHorizontal: 12, color: INK, backgroundColor: "#fff" }} />
    <Pressable accessibilityRole="button" onPress={savePlan} style={[s.darkButton, { marginTop: 10, minHeight: 44 }]}><Text style={s.darkButtonText}>Save this plan</Text></Pressable>
    {planStatus ? <Text accessibilityRole="alert" style={{ color: DEEP, fontSize: 13, fontWeight: "700", marginTop: 8 }}>{planStatus}</Text> : null}
    {savedPlans.length === 0 ? <Text style={{ color: "#55605a", fontSize: 13, marginTop: 10 }}>No saved plans yet. Build a session, then save it here.</Text> : savedPlans.map((plan) => <View key={plan.id} style={{ borderTopWidth: 1, borderTopColor: "#eff1ed", paddingTop: 10, marginTop: 10, gap: 6 }}>
      <Text style={{ color: INK, fontWeight: "700" }}>{plan.name}</Text>
      <Text style={{ color: "#55605a", fontSize: 12 }}>{`${plan.items.length} blocks · saved ${new Date(plan.saved_at).toLocaleDateString()}`}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Load ${plan.name}`} onPress={() => loadPlan(plan)} style={[s.outlineButton, { minHeight: 44 }]}><Text style={s.outlineButtonText}>Load</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={deletePlanId === plan.id ? `Confirm delete ${plan.name}` : `Delete ${plan.name}`} onPress={() => deletePlan(plan.id)} style={[s.outlineButton, { minHeight: 44 }]}><Text style={{ color: "#a11d1d", fontWeight: "700" }}>{deletePlanId === plan.id ? "Confirm delete" : "Delete"}</Text></Pressable>
      </View>
    </View>)}
  </View>;
  const attending = roster.filter((player) => (player.availability ?? "Available") !== "Out").length;
  const attendancePct = roster.length ? (attending / roster.length) * 100 : 0;
  const attendanceNote = roster.length === 0 ? "No players on the roster yet." : attending === roster.length ? "Everyone is available." : `${roster.length - attending} unavailable. Check the roster.`;
  const totalMinutes = planned.reduce((sum, item) => sum + (DRILLS.find((drill) => drill.title === item)?.duration.split(" ")[0] === "12" ? 12 : item === "Dynamic warm-up" ? 8 : 10), 0);
  return <View style={s.page}>
    <PageHeader eyebrow={dateLabel} title="Practice planner" detail="Build a focused session. Keep every minute intentional." right={<Pressable onPress={() => setRunning(!running)} style={s.darkButton}>{running ? <Pause color={GREEN} size={16} /> : <Play color={GREEN} size={15} fill={GREEN} />}<Text style={s.darkButtonText}>{running ? "Pause practice" : "Start practice"}</Text></Pressable>} />
    <View style={s.practiceSummary}><View style={s.summaryIcon}><CalendarDays color={DEEP} size={20} /></View><View style={{ flex: 1 }}><Text style={s.summaryTitle}>{teamName || "Your team"} · Practice session</Text><Text style={s.summaryMeta}>{`${roster.length} on the roster`}</Text></View><View style={s.totalTime}><Text style={s.totalTimeNum}>{totalMinutes}</Text><Text style={s.totalTimeLabel}>MIN TOTAL</Text></View></View>
    <View style={[s.plannerLayout, !wide && { flexDirection: "column" }]}>
      <View style={s.agendaColumn}><View style={s.agendaHeading}><View><Text style={s.sectionTitle}>SESSION AGENDA</Text><Text style={s.sectionSubtitle}>Drag to reorder your blocks</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Options" accessibilityState={{ expanded: optionsOpen }} onPress={() => { setOptionsOpen((v) => !v); setClearArmed(false); }} style={s.outlineButton}><MoreHorizontal color={INK} size={17} /><Text style={s.outlineButtonText}>Options</Text></Pressable></View>
        {optionsOpen ? (
          <View style={{ padding: 12, borderRadius: 10, borderWidth: 1, borderColor: LINE, backgroundColor: "#fff", gap: 8 }}>
            <Text style={{ color: "#55605a", fontSize: 13 }}>{planned.length} blocks in this session.</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={clearArmed ? "Confirm clear agenda" : "Clear agenda"}
              disabled={planned.length === 0}
              onPress={() => {
                if (!clearArmed) { setClearArmed(true); return; }
                setPlanned([]);
                setClearArmed(false);
                setOptionsOpen(false);
              }}
              style={{ minHeight: 44, justifyContent: "center", paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: "#dce2da", opacity: planned.length === 0 ? 0.5 : 1 }}
            >
              <Text style={{ color: "#a11d1d", fontWeight: "700" }}>{clearArmed ? "Confirm clear agenda" : "Clear agenda"}</Text>
            </Pressable>
          </View>
        ) : null}
        {planned.map((item, index) => <View key={`${item}-${index}`} style={s.agendaRow}><Text style={s.agendaTime}>{`${String(3 + Math.floor((30 + index * 10) / 60)).padStart(2, "0")}:${String((30 + index * 10) % 60).padStart(2, "0")}`}</Text><View style={[s.agendaRail, index === planned.length - 1 && s.agendaRailLast]}><View style={[s.agendaNode, checked.includes(item) && s.agendaNodeDone]}>{checked.includes(item) ? <Check color={DEEP} size={12} /> : <Text style={s.agendaNodeNum}>{String(index + 1).padStart(2, "0")}</Text>}</View></View><Pressable onPress={() => setChecked(checked.includes(item) ? checked.filter((x) => x !== item) : [...checked, item])} style={[s.agendaCard, checked.includes(item) && s.agendaCardDone]}><View style={{ flex: 1 }}><Text style={[s.agendaTitle, checked.includes(item) && s.agendaTitleDone]}>{item}</Text><Text style={s.agendaMeta}>{DRILLS.find((drill) => drill.title === item)?.focus ?? (item.includes("Horns") ? "Walk-through · offensive sets" : "Movement prep · activation")}</Text></View><View style={s.agendaDuration}><Clock3 color="#7e8b82" size={13} /><Text style={s.agendaDurationText}>{DRILLS.find((drill) => drill.title === item)?.duration ?? "10 min"}</Text></View><Pressable onPress={() => setPlanned(planned.filter((_, i) => i !== index))} style={s.removePlan}><X color="#9aa39c" size={15} /></Pressable></Pressable></View>)}
        <View style={s.addAgendaRow}><View style={s.agendaTime} /><View style={s.agendaRailLast}><View style={s.addNode}><Plus color={DEEP} size={14} /></View></View><View style={s.addAgendaInput}><TextInput value={newItem} onChangeText={setNewItem} onSubmitEditing={() => addItem()} placeholder="Add a block to your practice..." placeholderTextColor="#939d96" style={s.agendaTextInput} returnKeyType="done" /><Pressable onPress={() => addItem()} style={s.agendaAddButton}><Text style={s.agendaAddText}>ADD</Text></Pressable></View></View>
      </View>
      <View style={s.plannerAside}>{savePanel}<View style={s.asideCard}><View style={s.asideHeader}><ClipboardList color={DEEP} size={18} /><Text style={s.asideTitle}>COACH'S NOTES</Text></View><TextInput value={notes} onChangeText={setNotes} multiline placeholder="What does the team need to hear today?" placeholderTextColor="#929b95" style={s.notesInput} /></View><View style={s.asideCard}><View style={s.asideHeader}><Users color={DEEP} size={18} /><Text style={s.asideTitle}>ATTENDANCE</Text><Text style={s.attendanceCount}>{`${attending} / ${roster.length}`}</Text></View><View style={s.attendanceBar}><View style={[s.attendanceFill, { width: `${attendancePct}%` }]} /></View><Text style={s.attendanceNote}>{attendanceNote}</Text></View><View style={s.timerCard}><View style={s.timerRing}><Timer color={GREEN} size={20} /></View><Text style={s.timerTitle}>PRACTICE TIMER</Text><Text style={s.timerValue}>{running ? "IN PROGRESS" : "00:00"}</Text><Text style={s.timerCaption}>{running ? "SESSION IN PROGRESS" : "READY WHEN YOU ARE"}</Text><Pressable onPress={() => setRunning(!running)} style={s.timerButton}>{running ? <Pause color={INK} size={14} /> : <Play color={INK} size={14} fill={INK} />}<Text style={s.timerButtonText}>{running ? "PAUSE TIMER" : "START TIMER"}</Text></Pressable></View></View>
    </View>
  </View>;
}

const extra = StyleSheet.create({
  newPlayRow: { minHeight: 52, flexDirection: "row", alignItems: "center", gap: 9, padding: 8, marginBottom: 12, borderRadius: 8, backgroundColor: "#fff", borderWidth: 1, borderColor: LINE },
  newPlayInput: { flex: 1, color: INK, fontSize: 11, padding: 9, outlineStyle: "none" } as any,
  courtLarge: { marginTop: 0 },
  whiteboardToolbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 13 },
  whiteboardPlaySelect: { flex: 1 }, whiteboardLabel: { color: "#7b887e", fontSize: 7, letterSpacing: 0.75, fontWeight: "900", marginBottom: 6 },
  playPicker: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }, playPickerItem: { paddingHorizontal: 9, paddingVertical: 7, backgroundColor: "#fff", borderWidth: 1, borderColor: LINE, borderRadius: 6 }, playPickerItemActive: { backgroundColor: DEEP, borderColor: DEEP }, playPickerText: { color: "#59665d", fontSize: 8, fontWeight: "700" }, playPickerTextActive: { color: "#fff" },
  whiteboardWorkspace: { flexDirection: "row", alignItems: "flex-start", gap: 13 }, whiteboardStage: { flex: 1.7, minWidth: 0, backgroundColor: "#fff", borderRadius: 10, borderWidth: 1, borderColor: LINE, padding: 14 }, boardStageHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }, boardLiveTag: { backgroundColor: "#edf5e5", borderRadius: 5, flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 7, paddingVertical: 5 }, boardLiveText: { color: DEEP, fontSize: 7, fontWeight: "900", letterSpacing: 0.6 }, fullCourtWrap: { padding: 10, borderRadius: 8, backgroundColor: "#f8f9f6" }, boardLegend: { minHeight: 27, flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 8 }, legendEntry: { flexDirection: "row", alignItems: "center", gap: 5 }, legendOffense: { width: 9, height: 9, borderRadius: 5, backgroundColor: DEEP }, legendBall: { width: 9, height: 9, borderRadius: 5, backgroundColor: "#f4a76b", borderWidth: 1, borderColor: "#d27746" }, boardHint: { flex: 1, textAlign: "right", color: "#839087", fontSize: 8 },
  boardControls: { flex: 0.85, minWidth: 195, gap: 10 }, boardControlCard: { padding: 12, borderRadius: 9, backgroundColor: "#fff", borderWidth: 1, borderColor: LINE, gap: 3 }, boardSectionLabel: { color: "#7d8980", fontSize: 8, fontWeight: "900", letterSpacing: 0.75, marginBottom: 7 }, toolOption: { minHeight: 36, paddingHorizontal: 7, borderRadius: 7, flexDirection: "row", alignItems: "center", gap: 8 }, toolOptionActive: { backgroundColor: "#edf5e5" }, toolNumber: { width: 21, height: 21, borderRadius: 6, backgroundColor: "#f1f3ef", alignItems: "center", justifyContent: "center" }, toolNumberActive: { backgroundColor: GREEN }, toolNumberText: { color: "#77847b", fontSize: 8, fontWeight: "900" }, toolNumberTextActive: { color: DEEP }, toolText: { flex: 1, color: "#59665d", fontSize: 9, fontWeight: "700" }, toolTextActive: { color: DEEP, fontWeight: "900" }, boardDetailLabel: { color: "#8b958e", fontSize: 7, fontWeight: "900", letterSpacing: 0.65, marginTop: 8 }, boardDetailValue: { color: INK, fontSize: 9, fontWeight: "800", marginTop: 3 }, boardCoachNote: { padding: 11, borderRadius: 8, backgroundColor: "#edf3e8", flexDirection: "row", alignItems: "flex-start", gap: 8 }, boardCoachText: { flex: 1, color: "#627167", fontSize: 8, lineHeight: 13 },
  rosterBadge: { backgroundColor: "#e9f1e4", borderRadius: 6, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 9, paddingVertical: 7 },
  rosterBadgeText: { color: DEEP, fontSize: 8, letterSpacing: 0.65, fontWeight: "900" },
  teamOverview: { minHeight: 94, backgroundColor: DEEP, borderRadius: 11, paddingHorizontal: 18, paddingVertical: 15, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16 },
  teamOverviewIdentity: { flexDirection: "row", alignItems: "center", gap: 11 },
  teamOverviewIcon: { width: 43, height: 43, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
  teamOverviewName: { color: "#f5f9f4", fontSize: 15, fontWeight: "900" }, teamOverviewMeta: { color: "#b0c1b5", fontSize: 9, marginTop: 5 },
  teamOverviewStats: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", gap: 12 },
  teamOverviewStat: { alignItems: "center", minWidth: 48 }, teamOverviewStatValue: { color: GREEN, fontSize: 16, fontWeight: "900" }, teamOverviewStatLabel: { color: "#aec0b3", fontSize: 7, fontWeight: "900", letterSpacing: 0.55, marginTop: 4 }, teamOverviewDivider: { width: 1, height: 26, backgroundColor: "rgba(255,255,255,0.16)" },
  rosterToolbar: { marginTop: 16, marginBottom: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }, rosterToolbarHint: { color: "#849087", fontSize: 8, fontWeight: "900", letterSpacing: 0.8 },
  rosterLayout: { flexDirection: "row", gap: 15, alignItems: "flex-start" }, rosterListCard: { flex: 1.65, minWidth: 0, backgroundColor: "#fff", borderWidth: 1, borderColor: LINE, borderRadius: 10, paddingHorizontal: 13, paddingTop: 12 },
  rosterListHeader: { minHeight: 37, flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }, rosterListTitle: { color: INK, fontSize: 9, fontWeight: "900", letterSpacing: 0.8 }, rosterListCount: { color: "#8b958e", fontSize: 8, fontWeight: "700" }, rosterTableDescription: { color: "#89938b", fontSize: 8, marginTop: 4 },
  tableHeaderRow: { minHeight: 30, borderTopWidth: 1, borderBottomWidth: 1, borderColor: LINE, backgroundColor: "#f5f7f3", flexDirection: "row", alignItems: "center" }, tableHeaderCell: { color: "#77847b", fontSize: 7, fontWeight: "900", letterSpacing: 0.7 }, numberColumn: { width: 82 }, nameColumn: { flex: 1 }, actionColumn: { width: 60 }, phoneColumn: { width: 132 }, addressColumn: { flex: 1.3, minWidth: 160 },
  rosterTableRow: { minHeight: 44, borderBottomWidth: 1, borderBottomColor: "#eff1ed", flexDirection: "row", alignItems: "center" }, contactRow: { minHeight: 48 }, numberCell: { paddingLeft: 13 }, nameCell: { paddingHorizontal: 8 }, actionCell: { alignItems: "center", justifyContent: "center" }, contactInput: { height: 34, borderWidth: 1, borderColor: "#e9ece7", borderRadius: 6, marginHorizontal: 4, paddingHorizontal: 7, color: INK, fontSize: 8, outlineStyle: "none" } as any, additionalDetailsHeader: { minHeight: 53, marginTop: 13, flexDirection: "row", alignItems: "center", borderTopWidth: 1, borderTopColor: LINE },
  rosterJersey: { width: 31, height: 29, borderRadius: 7, backgroundColor: DEEP, alignItems: "center", justifyContent: "center" }, rosterJerseyText: { color: GREEN, fontSize: 10, fontWeight: "900" }, rosterPlayerName: { color: INK, fontSize: 9, fontWeight: "800" }, removePlayer: { width: 27, height: 27, alignItems: "center", justifyContent: "center", borderRadius: 6, backgroundColor: "#f6f7f4" }, rosterEmpty: { minHeight: 100, alignItems: "center", justifyContent: "center", gap: 8 }, rosterEmptyText: { color: "#8a948d", fontSize: 10 },
  rosterAside: { flex: 0.9, minWidth: 205, gap: 10 }, addPlayerCard: { backgroundColor: "#fff", borderWidth: 1, borderColor: LINE, borderRadius: 10, padding: 13 }, addPlayerHeading: { flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 14 }, addPlayerIcon: { width: 31, height: 31, borderRadius: 8, backgroundColor: GREEN, alignItems: "center", justifyContent: "center" }, addPlayerTitle: { color: INK, fontSize: 10, fontWeight: "900" }, addPlayerSubtitle: { color: "#8a948d", fontSize: 8, marginTop: 3 }, addFieldLabel: { color: "#7b887e", fontSize: 7, fontWeight: "900", letterSpacing: 0.7, marginTop: 8, marginBottom: 5 }, addPlayerInput: { height: 35, borderColor: LINE, borderWidth: 1, borderRadius: 7, paddingHorizontal: 9, color: INK, fontSize: 9, outlineStyle: "none" } as any,
  rosterTip: { backgroundColor: "#eaf1e5", borderRadius: 9, padding: 12, flexDirection: "row", alignItems: "flex-start", gap: 9 }, rosterTipTitle: { color: DEEP, fontSize: 8, fontWeight: "900", letterSpacing: 0.6 }, rosterTipText: { color: "#68776c", fontSize: 8, lineHeight: 13, marginTop: 5 },
});

const s = StyleSheet.create({
  ...extra,
  safe: { flex: 1, backgroundColor: BG }, app: { flex: 1, backgroundColor: BG }, topbar: { height: 68, backgroundColor: "#fff", borderBottomColor: LINE, borderBottomWidth: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 25 }, brandRow: { flexDirection: "row", alignItems: "center", gap: 10 }, brandMark: { width: 31, height: 31, borderRadius: 10, backgroundColor: GREEN, alignItems: "center", justifyContent: "center" }, brand: { color: INK, fontSize: 14, letterSpacing: 1.3, fontWeight: "900" }, brandLight: { color: "#8a948c", fontWeight: "700" }, topActions: { flexDirection: "row", alignItems: "center", gap: 14 }, seasonPill: { backgroundColor: "#f5f7f2", borderRadius: 99, paddingHorizontal: 11, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 7 }, greenDot: { height: 7, width: 7, borderRadius: 4, backgroundColor: "#79a447" }, seasonText: { fontSize: 9, color: "#53635a", letterSpacing: 0.7, fontWeight: "800" }, coachAvatar: { height: 34, width: 34, borderRadius: 18, backgroundColor: DEEP, justifyContent: "center", alignItems: "center" }, avatarText: { color: GREEN, fontSize: 11, fontWeight: "900" }, body: { flex: 1, flexDirection: "row" }, bodyWide: { maxWidth: 1440, width: "100%", alignSelf: "center" }, sidebar: { width: 216, backgroundColor: "#fff", borderRightWidth: 1, borderRightColor: LINE, paddingHorizontal: 14, paddingTop: 29, paddingBottom: 18, justifyContent: "space-between" }, sidebarMobile: { display: "none" }, navCaption: { color: "#a2aaa4", fontSize: 9, fontWeight: "800", letterSpacing: 1.3, paddingLeft: 11, marginBottom: 12 }, navGroup: { gap: 4 }, navItem: { minHeight: 43, borderRadius: 9, paddingHorizontal: 11, flexDirection: "row", alignItems: "center", gap: 11 }, navItemActive: { backgroundColor: "#edf5e3" }, navLabel: { color: "#758078", fontSize: 12, fontWeight: "600", flex: 1 }, navLabelActive: { color: DEEP, fontWeight: "800" }, liveBadge: { backgroundColor: "#fff0ec", borderRadius: 4, paddingHorizontal: 5, paddingVertical: 3 }, liveBadgeText: { color: "#bd563f", fontSize: 7, fontWeight: "900", letterSpacing: 0.6 }, sidebarBottom: { gap: 18 }, teamCard: { borderTopWidth: 1, borderTopColor: LINE, paddingTop: 17, paddingHorizontal: 3, flexDirection: "row", alignItems: "center", gap: 9 }, teamIcon: { width: 31, height: 31, borderRadius: 9, backgroundColor: DEEP, alignItems: "center", justifyContent: "center" }, teamName: { color: INK, fontSize: 10, fontWeight: "800" }, teamMeta: { color: MUTED, fontSize: 9, marginTop: 3 }, settingsLink: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 9 }, settingsText: { color: "#7d8780", fontSize: 11, fontWeight: "600" }, mainScroll: { paddingHorizontal: 30, paddingTop: 29, paddingBottom: 42, width: "100%", maxWidth: 1190, alignSelf: "center" }, page: { width: "100%" }, pageHeader: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 22 }, eyebrow: { color: "#728075", fontSize: 9, letterSpacing: 1.45, fontWeight: "800" }, pageTitle: { color: INK, fontSize: 29, lineHeight: 36, fontWeight: "800", letterSpacing: -0.9, marginTop: 4 }, pageDetail: { color: "#818a83", fontSize: 12, marginTop: 3 }, outlineButton: { height: 36, paddingHorizontal: 12, borderRadius: 8, borderColor: "#dce2da", borderWidth: 1, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 7 }, outlineButtonText: { color: INK, fontSize: 10, fontWeight: "800" }, darkButton: { height: 37, paddingHorizontal: 13, borderRadius: 8, backgroundColor: DEEP, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 7 }, darkButtonText: { color: "#fff", fontSize: 10, fontWeight: "800" }, gameBanner: { borderRadius: 12, backgroundColor: DEEP, paddingHorizontal: 21, paddingTop: 15, paddingBottom: 13, overflow: "hidden" }, gameTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, upcomingPill: { backgroundColor: "rgba(216,252,88,0.14)", borderRadius: 5, paddingHorizontal: 8, paddingVertical: 5, flexDirection: "row", alignItems: "center", gap: 6 }, bannerDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: GREEN }, upcomingText: { color: GREEN, fontSize: 8, fontWeight: "900", letterSpacing: 1 }, matchupRow: { paddingVertical: 18, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 15 }, matchTeam: { flex: 1, maxWidth: 280, flexDirection: "row", alignItems: "center", gap: 11 }, awayTeam: { flexDirection: "row-reverse", justifyContent: "flex-start" }, wolvesBadge: { height: 39, width: 39, backgroundColor: "rgba(255,255,255,0.11)", borderRadius: 10, alignItems: "center", justifyContent: "center" }, opponentBadge: { height: 39, width: 39, backgroundColor: "#ecbd8f", borderRadius: 10, alignItems: "center", justifyContent: "center" }, opponentInitial: { color: "#452f22", fontSize: 19, fontWeight: "900" }, matchTeamName: { color: "#f1f7f1", fontSize: 12, fontWeight: "900", letterSpacing: 0.6 }, matchTeamSub: { color: "#9eb1a5", fontSize: 9, marginTop: 4, letterSpacing: 0.5, fontWeight: "700" }, vsBlock: { alignItems: "center", paddingHorizontal: 10 }, vsText: { color: "#89a092", fontSize: 10, letterSpacing: 1.4, fontWeight: "900" }, gameTime: { color: GREEN, fontSize: 12, fontWeight: "900", marginTop: 6 }, bannerFooter: { minHeight: 32, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.13)", paddingTop: 11, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, bannerInfo: { flexDirection: "row", alignItems: "center", gap: 7 }, bannerInfoText: { color: "#b5c6bb", fontSize: 9, fontWeight: "600" }, bannerSeparator: { width: 3, height: 3, borderRadius: 2, backgroundColor: "#80988a", marginHorizontal: 4 }, gamePrep: { flexDirection: "row", alignItems: "center", gap: 8 }, gamePrepText: { color: GREEN, fontSize: 8, fontWeight: "900", letterSpacing: 0.8 }, statStrip: { marginTop: 13, paddingVertical: 12, paddingHorizontal: 15, minHeight: 85, backgroundColor: "#fff", borderColor: LINE, borderWidth: 1, borderRadius: 10, flexDirection: "row", justifyContent: "space-around", alignItems: "center" }, statStripWrap: { flexWrap: "wrap", gap: 12 }, miniStat: { flex: 1, minWidth: 110, paddingHorizontal: 11 }, miniStatTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, miniLabel: { color: "#8b958e", fontSize: 8, fontWeight: "900", letterSpacing: 0.9 }, miniValue: { color: INK, fontSize: 21, lineHeight: 24, fontWeight: "800", letterSpacing: -0.6, marginTop: 5 }, miniTrend: { color: "#819088", fontSize: 9, marginTop: 2 }, statDivider: { width: 1, height: 41, backgroundColor: LINE }, dashboardGrid: { flexDirection: "row", gap: 22, marginTop: 25 }, dashboardGridStack: { flexDirection: "column", gap: 20 }, columnMain: { flex: 1.55, minWidth: 0 }, columnSide: { flex: 1, minWidth: 230 }, sectionHeader: { minHeight: 42, marginBottom: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, sectionTitle: { color: INK, fontSize: 10, letterSpacing: 0.75, fontWeight: "900" }, sectionSubtitle: { color: "#89928b", fontSize: 10, marginTop: 3 }, sectionAction: { flexDirection: "row", alignItems: "center", gap: 6 }, sectionActionText: { color: DEEP, fontSize: 8, fontWeight: "900", letterSpacing: 0.7 }, whiteboardCard: { backgroundColor: "#fff", borderRadius: 11, borderWidth: 1, borderColor: LINE, padding: 14 }, cardTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, playTitleBlock: { flexDirection: "row", alignItems: "center", gap: 9 }, playIcon: { width: 32, height: 32, borderRadius: 9, alignItems: "center", justifyContent: "center" }, playTitle: { color: INK, fontSize: 13, fontWeight: "800" }, playSubtitle: { color: "#929b94", fontSize: 8, fontWeight: "800", marginTop: 4, letterSpacing: 0.55 }, moreBtn: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: "#f6f7f3" }, court: { aspectRatio: 280 / 150, backgroundColor: "#f8f9f6", borderRadius: 8, overflow: "hidden", marginTop: 12, position: "relative" }, courtCompact: { marginTop: 0 }, courtToken: { position: "absolute", width: 23, height: 23, borderRadius: 13, backgroundColor: "#d8fc58", borderWidth: 2, borderColor: "#fff", alignItems: "center", justifyContent: "center", transform: [{ translateX: -11 }, { translateY: -11 }] }, courtTokenDark: { backgroundColor: DEEP }, tokenText: { color: DEEP, fontSize: 9, fontWeight: "900" }, tokenTextDark: { color: "#fff" }, ball: { position: "absolute", left: "75%", top: "10%", width: 12, height: 12, borderRadius: 7, borderWidth: 1, borderColor: "#d27746", backgroundColor: "#f4a76b", alignItems: "center", justifyContent: "center" }, ballLines: { color: "#ab6338", fontSize: 10, lineHeight: 11, transform: [{ rotate: "35deg" }] }, courtHint: { position: "absolute", bottom: 8, right: 9, flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.8)", paddingHorizontal: 7, paddingVertical: 4, borderRadius: 4 }, hintDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#779087" }, courtHintText: { color: "#718077", fontSize: 7, fontWeight: "900", letterSpacing: 0.7 }, playCardFooter: { marginTop: 11, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, playMeta: { flexDirection: "row", alignItems: "center", gap: 6 }, playMetaText: { color: "#7f8982", fontSize: 9, fontWeight: "600" }, metaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: "#a2aaa4", marginHorizontal: 2 }, runPlayButton: { height: 30, borderRadius: 7, backgroundColor: GREEN, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 6 }, runPlayText: { color: INK, fontSize: 8, fontWeight: "900", letterSpacing: 0.65 }, focusCard: { backgroundColor: "#fff", borderRadius: 11, borderWidth: 1, borderColor: LINE, paddingHorizontal: 13, paddingTop: 8 }, focusItem: { minHeight: 58, borderBottomWidth: 1, borderBottomColor: "#eff1ed", flexDirection: "row", alignItems: "center", gap: 10 }, focusCheck: { width: 23, height: 23, borderRadius: 7, borderWidth: 1, borderColor: "#dce2da", alignItems: "center", justifyContent: "center" }, focusCheckDone: { backgroundColor: GREEN, borderColor: GREEN }, focusNumber: { color: "#99a29b", fontSize: 8, fontWeight: "900" }, focusTitle: { color: "#334239", fontSize: 10, fontWeight: "800" }, focusSub: { color: "#89938b", fontSize: 9, marginTop: 3 }, focusFooter: { height: 35, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, focusFooterText: { color: "#869189", fontSize: 8, letterSpacing: 0.7, fontWeight: "800" }, drillCallout: { marginTop: 11, padding: 12, borderRadius: 10, backgroundColor: "#eaf1e5", flexDirection: "row", alignItems: "center", gap: 10 }, drillIcon: { width: 33, height: 33, backgroundColor: "#d8e9cf", borderRadius: 9, justifyContent: "center", alignItems: "center" }, drillEyebrow: { color: "#7c8e7a", fontSize: 7, fontWeight: "900", letterSpacing: 1 }, drillName: { color: INK, fontSize: 10, fontWeight: "800", marginTop: 3 }, drillMeta: { color: "#7c8a7f", fontSize: 8, fontWeight: "700", marginTop: 3 }, livePreview: { marginTop: 19, minHeight: 53, backgroundColor: "#fff", borderWidth: 1, borderColor: LINE, borderRadius: 9, flexDirection: "row", alignItems: "center", paddingHorizontal: 14 }, livePreviewLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 7 }, liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#ef795f" }, livePreviewTitle: { color: INK, fontSize: 8, fontWeight: "900", letterSpacing: 0.75 }, livePreviewMeta: { color: "#919a93", fontSize: 9, marginLeft: 3 }, livePreviewStats: { flexDirection: "row", alignItems: "center", gap: 7, marginRight: 14 }, liveScore: { color: DEEP, fontSize: 11, fontWeight: "900" }, liveScoreLabel: { color: "#8b958e", fontSize: 8, marginRight: 8 }, scoreArrow: { width: 28, height: 28, backgroundColor: GREEN, borderRadius: 7, alignItems: "center", justifyContent: "center" }, mobileNav: { height: 59, paddingBottom: 4, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: LINE, flexDirection: "row", justifyContent: "space-around", alignItems: "center" }, mobileNavItem: { minWidth: 55, alignItems: "center", justifyContent: "center", gap: 4 }, mobileNavLabel: { color: "#869089", fontSize: 8, fontWeight: "700" }, libraryToolbar: { minHeight: 43, flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 16 }, searchBox: { height: 37, flex: 1, borderRadius: 8, borderWidth: 1, borderColor: LINE, backgroundColor: "#fff", flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 11 }, searchInput: { flex: 1, padding: 0, color: INK, fontSize: 10, outlineStyle: "none" } as any, filterButton: { height: 37, borderRadius: 8, borderColor: LINE, borderWidth: 1, backgroundColor: "#fff", paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 7 }, filterText: { color: "#536158", fontSize: 9, fontWeight: "700" }, libraryCount: { paddingHorizontal: 9, paddingVertical: 8, borderRadius: 6, backgroundColor: "#e9eee6" }, libraryCountText: { color: "#718075", fontSize: 8, fontWeight: "900", letterSpacing: 0.7 }, playbookLayout: { gap: 13 }, playListPane: { flex: 0.82, minWidth: 190, backgroundColor: "#fff", borderWidth: 1, borderColor: LINE, borderRadius: 10, padding: 8 }, playListRow: { minHeight: 59, paddingHorizontal: 8, borderRadius: 8, flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 3 }, playListRowActive: { backgroundColor: "#f0f5e9" }, listPlaySwatch: { width: 31, height: 31, borderRadius: 8, alignItems: "center", justifyContent: "center" }, listPlayTitle: { color: INK, fontSize: 10, fontWeight: "800" }, listPlayMeta: { color: "#8d9790", fontSize: 8, marginTop: 4, letterSpacing: 0.3 }, drillLibraryRow: { minHeight: 59, paddingHorizontal: 8, borderTopWidth: 1, borderTopColor: LINE, flexDirection: "row", alignItems: "center", gap: 9 }, noResults: { padding: 18, color: MUTED, fontSize: 11 }, playDetailPane: { flex: 1.7, minWidth: 0, backgroundColor: "#fff", borderWidth: 1, borderColor: LINE, borderRadius: 10, padding: 14 }, detailHeading: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 11 }, detailTag: { alignSelf: "flex-start", backgroundColor: "#eff5e5", borderRadius: 4, paddingHorizontal: 6, paddingVertical: 4 }, detailTagText: { color: "#617245", fontSize: 7, fontWeight: "900", letterSpacing: 0.7 }, detailTitle: { color: INK, fontSize: 17, fontWeight: "900", marginTop: 6 }, detailMeta: { color: "#828d85", fontSize: 9, marginTop: 4 }, playActions: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 11 }, coachNote: { marginTop: 13, padding: 11, backgroundColor: "#f5f7f1", borderRadius: 7 }, noteEyebrow: { color: "#7d8980", fontSize: 7, letterSpacing: 0.8, fontWeight: "900" }, noteText: { color: "#59675d", fontSize: 9, lineHeight: 15, marginTop: 5 }, drillShelf: { marginTop: 23 }, drillShelfHeading: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }, drillCards: { flexDirection: "row", gap: 10 }, drillCard: { flex: 1, minWidth: 120, backgroundColor: "#fff", borderColor: LINE, borderWidth: 1, borderRadius: 9, padding: 12 }, drillCardIcon: { width: 31, height: 31, borderRadius: 8, alignItems: "center", justifyContent: "center", marginBottom: 10 }, drillKind: { color: "#849087", fontSize: 7, fontWeight: "900", letterSpacing: 0.7 }, drillCardTitle: { color: INK, fontSize: 10, fontWeight: "800", marginTop: 4 }, drillCardMeta: { color: "#8c958f", fontSize: 8, marginTop: 4 }, drillDuration: { flexDirection: "row", gap: 5, alignItems: "center", marginTop: 11 }, drillDurationText: { color: "#76837a", fontSize: 8, fontWeight: "700" }, liveStatus: { borderRadius: 6, backgroundColor: "#fff0ec", flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 9, paddingVertical: 7 }, liveStatusText: { color: "#b55641", fontSize: 8, fontWeight: "900", letterSpacing: 0.7 }, gameScoreCard: { backgroundColor: DEEP, borderRadius: 12, minHeight: 150, flexDirection: "row", justifyContent: "space-around", alignItems: "center", paddingVertical: 19 }, scoreTeamLabel: { color: "#b8cabd", fontSize: 8, fontWeight: "900", letterSpacing: 1 }, bigScore: { color: "#fff", fontSize: 41, lineHeight: 49, fontWeight: "900", letterSpacing: -1 }, scoreCenter: { alignItems: "center", minWidth: 94 }, scoreVs: { color: "#95a99c", fontSize: 8, letterSpacing: 1.5, fontWeight: "900" }, quarterLabel: { color: "#a4b9aa", fontSize: 7, fontWeight: "800", letterSpacing: 1, marginTop: 5 }, quarterControl: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }, quarterButton: { width: 22, height: 22, borderRadius: 6, backgroundColor: "rgba(255,255,255,.14)", alignItems: "center", justifyContent: "center" }, quarterNumber: { color: GREEN, fontSize: 10, fontWeight: "900" }, gameClock: { color: "#fff", fontSize: 17, fontWeight: "800", marginTop: 6 }, opponentScoreBlock: { alignItems: "flex-end" }, statsGrid: { flexDirection: "row", gap: 15, marginTop: 18 }, statGroup: { flex: 1, minWidth: 0, backgroundColor: "#fff", borderWidth: 1, borderColor: LINE, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13 }, statGroupTitle: { color: "#7d8980", fontSize: 8, fontWeight: "900", letterSpacing: 1, marginBottom: 4 }, statControl: { minHeight: 58, flexDirection: "row", alignItems: "center", borderBottomColor: "#eff1ed", borderBottomWidth: 1, gap: 8 }, counterLabel: { color: "#34443a", fontSize: 10, fontWeight: "700" }, counterPercent: { color: "#8a968c", fontSize: 8, marginTop: 3 }, counterButtons: { minHeight: 30, flexDirection: "row", alignItems: "center", backgroundColor: "#f4f6f2", borderRadius: 7, padding: 3, gap: 8 }, stepButton: { width: 24, height: 24, borderRadius: 5, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" }, stepButtonAdd: { backgroundColor: GREEN }, counterValue: { minWidth: 31, textAlign: "center", color: INK, fontSize: 11, fontWeight: "900" }, missButton: { width: 25, height: 25, borderRadius: 6, alignItems: "center", justifyContent: "center", backgroundColor: "#f6f7f4" }, counterIcon: { width: 26, height: 26, borderRadius: 7, backgroundColor: "#edf3e8", alignItems: "center", justifyContent: "center" }, statFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 13 }, statFooterText: { color: "#929c94", fontSize: 8, fontWeight: "800", letterSpacing: 0.65 }, resetButton: { flexDirection: "row", alignItems: "center", gap: 6, padding: 7 }, resetText: { color: "#77837a", fontSize: 9, fontWeight: "700" }, practiceSummary: { minHeight: 67, paddingHorizontal: 15, backgroundColor: "#eaf2e4", borderRadius: 10, flexDirection: "row", alignItems: "center", gap: 11 }, summaryIcon: { width: 36, height: 36, borderRadius: 9, backgroundColor: "#d6e9c9", alignItems: "center", justifyContent: "center" }, summaryTitle: { color: INK, fontSize: 11, fontWeight: "800" }, summaryMeta: { color: "#78877c", fontSize: 9, marginTop: 4 }, totalTime: { alignItems: "center", paddingHorizontal: 6 }, totalTimeNum: { color: DEEP, fontSize: 18, fontWeight: "900" }, totalTimeLabel: { color: "#77877b", fontSize: 7, letterSpacing: 0.7, fontWeight: "900" }, plannerLayout: { flexDirection: "row", gap: 18, marginTop: 18 }, agendaColumn: { flex: 1.7, minWidth: 0 }, agendaRow: { minHeight: 65, flexDirection: "row", alignItems: "stretch" }, agendaHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 11 }, addAgendaRow: { minHeight: 65, flexDirection: "row", alignItems: "stretch" }, agendaTime: { width: 47, paddingTop: 16, color: "#819087", fontSize: 8, fontWeight: "800" }, agendaRail: { width: 24, borderLeftColor: "#dbe3d9", borderLeftWidth: 1, alignItems: "center", justifyContent: "flex-start", paddingTop: 13 }, agendaRailLast: { width: 24, borderLeftColor: "#dbe3d9", borderLeftWidth: 1, alignItems: "center", justifyContent: "flex-start", paddingTop: 13 }, agendaNode: { marginLeft: -1, width: 22, height: 22, borderRadius: 11, borderWidth: 1, borderColor: "#dce3d9", backgroundColor: BG, alignItems: "center", justifyContent: "center" }, agendaNodeDone: { borderColor: GREEN, backgroundColor: GREEN }, agendaNodeNum: { color: "#7e8b81", fontSize: 7, fontWeight: "900" }, agendaCard: { flex: 1, minHeight: 52, marginBottom: 9, paddingHorizontal: 11, borderRadius: 8, borderWidth: 1, borderColor: LINE, backgroundColor: "#fff", flexDirection: "row", alignItems: "center", gap: 8 }, agendaCardDone: { backgroundColor: "#f4f7ef" }, agendaTitle: { color: INK, fontSize: 10, fontWeight: "800" }, agendaTitleDone: { textDecorationLine: "line-through", color: "#7b897d" }, agendaMeta: { color: "#8c968f", fontSize: 8, marginTop: 4 }, agendaDuration: { flexDirection: "row", alignItems: "center", gap: 4 }, agendaDurationText: { color: "#7d8981", fontSize: 8, fontWeight: "700" }, removePlan: { padding: 4 }, addNode: { marginLeft: -1, width: 22, height: 22, borderRadius: 11, borderWidth: 1, borderColor: "#cedec4", backgroundColor: "#e9f2e3", alignItems: "center", justifyContent: "center" }, addAgendaInput: { flex: 1, height: 41, marginBottom: 12, borderRadius: 8, borderColor: LINE, borderWidth: 1, backgroundColor: "#fff", flexDirection: "row", alignItems: "center", paddingHorizontal: 10 }, agendaTextInput: { flex: 1, color: INK, fontSize: 9, paddingVertical: 7, outlineStyle: "none" } as any, agendaAddButton: { backgroundColor: "#edf5e4", borderRadius: 5, paddingHorizontal: 8, paddingVertical: 6 }, agendaAddText: { color: DEEP, fontSize: 8, fontWeight: "900" }, recommendedRow: { minHeight: 38, borderRadius: 7, paddingHorizontal: 9, backgroundColor: "#f0f4e9", flexDirection: "row", alignItems: "center", gap: 8 }, recommendedText: { flex: 1, color: "#61734b", fontSize: 8, fontWeight: "600" }, plannerAside: { flex: 0.9, minWidth: 195, gap: 10 }, asideCard: { backgroundColor: "#fff", borderColor: LINE, borderWidth: 1, borderRadius: 9, padding: 12 }, asideHeader: { flexDirection: "row", alignItems: "center", gap: 7 }, asideTitle: { color: INK, fontSize: 8, fontWeight: "900", letterSpacing: 0.7, flex: 1 }, notesInput: { minHeight: 78, marginTop: 10, textAlignVertical: "top", color: INK, fontSize: 9, lineHeight: 14, outlineStyle: "none" } as any, attendanceCount: { color: DEEP, fontSize: 9, fontWeight: "900" }, attendanceBar: { height: 5, backgroundColor: "#edf0ea", borderRadius: 4, marginTop: 12, overflow: "hidden" }, attendanceFill: { width: "92%", height: 5, borderRadius: 4, backgroundColor: "#86a96a" }, attendanceNote: { color: "#8c968f", fontSize: 8, marginTop: 7 }, timerCard: { padding: 13, alignItems: "center", borderRadius: 9, backgroundColor: DEEP }, timerRing: { width: 37, height: 37, borderRadius: 19, backgroundColor: "rgba(216,252,88,.13)", alignItems: "center", justifyContent: "center" }, timerTitle: { color: "#bfd0c4", fontSize: 7, fontWeight: "900", letterSpacing: 1, marginTop: 9 }, timerValue: { color: "#fff", fontSize: 26, fontWeight: "800", marginTop: 2 }, timerCaption: { color: "#9aafa1", fontSize: 7, fontWeight: "800", letterSpacing: 0.7, marginTop: 1 }, timerButton: { width: "100%", height: 30, borderRadius: 6, backgroundColor: GREEN, marginTop: 10, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }, timerButtonText: { color: INK, fontSize: 8, fontWeight: "900", letterSpacing: 0.7 },
} as any);
