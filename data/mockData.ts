import type { Skill, User } from '@/types';

/**
 * Canonical skill definitions. Each skill's prerequisiteId forms a directed
 * acyclic graph (skill tree). Null = entry-level / no dependency.
 */
export const SKILLS: Skill[] = [
  // ── PULL TRACK ──────────────────────────────────────────────────────────
  {
    id: '30_pullups',
    name: '30 Pull-ups',
    description: 'Complete 30 consecutive pull-ups with full range of motion.',
    category: 'pull',
    prerequisiteId: null,
    xp: 500,
    difficulty: 'intermediate',
  },
  {
    id: '1_oap',
    name: 'One-Arm Pull-up',
    description: 'Complete a strict one-arm pull-up on both arms.',
    category: 'pull',
    prerequisiteId: '30_pullups',
    xp: 2000,
    difficulty: 'elite',
  },
  {
    id: '2_oap',
    name: '2× One-Arm Pull-ups',
    description: 'Complete 2 consecutive OAPs on each arm.',
    category: 'pull',
    prerequisiteId: '1_oap',
    xp: 4000,
    difficulty: 'elite',
  },

  // ── PUSH TRACK ──────────────────────────────────────────────────────────
  {
    id: '50_dips',
    name: '50 Dips',
    description: 'Complete 50 consecutive parallel bar dips.',
    category: 'push',
    prerequisiteId: null,
    xp: 500,
    difficulty: 'intermediate',
  },
  {
    id: '1_hspu',
    name: 'Handstand Push-up',
    description: 'Complete a full strict HSPU against a wall.',
    category: 'push',
    prerequisiteId: '50_dips',
    xp: 1500,
    difficulty: 'advanced',
  },
  {
    id: 'freestanding_hspu',
    name: 'Freestanding HSPU',
    description: 'Complete a HSPU in a freestanding handstand.',
    category: 'push',
    prerequisiteId: '1_hspu',
    xp: 3000,
    difficulty: 'elite',
  },

  // ── LEVER TRACK ─────────────────────────────────────────────────────────
  {
    id: 'tuck_front_lever_10s',
    name: 'Tuck Front Lever 10s',
    description: 'Hold a tuck front lever position for 10 seconds.',
    category: 'lever',
    prerequisiteId: null,
    xp: 800,
    difficulty: 'intermediate',
  },
  {
    id: 'adv_tuck_front_lever',
    name: 'Adv. Tuck Front Lever',
    description: 'Hold an advanced tuck front lever for 10 seconds.',
    category: 'lever',
    prerequisiteId: 'tuck_front_lever_10s',
    xp: 1200,
    difficulty: 'advanced',
  },
  {
    id: 'full_front_lever',
    name: 'Full Front Lever 5s',
    description: 'Hold a full front lever position for 5 seconds.',
    category: 'lever',
    prerequisiteId: 'adv_tuck_front_lever',
    xp: 2500,
    difficulty: 'elite',
  },
];

/**
 * Mock authenticated user — Rois.
 * Password "Admin3005" is noted here for dev reference only.
 * In production this is handled exclusively by Supabase Auth.
 */
export const MOCK_USER: User = {
  id: 'usr_rois_001',
  username: 'Rois',
  email: 'rois@unlocked.app',
  heightM: 1.88,
  weightKg: 90,
  dob: '1999-05-30',
  unlockedSkillIds: [
    '30_pullups',
    '50_dips',
    '1_hspu',
    '1_oap',
    'tuck_front_lever_10s',
  ],
  avatarUrl: undefined,
  joinedAt: '2024-01-15',
};
