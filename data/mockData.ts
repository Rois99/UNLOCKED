import type { Skill, User } from '@/types';

export const SKILLS: Skill[] = [
  // ── CALISTHENICS · PULL ──────────────────────────────────────────────────
  {
    id: '30_pullups',
    name: '30 Pull-ups',
    description: 'Complete 30 consecutive pull-ups with full range of motion.',
    category: 'pull', treeType: 'calisthenics', prerequisiteIds: [],
    xp: 500, difficulty: 'intermediate',
  },
  {
    id: 'weighted_pullup',
    name: 'Weighted Pull-up +20kg',
    description: 'Complete 5 strict pull-ups with 20 kg of added weight.',
    category: 'pull', treeType: 'calisthenics', prerequisiteIds: ['30_pullups'],
    xp: 1000, difficulty: 'advanced',
  },
  {
    // DAG: requires BOTH 30_pullups AND weighted_pullup
    id: '1_oap',
    name: 'One-Arm Pull-up',
    description: 'Complete a strict one-arm pull-up on both arms.',
    category: 'pull', treeType: 'calisthenics', prerequisiteIds: ['30_pullups', 'weighted_pullup'],
    xp: 2000, difficulty: 'elite',
  },
  {
    id: '2_oap',
    name: '2× One-Arm Pull-ups',
    description: 'Complete 2 consecutive OAPs on each arm.',
    category: 'pull', treeType: 'calisthenics', prerequisiteIds: ['1_oap'],
    xp: 4000, difficulty: 'elite',
  },

  // ── CALISTHENICS · PUSH ──────────────────────────────────────────────────
  {
    id: '50_dips',
    name: '50 Dips',
    description: 'Complete 50 consecutive parallel bar dips.',
    category: 'push', treeType: 'calisthenics', prerequisiteIds: [],
    xp: 500, difficulty: 'intermediate',
  },
  {
    id: 'wall_handstand',
    name: 'Wall Handstand 30s',
    description: 'Hold a straight-body wall handstand for 30 seconds.',
    category: 'push', treeType: 'calisthenics', prerequisiteIds: ['50_dips'],
    xp: 600, difficulty: 'intermediate',
  },
  {
    // DAG: requires BOTH 50_dips AND wall_handstand
    id: '1_hspu',
    name: 'Handstand Push-up',
    description: 'Complete a full strict HSPU against a wall.',
    category: 'push', treeType: 'calisthenics', prerequisiteIds: ['50_dips', 'wall_handstand'],
    xp: 1500, difficulty: 'advanced',
  },
  {
    id: 'freestanding_hspu',
    name: 'Freestanding HSPU',
    description: 'Complete a HSPU in a freestanding handstand.',
    category: 'push', treeType: 'calisthenics', prerequisiteIds: ['1_hspu'],
    xp: 3000, difficulty: 'elite',
  },

  // ── CALISTHENICS · LEVER ─────────────────────────────────────────────────
  {
    id: 'tuck_front_lever_10s',
    name: 'Tuck Front Lever 10s',
    description: 'Hold a tuck front lever position for 10 seconds.',
    category: 'lever', treeType: 'calisthenics', prerequisiteIds: [],
    xp: 800, difficulty: 'intermediate',
  },
  {
    id: 'adv_tuck_front_lever',
    name: 'Adv. Tuck Front Lever',
    description: 'Hold an advanced tuck front lever for 10 seconds.',
    category: 'lever', treeType: 'calisthenics', prerequisiteIds: ['tuck_front_lever_10s'],
    xp: 1200, difficulty: 'advanced',
  },
  {
    id: 'full_front_lever',
    name: 'Full Front Lever 5s',
    description: 'Hold a full front lever position for 5 seconds.',
    category: 'lever', treeType: 'calisthenics', prerequisiteIds: ['adv_tuck_front_lever'],
    xp: 2500, difficulty: 'elite',
  },

  // ── GYM · SQUAT ──────────────────────────────────────────────────────────
  {
    id: 'squat_100',
    name: 'Squat 100 kg',
    description: 'Complete a 1-rep max back squat of 100 kg.',
    category: 'squat', treeType: 'gym', prerequisiteIds: [],
    xp: 600, difficulty: 'intermediate',
  },
  {
    id: 'squat_140',
    name: 'Squat 140 kg',
    description: 'Complete a 1-rep max back squat of 140 kg.',
    category: 'squat', treeType: 'gym', prerequisiteIds: ['squat_100'],
    xp: 1400, difficulty: 'advanced',
  },
  {
    id: 'squat_180',
    name: 'Squat 180 kg',
    description: 'Complete a 1-rep max back squat of 180 kg.',
    category: 'squat', treeType: 'gym', prerequisiteIds: ['squat_140'],
    xp: 3000, difficulty: 'elite',
  },

  // ── GYM · BENCH ──────────────────────────────────────────────────────────
  {
    id: 'bench_80',
    name: 'Bench Press 80 kg',
    description: 'Complete a 1-rep max bench press of 80 kg.',
    category: 'bench', treeType: 'gym', prerequisiteIds: [],
    xp: 500, difficulty: 'intermediate',
  },
  {
    id: 'bench_120',
    name: 'Bench Press 120 kg',
    description: 'Complete a 1-rep max bench press of 120 kg.',
    category: 'bench', treeType: 'gym', prerequisiteIds: ['bench_80'],
    xp: 1200, difficulty: 'advanced',
  },
  {
    id: 'bench_160',
    name: 'Bench Press 160 kg',
    description: 'Complete a 1-rep max bench press of 160 kg.',
    category: 'bench', treeType: 'gym', prerequisiteIds: ['bench_120'],
    xp: 2800, difficulty: 'elite',
  },

  // ── GYM · DEADLIFT ───────────────────────────────────────────────────────
  {
    id: 'dead_140',
    name: 'Deadlift 140 kg',
    description: 'Complete a 1-rep max deadlift of 140 kg.',
    category: 'deadlift', treeType: 'gym', prerequisiteIds: [],
    xp: 700, difficulty: 'intermediate',
  },
  {
    id: 'dead_200',
    name: 'Deadlift 200 kg',
    description: 'Complete a 1-rep max deadlift of 200 kg.',
    category: 'deadlift', treeType: 'gym', prerequisiteIds: ['dead_140'],
    xp: 1800, difficulty: 'advanced',
  },
  {
    id: 'dead_250',
    name: 'Deadlift 250 kg',
    description: 'Complete a 1-rep max deadlift of 250 kg.',
    category: 'deadlift', treeType: 'gym', prerequisiteIds: ['dead_200'],
    xp: 3500, difficulty: 'elite',
  },
];

/**
 * Mock authenticated user — Rois.
 * weighted_pullup and wall_handstand are included because 1_oap and 1_hspu
 * now require them as DAG prerequisites.
 */
export const MOCK_USER: User = {
  id: 'usr_rois_001',
  username: 'Rois',
  email: 'rois@unlocked.app',
  heightM: 1.80,
  weightKg: 90,
  dob: '1999-05-30',
  unlockedSkillIds: [
    // Calisthenics
    '30_pullups', 'weighted_pullup',
    '50_dips', 'wall_handstand',
    '1_hspu', '1_oap',
    'tuck_front_lever_10s',
    // Gym
    'squat_100', 'bench_80', 'dead_140',
  ],
  avatarUrl: undefined,
  joinedAt: '2024-01-15',
};
