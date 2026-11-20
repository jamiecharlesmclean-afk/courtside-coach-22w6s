// Starter playbook: the most-used half-court offence, out-of-bounds, press-break and defensive sets.
// Diagrams use court units (280 x 150, FIBA 28 m x 15 m). Attacking basket is on the right at (264, 75).
import type { BoardDiagram, BoardLine, BoardLineKind, BoardToken } from "@/components/portal/play-board";

export const PLAYBOOK_KEY = "courtside-coach:plays-v2";
const LEGACY_PLAYS_KEY = "courtside-coach:plays";

export type Play = {
  name: string;
  type: string;
  time: string;
  color: string;
  tag: string;
  players: string;
  coaching: string;
  diagram?: BoardDiagram;
};

type Spot = [label: string, x: number, y: number];
type Move = [kind: BoardLineKind, x1: number, y1: number, x2: number, y2: number];

// Builds a diagram from offence spots, defence spots and drawn movement lines.
function layout(offence: Spot[], defence: Spot[], moves: Move[]): BoardDiagram {
  const tokens: BoardToken[] = [
    ...offence.map(([label, x, y]) => ({ id: `o-${label}`, kind: "offense" as const, label, x, y })),
    ...defence.map(([label, x, y]) => ({ id: `d-${label}`, kind: "defense" as const, label, x, y })),
  ];
  const lines: BoardLine[] = moves.map(([kind, x1, y1, x2, y2], i) => ({ id: `${kind}-${i}`, kind, x1, y1, x2, y2 }));
  return { tokens, lines };
}

