export type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'elite';
export type SkillCategory = 'pull' | 'push' | 'lever' | 'balance' | 'core';
export type SkillState = 'unlocked' | 'available' | 'locked';

export interface Skill {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  /** Null means this is a root/base skill with no dependency. */
  prerequisiteId: string | null;
  xp: number;
  difficulty: Difficulty;
}

export interface User {
  id: string;
  username: string;
  /** Prepared for Supabase Auth — stores the email used at registration. */
  email: string;
  heightM: number;
  weightKg: number;
  /** ISO date string: 'YYYY-MM-DD' */
  dob: string;
  unlockedSkillIds: string[];
  avatarUrl?: string;
  joinedAt: string;
}
