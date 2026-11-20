// Accessible dropdown: a labelled button that shows the current value and opens a list of options.
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import ChevronDown from "lucide-react-native/dist/esm/icons/chevron-down.mjs";
import { palette, styles as ui } from "@/components/portal/ui";

type Props = {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  hint?: string;
};

export function Dropdown({ label, value, options, onChange, hint }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontSize: 15, fontWeight: "600", color: palette.ink }}>{label}</Text>
      {hint ? <Text style={ui.meta}>{hint}</Text> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value}`}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((o) => !o)}
        style={({ pressed }) => [
          {
            minHeight: 48,
            paddingHorizontal: 14,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: palette.line,
            backgroundColor: palette.surface,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          },
          pressed && { opacity: 0.85 },
        ]}
      >
        <Text style={{ fontSize: 16, color: palette.ink, fontWeight: "500" }}>{value}</Text>
        <ChevronDown color={palette.deep} size={18} style={{ transform: [{ rotate: open ? "180deg" : "0deg" }] }} />
      </Pressable>
      {open ? (
        <View accessibilityRole="menu" style={{ borderWidth: 1, borderColor: palette.line, borderRadius: 12, backgroundColor: palette.surface, overflow: "hidden" }}>
          {options.map((option) => {
            const selected = option === value;
            return (
              <Pressable
                key={option}
                accessibilityRole="menuitem"
                accessibilityLabel={option}
                accessibilityState={{ selected }}
                onPress={() => {
                  onChange(option);
                  setOpen(false);
                }}
                style={({ pressed }) => [
                  {
                    minHeight: 44,
                    paddingHorizontal: 14,
                    justifyContent: "center",
                    backgroundColor: selected ? palette.accent : palette.surface,
                    borderTopWidth: 1,
                    borderTopColor: palette.line,
                  },
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text style={{ fontSize: 16, color: palette.ink, fontWeight: selected ? "700" : "400" }}>{option}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
