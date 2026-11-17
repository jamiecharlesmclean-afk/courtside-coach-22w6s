import { Link } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Check from "lucide-react-native/dist/esm/icons/check.mjs";
import Menu from "lucide-react-native/dist/esm/icons/menu.mjs";
import { Dropdown } from "@/components/portal/dropdown";
import { ModuleMenu } from "@/components/portal/module-menu";
import { Button, Chip, Empty, Field, Header, Screen, Section, Status, palette, styles as ui } from "@/components/portal/ui";
import { useLocalCollection } from "@/lib/store";
import { addToPracticePlan } from "@/lib/practice-plan";
import { decodeDataUrlText } from "@/lib/csv";
import { downloadFile } from "@/lib/download";
import { DRILL_CSV_COLUMNS, drillBookPdf, drillsToCsv, planDrillImport } from "@/lib/drill-io";
import { pickDocumentFile } from "@/lib/uploads";
import {
  DIFFICULTIES,
  DRILLS_KEY,
  DRILL_CATEGORIES,
  emptyDrillDraft,
  type Drill,
  type DrillDraft,
} from "@/lib/drills";

const ALL = "All categories";

export default function DrillBookScreen() {
  const drills = useLocalCollection<Drill>(DRILLS_KEY);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>(ALL);
  const [favouritesOnly, setFavouritesOnly] = useState(false);
  const [draft, setDraft] = useState<DrillDraft>(emptyDrillDraft);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [showIO, setShowIO] = useState(false);
  const [ioText, setIoText] = useState("");
  const [ioStatus, setIoStatus] = useState("");
  const [confirmAll, setConfirmAll] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...drills.items]
      .sort((a, b) => a.name.localeCompare(b.name))
      .filter((d) => category === ALL || d.category === category)
      .filter((d) => !favouritesOnly || d.favourite)
      .filter((d) => !q || `${d.name} ${d.coaching_points} ${d.description}`.toLowerCase().includes(q));
  }, [drills.items, query, category, favouritesOnly]);

  const set = (key: keyof DrillDraft) => (value: string) => setDraft((d) => ({ ...d, [key]: value }));

  const closeForm = () => {
    setDraft(emptyDrillDraft);
    setEditingId(null);
    setFormOpen(false);
  };

  const openNew = () => {
    setDraft(emptyDrillDraft);
    setEditingId(null);
    setFormOpen(true);
    setMessage("Enter the new drill below.");
  };

  const startEdit = (drill: Drill) => {
    const { id: _id, created_at: _c, updated_at: _u, favourite: _f, ...fields } = drill;
    setDraft({ ...emptyDrillDraft, ...fields });
    setEditingId(drill.id);
    setFormOpen(true);
    setConfirmId(null);
    setMessage(`Editing ${drill.name}.`);
  };

  const save = () => {
    if (!draft.name.trim()) {
      setMessage("Enter a drill name before saving.");
      return;
    }
    const clean = { ...draft, name: draft.name.trim(), duration_min: draft.duration_min.trim(), players: draft.players.trim() };
    if (editingId) {
      drills.update(editingId, clean);
      setMessage(`Saved changes to ${clean.name}.`);
    } else {
      drills.create(clean);
      setMessage(`Added ${clean.name} to the drill book.`);
    }
    closeForm();
  };

  const toggleFavourite = (drill: Drill) => {
    drills.update(drill.id, { favourite: !drill.favourite });
    setMessage(drill.favourite ? `Removed ${drill.name} from favourites.` : `Added ${drill.name} to favourites.`);
  };

  const addToPlan = (drill: Drill) => {
    addToPracticePlan(drill.name)
      .then((added) => setMessage(added ? `Added ${drill.name} to the practice plan.` : `${drill.name} is already in the practice plan.`))
      .catch(() => setMessage(`Could not add ${drill.name} to the practice plan. Try again.`));
  };

  const remove = (drill: Drill) => {
    if (confirmId !== drill.id) {
      setConfirmId(drill.id);
      setMessage(`Press Confirm delete to remove ${drill.name}.`);
      return;
    }
    drills.remove(drill.id);
    if (editingId === drill.id) closeForm();
    setConfirmId(null);
    setMessage(`Deleted ${drill.name}.`);
  };

  const today = new Date().toISOString().slice(0, 10);
  const count = drills.items.length;

  const exportCsv = () => {
    const text = drillsToCsv(drills.items);
    if (downloadFile(`drill-book-${today}.csv`, "text/csv", text)) {
      setIoStatus(`Downloaded ${count} drills as CSV.`);
      return;
    }
    setIoText(text);
    setIoStatus("Downloads work in the browser version. The CSV text is in the box below: copy it into a .csv file.");
  };

  const exportPdf = () => {
    if (downloadFile(`drill-book-${today}.pdf`, "application/pdf", drillBookPdf(drills.items))) {
      setIoStatus(`Downloaded ${count} drills as PDF.`);
      return;
    }
    setIoStatus("PDF download works in the browser version. PDF sharing on a phone is not set up yet.");
  };

  const chooseCsv = async () => {
    try {
      const file = await pickDocumentFile();
      if (!file) return;
      setIoText(decodeDataUrlText(file.data));
      setIoStatus(`Loaded ${file.name}. Check the text, then press Import drills.`);
    } catch (error) {
      setIoStatus(error instanceof Error ? error.message : "That file could not be opened.");
    }
  };

  const runImport = () => {
    if (!ioText.trim()) {
      setIoStatus("Paste CSV text or choose a file first.");
      return;
    }
    const plan = planDrillImport(ioText, drills.items);
    for (const change of plan.changes) {
      if (change.kind === "create") drills.create(change.draft);
      else drills.update(change.id, change.draft);
    }
    const created = plan.changes.filter((c) => c.kind === "create").length;
    const updated = plan.changes.length - created;
    const notes = [
      `Added ${created}, updated ${updated}, skipped ${plan.skipped} row${plan.skipped === 1 ? "" : "s"} without a name.`,
      plan.defaulted ? `${plan.defaulted} unknown category or difficulty value${plan.defaulted === 1 ? "" : "s"} set to the first choice.` : "",
    ];
    setIoStatus(notes.filter(Boolean).join(" "));
  };

  const deleteAll = () => {
    if (count === 0) return;
    if (!confirmAll) {
      setConfirmAll(true);
      setIoStatus(`Press Confirm delete all to remove all ${count} drills.`);
      return;
    }
    drills.clear();
    closeForm();
    setConfirmId(null);
    setConfirmAll(false);
    setIoStatus("All drills deleted from this device.");
  };

  const toggleSelected = (id: string) => {
    setConfirmBulkDelete(false);
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  };

  const bulkEdit = (patch: Partial<DrillDraft>, label: string) => {
    if (selected.length === 0) return;
    for (const id of selected) drills.update(id, patch);
    setMessage(`${label} for ${selected.length} ${selected.length === 1 ? "drill" : "drills"}.`);
    setSelected([]);
  };

  const bulkDelete = () => {
    if (selected.length === 0) return;
    if (!confirmBulkDelete) {
      setConfirmBulkDelete(true);
      setMessage(`Press Confirm delete to remove ${selected.length} selected ${selected.length === 1 ? "drill" : "drills"}.`);
      return;
    }
    for (const id of selected) drills.remove(id);
    if (editingId && selected.includes(editingId)) closeForm();
    setMessage(`Deleted ${selected.length} ${selected.length === 1 ? "drill" : "drills"}.`);
    setSelected([]);
    setConfirmBulkDelete(false);
  };

  const leaveSelectMode = () => {
    setSelectMode(false);
    setSelected([]);
    setConfirmBulkDelete(false);
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
        <Header
          title="Drill book"
          detail="The shared drill book for every coach on the staff. Add new drills at the top, then search, filter and keep favourites handy."
        />
        <Status message={message} />

        <View style={[ui.actions, { paddingHorizontal: 20 }]}>
          <Button label={showIO ? "Hide import, export and delete" : "Import, export and delete"} variant="secondary" onPress={() => setShowIO((v) => !v)} />
        </View>
        {showIO ? (
          <Section title="Import, export and delete">
            <Text style={ui.sectionLabel}>Export</Text>
            <Text style={ui.meta}>{`${count} ${count === 1 ? "drill" : "drills"} in the book.`}</Text>
            <View style={ui.actions}>
              <Button label="Download CSV" variant="secondary" onPress={exportCsv} disabled={count === 0} />
              <Button label="Download PDF" variant="secondary" onPress={exportPdf} disabled={count === 0} />
            </View>
            <Text style={ui.sectionLabel}>Import CSV</Text>
            <Text style={ui.meta}>{`Columns: ${DRILL_CSV_COLUMNS.join(", ")}. A drill with the same name as one in the book is updated. Rows without a name are skipped.`}</Text>
            <View style={ui.actions}>
              <Button label="Choose CSV file" variant="secondary" onPress={chooseCsv} />
            </View>
            <Field label="CSV text" hint="Paste rows here, or choose a file" value={ioText} onChangeText={setIoText} multiline />
            <Button label="Import drills" onPress={runImport} />
            <Text style={ui.sectionLabel}>Delete</Text>
            <Text style={ui.meta}>Deleting removes drills from this device only. Download a CSV or PDF first to keep a copy.</Text>
            <Button
              label={confirmAll ? "Confirm delete all drills" : "Delete all drills"}
              variant="danger"
              onPress={deleteAll}
              disabled={count === 0}
            />
            {confirmAll ? <Button label="Keep my drills" variant="secondary" onPress={() => { setConfirmAll(false); setIoStatus("Nothing was deleted."); }} /> : null}
            <Status message={ioStatus} />
          </Section>
        ) : null}

        <Section title={editingId ? "Edit drill" : "New drills"}>
          <View style={ui.actions}>
            <Button label="Add drill" onPress={openNew} />
          </View>
          {formOpen ? (
            <>
              <Field label="Drill name" value={draft.name} onChangeText={set("name")} />
              <Dropdown label="Category" value={draft.category} options={DRILL_CATEGORIES} onChange={(c) => setDraft((d) => ({ ...d, category: c }))} />
              <Text style={{ fontSize: 15, fontWeight: "600", color: palette.ink }}>Difficulty</Text>
              <View style={ui.row}>
                {DIFFICULTIES.map((level) => (
                  <Chip key={level} label={level} selected={draft.difficulty === level} onPress={() => setDraft((d) => ({ ...d, difficulty: level }))} />
                ))}
              </View>
              <Field label="Duration (minutes)" value={draft.duration_min} onChangeText={set("duration_min")} keyboardType="number-pad" />
              <Field label="Number of players" value={draft.players} onChangeText={set("players")} />
              <Field label="Equipment required" value={draft.equipment} onChangeText={set("equipment")} />
              <Field label="Court area" hint="For example: half court, baseline, full court" value={draft.court_area} onChangeText={set("court_area")} />
              <Field label="Coaching points" value={draft.coaching_points} onChangeText={set("coaching_points")} multiline />
              <Field label="Description" value={draft.description} onChangeText={set("description")} multiline />
              <View style={ui.actions}>
                <Button label={editingId ? "Save changes" : "Save drill"} onPress={save} />
                <Button label="Cancel" variant="secondary" onPress={closeForm} />
              </View>
            </>
          ) : (
            <Text style={ui.meta}>Tap Add drill to enter a new drill. Existing drills are listed below.</Text>
          )}
        </Section>

        <Section title="Find a drill">
          <Field label="Search drills" value={query} onChangeText={setQuery} autoCapitalize="none" returnKeyType="search" />
          <Dropdown label="Category" value={category} options={[ALL, ...DRILL_CATEGORIES]} onChange={setCategory} />
          <View style={ui.row}>
            <Chip label="Favourites only" selected={favouritesOnly} onPress={() => setFavouritesOnly((v) => !v)} />
          </View>
        </Section>

        <Section title={`Drills (${visible.length})`}>
          {drills.items.length > 0 ? (
            <View style={ui.actions}>
              <Button label={selectMode ? "Done selecting" : "Select drills to edit"} variant="secondary" onPress={() => (selectMode ? leaveSelectMode() : setSelectMode(true))} />
            </View>
          ) : null}
          {selectMode && drills.items.length > 0 ? (
            <View style={{ gap: 10, padding: 12, borderWidth: 1, borderColor: palette.line, borderRadius: 12, backgroundColor: palette.surface }}>
              <Text accessibilityLiveRegion="polite" style={{ color: palette.ink, fontWeight: "700" }}>{`${selected.length} selected`}</Text>
              <View style={[ui.row, { flexWrap: "wrap" }]}>
                <Chip label={`Select all shown (${visible.length})`} selected={false} onPress={() => setSelected(visible.map((d) => d.id))} />
                <Chip label="Clear selection" selected={false} onPress={() => setSelected([])} />
              </View>
              <Text style={ui.sectionLabel}>Change selected</Text>
              <View style={[ui.row, { flexWrap: "wrap" }]}>
                <Chip label="Mark favourite" selected={false} onPress={() => bulkEdit({ favourite: true }, "Marked as favourite")} />
                <Chip label="Remove favourite" selected={false} onPress={() => bulkEdit({ favourite: false }, "Removed from favourites")} />
              </View>
              <Text style={ui.meta}>Difficulty</Text>
              <View style={[ui.row, { flexWrap: "wrap" }]}>
                {DIFFICULTIES.map((level) => (
                  <Chip key={level} label={level} selected={false} onPress={() => bulkEdit({ difficulty: level }, `Set difficulty to ${level}`)} />
                ))}
              </View>
              <Dropdown label="Set category" value="Choose a category" options={DRILL_CATEGORIES} onChange={(c) => bulkEdit({ category: c }, `Set category to ${c}`)} />
              <Button
                label={confirmBulkDelete ? `Confirm delete ${selected.length} selected` : `Delete selected (${selected.length})`}
                variant="danger"
                onPress={bulkDelete}
                disabled={selected.length === 0}
              />
            </View>
          ) : null}
          {visible.length === 0 ? (
            <Empty text={drills.items.length === 0 ? "The drill book is empty. Tap Add drill to enter the first one." : "No drill matches these filters."} />
          ) : (
            visible.map((d) => (
              <View key={d.id} style={{ gap: 6, paddingTop: 12, borderTopWidth: 1, borderTopColor: palette.line }}>
                {selectMode ? (
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityLabel={`Select ${d.name}`}
                    accessibilityState={{ checked: selected.includes(d.id) }}
                    onPress={() => toggleSelected(d.id)}
                    style={{ flexDirection: "row", alignItems: "center", gap: 10, minHeight: 44 }}
                  >
                    <View style={{ width: 24, height: 24, borderRadius: 6, borderWidth: 1, borderColor: palette.line, backgroundColor: selected.includes(d.id) ? palette.deep : palette.surface, alignItems: "center", justifyContent: "center" }}>
                      {selected.includes(d.id) ? <Check color="#fff" size={16} /> : null}
                    </View>
                    <Text style={{ color: palette.ink, fontWeight: "700" }}>{selected.includes(d.id) ? "Selected" : "Not selected"}</Text>
                  </Pressable>
                ) : null}
                <Text style={ui.name}>{d.name}</Text>
                <Text style={ui.meta}>
                  {[d.category, d.difficulty, d.duration_min ? `${d.duration_min} min` : "", d.players ? `${d.players} players` : ""]
                    .filter(Boolean)
                    .join(" · ")}
                </Text>
                {d.equipment ? <Text style={ui.meta}>Equipment: {d.equipment}</Text> : null}
                {d.court_area ? <Text style={ui.meta}>Court area: {d.court_area}</Text> : null}
                {d.coaching_points ? <Text style={ui.meta}>Coaching points: {d.coaching_points}</Text> : null}
                {d.description ? <Text style={ui.meta}>{d.description}</Text> : null}
                <View style={ui.actions}>
                  <Button label={`Add ${d.name} to practice plan`} onPress={() => addToPlan(d)} />
                  <Button
                    label={`${d.favourite ? "Unfavourite" : "Favourite"} ${d.name}`}
                    variant="secondary"
                    onPress={() => toggleFavourite(d)}
                  />
                  <Button label={`Edit ${d.name}`} variant="secondary" onPress={() => startEdit(d)} />
                  <Button
                    label={confirmId === d.id ? `Confirm delete ${d.name}` : `Delete ${d.name}`}
                    variant="danger"
                    onPress={() => remove(d)}
                  />
                </View>
              </View>
            ))
          )}
        </Section>
      </ScrollView>
      <ModuleMenu visible={menuOpen} onClose={() => setMenuOpen(false)} currentPath="/training" />
    </Screen>
  );
}
