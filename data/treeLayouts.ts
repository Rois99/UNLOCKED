/**
 * Tree layout geometry — all positions are COMPUTED, nothing is hardcoded.
 *
 * `computeLayout` is the single entry point. It accepts raw DB rows and
 * derives every node position from:
 *   • the skill's category  → branch angle (degrees, clockwise from 12 o'clock)
 *   • the skill's DAG depth → ring radius (px from center)
 *
 * Adding a new skill category or a deeper tier requires only a one-line
 * change to CATEGORY_ANGLE or DEPTH_RADII below.
 */

export const CANVAS_SIZE = { width: 1100, height: 1100 } as const;
export const TREE_CENTER = { x: 550, y: 490 } as const;

export type NodePosition = { x: number; y: number };
export type TreeLayout   = Record<string, NodePosition>;

// ── Geometry config ───────────────────────────────────────────────────────────

/** Branch angle per skill category, degrees clockwise from 12 o'clock. */
const CATEGORY_ANGLE: Record<string, number> = {
  // calisthenics
  pull:     300,
  push:      60,
  lever:    180,
  balance:  240,
  core:     120,
  // gym
  squat:    300,
  bench:     60,
  deadlift: 180,
};

/** Ring radius (px) indexed by DAG depth (0 = root, 1 = tier-2, …). */
const DEPTH_RADII = [190, 285, 380, 475, 570] as const;

/** Angular gap between sibling nodes placed at the same (category, depth). */
const SIBLING_SPREAD_DEG = 20;

// ── Core primitive ────────────────────────────────────────────────────────────

/** Convert polar coords (angle in degrees CW from north, radius in px) → canvas XY. */
export function nodePosRaw(angleDeg: number, r: number): NodePosition {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: Math.round(TREE_CENTER.x + r * Math.sin(rad)),
    y: Math.round(TREE_CENTER.y - r * Math.cos(rad)),
  };
}

// ── Dynamic layout engine ─────────────────────────────────────────────────────

type SkillRow = { id: string; category: string };
type DepRow   = { skill_id: string; prerequisite_id: string };

/**
 * Compute a full TreeLayout from live DB rows.
 *
 * Algorithm:
 *  1. Build a prerequisite map from dependency rows.
 *  2. Compute each skill's depth = max(parent depths) + 1; roots = 0.
 *  3. Group skills by (category, depth).
 *  4. Within each group, spread nodes evenly around the branch axis so
 *     siblings never overlap even when a tier has multiple skills.
 */
export function computeLayout(skills: SkillRow[], deps: DepRow[]): TreeLayout {
  const idSet = new Set(skills.map((s) => s.id));

  // Step 1 — prerequisite map (only edges within this tree's skill set)
  const prereqMap = new Map<string, string[]>();
  for (const s of skills) prereqMap.set(s.id, []);
  for (const d of deps) {
    if (idSet.has(d.skill_id) && idSet.has(d.prerequisite_id)) {
      prereqMap.get(d.skill_id)!.push(d.prerequisite_id);
    }
  }

  // Step 2 — memoised DAG depth with cycle guard
  const depthCache = new Map<string, number>();
  function getDepth(id: string, visited = new Set<string>()): number {
    if (depthCache.has(id)) return depthCache.get(id)!;
    if (visited.has(id)) return 0;
    visited.add(id);
    const parents = prereqMap.get(id) ?? [];
    const depth = parents.length === 0
      ? 0
      : Math.max(...parents.map((p) => getDepth(p, new Set(visited)))) + 1;
    depthCache.set(id, depth);
    return depth;
  }
  for (const s of skills) getDepth(s.id);

  // Step 3 — group by (category, depth)
  const groups = new Map<string, string[]>();
  for (const s of skills) {
    const key = `${s.category}::${depthCache.get(s.id) ?? 0}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(s.id);
  }

  // Step 4 — assign positions, spreading siblings around the branch axis
  const layout: TreeLayout = {};
  for (const [key, ids] of groups) {
    const [category, depthStr] = key.split('::');
    const depth     = parseInt(depthStr, 10);
    const baseAngle = CATEGORY_ANGLE[category] ?? 0;
    const r         = DEPTH_RADII[Math.min(depth, DEPTH_RADII.length - 1)];
    const n         = ids.length;
    const totalSpread = (n - 1) * SIBLING_SPREAD_DEG;

    ids.forEach((id, i) => {
      const angle = baseAngle - totalSpread / 2 + i * SIBLING_SPREAD_DEG;
      layout[id] = nodePosRaw(angle, r);
    });
  }

  return layout;
}
