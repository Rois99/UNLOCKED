export type Difficulty    = 'beginner' | 'intermediate' | 'advanced' | 'elite';
export type SkillState    = 'unlocked' | 'available' | 'locked';
export type TreeType      = 'calisthenics' | 'gym';
export type SkillCategory =
  | 'pull' | 'push' | 'lever' | 'balance' | 'core'   // calisthenics
  | 'squat' | 'bench' | 'deadlift';                    // gym

export interface Skill {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  treeType: TreeType;
  /** null = root / no prerequisite */
  prerequisiteId: string | null;
  xp: number;
  difficulty: Difficulty;
}

export interface User {
  id: string;
  username: string;
  email: string;
  heightM: number;
  weightKg: number;
  /** ISO date 'YYYY-MM-DD' */
  dob: string;
  unlockedSkillIds: string[];
  avatarUrl?: string;
  joinedAt: string;
}
