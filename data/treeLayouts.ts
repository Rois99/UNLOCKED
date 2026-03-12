/**
 * Pixel-based radial node positions on a fixed 1100×1100 canvas.
 *
 * Tree center: (550, 490)  — shifted upward so the downward Lever branch
 * has more vertical room without exceeding the canvas height.
 *
 * Three branches, 120° apart (θ measured clockwise from 12 o'clock):
 *   Left  (Pull / Squat)       θ = 300°  sin = −0.866  cos =  0.500
 *   Right (Push / Bench)       θ =  60°  sin = +0.866  cos =  0.500
 *   Down  (Lever / Deadlift)   θ = 180°  sin =  0.000  cos = −1.000
 *
 * Ring radii  (px from center):
 *   Inner  r = 190  →  base / root skills
 *   Middle r = 340  →  tier-2 skills
 *   Outer  r = 480  →  tier-3 skills
 *
 * Minimum node-to-node clearance (same branch, adjacent rings): ≈ 140 px.
 * Node circle diameter = 64 px  →  76 px free space between circles. ✓
 */
export const CANVAS_SIZE = { width: 1100, height: 1100 } as const;
export const TREE_CENTER = { x: 550, y: 490 } as const;

export type NodePosition = { x: number; y: number };
export type TreeLayout   = Record<string, NodePosition>;

// ── CALISTHENICS ────────────────────────────────────────────────────────────
export const CALISTHENICS_LAYOUT: TreeLayout = {
  // inner ring — root skills
  '30_pullups':            { x: 386, y: 395 },   // left branch
  '50_dips':               { x: 715, y: 395 },   // right branch
  'tuck_front_lever_10s':  { x: 550, y: 680 },   // down branch
  // middle ring
  '1_oap':                 { x: 256, y: 320 },
  '1_hspu':                { x: 844, y: 320 },
  'adv_tuck_front_lever':  { x: 550, y: 830 },
  // outer ring
  '2_oap':                 { x: 134, y: 250 },
  'freestanding_hspu':     { x: 966, y: 250 },
  'full_front_lever':      { x: 550, y: 970 },
};

// ── GYM ─────────────────────────────────────────────────────────────────────
// Mirror geometry — same positions, different skill IDs.
export const GYM_LAYOUT: TreeLayout = {
  // inner ring — root lifts
  'squat_100':  { x: 386, y: 395 },
  'bench_80':   { x: 715, y: 395 },
  'dead_140':   { x: 550, y: 680 },
  // middle ring
  'squat_140':  { x: 256, y: 320 },
  'bench_120':  { x: 844, y: 320 },
  'dead_200':   { x: 550, y: 830 },
  // outer ring
  'squat_180':  { x: 134, y: 250 },
  'bench_160':  { x: 966, y: 250 },
  'dead_250':   { x: 550, y: 970 },
};
