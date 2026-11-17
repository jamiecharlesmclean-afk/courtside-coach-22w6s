import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import Menu from "lucide-react-native/dist/esm/icons/menu.mjs";
import { ModuleMenu } from "@/components/portal/module-menu";
import { Button, Field, Header, Screen, Section, Status, palette } from "@/components/portal/ui";
import { emptySettings, loadSettings, saveSettings, type TeamSettings } from "@/lib/settings";
import { pickLogo } from "@/lib/uploads";

export default function SettingsScreen() {
  const [draft, setDraft] = useState<TeamSettings>(emptySettings);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

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
      </ScrollView>
      <ModuleMenu visible={menuOpen} onClose={() => setMenuOpen(false)} currentPath="/settings" />
    </Screen>
  );
}
