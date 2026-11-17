import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle as SvgCircle, G, Path } from "react-native-svg";

// A play diagram: players, ball and the lines drawn between them, in court units (280 x 150 = FIBA 28 m x 15 m).

export type BoardView = "Full court" | "Half court" | "Other half";
export const BOARD_VIEWS: BoardView[] = ["Full court", "Half court", "Other half"];
// Which part of the court is shown, in court units. Half court is the attacking half (right), Other half the defending half (left).
const VIEW_WINDOW: Record<BoardView, { x0: number; w: number }> = {
  "Full court": { x0: 0, w: 280 },
  "Half court": { x0: 140, w: 140 },
  "Other half": { x0: 0, w: 140 },
};

export type BoardOrientation = "horizontal" | "vertical";

export type BoardToken = { id: string; kind: "offense" | "defense" | "ball"; label: string; x: number; y: number };
export type BoardLineKind = "pass" | "cut" | "screen" | "dribble";
export type BoardLine = { id: string; kind: BoardLineKind; x1: number; y1: number; x2: number; y2: number };
export type BoardDiagram = { tokens: BoardToken[]; lines: BoardLine[] };

export const STARTING_FORMATION: BoardDiagram = {
  tokens: [
    { id: "o1", kind: "offense", label: "1", x: 31, y: 38 },
    { id: "o2", kind: "offense", label: "2", x: 120, y: 23 },
    { id: "o3", kind: "offense", label: "3", x: 164, y: 23 },
    { id: "o4", kind: "offense", label: "4", x: 49, y: 107 },
    { id: "o5", kind: "offense", label: "5", x: 226, y: 100 },
  ],
  lines: [],
};

export const BOARD_TOOLS = ["Select & move", "Add player", "Add defender", "Ball", "Pass", "Cut", "Screen", "Dribble"] as const;
export type BoardTool = (typeof BOARD_TOOLS)[number];

export const TOOL_HINTS: Record<BoardTool, string> = {
  "Select & move": "Tap a player to select them, then tap the court to move them. Tap the same player again to deselect.",
  "Add player": "Tap the court to place the next numbered player (up to 5).",
  "Add defender": "Tap the court to place the next defender, X1 to X5 (up to 5).",
  Ball: "Tap the court to place the ball.",
  Pass: "Tap where the pass starts, then tap where the receiver gets the ball.",
  Cut: "Tap where the cut starts, then tap where it ends. The arrow shows the path.",
  Screen: "Tap where the screen starts, then tap the spot being screened. The bar marks the screen.",
  Dribble: "Tap where the dribble starts, then tap where it ends.",
};

const LINE_TOOLS: Partial<Record<BoardTool, BoardLineKind>> = { Pass: "pass", Cut: "cut", Screen: "screen", Dribble: "dribble" };
const LINE_STYLE: Record<BoardLineKind, { color: string; dash?: string; width: number }> = {
  pass: { color: "#1f5c48", dash: "4 3", width: 1.6 },
  cut: { color: "#193e32", width: 1.8 },
  screen: { color: "#c7650f", width: 2 },
  dribble: { color: "#2f6cb3", dash: "1 3", width: 2.2 },
};
const MAX_PLAYERS = 5;
const REACH = 8; // how close a line start must be to a player for that player to move when animated

