import type { Skill, SkillCategory, SkillState } from '@/types';
import type { NodePosition, TreeLayout } from '@/data/treeLayouts';

// ── Skill state ──────────────────────────────────────────────────────────────

/**
 * Derive the display state of a skill based on the user's progress.
 *  unlocked  — user has already verified this skill
 *  available — prerequisite met (or no prerequisite), ready to be claimed
 *  locked    — prerequisite not yet unlocked
 */
export function getSkillState(skill: Skill, unlockedIds: string[]): SkillState {
  if (unlockedIds.includes(skill.id)) return 'unlocked';
  if (skill.prerequisiteId === null || unlockedIds.includes(skill.prerequisiteId)) {
    return 'available';
  }
  return 'locked';
}

/** Return skills in a category ordered root-first along the prerequisite chain. */
export function getOrderedTrackSkills(skills: Skill[], category: SkillCategory): Skill[] {
  const track = skills.filter((s) => s.category === category);
  const result: Skill[] = [];
  let current: Skill | undefined = track.find((s) => s.prerequisiteId === null);
  while (current) {
    result.push(current);
    current = track.find((s) => s.prerequisiteId === current!.id);
  }
  return result;
}

// ── User stat helpers ────────────────────────────────────────────────────────

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

// ── Tree connection helpers ──────────────────────────────────────────────────

export type ConnectionStyle = 'unlocked' | 'available' | 'locked';

export interface SkillConnection {
  fromId: string;
  toId:   string;
  from:   NodePosition;
  to:     NodePosition;
  style:  ConnectionStyle;
}

/**
 * Build the list of parent→child edge descriptors for rendering SVG lines.
 * Style is determined by the user's unlocked progress:
 *   unlocked  — both endpoints verified (glowing line)
 *   available — parent verified, child not yet (dashed dim line)
 *   locked    — parent not yet verified (very dim line)
 */
export function buildConnections(
  skills: Skill[],
  layout: TreeLayout,
  unlockedIds: string[],
): SkillConnection[] {
  return skills
    .filter(
      (s) =>
        s.prerequisiteId !== null &&
        layout[s.id] != null &&
        layout[s.prerequisiteId!] != null,
    )
    .map((s) => {
      const parentId = s.prerequisiteId!;
      const style: ConnectionStyle =
        unlockedIds.includes(parentId) && unlockedIds.includes(s.id)
          ? 'unlocked'
          : unlockedIds.includes(parentId)
          ? 'available'
          : 'locked';
      return {
        fromId: parentId,
        toId: s.id,
        from: layout[parentId],
        to: layout[s.id],
        style,
      };
    });
}

/**
 * Generate a quadratic Bézier SVG path string between two node centers.
 *
 * - Starts/ends at the circle perimeter (not the center) to avoid the line
 *   being hidden beneath the node circle.
 * - Control point is the segment midpoint pulled `curveFactor` of the way
 *   toward the tree center, producing a gentle inward curve.
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

  // Edge points — start/end at circle perimeter
  const sx = from.x + nx * nodeRadius;
  const sy = from.y + ny * nodeRadius;
  const ex = to.x - nx * nodeRadius;
  const ey = to.y - ny * nodeRadius;

  // Control point — midpoint pulled toward tree center
  const mx = (sx + ex) / 2;
  const my = (sy + ey) / 2;
  const cpx = mx + (center.x - mx) * curveFactor;
  const cpy = my + (center.y - my) * curveFactor;

  return (
    `M ${sx.toFixed(1)} ${sy.toFixed(1)} ` +
    `Q ${cpx.toFixed(1)} ${cpy.toFixed(1)} ` +
    `${ex.toFixed(1)} ${ey.toFixed(1)}`
  );
}
