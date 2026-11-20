import { Link } from "expo-router";
import { useMemo, useState } from "react";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import Menu from "lucide-react-native/dist/esm/icons/menu.mjs";
import { Dropdown } from "@/components/portal/dropdown";
import { ModuleMenu } from "@/components/portal/module-menu";
import { Button, Empty, Field, Header, Screen, Section, Status, palette, styles as ui } from "@/components/portal/ui";
import { DOCUMENTS_KEY, DOCUMENT_CATEGORIES, emptyDocumentDraft, type Document, type DocumentDraft } from "@/lib/documents";
import { useLocalCollection } from "@/lib/store";
import { formatBytes, pickDocumentFile } from "@/lib/uploads";

const ALL = "All categories";

export default function DocumentsScreen() {
  const docs = useLocalCollection<Document>(DOCUMENTS_KEY);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>(ALL);
  const [draft, setDraft] = useState<DocumentDraft>(emptyDocumentDraft);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...docs.items]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .filter((d) => category === ALL || d.category === category)
      .filter((d) => !q || `${d.title} ${d.notes} ${d.category}`.toLowerCase().includes(q));
  }, [docs.items, query, category]);

  const set = (key: keyof DocumentDraft) => (value: string) => setDraft((d) => ({ ...d, [key]: value }));

  const closeForm = () => {
    setDraft(emptyDocumentDraft);
    setEditingId(null);
    setFormOpen(false);
  };

  const openNew = () => {
    setDraft(emptyDocumentDraft);
    setEditingId(null);
    setFormOpen(true);
    setMessage("Enter the new document below.");
  };

  const startEdit = (doc: Document) => {
    const { id: _id, created_at: _c, updated_at: _u, ...fields } = doc;
    setDraft(fields);
    setEditingId(doc.id);
    setFormOpen(true);
    setConfirmId(null);
    setMessage(`Editing ${doc.title}.`);
  };

  const save = () => {
    if (!draft.title.trim()) {
      setMessage("Enter a document title before saving.");
      return;
    }
    const clean = { ...draft, title: draft.title.trim(), link: draft.link.trim(), notes: draft.notes.trim() };
    if (editingId) {
      docs.update(editingId, clean);
      setMessage(`Saved changes to ${clean.title}.`);
    } else {
      docs.create(clean);
      setMessage(`Added ${clean.title} to the library.`);
    }
    closeForm();
  };

  const remove = (doc: Document) => {
    if (confirmId !== doc.id) {
      setConfirmId(doc.id);
      setMessage(`Press Confirm delete to remove ${doc.title}.`);
      return;
    }
    docs.remove(doc.id);
    if (editingId === doc.id) closeForm();
    setConfirmId(null);
    setMessage(`Deleted ${doc.title}.`);
  };

  const attachFile = () => {
    pickDocumentFile()
      .then((file) => {
        if (!file) return;
        setDraft((d) => ({ ...d, file_name: file.name, file_type: file.type, file_size: file.size, file_data: file.data }));
        setMessage(`Attached ${file.name}. Press Save to keep it.`);
      })
      .catch((e: Error) => setMessage(e.message));
  };

  const removeFile = () => {
    setDraft((d) => ({ ...d, file_name: "", file_type: "", file_size: 0, file_data: "" }));
    setMessage("File removed from this document.");
  };

  const open = (doc: Document) => {
    if (doc.file_data) {
      Linking.openURL(doc.file_data).catch(() => setMessage(`Could not open ${doc.title}.`));
      return;
    }
    if (!doc.link) return;
    const url = /^https?:\/\//i.test(doc.link) ? doc.link : `https://${doc.link}`;
    Linking.openURL(url).catch(() => setMessage(`Could not open ${doc.title}.`));
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
          title="Documents"
          detail="The team's document library: forms, schedules, policies and handouts. Save a link to each file so everyone finds it in one place."
        />
        <Status message={message} />

        <Section title={editingId ? "Edit document" : "New document"}>
          <View style={ui.actions}>
            <Button label="Add document" onPress={openNew} />
          </View>
          {formOpen ? (
            <>
              <Field label="Document title" value={draft.title} onChangeText={set("title")} />
              <Dropdown label="Category" value={draft.category} options={[...DOCUMENT_CATEGORIES]} onChange={(c) => setDraft((d) => ({ ...d, category: c }))} />
              <Field
                label="Link to the file (optional)"
                hint="Paste the web address where the file is stored"
                value={draft.link}
                onChangeText={set("link")}
                autoCapitalize="none"
                keyboardType="url"
              />
              <Text style={{ fontSize: 15, fontWeight: "600", color: palette.ink }}>File from this device (optional)</Text>
              <Text style={ui.meta}>Up to 5 MB. Stored on this device with the document.</Text>
              {draft.file_data ? (
                <View style={ui.actions}>
                  <Text style={ui.meta}>{draft.file_name} · {formatBytes(draft.file_size)}</Text>
                  <Button label="Remove file" variant="secondary" onPress={removeFile} />
                </View>
              ) : null}
              <View style={ui.actions}>
                <Button label={draft.file_data ? "Choose a different file" : "Attach file"} variant="secondary" onPress={attachFile} />
              </View>
              <Field label="Notes" hint="For example: who must sign, the season it applies to" value={draft.notes} onChangeText={set("notes")} multiline />
              <View style={ui.actions}>
                <Button label={editingId ? "Save changes" : "Save document"} onPress={save} />
                <Button label="Cancel" variant="secondary" onPress={closeForm} />
              </View>
            </>
          ) : (
            <Text style={ui.meta}>Tap Add document to save a new entry. Existing documents are listed below.</Text>
          )}
        </Section>

        <Section title="Find a document">
          <Field label="Search documents" value={query} onChangeText={setQuery} autoCapitalize="none" returnKeyType="search" />
          <Dropdown label="Category" value={category} options={[ALL, ...DOCUMENT_CATEGORIES]} onChange={setCategory} />
        </Section>

        <Section title={`Documents (${visible.length})`}>
          {visible.length === 0 ? (
            <Empty text={docs.items.length === 0 ? "No documents yet. Tap Add document to save the first one." : "No document matches these filters."} />
          ) : (
            visible.map((d) => (
              <View key={d.id} style={{ gap: 6, paddingTop: 12, borderTopWidth: 1, borderTopColor: palette.line }}>
                <Text style={ui.name}>{d.title}</Text>
                <Text style={ui.meta}>
                  {[d.category, `Added ${new Date(d.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`].join(" · ")}
                </Text>
                {d.notes ? <Text style={ui.meta}>{d.notes}</Text> : null}
                {d.file_data ? <Text style={ui.meta}>File: {d.file_name} · {formatBytes(d.file_size)}</Text> : null}
                {d.link ? <Text style={ui.meta}>Link: {d.link}</Text> : null}
                {!d.link && !d.file_data ? <Text style={ui.meta}>No file or link saved.</Text> : null}
                <View style={ui.actions}>
                  {d.link || d.file_data ? <Button label={`Open ${d.title}`} onPress={() => open(d)} /> : null}
                  <Button label={`Edit ${d.title}`} variant="secondary" onPress={() => startEdit(d)} />
                  <Button
                    label={confirmId === d.id ? `Confirm delete ${d.title}` : `Delete ${d.title}`}
                    variant="danger"
                    onPress={() => remove(d)}
                  />
                </View>
              </View>
            ))
          )}
        </Section>
      </ScrollView>
      <ModuleMenu visible={menuOpen} onClose={() => setMenuOpen(false)} currentPath="/documents" />
    </Screen>
  );
}
