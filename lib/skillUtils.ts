import type { Skill, SkillCategory, SkillState } from '@/types';

/**
 * Derive the display state of a skill based on the user's progress.
 * - unlocked  : user has already verified this skill
 * - available : prerequisite met (or none), ready to be claimed
 * - locked    : prerequisite not yet unlocked
 */
export function getSkillState(skill: Skill, unlockedIds: string[]): SkillState {
  if (unlockedIds.includes(skill.id)) return 'unlocked';
  if (skill.prerequisiteId === null || unlockedIds.includes(skill.prerequisiteId)) {
    return 'available';
  }
  return 'locked';
}

/**
 * Return the skills in a given category ordered by their prerequisite chain
 * (root first). Assumes a simple linear chain per category.
 */
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

/** Sum of XP for all unlocked skills. */
export function calcTotalXP(skills: Skill[], unlockedIds: string[]): number {
  return skills
    .filter((s) => unlockedIds.includes(s.id))
    .reduce((sum, s) => sum + s.xp, 0);
}

/** Simple level from XP — 1 level per 1000 XP, minimum level 1. */
export function calcLevel(totalXP: number): number {
  return Math.max(1, Math.floor(totalXP / 1000));
}

/** Age in full years from an ISO date string. */
export function calcAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
  ) {
    age -= 1;
  }
  return age;
}
