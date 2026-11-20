// Central roster: players and staff in one list. Search, filters, sorting, bulk edit,
// archive, staff permissions, CSV import and export, and stat-sheet templates.
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import Check from "lucide-react-native/dist/esm/icons/check.mjs";
import { AvailabilityBadge, PlayerEditor, type PersonDraft } from "@/components/portal/player-editor";
import { Dropdown } from "@/components/portal/dropdown";
import { Button, Chip, Field, Section, Status, palette, styles as ui } from "@/components/portal/ui";
import { pickDocumentFile } from "@/lib/uploads";
import {
  CSV_COLUMNS, EXAMPLE_CSV, POSITIONS, STAFF_PERMISSIONS, STAFF_ROLES, STAT_TEMPLATES,
  csvFromPlayers, importCsv, normalizePlayer, sortByJersey, sortByName, statSheetCsv,
  type PlayerProfile,
} from "@/lib/roster";
import type { TeamSettings } from "@/lib/settings";

type ViewFilter = "Players" | "Inactive" | "Staff" | "Archived";
const VIEWS: ViewFilter[] = ["Players", "Inactive", "Staff", "Archived"];
const ALL_POSITIONS = "All positions";
const NOT_SET = "Not set";

function inView(p: PlayerProfile, view: ViewFilter): boolean {
  switch (view) {
    case "Players": return p.kind === "Player" && !p.archived && p.status === "Active";
    case "Inactive": return p.kind === "Player" && !p.archived && p.status === "Inactive";
    case "Staff": return p.kind === "Staff" && !p.archived;
    case "Archived": return p.archived;
  }
}

function metaLine(p: PlayerProfile): string {
  if (p.kind === "Staff") return [p.staff_role || "Staff member", p.archived ? "Archived" : ""].filter(Boolean).join(" · ");
  return [p.position || "Position not set", p.height, p.archived ? "Archived" : p.status === "Inactive" ? "Inactive" : ""].filter(Boolean).join(" · ");
}

