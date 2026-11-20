import { Link } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Menu from "lucide-react-native/dist/esm/icons/menu.mjs";
import { Dropdown } from "@/components/portal/dropdown";
import { ModuleMenu } from "@/components/portal/module-menu";
import { Button, Empty, Field, Header, Screen, Section, Status, palette, styles as ui } from "@/components/portal/ui";
import { GAMES_KEY, VENUES, emptyGameDraft, formatGameDate, localDateKey, readDate, toDisplayDate, type Game, type GameDraft } from "@/lib/games";
import { useLocalCollection } from "@/lib/store";

export default function GamesScreen() {
  const games = useLocalCollection<Game>(GAMES_KEY);
  const [draft, setDraft] = useState<GameDraft>(emptyGameDraft);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const today = localDateKey(new Date());
  const sorted = useMemo(
    () => [...games.items].sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)),
    [games.items],
  );

  const set = (key: keyof GameDraft) => (value: string) => setDraft((d) => ({ ...d, [key]: value }));

  const closeForm = () => {
    setDraft(emptyGameDraft);
    setEditingId(null);
    setFormOpen(false);
  };

  const openNew = () => {
    setDraft(emptyGameDraft);
    setEditingId(null);
    setFormOpen(true);
    setMessage("Enter the new game below.");
  };

  const startEdit = (game: Game) => {
    const { id: _id, created_at: _c, updated_at: _u, ...fields } = game;
    setDraft({ ...fields, date: toDisplayDate(game.date) });
    setEditingId(game.id);
    setFormOpen(true);
    setConfirmId(null);
    setMessage(`Editing the game against ${game.opponent}.`);
  };

  const save = () => {
    const date = readDate(draft.date);
    const opponent = draft.opponent.trim();
    if (!date) {
      setMessage("Enter the date as dd-mm-yyyy, for example 21-11-2026.");
      return;
    }
    if (!opponent) {
      setMessage("Enter the opponent's name before saving.");
      return;
    }
    const clean = { ...draft, date, opponent, time: draft.time.trim(), location: draft.location.trim(), notes: draft.notes.trim() };
    if (editingId) {
      games.update(editingId, clean);
      setMessage(`Saved changes to the game against ${opponent}.`);
    } else {
      games.create(clean);
      setMessage(`Added the game against ${opponent}.`);
    }
    closeForm();
  };

  const remove = (game: Game) => {
    if (confirmId !== game.id) {
      setConfirmId(game.id);
      setMessage(`Press Confirm delete to remove the game against ${game.opponent}.`);
      return;
    }
    games.remove(game.id);
    if (editingId === game.id) closeForm();
    setConfirmId(null);
    setMessage(`Deleted the game against ${game.opponent}.`);
  };

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
        <Header title="Games" detail="The season schedule. The next upcoming game shows on Home." />
        <Status message={message} />

        <Section title={editingId ? "Edit game" : "New game"}>
          <View style={ui.actions}>
            <Button label="Add game" onPress={openNew} />
          </View>
          {formOpen ? (
            <>
              <Field label="Date" hint="dd-mm-yyyy, for example 21-11-2026" value={draft.date} onChangeText={set("date")} autoCapitalize="none" />
              <Field label="Time" hint="For example 6:30 PM" value={draft.time} onChangeText={set("time")} />
              <Field label="Opponent" value={draft.opponent} onChangeText={set("opponent")} />
              <Dropdown label="Venue" value={draft.venue} options={[...VENUES]} onChange={(venue) => setDraft((d) => ({ ...d, venue }))} />
              <Field label="Location (optional)" hint="Gym or court name and address" value={draft.location} onChangeText={set("location")} />
              <Field label="Notes (optional)" value={draft.notes} onChangeText={set("notes")} multiline />
              <View style={ui.actions}>
                <Button label={editingId ? "Save changes" : "Save game"} onPress={save} />
                <Button label="Cancel" variant="secondary" onPress={closeForm} />
              </View>
            </>
          ) : (
            <Text style={ui.meta}>Tap Add game to schedule a game. Existing games are listed below.</Text>
          )}
        </Section>

        <Section title={`Schedule (${sorted.length})`}>
          {sorted.length === 0 ? (
            <Empty text="No games scheduled yet. Tap Add game to enter the first one." />
          ) : (
            sorted.map((game) => {
              const played = game.date < today;
              return (
                <View key={game.id} style={{ gap: 6, paddingTop: 12, borderTopWidth: 1, borderTopColor: palette.line }}>
                  <Text style={ui.name}>{`${game.venue === "Away" ? "At" : "vs"} ${game.opponent}`}</Text>
                  <Text style={ui.meta}>{[formatGameDate(game.date, game.time), played ? "Past" : "Upcoming"].join(" · ")}</Text>
                  {game.location ? <Text style={ui.meta}>{game.location}</Text> : null}
                  {game.notes ? <Text style={ui.meta}>{game.notes}</Text> : null}
                  <View style={ui.actions}>
                    <Button label={`Edit game against ${game.opponent}`} variant="secondary" onPress={() => startEdit(game)} />
                    <Button
                      label={confirmId === game.id ? "Confirm delete" : `Delete game against ${game.opponent}`}
                      variant="danger"
                      onPress={() => remove(game)}
                    />
                  </View>
                </View>
              );
            })
          )}
        </Section>
      </ScrollView>
      <ModuleMenu visible={menuOpen} onClose={() => setMenuOpen(false)} currentPath="/games" />
    </Screen>
  );
}