function newId() {
  return Math.random().toString(36).slice(2, 9);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

// Line body plus the arrow head (or the screen bar) at its end.
function lineShape(line: BoardLine) {
  const { x1, y1, x2, y2, kind } = line;
  const angle = Math.atan2(y2 - y1, x2 - x1);
  if (kind === "screen") {
    const px = -Math.sin(angle) * 6;
    const py = Math.cos(angle) * 6;
    return { body: `M${x1} ${y1} L${x2} ${y2}`, head: `M${x2 + px} ${y2 + py} L${x2 - px} ${y2 - py}` };
  }
  const size = 4.5;
  const left = [x2 - size * Math.cos(angle - 0.45), y2 - size * Math.sin(angle - 0.45)];
  const right = [x2 - size * Math.cos(angle + 0.45), y2 - size * Math.sin(angle + 0.45)];
  return { body: `M${x1} ${y1} L${x2} ${y2}`, head: `M${left[0]} ${left[1]} L${x2} ${y2} L${right[0]} ${right[1]}` };
}

export function PlayBoard({
  diagram,
  view = "Full court",
  orientation = "horizontal",
  editable = false,
  tool = "Select & move",
  onChange,
  animateKey = 0,
  actionsAbove = false,
}: {
  diagram: BoardDiagram;
  /** Show the Undo / Clear / Reset row above the court, next to the drawing tools. */
  actionsAbove?: boolean;
  view?: BoardView;
  orientation?: BoardOrientation;
  editable?: boolean;
  tool?: BoardTool;
  onChange?: (next: BoardDiagram) => void;
  animateKey?: number;
}) {
  const { x0, w } = VIEW_WINDOW[view];
  const vertical = orientation === "vertical";
  // Court units are always stored as 280 x 150. Vertical rotates the court so the baseline is at the top.
  const boxW = vertical ? 150 : w;
  const boxH = vertical ? w : 150;
  const boardRef = useRef<View>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pending, setPending] = useState<{ x: number; y: number } | null>(null);
  const [history, setHistory] = useState<BoardDiagram[]>([]);
  const [frame, setFrame] = useState(0);
  const [message, setMessage] = useState("");

  // Animate: frames 1-4 move each player along the cut, screen or dribble that starts at them, and the ball along a pass. Frame 0 is the set position.
  useEffect(() => {
    if (!animateKey) return;
    let tick = 0;
    setFrame(0);
    const timer = setInterval(() => {
      tick += 1;
      setFrame(tick <= 4 ? tick : 0);
      if (tick >= 5) clearInterval(timer);
    }, 450);
    return () => clearInterval(timer);
  }, [animateKey]);

  useEffect(() => {
    setPending(null);
    setSelectedId(null);
    setMessage("");
  }, [tool]);

  function commit(next: BoardDiagram) {
    if (!onChange) return;
    setHistory((past) => [...past.slice(-29), diagram]);
    setMessage("");
    onChange(next);
  }

  function undo() {
    const previous = history[history.length - 1];
    if (!previous || !onChange) {
      setMessage("Nothing to undo.");
      return;
    }
    setHistory((past) => past.slice(0, -1));
    setSelectedId(null);
    setPending(null);
    onChange(previous);
  }

  function placeAt(x: number, y: number) {
    if (tool === "Select & move") {
      if (!selectedId) {
        setMessage("Tap a player first, then tap the court to move them.");
        return;
      }
      commit({ ...diagram, tokens: diagram.tokens.map((t) => (t.id === selectedId ? { ...t, x, y } : t)) });
      return;
    }
    if (tool === "Add player" || tool === "Add defender") {
      const kind = tool === "Add player" ? "offense" : "defense";
      const existing = diagram.tokens.filter((t) => t.kind === kind);
      if (existing.length >= MAX_PLAYERS) {
        setMessage(`Up to ${MAX_PLAYERS} ${kind === "offense" ? "players" : "defenders"} on the board. Remove one first.`);
        return;
      }
      const used = new Set(existing.map((t) => t.label));
      let n = 1;
      while (used.has(kind === "offense" ? String(n) : `X${n}`)) n += 1;
      const label = kind === "offense" ? String(n) : `X${n}`;
      commit({ ...diagram, tokens: [...diagram.tokens, { id: newId(), kind, label, x, y }] });
      return;
    }
    if (tool === "Ball") {
      const hasBall = diagram.tokens.some((t) => t.kind === "ball");
      const tokens = hasBall
        ? diagram.tokens.map((t) => (t.kind === "ball" ? { ...t, x, y } : t))
        : [...diagram.tokens, { id: newId(), kind: "ball" as const, label: "", x, y }];
      commit({ ...diagram, tokens });
      return;
    }
    const kind = LINE_TOOLS[tool];
    if (!kind) return;
    if (!pending) {
      setPending({ x, y });
      setMessage("Now tap where it ends.");
      return;
    }
    const distance = Math.hypot(x - pending.x, y - pending.y);
    setPending(null);
    if (distance < 4) {
      setMessage("Tap a point further away to draw the line.");
      return;
    }
    commit({ ...diagram, lines: [...diagram.lines, { id: newId(), kind, x1: pending.x, y1: pending.y, x2: x, y2: y }] });
  }

  // locationX/Y are relative to the board in pixels; convert them to court units for the current orientation.
  function tapCourt(locationX: number, locationY: number, box: { width: number; height: number }) {
    if (!editable || !box.width || !box.height || !Number.isFinite(locationX) || !Number.isFinite(locationY)) return;
    const fx = clamp(locationX / box.width, 0, 1) * boxW;
    const fy = clamp(locationY / box.height, 0, 1) * boxH;
    if (vertical) {
      // Vertical: the screen's vertical axis runs along the court's length, and its horizontal axis across the width.
      placeAt(clamp(x0 + fy, x0, x0 + w), fx);
    } else {
      placeAt(clamp(x0 + fx, x0, x0 + w), fy);
    }
  }

  function tapToken(token: BoardToken) {
    if (!editable) return;
    if (tool === "Select & move") {
      setSelectedId((current) => (current === token.id ? null : token.id));
      setMessage("");
      return;
    }
    placeAt(token.x, token.y);
  }

  function removeSelected() {
    if (!selectedId) {
      setMessage("Tap a player to select them first.");
      return;
    }
    commit({ ...diagram, tokens: diagram.tokens.filter((t) => t.id !== selectedId) });
    setSelectedId(null);
  }

  function shownPosition(token: BoardToken) {
    if (!frame) return { x: token.x, y: token.y };
    const movers = token.kind === "ball" ? ["pass"] : ["cut", "screen", "dribble"];
    const line = diagram.lines.find((l) => movers.includes(l.kind) && Math.hypot(l.x1 - token.x, l.y1 - token.y) < REACH);
    if (!line) return { x: token.x, y: token.y };
    const k = frame / 4;
    return { x: token.x + (line.x2 - token.x) * k, y: token.y + (line.y2 - token.y) * k };
  }

  // Position of a court point as a percentage of the board, in the current orientation.
  function percentAt(x: number, y: number) {
    if (vertical) return { left: `${(y / 150) * 100}%` as const, top: `${((x - x0) / w) * 100}%` as const };
    return { left: `${((x - x0) / w) * 100}%` as const, top: `${(y / 150) * 100}%` as const };
  }

  // Court drawn in court units. Vertical turns it a quarter turn so the court runs top to bottom.
  const courtGroupTransform = vertical ? `matrix(0 1 1 0 0 ${-x0})` : undefined;

  const actions = editable ? (
    <View style={styles.actions}>
      <ActionButton label="Undo" onPress={undo} />
      <ActionButton label="Remove selected player" onPress={removeSelected} />
      <ActionButton label="Clear drawings" onPress={() => commit({ ...diagram, lines: [] })} />
      <ActionButton label="Reset players" onPress={() => commit({ ...STARTING_FORMATION, lines: diagram.lines })} />
    </View>
  ) : null;

  return (
    <View style={{ gap: 10 }}>
      {actionsAbove ? actions : null}
      <View
        ref={boardRef}
        onLayout={(event) => setSize({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height })}
        style={[styles.board, { aspectRatio: boxW / boxH }, vertical && styles.boardVertical]}
      >
        <Svg viewBox={vertical ? `0 0 150 ${w}` : `${x0} 0 ${w} 150`} preserveAspectRatio="xMidYMid meet" style={StyleSheet.absoluteFill}>
          <G transform={courtGroupTransform}>
            {/* FIBA court lines, 28 m x 15 m at 10 units per metre. */}
            <Path d="M0 0 H280 V150 H0 Z M140 0 V150 M0 50.5 H58 V99.5 H0 M280 50.5 H222 V99.5 H280 M58 57 A18 18 0 0 1 58 93 M222 57 A18 18 0 0 0 222 93 M12 66 V84 M268 66 V84 M15.75 62.5 A12.5 12.5 0 0 1 15.75 87.5 M264.25 62.5 A12.5 12.5 0 0 0 264.25 87.5 M0 9 H29.9 A67.5 67.5 0 0 1 29.9 141 H0 M280 9 H250.1 A67.5 67.5 0 0 0 250.1 141 H280" fill="none" stroke="#c4cdc1" strokeWidth={1.4} />
            <SvgCircle cx={140} cy={75} r={18} fill="none" stroke="#c4cdc1" strokeWidth={1.4} />
            {diagram.lines.map((line) => {
              const shape = lineShape(line);
              const style = LINE_STYLE[line.kind];
              return (
                <G key={line.id}>
                  <Path d={shape.body} fill="none" stroke={style.color} strokeWidth={style.width} strokeDasharray={style.dash} strokeLinecap="round" />
                  <Path d={shape.head} fill="none" stroke={style.color} strokeWidth={style.width} strokeLinecap="round" strokeLinejoin="round" />
                </G>
              );
            })}
            {pending ? <SvgCircle cx={pending.x} cy={pending.y} r={4} fill="none" stroke="#c7650f" strokeWidth={1.5} strokeDasharray="2 2" /> : null}
          </G>
        </Svg>

        {editable ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Court. Tap to place or move with the selected tool."
            onPress={(event) => {
              const { locationX, locationY, pageX, pageY } = event.nativeEvent;
              if (typeof locationX === "number" && typeof locationY === "number") {
                tapCourt(locationX, locationY, size);
                return;
              }
              boardRef.current?.measure((_x, _y, width, height, left, top) => tapCourt(pageX - left, pageY - top, { width, height }));
            }}
            style={StyleSheet.absoluteFill}
          />
        ) : null}

        {diagram.tokens.map((token) => {
          const position = shownPosition(token);
          if (position.x < x0 || position.x > x0 + w) return null;
          const selected = token.id === selectedId;
          const { left, top } = percentAt(position.x, position.y);
          if (token.kind === "ball") {
            return (
              <Pressable
                key={token.id}
                accessibilityLabel="Ball"
                disabled={!editable}
                onPress={() => tapToken(token)}
                hitSlop={12}
                style={[styles.ball, { left, top }]}
              />
            );
          }
          const defense = token.kind === "defense";
          return (
            <Pressable
              key={token.id}
              accessibilityRole={editable ? "button" : undefined}
              accessibilityLabel={`${defense ? "Defender" : "Player"} ${token.label}${selected ? ", selected" : ""}`}
              accessibilityState={{ selected }}
              disabled={!editable}
              onPress={() => tapToken(token)}
              hitSlop={8}
              style={[styles.token, defense ? styles.defense : styles.offense, selected && styles.selected, { left, top }]}
            >
              <Text style={[styles.tokenText, defense && styles.defenseText]}>{token.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {editable ? (
        <View style={{ gap: 10 }}>
          <Text accessibilityLiveRegion="polite" style={styles.hint}>{message || TOOL_HINTS[tool]}</Text>
          {actionsAbove ? null : actions}
        </View>
      ) : null}
      {editable && pending ? <Text style={styles.hint}>Line started. Tap the end point, or switch tools to cancel.</Text> : null}
    </View>
  );
}

// Drawing tools as a row of selectable buttons.
export function ToolButtons({ tool, onSelect }: { tool: BoardTool; onSelect: (tool: BoardTool) => void }) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel="Drawing tools" style={styles.toolRow}>
      {BOARD_TOOLS.map((item) => {
        const selected = tool === item;
        return (
          <Pressable
            key={item}
            accessibilityRole="radio"
            accessibilityLabel={item}
            accessibilityState={{ selected, checked: selected }}
            hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
            onPress={() => onSelect(item)}
            style={[styles.toolButton, selected && styles.toolButtonActive]}
          >
            <Text style={[styles.toolButtonText, selected && styles.toolButtonTextActive]}>{item}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ActionButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.action}>
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

const DEEP = "#193e32";
const INK = "#17231e";
const LINE = "#d9ddd5";

const styles = StyleSheet.create({
  board: { width: "100%", backgroundColor: "#f7f8f4", borderRadius: 14, borderWidth: 1, borderColor: LINE, overflow: "hidden" },
  boardVertical: { maxWidth: 380, alignSelf: "center" },
  token: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 14,
    marginLeft: -14,
    marginTop: -14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  offense: { backgroundColor: DEEP },
  defense: { backgroundColor: "#ffffff", borderColor: INK },
  selected: { borderColor: "#d8fc58", borderWidth: 3 },
  tokenText: { color: "#ffffff", fontWeight: "800", fontSize: 12 },
  defenseText: { color: INK, fontSize: 10 },
  ball: {
    position: "absolute",
    width: 14,
    height: 14,
    borderRadius: 7,
    marginLeft: -7,
    marginTop: -7,
    backgroundColor: "#e0873f",
    borderWidth: 1,
    borderColor: "#ffffff",
  },
  hint: { fontSize: 13, color: "#55605a", lineHeight: 19 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  action: {
    minHeight: 44,
    paddingHorizontal: 12,
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: "#ffffff",
  },
  actionText: { fontSize: 13, fontWeight: "700", color: INK },
  toolRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  toolButton: {
    minHeight: 32,
    paddingHorizontal: 10,
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: "#ffffff",
  },
  toolButtonActive: { backgroundColor: DEEP, borderColor: DEEP },
  toolButtonText: { fontSize: 12, fontWeight: "700", color: INK },
  toolButtonTextActive: { color: "#ffffff" },
});