export function RosterManager({ settings, wide, roster, setRoster }: { settings: TeamSettings; wide: boolean; roster: PlayerProfile[]; setRoster: (roster: PlayerProfile[]) => void }) {
  const [view, setView] = useState<ViewFilter>("Players");
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState(ALL_POSITIONS);
  const [sortBy, setSortBy] = useState<"jersey" | "name">("jersey");
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [editor, setEditor] = useState<{ id: string | null; kind: "Player" | "Staff" } | null>(null);
  const [status, setStatus] = useState("");
  const [showIO, setShowIO] = useState(false);
  const [importText, setImportText] = useState("");
  const [ioOutput, setIoOutput] = useState("");
  const [ioStatus, setIoStatus] = useState("");
  const [templateId, setTemplateId] = useState(STAT_TEMPLATES[0].id);

  const counts = {
    Players: roster.filter((p) => inView(p, "Players")).length,
    Inactive: roster.filter((p) => inView(p, "Inactive")).length,
    Staff: roster.filter((p) => inView(p, "Staff")).length,
    Archived: roster.filter((p) => inView(p, "Archived")).length,
  };

  const q = query.trim().toLowerCase();
  const shown = (view === "Staff" ? sortByName : sortBy === "jersey" ? sortByJersey : sortByName)(
    roster.filter((p) => inView(p, view))
      .filter((p) => view === "Staff" || position === ALL_POSITIONS || (position === NOT_SET ? !p.position : p.position === position))
      .filter((p) => !q || `${p.name} ${p.number} ${p.position} ${p.phone} ${p.staff_role}`.toLowerCase().includes(q)),
  );

  const editing = editor?.id ? roster.find((p) => p.id === editor.id) ?? null : null;
  const selectedIds = new Set(selected);

  function toggleSelect(id: string) {
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  function bulk(patch: Partial<PlayerProfile>, message: string) {
    if (selected.length === 0) return;
    setRoster(roster.map((p) => (selectedIds.has(p.id) ? normalizePlayer({ ...p, ...patch }) : p)));
    setStatus(`${message} (${selected.length}).`);
    setSelected([]);
  }

  function setArchived(id: string, archived: boolean) {
    setRoster(roster.map((p) => (p.id === id ? { ...p, archived } : p)));
    setSelected((cur) => cur.filter((x) => x !== id));
    const person = roster.find((p) => p.id === id);
    setStatus(`${person?.name ?? "Person"} ${archived ? "archived. Restore them from Archived." : "restored."}`);
  }

  function saveEntry(draft: PersonDraft) {
    if (draft.kind === "Player" && draft.number !== "-") {
      const clash = roster.find((p) => p.kind === "Player" && !p.archived && p.id !== editor?.id && p.number === draft.number);
      if (clash) { setStatus(`Another player already wears #${draft.number} (${clash.name}).`); return; }
    }
    if (editor?.id) {
      setRoster(roster.map((p) => (p.id === editor.id ? normalizePlayer({ ...draft, id: p.id, archived: p.archived }) : p)));
      setStatus(`Saved ${draft.name}.`);
    } else {
      const id = `p-${Date.now()}`;
      setRoster([...roster, normalizePlayer({ ...draft, id })]);
      setStatus(`Added ${draft.name}${draft.kind === "Staff" ? " to staff" : ""}.`);
      if (draft.kind === "Staff") setView("Staff");
    }
    setEditor(null);
  }

  function deleteEntry() {
    if (!editing) return;
    setRoster(roster.filter((p) => p.id !== editing.id));
    setSelected((cur) => cur.filter((x) => x !== editing.id));
    setStatus(`Deleted ${editing.name} from this device.`);
    setEditor(null);
  }

  async function chooseCsv() {
    try {
      const file = await pickDocumentFile();
      if (!file) return;
      const base64 = file.data.split(",")[1] ?? "";
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      setImportText(new TextDecoder().decode(bytes));
      setIoStatus(`Loaded ${file.name}. Check the text, then press Import players.`);
    } catch (error) {
      setIoStatus(error instanceof Error ? error.message : "That file could not be opened.");
    }
  }

  function runImport() {
    if (!importText.trim()) { setIoStatus("Paste CSV text or choose a file first."); return; }
    const result = importCsv(importText, roster);
    setRoster(result.players);
    setIoStatus(`Added ${result.added}, updated ${result.updated}, skipped ${result.skipped} row${result.skipped === 1 ? "" : "s"} without a first and last name.`);
  }

  async function copyOutput() {
    try {
      await (globalThis as any).navigator?.clipboard?.writeText(ioOutput);
      setIoStatus("Copied the CSV.");
    } catch {
      setIoStatus("Select the text in the box and copy it.");
    }
  }

  const template = STAT_TEMPLATES.find((t) => t.id === templateId) ?? STAT_TEMPLATES[0];
  const bulkArchive = view === "Archived"
    ? { label: "Restore", patch: { archived: false }, message: "Restored" }
    : { label: "Archive", patch: { archived: true }, message: "Archived" };

  return (
    <View style={{ gap: 14 }}>
      <View style={{ gap: 4 }}>
        <Text style={{ color: palette.ink, fontSize: 22, fontWeight: "800" }}>{settings.team_name || "Your team"} roster</Text>
        <Text style={ui.meta}>Every player and staff member in one list. Inactive and archived people are kept but left out of practice and attendance.</Text>
      </View>

      <Status message={status} />

      <View accessibilityRole="tablist" style={[ui.row, { flexWrap: "wrap" }]}>
        {VIEWS.map((v) => (
          <Chip key={v} label={`${v} (${counts[v]})`} selected={view === v} onPress={() => { setView(v); setSelected([]); }} />
        ))}
      </View>

      <Field label="Search" hint="Name, jersey number, position, role or phone" value={query} onChangeText={setQuery} placeholder="Search people" returnKeyType="search" />

      <View style={{ flexDirection: wide ? "row" : "column", gap: 12, alignItems: wide ? "flex-end" : "stretch" }}>
        {view !== "Staff" ? (
          <View style={{ flex: 1 }}>
            <Dropdown label="Filter by position" value={position} options={[ALL_POSITIONS, ...POSITIONS, NOT_SET]} onChange={setPosition} />
          </View>
        ) : null}
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 15, fontWeight: "600", color: palette.ink }}>Sort</Text>
          <View style={ui.row}>
            <Chip label="Jersey number" selected={sortBy === "jersey"} onPress={() => setSortBy("jersey")} />
            <Chip label="Name" selected={sortBy === "name"} onPress={() => setSortBy("name")} />
          </View>
        </View>
      </View>

      <View style={[ui.row, { flexWrap: "wrap" }]}>
        <Button label="Add player" onPress={() => setEditor({ id: null, kind: "Player" })} />
        <Button label="Add staff member" variant="secondary" onPress={() => setEditor({ id: null, kind: "Staff" })} />
        <Button label={selectMode ? "Done selecting" : "Select people"} variant="secondary" onPress={() => { setSelectMode((v) => !v); setSelected([]); }} />
        <Button label={showIO ? "Hide import and export" : "Import and export"} variant="secondary" onPress={() => setShowIO((v) => !v)} />
      </View>

      {selectMode ? (
        <View style={{ backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, borderRadius: 12, padding: 12, gap: 10 }}>
          <Text accessibilityLiveRegion="polite" style={{ color: palette.ink, fontWeight: "700" }}>{`${selected.length} selected`}</Text>
          <View style={[ui.row, { flexWrap: "wrap" }]}>
            <Chip label={`Select all shown (${shown.length})`} selected={false} onPress={() => setSelected(shown.map((p) => p.id))} />
            <Chip label="Clear selection" selected={false} onPress={() => setSelected([])} />
            {view !== "Archived" && view !== "Staff" ? <Chip label="Mark active" selected={false} onPress={() => bulk({ status: "Active" }, "Marked active")} /> : null}
            {view !== "Archived" && view !== "Staff" ? <Chip label="Mark inactive" selected={false} onPress={() => bulk({ status: "Inactive" }, "Marked inactive")} /> : null}
            <Chip label={`${bulkArchive.label} selected`} selected={false} onPress={() => bulk(bulkArchive.patch, bulkArchive.message)} />
          </View>
          {view !== "Staff" && view !== "Archived" ? (
            <Dropdown label="Set position for selected" value="Choose a position" options={[...POSITIONS]} onChange={(value) => bulk({ position: value }, `Set position to ${value}`)} />
          ) : null}
        </View>
      ) : null}

      {view === "Staff" ? (
        <Section title="Staff accounts and permissions">
          <Text style={ui.meta}>
            Staff roles show what each person is responsible for. Sign-in accounts are not connected yet, so these roles do not restrict access until they are (see docs/SIGN_IN_PROPOSAL.md).
          </Text>
          {STAFF_ROLES.map((role) => (
            <View key={role} style={{ gap: 2 }}>
              <Text style={{ color: palette.ink, fontWeight: "700" }}>{role}</Text>
              <Text style={ui.meta}>{STAFF_PERMISSIONS[role]}</Text>
            </View>
          ))}
        </Section>
      ) : null}

      {shown.length === 0 ? (
        <View style={{ backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, borderRadius: 12, padding: 16, gap: 6 }}>
          <Text style={{ color: palette.ink, fontSize: 16, fontWeight: "800" }}>{roster.length === 0 ? "No people yet" : "Nobody matches these filters"}</Text>
          <Text style={ui.meta}>{roster.length === 0 ? "Tap Add player to start the roster, or import a CSV file below." : "Clear the search or pick another filter."}</Text>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {shown.map((p) => {
            const isSelected = selectedIds.has(p.id);
            return (
              <View key={p.id} style={{ backgroundColor: palette.surface, borderWidth: 1, borderColor: isSelected ? palette.deep : palette.line, borderRadius: 12, padding: 12, gap: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  {selectMode ? (
                    <Pressable
                      accessibilityRole="checkbox"
                      accessibilityLabel={`Select ${p.name}`}
                      accessibilityState={{ checked: isSelected }}
                      onPress={() => toggleSelect(p.id)}
                      style={{ width: 44, height: 44, borderRadius: 8, borderWidth: 1, borderColor: palette.line, alignItems: "center", justifyContent: "center", backgroundColor: isSelected ? palette.deep : palette.surface }}
                    >
                      {isSelected ? <Check color="#fff" size={18} /> : null}
                    </Pressable>
                  ) : null}
                  <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: palette.deep, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ color: "#d8fc58", fontWeight: "900", fontSize: p.kind === "Staff" ? 10 : 15 }}>{p.kind === "Staff" ? "STAFF" : p.number === "-" ? "–" : p.number}</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                    <Text numberOfLines={1} style={{ color: palette.ink, fontSize: 16, fontWeight: "800" }}>{p.name}</Text>
                    <Text numberOfLines={2} style={ui.meta}>{metaLine(p)}</Text>
                  </View>
                </View>
                <View style={[ui.row, { justifyContent: "space-between", flexWrap: "wrap" }]}>
                  {p.kind === "Player" && !p.archived ? <AvailabilityBadge status={p.availability ?? "Available"} /> : <View />}
                  <View style={ui.row}>
                    <Pressable accessibilityRole="button" accessibilityLabel={`Update ${p.name}`} onPress={() => setEditor({ id: p.id, kind: p.kind })} style={{ minHeight: 44, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: palette.line, justifyContent: "center" }}>
                      <Text style={{ color: palette.deep, fontWeight: "800" }}>Update</Text>
                    </Pressable>
                    <Pressable accessibilityRole="button" accessibilityLabel={`${p.archived ? "Restore" : "Archive"} ${p.name}`} onPress={() => setArchived(p.id, !p.archived)} style={{ minHeight: 44, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: palette.line, justifyContent: "center" }}>
                      <Text style={{ color: palette.ink, fontWeight: "700" }}>{p.archived ? "Restore" : "Archive"}</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {showIO ? (
        <Section title="Import and export">
          <Text style={ui.sectionLabel}>Import CSV</Text>
          <Text style={ui.meta}>{`Columns: ${CSV_COLUMNS.join(", ")}. Rows need a first and last name. A row that matches an existing person by name updates them; other rows are added.`}</Text>
          <View style={{ backgroundColor: "#f3f5f1", borderRadius: 8, padding: 10 }}>
            <Text selectable style={{ fontFamily: "monospace", fontSize: 12, color: palette.ink }}>{EXAMPLE_CSV}</Text>
          </View>
          <View style={[ui.row, { flexWrap: "wrap" }]}>
            <Button label="Choose CSV file" variant="secondary" onPress={chooseCsv} />
            <Button label="Use example" variant="secondary" onPress={() => setImportText(EXAMPLE_CSV)} />
          </View>
          <Field label="CSV text" hint="Paste rows here, or choose a file" value={importText} onChangeText={setImportText} multiline placeholder={EXAMPLE_CSV.split("\n")[0]} />
          <Button label="Import players" onPress={runImport} />

          <Text style={ui.sectionLabel}>Export</Text>
          <Button label="Export everyone as CSV" variant="secondary" onPress={() => { setIoOutput(csvFromPlayers(roster)); setIoStatus(`Exported ${roster.length} people.`); }} />
          <Text style={ui.meta}>Stat-preparation templates</Text>
          <View style={[ui.row, { flexWrap: "wrap" }]}>
            {STAT_TEMPLATES.map((t) => (
              <Chip key={t.id} label={t.name} selected={templateId === t.id} onPress={() => setTemplateId(t.id)} />
            ))}
          </View>
          <Text style={ui.meta}>{`${template.description} Columns: ${template.stats.join(", ")}.`}</Text>
          <Button label={`Export ${template.name.toLowerCase()} sheet`} variant="secondary" onPress={() => { setIoOutput(statSheetCsv(template, roster)); setIoStatus(`Stat sheet for ${template.name.toLowerCase()} ready. Active players only.`); }} />

          <Status message={ioStatus} />
          {ioOutput ? (
            <>
              <Field label="CSV output" value={ioOutput} multiline editable={false} />
              <Button label="Copy CSV" variant="secondary" onPress={copyOutput} />
            </>
          ) : null}
        </Section>
      ) : null}

      {editor ? (
        <PlayerEditor
          key={editor.id ?? `new-${editor.kind}`}
          player={editing}
          defaultKind={editor.kind}
          onSave={saveEntry}
          onDelete={editing ? deleteEntry : undefined}
          onClose={() => setEditor(null)}
        />
      ) : null}
    </View>
  );
}
