import type { Skill, SkillCategory, SkillState, TreeType, Difficulty, RequirementType } from '@/types';
import type { NodePosition, TreeLayout } from '@/data/treeLayouts';

// ── DB row types (snake_case, as returned by Supabase) ────────────────────────

export type DbSkillRow = {
  id:               string;
  name:             string;
  description:      string;
  category:         string;
  tree_type:        string;
  xp:               number;
  difficulty:       string;
  requirement_type: string;   // 'AND' | 'OR'
  video_guide_url:  string | null;
  written_tips:     string | null;
};

export type DbDependencyRow = {
  skill_id:        string;
  prerequisite_id: string;
};

// ── DB → domain model helpers ─────────────────────────────────────────────────

/** Build a map of skillId → prerequisiteIds[] from raw dependency rows. */
export function buildDepsMap(deps: DbDependencyRow[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const d of deps) {
    if (!map.has(d.skill_id)) map.set(d.skill_id, []);
    map.get(d.skill_id)!.push(d.prerequisite_id);
  }
  return map;
}

/** Convert a DB row + deps map into the app's Skill domain object. */
export function dbRowToSkill(row: DbSkillRow, depsMap: Map<string, string[]>): Skill {
  return {
    id:              row.id,
    name:            row.name,
    description:     row.description,
    category:        row.category        as SkillCategory,
    treeType:        row.tree_type       as TreeType,
    prerequisiteIds: depsMap.get(row.id) ?? [],
    requirementType: (row.requirement_type ?? 'AND') as RequirementType,
    xp:              row.xp,
    difficulty:      row.difficulty      as Difficulty,
  };
}

// ── Skill state ───────────────────────────────────────────────────────────────

/**
 * Derive the display state of a skill.
 *
 *  unlocked  — user has verified this skill
 *  available — prerequisites satisfied per requirementType:
 *               AND → every prerequisite unlocked
 *               OR  → at least one prerequisite unlocked (or none required)
 *  locked    — prerequisites not satisfied
 */
export function getSkillState(skill: Skill, unlockedIds: string[]): SkillState {
  if (unlockedIds.includes(skill.id)) return 'unlocked';

  if (skill.prerequisiteIds.length === 0) return 'available';

  const satisfied = skill.requirementType === 'OR'
    ? skill.prerequisiteIds.some((id)  => unlockedIds.includes(id))
    : skill.prerequisiteIds.every((id) => unlockedIds.includes(id));

  return satisfied ? 'available' : 'locked';
}

// ── User stat helpers ─────────────────────────────────────────────────────────

export function calcTotalXP(skills: Skill[], unlockedIds: string[]): number {
  return skills
    .filter((s) => unlockedIds.includes(s.id))
    .reduce((sum, s) => sum + s.xp, 0);
}

export function calcLevel(totalXP: number): number {
  return Math.max(1, Math.floor(totalXP / 1000));
}

export function calcAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
  ) age -= 1;
  return age;
}

// ── Tree connection helpers ───────────────────────────────────────────────────

export type ConnectionStyle = 'unlocked' | 'available' | 'locked';

export interface SkillConnection {
  fromId:          string;
  toId:            string;
  from:            NodePosition;
  to:              NodePosition;
  style:           ConnectionStyle;
  /** True when the destination skill uses OR requirement logic. */
  isOr:            boolean;
}

/**
 * Build all directed edge descriptors for SVG rendering.
 *
 * One connection is emitted per prerequisite edge.
 * Each edge carries an `isOr` flag so TreeConnections can render
 * OR-path edges in amber to distinguish them from AND-path cyan edges.
 *
 * Edge style logic (same for AND and OR — per-edge, not per-skill):
 *   unlocked  — both endpoints verified
 *   available — from-node verified, to-node not yet
 *   locked    — from-node not yet verified
 */
export function buildConnections(
  skills: Skill[],
  layout: TreeLayout,
  unlockedIds: string[],
): SkillConnection[] {
  return skills.flatMap((skill) =>
    skill.prerequisiteIds
      .filter((prereqId) => layout[skill.id] != null && layout[prereqId] != null)
      .map((prereqId): SkillConnection => {
        const style: ConnectionStyle =
          unlockedIds.includes(prereqId) && unlockedIds.includes(skill.id)
            ? 'unlocked'
            : unlockedIds.includes(prereqId)
            ? 'available'
            : 'locked';
        return {
          fromId: prereqId,
          toId:   skill.id,
          from:   layout[prereqId],
          to:     layout[skill.id],
          style,
          isOr:   skill.requirementType === 'OR',
        };
      }),
  );
}

/**
 * Quadratic Bézier SVG path between two node centers.
 * Terminates at circle perimeter, curves gently toward tree center.
 */
export function buildSvgPath(
  from: NodePosition,
  to: NodePosition,
  center: NodePosition,
  nodeRadius = 32,
  curveFactor = 0.15,
): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 1) return '';

  const nx = dx / dist;
  const ny = dy / dist;
  const sx = from.x + nx * nodeRadius;
  const sy = from.y + ny * nodeRadius;
  const ex = to.x  - nx * nodeRadius;
  const ey = to.y  - ny * nodeRadius;

  const mx  = (sx + ex) / 2;
  const my  = (sy + ey) / 2;
  const cpx = mx + (center.x - mx) * curveFactor;
  const cpy = my + (center.y - my) * curveFactor;

  return (
    `M ${sx.toFixed(1)} ${sy.toFixed(1)} ` +
    `Q ${cpx.toFixed(1)} ${cpy.toFixed(1)} ` +
    `${ex.toFixed(1)} ${ey.toFixed(1)}`
  );
}
