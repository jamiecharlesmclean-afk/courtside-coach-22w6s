import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import Menu from "lucide-react-native/dist/esm/icons/menu.mjs";
import { ModuleMenu } from "@/components/portal/module-menu";
import { Button, Field, Header, Screen, Section, Status, palette } from "@/components/portal/ui";
import { emptySettings, loadSettings, saveSettings, type TeamSettings } from "@/lib/settings";
import { pickDocumentFile, pickLogo } from "@/lib/uploads";
import { decodeDataUrlText } from "@/lib/csv";
import { currentBackupText, readBackup, restoreBackup, type BackupData } from "@/lib/backup";
import { downloadFile } from "@/lib/download";
import { localDateKey, toDisplayDate } from "@/lib/games";
import { archiveSummary, endSeason, loadArchive, loadSeasonStatus, startNewSeason, type ArchivedSeason, type SeasonStatus } from "@/lib/seasons";

export default function SettingsScreen() {
  const [draft, setDraft] = useState<TeamSettings>(emptySettings);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [backup, setBackup] = useState<{ name: string; keyCount: number; exportedAt: string; data: BackupData } | null>(null);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [seasonStatus, setSeasonStatus] = useState<SeasonStatus | null>(null);
  const [archive, setArchive] = useState<ArchivedSeason[]>([]);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [nextSeason, setNextSeason] = useState("");

  useEffect(() => {
    loadSettings().then((saved) => {
      setDraft(saved);
      setReady(true);
    });
  }, []);

  const set = (key: keyof TeamSettings) => (value: string) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setMessage("");
  };

  const save = () => {
    const clean = Object.fromEntries(
      Object.entries(draft).map(([k, v]) => [k, v.trim()]),
    ) as TeamSettings;
    saveSettings(clean).then(() => {
      setDraft(clean);
      setMessage("Settings saved on this device.");
    }).catch(() => setMessage("Settings could not be saved. Try again."));
  };

  const downloadBackup = () => currentBackupText().then((text) => {
    const [year, month, day] = localDateKey(new Date()).split("-");
    const ok = downloadFile(`courtside-backup-${day}-${month}-${year}.json`, "application/json", text);
    setMessage(ok ? "Backup downloaded." : "Downloads are not available on this device. Open the app in a browser to download a backup.");
  }).catch(() => setMessage("The backup could not be made. Try again."));

  const chooseBackup = () => pickDocumentFile().then((file) => {
    if (!file) return;
    const result = readBackup(decodeDataUrlText(file.data));
    if (!result.ok) {
      setBackup(null);
      setMessage(result.error);
      return;
    }
    setBackup({ name: file.name, keyCount: result.keyCount, exportedAt: result.exportedAt, data: result.data });
    setConfirmRestore(false);
    setMessage("");
  }).catch((e: Error) => setMessage(e.message));

  const restore = () => {
    if (!backup) return;
    restoreBackup(backup.data)
      .then(() => loadSettings())
      .then((saved) => {
        setDraft(saved);
        setBackup(null);
        setConfirmRestore(false);
        setMessage("Backup restored on this device. Screens show the restored data when you open them.");
      })
      .catch(() => setMessage("The backup could not be restored. Your data was not changed."));
  };

  const refreshSeasons = () => Promise.all([loadSeasonStatus(), loadArchive()]).then(([status, rows]) => {
    setSeasonStatus(status);
    setArchive(rows);
  });

  useEffect(() => {
    refreshSeasons().catch(() => {});
  }, []);

  const endThisSeason = () => endSeason(localDateKey(new Date()))
    .then((season) => {
      setConfirmEnd(false);
      setMessage(`${season.name} has ended. Its games and calendar items are in the archive.`);
      return refreshSeasons();
    })
    .catch(() => setMessage("The season could not be ended. Nothing was changed."));

  const beginNewSeason = () => {
    const name = nextSeason.trim();
    if (!name) {
      setMessage("Type the name of the new season first, for example 2026/27.");
      return;
    }
    startNewSeason(name)
      .then(() => {
        setDraft((d) => ({ ...d, season: name }));
        setNextSeason("");
        setMessage(`${name} has started. The games and calendar are empty.`);
        return refreshSeasons();
      })
      .catch(() => setMessage("The new season could not be started. Try again."));
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
        <Header title="Settings" detail="Team details shown across the app: the team name, coaching staff, season, competition and age group." />
        <Status message={message} />

        {ready ? (
          <Section title="Team details">
            <Field label="Team name" value={draft.team_name} onChangeText={set("team_name")} />
            <Text style={{ fontSize: 15, fontWeight: "600", color: palette.ink }}>Team logo</Text>
            <Text style={{ fontSize: 14, color: palette.muted }}>Choose a square photo from this device, or paste a web address. Shown in the header and on the home screen.</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              <Button
                label="Choose logo from photos"
                variant="secondary"
                onPress={() => pickLogo().then((data) => {
                  if (data) {
                    setDraft((d) => ({ ...d, logo_url: data }));
                    setMessage("Logo chosen. Press Save settings to keep it.");
                  }
                }).catch((e: Error) => setMessage(e.message))}
              />
            </View>
            <Field label="Or logo web address" value={draft.logo_url.startsWith("data:") ? "" : draft.logo_url} onChangeText={set("logo_url")} autoCapitalize="none" keyboardType="url" />
            {draft.logo_url ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ width: 64, height: 64, borderRadius: 10, borderWidth: 1, borderColor: palette.line, backgroundColor: "#fff", padding: 6 }}>
                  <Image source={{ uri: draft.logo_url }} accessibilityLabel="Team logo preview" style={{ width: "100%", height: "100%" }} resizeMode="contain" />
                </View>
                <Button label="Remove logo" variant="secondary" onPress={() => { setDraft((d) => ({ ...d, logo_url: "" })); setMessage(""); }} />
              </View>
            ) : null}
            <Field label="Age group" hint="For example: U16, Varsity, Senior" value={draft.age_group} onChangeText={set("age_group")} />
            <Field label="Season" hint="For example: 2025/26" value={draft.season} onChangeText={set("season")} />
            <Field label="Competition" hint="For example: District League" value={draft.competition} onChangeText={set("competition")} />
            <Field
              label="Coaching staff"
              hint="One name per line, with the role after a comma. For example: Dana Ortiz, Head coach"
              value={draft.coaching_staff}
              onChangeText={set("coaching_staff")}
              multiline
            />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              <Button label="Save settings" onPress={save} />
            </View>
          </Section>
        ) : null}

        <Section title="Season">
          {seasonStatus ? (
            <Text style={{ fontSize: 15, fontWeight: "700", color: palette.ink }}>
              {`End of season: ${seasonStatus.name} ended on ${toDisplayDate(seasonStatus.ended_on)}. Start the next season below.`}
            </Text>
          ) : (
            <Text style={{ fontSize: 15, color: palette.ink }}>
              {`Season in progress${draft.season ? `: ${draft.season}` : ""}.`}
            </Text>
          )}
          <Text style={{ fontSize: 14, color: palette.muted }}>
            Ending the season moves its games and calendar items to the archive and clears the schedule. The roster, drill book, playbook and documents stay.
          </Text>
          {seasonStatus ? (
            <>
              <Field label="New season name" hint="For example: 2026/27" value={nextSeason} onChangeText={setNextSeason} />
              <Button label="Start new season" onPress={beginNewSeason} />
            </>
          ) : confirmEnd ? (
            <>
              <Text style={{ fontSize: 14, color: palette.ink }}>
                The season is labelled as ended on this device. You can start the next one afterwards.
              </Text>
              <Button label="Yes, end the season" variant="danger" onPress={endThisSeason} />
              <Button label="Cancel" variant="secondary" onPress={() => setConfirmEnd(false)} />
            </>
          ) : (
            <Button label="End of season" variant="secondary" onPress={() => setConfirmEnd(true)} />
          )}
          <Text style={{ fontSize: 15, fontWeight: "700", color: palette.ink }}>Archive</Text>
          {archive.length === 0 ? (
            <Text style={{ fontSize: 14, color: palette.muted }}>No seasons archived yet.</Text>
          ) : archive.map((season) => (
            <Text key={season.id} style={{ fontSize: 14, color: palette.ink }}>
              {`${season.name}: ended ${toDisplayDate(season.ended_on)}, ${archiveSummary(season)}.`}
            </Text>
          ))}
        </Section>

        <Section title="Backup">
          <Text style={{ fontSize: 14, color: palette.muted }}>
            Download one file with everything saved on this device: roster, drill book, playbook, practice plans, games, calendar, documents and settings. Keep it somewhere safe.
          </Text>
          <Button label="Download backup" variant="secondary" onPress={downloadBackup} />
          <Button label="Choose backup file" variant="secondary" onPress={chooseBackup} />
          {backup ? (
            <View style={{ gap: 10 }}>
              <Text style={{ fontSize: 15, color: palette.ink }}>
                {`Backup from ${backup.exportedAt ? toDisplayDate(backup.exportedAt.slice(0, 10)) : "an unknown date"}: ${backup.keyCount} saved sections from ${backup.name}.`}
              </Text>
              {confirmRestore ? (
                <>
                  <Text style={{ fontSize: 14, color: palette.ink }}>
                    Restoring replaces all CourtSide data on this device. This cannot be undone.
                  </Text>
                  <Button label="Yes, replace data on this device" variant="danger" onPress={restore} />
                  <Button label="Cancel restore" variant="secondary" onPress={() => setConfirmRestore(false)} />
                </>
              ) : (
                <Button label="Restore this backup" variant="danger" onPress={() => setConfirmRestore(true)} />
              )}
            </View>
          ) : null}
        </Section>
      </ScrollView>
      <ModuleMenu visible={menuOpen} onClose={() => setMenuOpen(false)} currentPath="/settings" />
    </Screen>
  );
}
