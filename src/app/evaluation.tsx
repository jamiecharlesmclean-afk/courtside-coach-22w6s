// Player evaluation: rate each player on the skills from 1 to 5, and save the results on this device.
import { Link } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Menu from "lucide-react-native/dist/esm/icons/menu.mjs";
import { Dropdown } from "@/components/portal/dropdown";
import { ModuleMenu } from "@/components/portal/module-menu";
import { Button, Field, Header, Screen, Section, Status, palette } from "@/components/portal/ui";
import { localDateKey, readDate, toDisplayDate } from "@/lib/games";
import { cleanRatings, EVALUATIONS_KEY, SKILL_CATEGORIES, scoreRatings, type EvaluationRecord } from "@/lib/evaluation-format";
import { fullName, isRosterPlayer, normalizePlayer, sortByJersey, type PlayerProfile } from "@/lib/roster";
import { useLocalCollection } from "@/lib/store";

// The roster is stored under this key by the Team screen.
const ROSTER_KEY = "courtside-coach:team-roster";
const SCALE = [1, 2, 3, 4, 5];

function displayName(player: PlayerProfile): string {
  return player.name || fullName(player.first_name, player.last_name);
}

function overallText(ratings: Record<string, number>): string {
  const { overall } = scoreRatings(ratings);
  return overall === null ? "Not rated" : `${overall}% overall`;
}

