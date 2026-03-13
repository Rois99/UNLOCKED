/**
 * Pixel-based radial node positions on a fixed 1100×1100 canvas.
 *
 * Positions are COMPUTED — not hardcoded — from branch angles and ring radii.
 * To add a branch or ring, extend the config objects below; the math handles
 * the rest automatically.
 *
 * Coordinate convention: angles are measured clockwise from 12 o'clock
 * (north), matching standard compass bearings.
 *   sin(θ) → x component (east = positive)
 *   cos(θ) → y component (south = positive, because CSS y-axis is inverted)
 *   x = cx + r * sin(θ_rad)
 *   y = cy - r * cos(θ_rad)   ← subtract because CSS y increases downward
 */

export const CANVAS_SIZE = { width: 1100, height: 1100 } as const;
export const TREE_CENTER = { x: 550, y: 490 } as const;

export type NodePosition = { x: number; y: number };
export type TreeLayout   = Record<string, NodePosition>;

// ── Geometry primitives ───────────────────────────────────────────────────────

/** Ring radii in pixels from the tree center. */
const RADII = {
  inner:  190,   // tier-1 / root skills
  middle: 340,   // tier-2 skills
  outer:  480,   // tier-3 skills
} as const;

type RingName = keyof typeof RADII;

/** Branch angles in degrees, clockwise from 12 o'clock. */
const BRANCH_ANGLES = {
  pull:      300,   // upper-left
  push:       60,   // upper-right
  lever:     180,   // straight down
  squat:     300,   // mirrors pull
  bench:      60,   // mirrors push
  deadlift:  180,   // mirrors lever
} as const;

type BranchName = keyof typeof BRANCH_ANGLES;

/**
 * Compute a single node's pixel position on the canvas.
 *
 * @param branch - named branch (determines angle from center)
 * @param ring   - named ring (determines distance from center)
 */
function nodePos(branch: BranchName, ring: RingName): NodePosition {
  const deg = BRANCH_ANGLES[branch];
  const r   = RADII[ring];
  const rad = (deg * Math.PI) / 180;
  return {
    x: Math.round(TREE_CENTER.x + r * Math.sin(rad)),
    y: Math.round(TREE_CENTER.y - r * Math.cos(rad)),
  };
}

// ── CALISTHENICS ──────────────────────────────────────────────────────────────
export const CALISTHENICS_LAYOUT: TreeLayout = {
  // Pull branch  (300°)
  '30_pullups':           nodePos('pull',  'inner'),
  '1_oap':                nodePos('pull',  'middle'),
  '2_oap':                nodePos('pull',  'outer'),
  // Push branch  (60°)
  '50_dips':              nodePos('push',  'inner'),
  '1_hspu':               nodePos('push',  'middle'),
  'freestanding_hspu':    nodePos('push',  'outer'),
  // Lever branch (180°)
  'tuck_front_lever_10s': nodePos('lever', 'inner'),
  'adv_tuck_front_lever': nodePos('lever', 'middle'),
  'full_front_lever':     nodePos('lever', 'outer'),
};

// ── GYM ───────────────────────────────────────────────────────────────────────
export const GYM_LAYOUT: TreeLayout = {
  // Squat branch   (300° — mirrors pull)
  'squat_100': nodePos('squat',    'inner'),
  'squat_140': nodePos('squat',    'middle'),
  'squat_180': nodePos('squat',    'outer'),
  // Bench branch   (60°  — mirrors push)
  'bench_80':  nodePos('bench',    'inner'),
  'bench_120': nodePos('bench',    'middle'),
  'bench_160': nodePos('bench',    'outer'),
  // Deadlift branch (180° — mirrors lever)
  'dead_140':  nodePos('deadlift', 'inner'),
  'dead_200':  nodePos('deadlift', 'middle'),
  'dead_250':  nodePos('deadlift', 'outer'),
};
