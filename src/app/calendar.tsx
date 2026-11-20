import { Link, router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Menu from "lucide-react-native/dist/esm/icons/menu.mjs";
import { Dropdown } from "@/components/portal/dropdown";
import { ModuleMenu } from "@/components/portal/module-menu";
import { Button, Empty, Field, Header, Screen, Section, Status, palette, styles as ui } from "@/components/portal/ui";
import { GAMES_KEY, VENUES, formatGameDate, localDateKey, toDisplayDate, type Game } from "@/lib/games";
import {
  CALENDAR_KEY,
  EVENT_TYPES,
  EXAMPLE_CALENDAR_CSV,
  calendarToCsv,
  linkFor,
  emptyEventDraft,
  formatDayLabel,
  monthGrid,
  normalizeClock,
  planCalendarImport,
  readDate,
  sortItems,
  timeRange,
  toItems,
  type CalendarEvent,
  type CalendarItem,
  type EventDraft,
  type EventType,
} from "@/lib/calendar";
import { decodeDataUrlText } from "@/lib/csv";
import { downloadFile } from "@/lib/download";
import { pickDocumentFile } from "@/lib/uploads";
import { useLocalCollection } from "@/lib/store";

const FILTERS = ["All", ...EVENT_TYPES] as const;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarScreen() {
  const events = useLocalCollection<CalendarEvent>(CALENDAR_KEY);
  const games = useLocalCollection<Game>(GAMES_KEY);

  const today = localDateKey(new Date());
  const [monthStart, setMonthStart] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState(today);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");

  const [draft, setDraft] = useState<EventDraft>({ ...emptyEventDraft, date: toDisplayDate(today) });
  const [venue, setVenue] = useState<string>(VENUES[0]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CalendarItem | null>(null);
  const [confirmKey, setConfirmKey] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const [ioOpen, setIoOpen] = useState(false);
  const [ioText, setIoText] = useState("");
  const [ioStatus, setIoStatus] = useState("");

  const allItems = useMemo(() => toItems(events.items, games.items), [events.items, games.items]);
  const visible = useMemo(
    () => (filter === "All" ? allItems : allItems.filter((item) => item.type === filter)),
    [allItems, filter],
  );
  const dayItems = useMemo(() => visible.filter((item) => item.date === selectedDay), [visible, selectedDay]);
  const upcoming = useMemo(() => sortItems(visible.filter((item) => item.date >= today)).slice(0, 12), [visible, today]);
  const countByDay = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of visible) counts[item.date] = (counts[item.date] ?? 0) + 1;
    return counts;
  }, [visible]);

  const weeks = useMemo(() => monthGrid(monthStart.getFullYear(), monthStart.getMonth()), [monthStart]);
  const monthLabel = monthStart.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const shiftMonth = (delta: number) => {
    setMonthStart(new Date(monthStart.getFullYear(), monthStart.getMonth() + delta, 1));
    setConfirmKey(null);
  };

  const set = (key: keyof EventDraft) => (value: string) => setDraft((d) => ({ ...d, [key]: value }));

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    setDraft({ ...emptyEventDraft, date: toDisplayDate(selectedDay) });
    setVenue(VENUES[0]);
  };

  const openNew = () => {
    setEditing(null);
    setDraft({ ...emptyEventDraft, date: toDisplayDate(selectedDay) });
    setVenue(VENUES[0]);
    setFormOpen(true);
    setMessage("Enter the new calendar item below.");
  };

  const startEdit = (item: CalendarItem) => {
    setEditing(item);
    setDraft({
      date: toDisplayDate(item.date),
      start: item.start,
      end: item.end,
      type: item.type,
      title: item.title,
      location: item.location,
      notes: item.notes,
    });
    setVenue(item.venue || VENUES[0]);
    setFormOpen(true);
    setConfirmKey(null);
    setMessage(`Editing ${item.title}.`);
  };

  const removeItem = (item: CalendarItem) => {
    if (item.source === "game") games.remove(item.id);
    else events.remove(item.id);
  };

  const save = () => {
    const date = readDate(draft.date);
    const title = draft.title.trim();
    const start = normalizeClock(draft.start);
    const end = normalizeClock(draft.end);
    if (!date) {
      setMessage("Enter the date as dd-mm-yyyy, for example 21-11-2026.");
      return;
    }
    if (!title) {
      setMessage(draft.type === "Game" ? "Enter the opponent's name before saving." : "Enter a title before saving.");
      return;
    }
    if (start === null || end === null) {
      setMessage("Enter times like 6:30 PM or 18:30, or leave them blank for all day.");
      return;
    }
    const cleaned = { ...draft, date, title, start, end, location: draft.location.trim(), notes: draft.notes.trim() };
    const isGame = draft.type === "Game";

    if (editing && (editing.source === "game") !== isGame) {
      // Type moved between games and other events: remove the old record, then add the new one.
      removeItem(editing);
    }

    if (isGame) {
      const gameFields = { date, time: start, opponent: title, venue, location: cleaned.location, notes: cleaned.notes };
      if (editing && editing.source === "game" && isGame) games.update(editing.id, gameFields);
      else games.create(gameFields);
      setMessage(`Saved the game against ${title} on ${formatDayLabel(date)}.`);
    } else {
      const eventFields = { ...cleaned, type: draft.type as EventType };
      if (editing && editing.source === "event") events.update(editing.id, eventFields);
      else events.create(eventFields);
      setMessage(`Saved ${title} on ${formatDayLabel(date)}.`);
    }
    setSelectedDay(date);
    const [y, m] = date.split("-").map(Number);
    setMonthStart(new Date(y!, m! - 1, 1));
    closeForm();
  };

  const exportCsv = () => {
    const today = localDateKey(new Date());
    if (downloadFile(`calendar-${today}.csv`, "text/csv", calendarToCsv(allItems))) {
      setIoStatus(`Downloaded ${allItems.length} calendar items as CSV.`);
      return;
    }
    setIoStatus("CSV download works in the browser version. Sharing on a phone is not set up yet.");
  };

  const chooseCsv = async () => {
    try {
      const file = await pickDocumentFile();
      if (!file) return;
      setIoText(decodeDataUrlText(file.data));
      setIoStatus(`Loaded ${file.name}. Check the text, then press Import calendar.`);
    } catch (error) {
      setIoStatus(error instanceof Error ? error.message : "That file could not be opened.");
    }
  };

  const runImport = () => {
    if (!ioText.trim()) {
      setIoStatus("Paste CSV text or choose a file first.");
      return;
    }
    const plan = planCalendarImport(ioText, events.items, games.items);
    for (const change of plan.changes) {
      if (change.target === "event") {
        if (change.kind === "create") events.create(change.draft as Omit<CalendarEvent, "id" | "created_at" | "updated_at">);
        else events.update(change.id, change.draft);
      } else if (change.kind === "create") {
        games.create(change.draft);
      } else {
        games.update(change.id, change.draft);
      }
    }
    const skipped = plan.skipped.length;
    const first = plan.skipped[0] ? ` First problem: ${plan.skipped[0]}` : "";
    setIoStatus(`Added ${plan.created}, updated ${plan.updated}, skipped ${skipped} rows.${first}`);
    if (plan.changes.length > 0) setIoText("");
  };

  const count = allItems.length;

  return (
    <Screen>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 48 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginTop: 16 }}>
          <Link href="/" accessibilityRole="link" style={{ color: palette.deep, fontWeight: "600", fontSize: 15 }}>
            Back to home
          </Link>
          <Pressable accessibilityRole="button" accessibilityLabel="Open module menu" onPress={() => setMenuOpen(true)} style={{ minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" }}>
            <Menu color={palette.ink} size={22} />
          </Pressable>
        </View>
        <Header title="Calendar" detail="Practices, games, tournaments, meetings, team activities and social events in one place." />
        <Status message={message} />

        <Section title="Add to calendar">
          <View style={ui.actions}>
            <Button label="Add calendar item" onPress={openNew} />
          </View>
          {formOpen ? (
            <>
              <Dropdown label="Type" value={draft.type} options={[...EVENT_TYPES]} onChange={(type) => setDraft((d) => ({ ...d, type: type as EventType }))} />
              <Field label="Date" hint="dd-mm-yyyy, for example 21-11-2026" value={draft.date} onChangeText={set("date")} autoCapitalize="none" />
              <Field label="Start time (optional)" hint="For example 6:30 PM or 18:30. Leave blank for all day." value={draft.start} onChangeText={set("start")} />
              <Field label="End time (optional)" hint="For example 8:00 PM" value={draft.end} onChangeText={set("end")} />
              <Field
                label={draft.type === "Game" ? "Opponent" : "Title"}
                value={draft.title}
                onChangeText={set("title")}
              />
              {draft.type === "Game" ? (
                <Dropdown label="Venue" value={venue} options={[...VENUES]} onChange={setVenue} />
              ) : null}
              <Field label="Location (optional)" value={draft.location} onChangeText={set("location")} />
              <Field label="Notes (optional)" value={draft.notes} onChangeText={set("notes")} multiline />
              <View style={ui.actions}>
                <Button label={editing ? "Save changes" : "Save calendar item"} onPress={save} />
                <Button label="Cancel" variant="secondary" onPress={closeForm} />
              </View>
            </>
          ) : null}
        </Section>

        <Section title="Month">
          <View style={ui.actions}>
            <Button label="Previous month" variant="secondary" onPress={() => shiftMonth(-1)} />
            <Button label="Next month" variant="secondary" onPress={() => shiftMonth(1)} />
          </View>
          <Text style={ui.name} accessibilityLiveRegion="polite">{monthLabel}</Text>
          <View style={{ flexDirection: "row" }}>
            {WEEKDAYS.map((day) => (
              <Text key={day} style={{ flex: 1, textAlign: "center", color: palette.muted, fontSize: 12, fontWeight: "600" }}>{day}</Text>
            ))}
          </View>
          {weeks.map((week, wi) => (
            <View key={wi} style={{ flexDirection: "row" }}>
              {week.map((day, di) => {
                if (!day) return <View key={di} style={{ flex: 1, minHeight: 44 }} />;
                const dayNumber = Number(day.slice(8));
                const n = countByDay[day] ?? 0;
                const selected = day === selectedDay;
                return (
                  <Pressable
                    key={day}
                    accessibilityRole="button"
                    accessibilityLabel={`${formatDayLabel(day)}, ${n} ${n === 1 ? "item" : "items"}`}
                    accessibilityState={{ selected }}
                    onPress={() => {
                      setSelectedDay(day);
                      setConfirmKey(null);
                    }}
                    style={{
                      flex: 1,
                      minHeight: 44,
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 8,
                      margin: 1,
                      backgroundColor: selected ? palette.deep : day === today ? palette.accent : "transparent",
                    }}
                  >
                    <Text style={{ fontWeight: "600", color: selected ? palette.onDeep : palette.ink }}>{dayNumber}</Text>
                    <Text style={{ fontSize: 11, color: selected ? palette.onDeep : palette.muted }}>{n > 0 ? `${n}` : " "}</Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </Section>

        <Section title="Filter">
          <Dropdown label="Show" value={filter} options={[...FILTERS]} onChange={(value) => setFilter(value as (typeof FILTERS)[number])} />
        </Section>

        <Section title={formatDayLabel(selectedDay)}>
          {dayItems.length === 0 ? (
            <Empty text="Nothing scheduled this day." />
          ) : (
            dayItems.map((item) => <ItemRow key={item.key} item={item} confirming={confirmKey === item.key} onEdit={() => startEdit(item)} onDelete={() => {
              if (confirmKey !== item.key) {
                setConfirmKey(item.key);
                setMessage(`Press Confirm delete to remove ${item.title}.`);
                return;
              }
              removeItem(item);
              setConfirmKey(null);
              setMessage(`Deleted ${item.title}.`);
            }} />)
          )}
        </Section>

        <Section title="Coming up">
          {upcoming.length === 0 ? (
            <Empty text="No upcoming items. Add practices, games or events above." />
          ) : (
            upcoming.map((item) => (
              <View key={item.key} style={{ gap: 2, paddingTop: 10, borderTopWidth: 1, borderTopColor: palette.line }}>
                <Text style={ui.meta}>{item.date === today ? "Today" : formatGameDate(item.date, "")}</Text>
                <Text style={ui.name}>{item.title}</Text>
                <Text style={ui.meta}>{`${item.type} · ${timeRange(item)}`}</Text>
                <View style={ui.actions}>
                  <Button label={linkFor(item.type).label} variant="secondary" onPress={() => openCalendarItem(item.type)} />
                </View>
              </View>
            ))
          )}
        </Section>

        <Section title="Import and export">
          <Button label={ioOpen ? "Hide import and export" : "Show import and export"} variant="secondary" onPress={() => setIoOpen((o) => !o)} />
          {ioOpen ? (
            <>
              <Text style={ui.meta}>
                Columns: date, start, end, type, title, location, venue, notes. Type must be one of Practice, Game, Tournament, Meeting, Team activity or Social event. Venue (Home or Away) applies to games. Rows that match an existing item by date, start time, title and type are updated; others are added.
              </Text>
              <Text style={ui.meta}>{`${count} items on the calendar.`}</Text>
              <View style={ui.actions}>
                <Button label="Download CSV" variant="secondary" onPress={exportCsv} disabled={count === 0} />
                <Button label="Use example CSV" variant="secondary" onPress={() => { setIoText(EXAMPLE_CALENDAR_CSV); setIoStatus("Example loaded. Press Import calendar to add it."); }} />
              </View>
              <Button label="Choose CSV file" variant="secondary" onPress={chooseCsv} />
              <Field label="Or paste CSV text" value={ioText} onChangeText={setIoText} multiline />
              <Button label="Import calendar" onPress={runImport} />
              <Status message={ioStatus} />
            </>
          ) : null}
        </Section>
      </ScrollView>
      <ModuleMenu visible={menuOpen} onClose={() => setMenuOpen(false)} currentPath="/calendar" />
    </Screen>
  );
}

// Opens the screen that matches a calendar item: game schedule, practice plan or announcements on Home.
function openCalendarItem(type: EventType) {
  const { route } = linkFor(type);
  if ("path" in route) router.push(route.path);
  else router.push({ pathname: "/", params: { tab: route.tab, t: String(Date.now()) } });
}

function ItemRow({ item, confirming, onEdit, onDelete }: { item: CalendarItem; confirming: boolean; onEdit: () => void; onDelete: () => void }) {
  return (
    <View style={{ gap: 6, paddingTop: 12, borderTopWidth: 1, borderTopColor: palette.line }}>
      <Text style={ui.name}>{item.type === "Game" ? `${item.venue === "Away" ? "At" : "vs"} ${item.title}` : item.title}</Text>
      <Text style={ui.meta}>{`${item.type} · ${timeRange(item)}`}</Text>
      {item.location ? <Text style={ui.meta}>{item.location}</Text> : null}
      {item.notes ? <Text style={ui.meta}>{item.notes}</Text> : null}
      <View style={ui.actions}>
        <Button label={linkFor(item.type).label} variant="secondary" onPress={() => openCalendarItem(item.type)} />
        <Button label={`Edit ${item.title}`} variant="secondary" onPress={onEdit} />
        <Button label={confirming ? "Confirm delete" : `Delete ${item.title}`} variant="danger" onPress={onDelete} />
      </View>
    </View>
  );
}
