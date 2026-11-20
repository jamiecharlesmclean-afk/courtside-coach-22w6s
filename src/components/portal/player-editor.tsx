// Add or update a player or staff member: profile, contact, availability and coach notes.
import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import X from "lucide-react-native/dist/esm/icons/x.mjs";
import { Button, Chip, Field, Status, palette, styles as ui } from "@/components/portal/ui";
import {
  AVAILABILITY, DOMINANT_HANDS, ENTRY_KINDS, POSITIONS, STAFF_PERMISSIONS, STAFF_ROLES, STATUSES,
  fullName, type Availability, type EntryKind, type PlayerProfile, type RosterStatus,
} from "@/lib/roster";

const BADGE: Record<Availability, { bg: string; fg: string }> = {
  Available: { bg: "#e4f3d0", fg: "#2c5514" },
  Limited: { bg: "#fff0cc", fg: "#6b4300" },
  Out: { bg: "#fde0e0", fg: "#8c1717" },
};

export function AvailabilityBadge({ status }: { status: Availability }) {
  return (
    <View
      accessibilityLabel={`Availability: ${status}`}
      style={{ alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: BADGE[status].bg }}
    >
      <Text style={{ fontSize: 12, fontWeight: "700", color: BADGE[status].fg }}>{status}</Text>
    </View>
  );
}

export type PersonDraft = Omit<PlayerProfile, "id" | "name"> & { name?: string };

export function blankPerson(kind: EntryKind): PersonDraft {
  return {
    first_name: "", last_name: "", number: "-", position: "", height: "", weight: "", dominant_hand: "",
    phone: "", address: "", availability: "Available", date_of_birth: "", emergency_contact: "", emergency_phone: "", coach_notes: "",
    status: "Active" as RosterStatus, archived: false, kind, staff_role: kind === "Staff" ? "Assistant coach" : "",
  };
}

