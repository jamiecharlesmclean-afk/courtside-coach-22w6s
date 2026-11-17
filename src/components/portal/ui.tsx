// Shared, accessible building blocks for the portal screens. Colours have
// WCAG AA contrast on the background; touch targets are at least 44pt.
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";

export const palette = {
  bg: "#f5f5f1",
  surface: "#ffffff",
  ink: "#17231e",
  muted: "#55605a",
  line: "#d9ddd5",
  accent: "#d8fc58",
  deep: "#193e32",
  onDeep: "#ffffff",
  danger: "#9b1c1c",
  focus: "#193e32",
};

export function Screen({ children }: { children: ReactNode }) {
  return <View style={styles.screen}>{children}</View>;
}

export function Header({ title, detail }: { title: string; detail: string }) {
  return (
    <View style={styles.header}>
      <Text accessibilityRole="header" style={styles.title}>{title}</Text>
      <Text style={styles.detail}>{detail}</Text>
    </View>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.card} accessibilityLabel={title}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export function Field({
  label,
  hint,
  ...input
}: TextInputProps & { label: string; hint?: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={palette.muted}
        style={[styles.input, input.multiline && styles.multiline]}
        {...input}
      />
    </View>
  );
}

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
}) {
  const colors = {
    primary: { bg: palette.deep, fg: palette.onDeep, border: palette.deep },
    secondary: { bg: palette.surface, fg: palette.ink, border: palette.line },
    danger: { bg: palette.surface, fg: palette.danger, border: palette.danger },
  }[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ focused, pressed }) => [
        styles.button,
        { backgroundColor: colors.bg, borderColor: colors.border },
        focused && styles.focus,
        pressed && { opacity: 0.85 },
        disabled && { opacity: 0.5 },
      ]}
    >
      <Text style={[styles.buttonText, { color: colors.fg }]}>{label}</Text>
    </Pressable>
  );
}

// A selectable option (category, difficulty). Announced as a selected button.
export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ focused }) => [
        styles.chip,
        selected && { backgroundColor: palette.deep, borderColor: palette.deep },
        focused && styles.focus,
      ]}
    >
      <Text style={[styles.chipText, selected && { color: palette.onDeep }]}>{label}</Text>
    </Pressable>
  );
}

export function Status({ message }: { message: string }) {
  if (!message) return null;
  return (
    <Text accessibilityLiveRegion="polite" accessibilityRole="alert" style={styles.status}>
      {message}
    </Text>
  );
}

export function Empty({ text }: { text: string }) {
  return <Text style={styles.empty}>{text}</Text>;
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg, width: "100%", maxWidth: 760, alignSelf: "center" },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8, gap: 6 },
  title: { fontSize: 26, fontWeight: "700", color: palette.ink },
  detail: { fontSize: 15, color: palette.muted, lineHeight: 22 },
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 14,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.line,
    gap: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: palette.ink },
  field: { gap: 6 },
  label: { fontSize: 15, fontWeight: "600", color: palette.ink },
  hint: { fontSize: 13, color: palette.muted },
  input: {
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: palette.ink,
    borderWidth: 1,
    borderColor: palette.muted,
    borderRadius: 10,
    backgroundColor: palette.surface,
  },
  multiline: { minHeight: 96, textAlignVertical: "top" },
  button: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { fontSize: 15, fontWeight: "600" },
  chip: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: palette.muted,
    backgroundColor: palette.surface,
    justifyContent: "center",
  },
  chipText: { fontSize: 14, fontWeight: "600", color: palette.ink },
  focus: { outlineWidth: 3, outlineColor: palette.focus, outlineStyle: "solid" } as any,
  status: { marginHorizontal: 16, marginTop: 12, fontSize: 15, color: palette.deep, fontWeight: "600" },
  empty: { marginHorizontal: 16, marginTop: 16, fontSize: 15, color: palette.muted },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  meta: { fontSize: 14, color: palette.muted, lineHeight: 20 },
  name: { fontSize: 17, fontWeight: "700", color: palette.ink },
  sectionLabel: { fontSize: 13, fontWeight: "700", color: palette.muted, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 4 },
});