function RatingButton({ value, selected, skillName, onPress }: { value: number; selected: boolean; skillName: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${skillName}: rate ${value} of 5`}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        minWidth: 44,
        minHeight: 44,
        flex: 1,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: selected ? palette.deep : palette.line,
        backgroundColor: selected ? palette.deep : "#fff",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: selected ? "#fff" : palette.ink, fontWeight: "700", fontSize: 15 }}>{value}</Text>
    </Pressable>
  );
}

export default function EvaluationScreen() {
  const evaluations = useLocalCollection<EvaluationRecord>(EVALUATIONS_KEY);
  const [players, setPlayers] = useState<PlayerProfile[]>([]);
  const [playerId, setPlayerId] = useState("");
  const [dateText, setDateText] = useState(() => toDisplayDate(localDateKey(new Date())));
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ROSTER_KEY)
      .then((raw) => {
        const rows: Partial<PlayerProfile>[] = raw ? JSON.parse(raw) : [];
        setPlayers(sortByJersey(rows.map((row, index) => normalizePlayer(row, index)).filter(isRosterPlayer)));
      })
      .catch(() => setPlayers([]));
  }, []);

  const playerOptions = players.map((player) => ({ id: player.id, label: `${displayName(player)} (#${player.number || "-"})` }));
  const selectedLabel = playerOptions.find((option) => option.id === playerId)?.label ?? "Choose a player";
  const evaluatedOn = readDate(dateText);
  const score = useMemo(() => scoreRatings(ratings), [ratings]);
  const saved = useMemo(
    () => [...evaluations.items].sort((a, b) => b.evaluated_on.localeCompare(a.evaluated_on) || b.created_at.localeCompare(a.created_at)),
    [evaluations.items],
  );

  const setRating = (skillId: string, value: number) => {
    setRatings((prev) => {
      const next = { ...prev };
      if (next[skillId] === value) delete next[skillId];
      else next[skillId] = value;
      return next;
    });
    setMessage("");
  };

  const resetForm = () => {
    setEditingId(null);
    setPlayerId("");
    setRatings({});
    setNotes("");
    setDateText(toDisplayDate(localDateKey(new Date())));
    setConfirmId(null);
  };

  const save = () => {
    const player = players.find((p) => p.id === playerId);
    if (!player) {
      setMessage("Choose a player first.");
      return;
    }
    if (!evaluatedOn) {
      setMessage("Type the date as dd-mm-yyyy, for example 18-11-2026.");
      return;
    }
    if (score.rated === 0) {
      setMessage("Rate at least one skill before saving.");
      return;
    }
    const payload = {
      player_id: player.id,
      player_name: displayName(player),
      evaluated_on: evaluatedOn,
      ratings: cleanRatings(ratings),
      notes: notes.trim(),
    };
    const wasEditing = editingId !== null;
    if (editingId) evaluations.update(editingId, payload);
    else evaluations.create(payload);
    resetForm();
    setMessage(wasEditing ? "Evaluation updated on this device." : "Evaluation saved on this device.");
  };

  const edit = (row: EvaluationRecord) => {
    setEditingId(row.id);
    setPlayerId(row.player_id);
    setDateText(toDisplayDate(row.evaluated_on));
    setRatings({ ...row.ratings });
    setNotes(row.notes);
    setConfirmId(null);
    setMessage(`Editing ${row.player_name}, ${toDisplayDate(row.evaluated_on)}.`);
  };

  const remove = (row: EvaluationRecord) => {
    evaluations.remove(row.id);
    if (editingId === row.id) resetForm();
    setConfirmId(null);
    setMessage("Evaluation deleted.");
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
        <Header title="Player evaluation" detail="Rate each player from 1 to 5 on the skills below. Results are saved on this device." />
        <Status message={message} />

        <Section title={editingId ? "Edit evaluation" : "New evaluation"}>
          {players.length === 0 ? (
            <Text style={{ fontSize: 14, color: palette.muted }}>No active players yet. Add players in the Team roster first.</Text>
          ) : (
            <Dropdown
              label="Player"
              value={selectedLabel}
              options={playerOptions.map((option) => option.label)}
              onChange={(label) => setPlayerId(playerOptions.find((option) => option.label === label)?.id ?? "")}
            />
          )}
          <Field
            label="Date of evaluation"
            hint="Type as dd-mm-yyyy, for example 18-11-2026"
            value={dateText}
            onChangeText={(text) => { setDateText(text); setMessage(""); }}
            keyboardType="numbers-and-punctuation"
          />
          {dateText.trim() && !evaluatedOn ? (
            <Text style={{ fontSize: 13, color: palette.muted }}>This date is not valid. Use dd-mm-yyyy.</Text>
          ) : null}
          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 15, fontWeight: "700", color: palette.ink }}>
              {score.overall === null ? "No skills rated yet" : `Overall ${score.overall}%`}
            </Text>
            <Text style={{ fontSize: 13, color: palette.muted }}>
              {`${score.rated} of ${score.total} skills rated. Tap a selected number again to clear it.`}
            </Text>
          </View>
        </Section>

        {SKILL_CATEGORIES.map((category) => (
          <Section key={category.id} title={category.name}>
            {category.skills.map((skill) => (
              <View key={skill.id} style={{ gap: 6 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: palette.ink }}>{skill.name}</Text>
                <View style={{ flexDirection: "row", gap: 6 }}>
                  {SCALE.map((value) => (
                    <RatingButton
                      key={value}
                      value={value}
                      skillName={skill.name}
                      selected={ratings[skill.id] === value}
                      onPress={() => setRating(skill.id, value)}
                    />
                  ))}
                </View>
              </View>
            ))}
          </Section>
        ))}

        <Section title="Notes and save">
          <Field label="Notes" hint="Strengths, areas to work on, or anything the coach should remember" value={notes} onChangeText={setNotes} multiline />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <Button label={editingId ? "Update evaluation" : "Save evaluation"} onPress={save} />
            {editingId || score.rated > 0 || notes ? <Button label="Clear form" variant="secondary" onPress={resetForm} /> : null}
          </View>
        </Section>

        <Section title="Saved evaluations">
          {!evaluations.loaded ? null : saved.length === 0 ? (
            <Text style={{ fontSize: 14, color: palette.muted }}>No evaluations saved yet.</Text>
          ) : (
            saved.map((row) => (
              <View key={row.id} style={{ borderWidth: 1, borderColor: palette.line, borderRadius: 10, padding: 12, gap: 8, backgroundColor: "#fff" }}>
                <Text style={{ fontSize: 15, fontWeight: "700", color: palette.ink }}>{row.player_name}</Text>
                <Text style={{ fontSize: 13, color: palette.muted }}>{`${toDisplayDate(row.evaluated_on)} · ${overallText(row.ratings)}`}</Text>
                {row.notes ? <Text style={{ fontSize: 14, color: palette.ink }}>{row.notes}</Text> : null}
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  <Button label={`Edit ${row.player_name}, ${toDisplayDate(row.evaluated_on)}`} variant="secondary" onPress={() => edit(row)} />
                  {confirmId === row.id ? (
                    <Button label="Confirm delete" variant="danger" onPress={() => remove(row)} />
                  ) : (
                    <Button label={`Delete ${row.player_name}, ${toDisplayDate(row.evaluated_on)}`} variant="secondary" onPress={() => setConfirmId(row.id)} />
                  )}
                </View>
              </View>
            ))
          )}
        </Section>
      </ScrollView>
      <ModuleMenu visible={menuOpen} onClose={() => setMenuOpen(false)} currentPath="/evaluation" />
    </Screen>
  );
}