export function PlayerEditor({
  player,
  defaultKind = "Player",
  onSave,
  onDelete,
  onClose,
}: {
  player: PlayerProfile | null; // null when adding someone new
  defaultKind?: EntryKind;
  onSave: (draft: PersonDraft) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<PersonDraft>(() => {
    if (!player) return blankPerson(defaultKind);
    const { id: _id, ...rest } = player;
    return { ...rest, availability: rest.availability ?? "Available" };
  });
  const [message, setMessage] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isStaff = draft.kind === "Staff";
  const title = player ? `Update ${player.name || "person"}` : isStaff ? "Add staff member" : "Add player";

  const set = (key: keyof PersonDraft) => (value: string) => setDraft((d) => ({ ...d, [key]: value }));

  const save = () => {
    const first = draft.first_name.trim();
    const last = draft.last_name.trim();
    if (!first || !last) {
      setMessage("Enter the first and last name before saving.");
      return;
    }
    const clean = Object.fromEntries(
      Object.entries(draft).map(([k, v]) => [k, typeof v === "string" ? v.trim() : v]),
    ) as PersonDraft;
    onSave({
      ...clean,
      name: fullName(first, last),
      number: isStaff ? "-" : clean.number || "-",
      availability: isStaff ? undefined : clean.availability,
    });
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose} accessibilityViewIsModal>
      <View style={{ flex: 1, backgroundColor: "rgba(23,35,30,0.45)", justifyContent: "center", alignItems: "center", padding: 16 }}>
        <View
          accessibilityRole="none"
          accessibilityLabel={title}
          style={{ width: "100%", maxWidth: 560, maxHeight: "92%", backgroundColor: palette.surface, borderRadius: 16, borderWidth: 1, borderColor: palette.line, overflow: "hidden" }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: palette.line }}>
            <Text accessibilityRole="header" style={ui.name}>{title}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={{ minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" }}>
              <X color={palette.ink} size={20} />
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, gap: 12 }}>
            <Status message={message} />

            <Text style={ui.sectionLabel}>Who</Text>
            <View style={ui.row}>
              {ENTRY_KINDS.map((kind) => (
                <Chip key={kind} label={kind === "Player" ? "Player" : "Staff member"} selected={draft.kind === kind} onPress={() => setDraft((d) => ({ ...d, kind }))} />
              ))}
            </View>
            <Field label="First name" value={draft.first_name} onChangeText={set("first_name")} autoComplete="given-name" />
            <Field label="Last name" value={draft.last_name} onChangeText={set("last_name")} autoComplete="family-name" />
            {isStaff ? (
              <>
                <Text style={ui.sectionLabel}>Staff role and permissions</Text>
                <View style={ui.row}>
                  {STAFF_ROLES.map((role) => (
                    <Chip key={role} label={role} selected={draft.staff_role === role} onPress={() => setDraft((d) => ({ ...d, staff_role: role }))} />
                  ))}
                </View>
                {STAFF_ROLES.includes(draft.staff_role as never) ? (
                  <Text style={ui.meta}>{STAFF_PERMISSIONS[draft.staff_role as keyof typeof STAFF_PERMISSIONS]}</Text>
                ) : null}
              </>
            ) : (
              <>
                <Field label="Jersey number" value={draft.number === "-" ? "" : draft.number} onChangeText={set("number")} keyboardType="number-pad" />
                <Text style={ui.sectionLabel}>Position</Text>
                <View style={ui.row}>
                  {POSITIONS.map((position) => (
                    <Chip key={position} label={position} selected={draft.position === position} onPress={() => setDraft((d) => ({ ...d, position: d.position === position ? "" : position }))} />
                  ))}
                </View>
                <Text style={ui.sectionLabel}>Body and handedness</Text>
                <Field label="Height" hint="For example 1.82 m or 6 ft 0 in" value={draft.height} onChangeText={set("height")} />
                <Field label="Weight" value={draft.weight} onChangeText={set("weight")} />
                <Text style={ui.sectionLabel}>Dominant hand</Text>
                <View style={ui.row}>
                  {DOMINANT_HANDS.map((hand) => (
                    <Chip key={hand} label={hand} selected={draft.dominant_hand === hand} onPress={() => setDraft((d) => ({ ...d, dominant_hand: d.dominant_hand === hand ? "" : hand }))} />
                  ))}
                </View>
              </>
            )}

            <Text style={ui.sectionLabel}>Status</Text>
            <View style={ui.row}>
              {STATUSES.map((status) => (
                <Chip key={status} label={status} selected={draft.status === status} onPress={() => setDraft((d) => ({ ...d, status }))} />
              ))}
            </View>
            <Text style={ui.meta}>Inactive people stay on the roster but are left out of attendance and the planner.</Text>

            <Text style={ui.sectionLabel}>Contact</Text>
            <Field label="Date of birth" hint="Format: YYYY-MM-DD" value={draft.date_of_birth ?? ""} onChangeText={set("date_of_birth")} />
            <Field label="Contact telephone" value={draft.phone} onChangeText={set("phone")} keyboardType="phone-pad" autoComplete="tel" />
            <Field label="Address" value={draft.address} onChangeText={set("address")} />
            <Field label="Emergency contact name" value={draft.emergency_contact ?? ""} onChangeText={set("emergency_contact")} />
            <Field label="Emergency contact phone" value={draft.emergency_phone ?? ""} onChangeText={set("emergency_phone")} keyboardType="phone-pad" />

            {isStaff ? null : (
              <>
                <Text style={ui.sectionLabel}>Availability</Text>
                <View style={ui.row}>
                  {AVAILABILITY.map((status) => (
                    <Chip key={status} label={status} selected={draft.availability === status} onPress={() => setDraft((d) => ({ ...d, availability: status }))} />
                  ))}
                </View>
              </>
            )}

            <Text style={ui.sectionLabel}>Coach notes</Text>
            <Field label="Coach notes" hint="Visible to everyone on the roster." value={draft.coach_notes} onChangeText={set("coach_notes")} multiline />

            <View style={ui.actions}>
              <Button label={player ? "Save changes" : "Save"} onPress={save} />
              <Button label="Cancel" variant="secondary" onPress={onClose} />
            </View>
            {player && onDelete ? (
              <View style={{ gap: 8, marginTop: 4 }}>
                <Text style={ui.meta}>Deleting removes this record from this device. Archive keeps it.</Text>
                <Button
                  label={confirmDelete ? "Confirm delete" : "Delete record"}
                  variant="danger"
                  onPress={() => (confirmDelete ? onDelete() : setConfirmDelete(true))}
                />
              </View>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