export const STARTER_PLAYS: Play[] = [
  {
    name: "Horns Twist",
    type: "HALF COURT OFFENCE",
    time: "0:18",
    color: "#d9fa57",
    tag: "QUICK HIT",
    players: "5 players",
    coaching: "Start with the ball at the top. The horns screen for the wings, then the wing cuts off the screen. Keep the first pass quick and look for the drive.",
    diagram: layout(
      [["1", 195, 75], ["2", 250, 22], ["3", 250, 128], ["4", 222, 52], ["5", 222, 98]],
      [["X1", 180, 75], ["X2", 232, 26], ["X3", 232, 124], ["X4", 210, 52], ["X5", 210, 98]],
      [["pass", 195, 75, 250, 22], ["screen", 222, 98, 232, 124], ["cut", 250, 128, 236, 108]],
    ),
  },
  {
    name: "Spain Pick and Roll",
    type: "HALF COURT OFFENCE",
    time: "0:22",
    color: "#b9d6ff",
    tag: "CORE OFFENCE",
    players: "5 players",
    coaching: "The back screen by 4 frees the roller. Read the low defender: if they tag the roll, pass to the open shooter; if not, the roller finishes.",
    diagram: layout(
      [["1", 210, 75], ["2", 255, 22], ["3", 258, 128], ["4", 224, 118], ["5", 236, 70]],
      [["X1", 224, 72], ["X2", 240, 26], ["X3", 242, 124], ["X4", 234, 108], ["X5", 252, 75]],
      [["screen", 236, 70, 222, 75], ["screen", 224, 118, 240, 90], ["cut", 236, 70, 256, 75], ["pass", 210, 75, 236, 70]],
    ),
  },
  {
    name: "Flex Offence",
    type: "HALF COURT OFFENCE",
    time: "0:24",
    color: "#c9e8d8",
    tag: "SET OFFENCE",
    players: "5 players",
    coaching: "Screen away for the wing, then cut hard to the basket. Look for the shot off the cut before passing back out to the wing.",
    diagram: layout(
      [["1", 200, 75], ["2", 246, 24], ["3", 258, 128], ["4", 222, 52], ["5", 226, 100]],
      [["X1", 186, 75], ["X2", 236, 30], ["X3", 240, 120], ["X4", 214, 58], ["X5", 220, 94]],
      [["screen", 226, 100, 240, 30], ["cut", 246, 24, 222, 60], ["pass", 200, 75, 246, 24]],
    ),
  },
  {
    name: "Motion Offence",
    type: "HALF COURT OFFENCE",
    time: "0:30",
    color: "#f2d6a2",
    tag: "PRINCIPLES",
    players: "5 players",
    coaching: "Pass, cut, then screen away. Keep spacing and move the ball until a cut or a shot opens. The pass always goes to the side the defence is leaving.",
    diagram: layout(
      [["1", 200, 75], ["2", 248, 24], ["3", 252, 126], ["4", 226, 52], ["5", 230, 100]],
      [["X1", 188, 80], ["X2", 236, 30], ["X3", 240, 120], ["X4", 216, 56], ["X5", 222, 96]],
      [["pass", 200, 75, 248, 24], ["pass", 248, 24, 252, 126], ["cut", 200, 75, 232, 84]],
    ),
  },
  {
    name: "Baseline Stack",
    type: "OUT OF BOUNDS",
    time: "0:14",
    color: "#ffc99b",
    tag: "SIDELINE",
    players: "5 players",
    coaching: "Set the screen flat and time the cut. The inbounder keeps the ball moving to the first open player, and never throws into a crowd.",
    diagram: layout(
      [["5", 278, 75], ["1", 220, 75], ["2", 240, 40], ["3", 240, 112], ["4", 252, 75]],
      [["X1", 226, 75], ["X2", 248, 46], ["X3", 250, 104], ["X4", 244, 82], ["X5", 262, 75]],
      [["screen", 252, 75, 246, 42], ["cut", 240, 112, 262, 130], ["pass", 278, 75, 240, 112]],
    ),
  },
  {
    name: "Diamond Press Break",
    type: "PRESS BREAK",
    time: "0:26",
    color: "#e8c4ef",
    tag: "COUNTER",
    players: "5 players",
    coaching: "Keep the diamond shape. The top player is the release valve. Pass to the open side and never into the trap.",
    diagram: layout(
      [["5", 30, 75], ["1", 72, 75], ["2", 98, 40], ["3", 98, 110], ["4", 122, 75]],
      [["X1", 46, 75], ["X2", 112, 42], ["X3", 112, 108], ["X4", 132, 75], ["X5", 84, 95]],
      [["pass", 30, 75, 72, 75], ["pass", 72, 75, 98, 40], ["pass", 98, 40, 122, 75]],
    ),
  },
  {
    name: "Man-to-Man Help",
    type: "DEFENCE",
    time: "0:20",
    color: "#cfe0ff",
    tag: "MAN DEFENCE",
    players: "5 defenders",
    coaching: "Ball-you-help. Each defender sees the ball and their own man. On a drive, the nearest help steps in and the defender recovers to their man.",
    diagram: layout(
      [["1", 200, 75], ["2", 248, 24], ["3", 250, 126], ["4", 222, 52], ["5", 222, 98]],
      [["X1", 188, 75], ["X2", 240, 30], ["X3", 242, 120], ["X4", 214, 58], ["X5", 212, 94]],
      [["dribble", 200, 75, 224, 75], ["cut", 214, 94, 226, 84]],
    ),
  },
  {
    name: "2-3 Zone",
    type: "DEFENCE",
    time: "0:20",
    color: "#bfe9d0",
    tag: "ZONE",
    players: "5 defenders",
    coaching: "Top two guard the wings, bottom three protect the paint. Shift toward the ball, and keep the low defender ready to rotate to the corner.",
    diagram: layout(
      [["1", 160, 75], ["2", 206, 20], ["3", 206, 130], ["4", 254, 12], ["5", 254, 138]],
      [["X1", 186, 50], ["X2", 186, 100], ["X3", 236, 36], ["X4", 246, 75], ["X5", 236, 114]],
      [["pass", 160, 75, 206, 20], ["pass", 206, 20, 254, 12]],
    ),
  },
  {
    name: "3-2 Zone",
    type: "DEFENCE",
    time: "0:20",
    color: "#f7d9c4",
    tag: "ZONE",
    players: "5 defenders",
    coaching: "Pressure the top of the zone. On a pass into the corner, the wing defender steps out and the baseline defender slides to cover the short corner.",
    diagram: layout(
      [["1", 164, 75], ["2", 210, 16], ["3", 210, 134], ["4", 256, 30], ["5", 256, 120]],
      [["X1", 190, 40], ["X2", 196, 75], ["X3", 190, 110], ["X4", 238, 56], ["X5", 238, 94]],
      [["pass", 164, 75, 210, 16], ["pass", 210, 16, 256, 30]],
    ),
  },
  {
    name: "Full-Court Press",
    type: "DEFENCE",
    time: "0:16",
    color: "#e6e3ff",
    tag: "PRESS",
    players: "5 defenders",
    coaching: "1-2-1-1 press: trap the ball on the sideline. The back player covers the middle, and the other defenders rotate to the pass.",
    diagram: layout(
      [["1", 72, 75], ["2", 102, 28], ["3", 108, 122], ["4", 130, 62], ["5", 134, 96]],
      [["X1", 90, 75], ["X2", 118, 34], ["X3", 120, 116], ["X4", 150, 60], ["X5", 162, 96]],
      [["dribble", 72, 75, 60, 60]],
    ),
  },
  {
    name: "Closeout to Shooter",
    type: "DEFENCE",
    time: "0:10",
    color: "#ffd6d6",
    tag: "CLOSEOUT",
    players: "2 defenders",
    coaching: "Sprint to the shooter, chop the feet and get hands up. Stay between the shooter and the basket, and keep the help defender ready.",
    diagram: layout(
      [["3", 250, 30], ["4", 226, 100]],
      [["X3", 232, 38], ["X4", 218, 96]],
      [["cut", 232, 38, 246, 32]],
    ),
  },
  {
    name: "Box Set",
    type: "HALF COURT OFFENCE",
    time: "0:20",
    color: "#c7f2d4",
    tag: "SET OFFENCE",
    players: "5 players",
    coaching: "Ball goes to the top, then to the elbow. The low screens by 5 free 2 and 3 for the corner three or the cut to the basket. Read the defence: if they switch the screen, attack the mismatch.",
    diagram: layout(
      [["1", 206, 75], ["2", 262, 24], ["3", 262, 126], ["4", 232, 56], ["5", 236, 94]],
      [["X1", 196, 75], ["X2", 250, 30], ["X3", 250, 120], ["X4", 226, 62], ["X5", 226, 88]],
      [["pass", 206, 75, 232, 56], ["screen", 236, 94, 252, 26], ["cut", 262, 24, 246, 58]],
    ),
  },
  {
    name: "Pick and Roll Defence",
    type: "DEFENCE",
    time: "0:16",
    color: "#ffd6e0",
    tag: "PNR DEFENCE",
    players: "5 players",
    coaching: "X1 fights over the screen. X5 hedges for one count, then drops back to the roller. Never let the ball handler turn the corner. Recover to the roller and close out to the shooter.",
    diagram: layout(
      [["1", 214, 75], ["2", 262, 22], ["3", 262, 128], ["4", 250, 50], ["5", 232, 75]],
      [["X1", 204, 75], ["X2", 252, 30], ["X3", 252, 122], ["X4", 240, 58], ["X5", 222, 68]],
      [["screen", 232, 75, 216, 72]],
    ),
  },
  {
    name: "1-3-1 Zone",
    type: "DEFENCE",
    time: "0:18",
    color: "#e0d6ff",
    tag: "ZONE",
    players: "5 players",
    coaching: "X1 pressures the ball at the top. X2, X3 and X4 form the line across the lane. X5 stays at the back to cover the baseline. Shift as one unit, and rotate to the ball, not the man.",
    diagram: layout(
      [["1", 180, 75], ["2", 230, 22], ["3", 240, 75], ["4", 230, 128], ["5", 250, 40]],
      [["X1", 190, 75], ["X2", 226, 30], ["X3", 226, 75], ["X4", 226, 120], ["X5", 254, 75]],
      [["pass", 180, 75, 230, 22], ["pass", 230, 22, 230, 128], ["cut", 230, 128, 262, 118]],
    ),
  },
];

// Keeps the coach's own plays, drops the four old placeholder plays, and puts the starter set first.
const OLD_SAMPLE_NAMES = new Set(["Horns Twist", "Spain PnR", "Baseline Stack", "Diamond Press"]);

export function mergeSavedPlays(saved: Play[] | null): Play[] {
  const own = (saved ?? []).filter((play) => play && typeof play.name === "string" && !OLD_SAMPLE_NAMES.has(play.name) && !STARTER_PLAYS.some((s) => s.name === play.name));
  return [...STARTER_PLAYS, ...own];
}

export { LEGACY_PLAYS_KEY };
