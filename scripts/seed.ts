/**
 * Seed script — populates Supabase Auth + profiles + skills +
 * skill_dependencies + user_unlocked_skills.
 *
 * Run with:  npm run seed
 */
import { createClient } from '@supabase/supabase-js';
import { config }       from 'dotenv';
import { resolve }      from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const url            = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url || !serviceRoleKey) {
  console.error('❌  Missing env vars in .env.local');
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Skill catalogue ───────────────────────────────────────────────────────────

const SKILLS = [
  // Calisthenics · Pull
  { id: '30_pullups',           name: '30 Pull-ups',            description: 'Complete 30 consecutive pull-ups with full range of motion.',      category: 'pull',     tree_type: 'calisthenics', xp: 500,  difficulty: 'intermediate', requirement_type: 'AND' },
  { id: 'weighted_pullup',      name: 'Weighted Pull-up +20kg', description: 'Complete 5 strict pull-ups with 20 kg of added weight.',            category: 'pull',     tree_type: 'calisthenics', xp: 1000, difficulty: 'advanced',      requirement_type: 'AND' },
  { id: '1_oap',                name: 'One-Arm Pull-up',        description: 'Complete a strict one-arm pull-up on both arms.',                   category: 'pull',     tree_type: 'calisthenics', xp: 2000, difficulty: 'elite',          requirement_type: 'AND' },
  { id: '2_oap',                name: '2× One-Arm Pull-ups',    description: 'Complete 2 consecutive OAPs on each arm.',                          category: 'pull',     tree_type: 'calisthenics', xp: 4000, difficulty: 'elite',          requirement_type: 'AND' },
  // Calisthenics · Push
  { id: '50_dips',              name: '50 Dips',                description: 'Complete 50 consecutive parallel bar dips.',                        category: 'push',     tree_type: 'calisthenics', xp: 500,  difficulty: 'intermediate', requirement_type: 'AND' },
  { id: 'wall_handstand',       name: 'Wall Handstand 30s',     description: 'Hold a straight-body wall handstand for 30 seconds.',               category: 'push',     tree_type: 'calisthenics', xp: 600,  difficulty: 'intermediate', requirement_type: 'AND' },
  { id: '1_hspu',               name: 'Handstand Push-up',      description: 'Complete a full strict HSPU against a wall.',                       category: 'push',     tree_type: 'calisthenics', xp: 1500, difficulty: 'advanced',      requirement_type: 'AND' },
  { id: 'freestanding_hspu',    name: 'Freestanding HSPU',      description: 'Complete a HSPU in a freestanding handstand.',                      category: 'push',     tree_type: 'calisthenics', xp: 3000, difficulty: 'elite',          requirement_type: 'AND' },
  // Calisthenics · Lever
  { id: 'tuck_front_lever_10s', name: 'Tuck Front Lever 10s',   description: 'Hold a tuck front lever position for 10 seconds.',                  category: 'lever',    tree_type: 'calisthenics', xp: 800,  difficulty: 'intermediate', requirement_type: 'AND' },
  { id: 'adv_tuck_front_lever', name: 'Adv. Tuck Front Lever',  description: 'Hold an advanced tuck front lever for 10 seconds.',                 category: 'lever',    tree_type: 'calisthenics', xp: 1200, difficulty: 'advanced',      requirement_type: 'AND' },
  { id: 'full_front_lever',     name: 'Full Front Lever 5s',    description: 'Hold a full front lever for 5 seconds. Requires adv. tuck lever OR 2× OAP.', category: 'lever', tree_type: 'calisthenics', xp: 2500, difficulty: 'elite', requirement_type: 'OR'  },
  // Calisthenics · Legs (bodyweight squat progression — standards to be signed off by the coach)
  { id: '50_squats',            name: '50 Bodyweight Squats',   description: 'Complete 50 consecutive bodyweight squats, hips below knee level.', category: 'legs', tree_type: 'calisthenics', xp: 300,  difficulty: 'beginner',     requirement_type: 'AND' },
  { id: '15_bulgarian_split',   name: '15 Bulgarian Split Squats', description: 'Complete 15 Bulgarian split squats on each leg, rear foot elevated.', category: 'legs', tree_type: 'calisthenics', xp: 500,  difficulty: 'intermediate', requirement_type: 'AND' },
  { id: 'pistol_squat',         name: 'Pistol Squat',           description: 'Complete a full single-leg pistol squat on each leg without support.', category: 'legs', tree_type: 'calisthenics', xp: 1200, difficulty: 'advanced',     requirement_type: 'AND' },
  { id: '10_pistol_squats',     name: '10 Pistol Squats',       description: 'Complete 10 consecutive pistol squats on each leg.',                category: 'legs', tree_type: 'calisthenics', xp: 2500, difficulty: 'elite',        requirement_type: 'AND' },
  // Gym · Squat
  { id: 'squat_100',            name: 'Squat 100 kg',           description: 'Complete a 1-rep max back squat of 100 kg.',                        category: 'squat',    tree_type: 'gym',          xp: 600,  difficulty: 'intermediate', requirement_type: 'AND' },
  { id: 'squat_140',            name: 'Squat 140 kg',           description: 'Complete a 1-rep max back squat of 140 kg.',                        category: 'squat',    tree_type: 'gym',          xp: 1400, difficulty: 'advanced',      requirement_type: 'AND' },
  { id: 'squat_180',            name: 'Squat 180 kg',           description: 'Complete a 1-rep max back squat of 180 kg.',                        category: 'squat',    tree_type: 'gym',          xp: 3000, difficulty: 'elite',          requirement_type: 'AND' },
  // Gym · Bench
  { id: 'bench_80',             name: 'Bench Press 80 kg',      description: 'Complete a 1-rep max bench press of 80 kg.',                        category: 'bench',    tree_type: 'gym',          xp: 500,  difficulty: 'intermediate', requirement_type: 'AND' },
  { id: 'bench_120',            name: 'Bench Press 120 kg',     description: 'Complete a 1-rep max bench press of 120 kg.',                       category: 'bench',    tree_type: 'gym',          xp: 1200, difficulty: 'advanced',      requirement_type: 'AND' },
  { id: 'bench_160',            name: 'Bench Press 160 kg',     description: 'Complete a 1-rep max bench press of 160 kg.',                       category: 'bench',    tree_type: 'gym',          xp: 2800, difficulty: 'elite',          requirement_type: 'AND' },
  // Gym · Deadlift
  { id: 'dead_140',             name: 'Deadlift 140 kg',        description: 'Complete a 1-rep max deadlift of 140 kg.',                          category: 'deadlift', tree_type: 'gym',          xp: 700,  difficulty: 'intermediate', requirement_type: 'AND' },
  { id: 'dead_200',             name: 'Deadlift 200 kg',        description: 'Complete a 1-rep max deadlift of 200 kg.',                          category: 'deadlift', tree_type: 'gym',          xp: 1800, difficulty: 'advanced',      requirement_type: 'AND' },
  { id: 'dead_250',             name: 'Deadlift 250 kg',        description: 'Complete a 1-rep max deadlift of 250 kg.',                          category: 'deadlift', tree_type: 'gym',          xp: 3500, difficulty: 'elite',          requirement_type: 'AND' },
];

// ── DAG dependency graph ──────────────────────────────────────────────────────
// Each row = one directed edge: prerequisite_id → skill_id

const SKILL_DEPENDENCIES = [
  // Pull chain — 1_oap has TWO prerequisites (DAG)
  { skill_id: 'weighted_pullup',      prerequisite_id: '30_pullups' },
  { skill_id: '1_oap',               prerequisite_id: '30_pullups' },
  { skill_id: '1_oap',               prerequisite_id: 'weighted_pullup' },  // ← multi-prereq
  { skill_id: '2_oap',               prerequisite_id: '1_oap' },
  // Push chain — 1_hspu has TWO prerequisites (DAG)
  { skill_id: 'wall_handstand',       prerequisite_id: '50_dips' },
  { skill_id: '1_hspu',              prerequisite_id: '50_dips' },
  { skill_id: '1_hspu',              prerequisite_id: 'wall_handstand' },   // ← multi-prereq
  { skill_id: 'freestanding_hspu',   prerequisite_id: '1_hspu' },
  // Lever chain — full_front_lever uses OR: adv_tuck_front_lever OR 2_oap (cross-branch)
  { skill_id: 'adv_tuck_front_lever', prerequisite_id: 'tuck_front_lever_10s' },
  { skill_id: 'full_front_lever',    prerequisite_id: 'adv_tuck_front_lever' },
  { skill_id: 'full_front_lever',    prerequisite_id: '2_oap' },             // ← OR path
  // Legs chain (calisthenics)
  { skill_id: '15_bulgarian_split',  prerequisite_id: '50_squats' },
  { skill_id: 'pistol_squat',        prerequisite_id: '15_bulgarian_split' },
  { skill_id: '10_pistol_squats',    prerequisite_id: 'pistol_squat' },
  // Gym — Squat
  { skill_id: 'squat_140',           prerequisite_id: 'squat_100' },
  { skill_id: 'squat_180',           prerequisite_id: 'squat_140' },
  // Gym — Bench
  { skill_id: 'bench_120',           prerequisite_id: 'bench_80' },
  { skill_id: 'bench_160',           prerequisite_id: 'bench_120' },
  // Gym — Deadlift
  { skill_id: 'dead_200',            prerequisite_id: 'dead_140' },
  { skill_id: 'dead_250',            prerequisite_id: 'dead_200' },
];

// ── Users ─────────────────────────────────────────────────────────────────────

const USERS = [
  {
    email:    'rois@unlocked.app',
    password: 'Admin3005',
    profile: {
      username:  'Rois',
      height_m:  1.80,
      weight_kg: 90,
      dob:       '1999-05-30',
      bio:       '2nd year Electrical Engineering student (88 avg). Focus: one-arm pull-ups.',
      location:  'Shoham',
      language:  'he',
      is_coach:  false,
    },
    // weighted_pullup + wall_handstand included because 1_oap and 1_hspu require them
    unlockedSkillIds: [
      '30_pullups', 'weighted_pullup',
      '50_dips', 'wall_handstand',
      '1_hspu', '1_oap',
      'tuck_front_lever_10s',
      'squat_100', 'bench_80', 'dead_140',
    ],
  },
  {
    email:    'alex@unlocked.app',
    password: 'TestUser1!',
    profile: {
      username:  'AlexFit',
      height_m:  1.75,
      weight_kg: 78,
      dob:       '2001-03-14',
      bio:       'Just getting started on the calisthenics journey.',
      location:  'Tel Aviv',
      language:  'en',
      is_coach:  false,
    },
    unlockedSkillIds: ['30_pullups', '50_dips'],
  },
  {
    email:    'maya@unlocked.app',
    password: 'TestUser1!',
    profile: {
      username:  'MayaStrong',
      height_m:  1.68,
      weight_kg: 62,
      dob:       '1997-11-22',
      bio:       'Advanced calisthenics athlete. 3 years of structured training.',
      location:  'Haifa',
      language:  'en',
      is_coach:  false,
    },
    unlockedSkillIds: [
      '30_pullups', 'weighted_pullup', '1_oap', '2_oap',
      '50_dips', 'wall_handstand', '1_hspu',
      'tuck_front_lever_10s', 'adv_tuck_front_lever',
    ],
  },
  {
    email:    'dan@unlocked.app',
    password: 'TestUser1!',
    profile: {
      username:  'CoachDan',
      height_m:  1.82,
      weight_kg: 85,
      dob:       '1990-07-08',
      bio:       'Certified strength & calisthenics coach. 10+ years experience.',
      location:  'Jerusalem',
      language:  'en',
      is_coach:  true,
      cert_url:  null,
    },
    unlockedSkillIds: [
      '30_pullups', 'weighted_pullup', '1_oap', '2_oap',
      '50_dips', 'wall_handstand', '1_hspu', 'freestanding_hspu',
      'tuck_front_lever_10s', 'adv_tuck_front_lever', 'full_front_lever',
      'squat_100', 'squat_140', 'bench_80', 'bench_120', 'dead_140', 'dead_200',
    ],
  },
  {
    // New-user test account: no goals or questionnaire yet, so logging in
    // starts the onboarding flow.
    email:    'ilai@unlocked.app',
    password: 'TestUser1!',
    profile: {
      username: 'עילי',
      language: 'he',
    },
    unlockedSkillIds: [] as string[],
  },
];

// ── Training content (sample rows from content/UNLOCKED_training_framework.xlsx) ─
// Placeholder values to exercise the app end to end. They are replaced by the
// coach-approved framework once it is filled in and imported.

const GOALS = [
  { id: 'pullups', name: 'Pull-ups',  sort_order: 1 },
  { id: 'dips',    name: 'Dips',      sort_order: 2 },
  { id: 'pushups', name: 'Push-ups',  sort_order: 3 },
  { id: 'squats',  name: 'Squats',    sort_order: 4 },
];

const EXERCISES = [
  { id: 'scap_pull',       name: 'Scapular Pull',   goal_id: 'pullups', measure_type: 'reps', primary_muscle: 'upper_back', secondary_muscles: ['lats'],                          body_areas: ['shoulder'],          equipment: ['pull_up_bar'], difficulty: 2, standard: 'Dead hang, straight arms; pull the shoulder blades down and back without bending the elbows.', tips: 'Small, controlled movement.' },
  { id: 'australian_row',  name: 'Australian Row',  goal_id: 'pullups', measure_type: 'reps', primary_muscle: 'lats',       secondary_muscles: ['biceps', 'upper_back'],          body_areas: ['shoulder', 'elbow'], equipment: ['pull_up_bar'], difficulty: 3, standard: 'Body straight, chest touches the bar, full arm extension at the bottom.',                     tips: 'Hips stay up; do not lead with the neck.' },
  { id: 'negative_pullup', name: 'Negative Pull-up', goal_id: 'pullups', measure_type: 'reps', primary_muscle: 'lats',      secondary_muscles: ['biceps', 'forearms'],            body_areas: ['shoulder', 'elbow'], equipment: ['pull_up_bar'], difficulty: 5, standard: 'Jump to the top, lower for 4 seconds to full extension.',                                     tips: 'Do not drop through the bottom half.' },
  { id: 'pullup',          name: 'Pull-up',          goal_id: 'pullups', measure_type: 'reps', primary_muscle: 'lats',      secondary_muscles: ['biceps', 'forearms', 'upper_back'], body_areas: ['shoulder', 'elbow'], equipment: ['pull_up_bar'], difficulty: 6, standard: 'Chin over the bar, full extension at the bottom, no swinging.',                               tips: 'No kipping, no half reps.' },
  // PLACEHOLDER tracks for dips / push-ups / squats — replace with the framework file.
  { id: 'bench_dip',       name: 'Bench Dip',        goal_id: 'dips',    measure_type: 'reps', primary_muscle: 'triceps',   secondary_muscles: ['front_shoulder', 'chest'],        body_areas: ['shoulder', 'elbow', 'wrist'], equipment: ['bench'],         difficulty: 2, standard: 'Hands on the bench, lower until elbows reach 90°, press to full lockout.', tips: 'Keep shoulders down, away from the ears.' },
  { id: 'negative_dip',    name: 'Negative Dip',     goal_id: 'dips',    measure_type: 'reps', primary_muscle: 'triceps',   secondary_muscles: ['chest', 'front_shoulder'],        body_areas: ['shoulder', 'elbow', 'wrist'], equipment: ['parallel_bars'], difficulty: 4, standard: 'Start at lockout, lower for 4 seconds until elbows reach 90°.',           tips: 'Slow and controlled the whole way.' },
  { id: 'dip',             name: 'Dip',              goal_id: 'dips',    measure_type: 'reps', primary_muscle: 'triceps',   secondary_muscles: ['chest', 'front_shoulder'],        body_areas: ['shoulder', 'elbow', 'wrist'], equipment: ['parallel_bars'], difficulty: 5, standard: 'Elbows to 90° at the bottom, full lockout at the top, no swinging.',      tips: 'Lean slightly forward.' },
  { id: 'incline_pushup',  name: 'Incline Push-up',  goal_id: 'pushups', measure_type: 'reps', primary_muscle: 'chest',     secondary_muscles: ['triceps', 'front_shoulder'],      body_areas: ['shoulder', 'wrist'],          equipment: ['bench'],         difficulty: 2, standard: 'Hands on the bench, body straight, chest to the edge, full lockout.',     tips: 'Squeeze glutes so hips do not sag.' },
  { id: 'knee_pushup',     name: 'Knee Push-up',     goal_id: 'pushups', measure_type: 'reps', primary_muscle: 'chest',     secondary_muscles: ['triceps', 'front_shoulder'],      body_areas: ['shoulder', 'wrist'],          equipment: [],                difficulty: 3, standard: 'From the knees, body straight from knees to head, chest close to the floor.', tips: 'Elbows at about 45° from the body.' },
  { id: 'pushup',          name: 'Push-up',          goal_id: 'pushups', measure_type: 'reps', primary_muscle: 'chest',     secondary_muscles: ['triceps', 'front_shoulder', 'core'], body_areas: ['shoulder', 'wrist'],       equipment: [],                difficulty: 4, standard: 'Body straight, chest to a fist above the floor, full lockout.',           tips: 'No sagging hips.' },
  { id: 'box_squat',       name: 'Box Squat',        goal_id: 'squats',  measure_type: 'reps', primary_muscle: 'quads',     secondary_muscles: ['glutes'],                         body_areas: ['knee', 'hip'],                equipment: ['bench'],         difficulty: 1, standard: 'Sit back to touch the bench, stand to full hip extension.',              tips: 'Knees track over the toes.' },
  { id: 'bodyweight_squat', name: 'Bodyweight Squat', goal_id: 'squats', measure_type: 'reps', primary_muscle: 'quads',     secondary_muscles: ['glutes', 'hamstrings'],           body_areas: ['knee', 'hip'],                equipment: [],                difficulty: 2, standard: 'Hips below knee level, heels down, full extension at the top.',          tips: 'Chest up.' },
  { id: 'bulgarian_split_squat', name: 'Bulgarian Split Squat', goal_id: 'squats', measure_type: 'reps_per_side', primary_muscle: 'quads', secondary_muscles: ['glutes'], body_areas: ['knee', 'hip'],                equipment: ['bench'],         difficulty: 4, standard: 'Rear foot on the bench, back knee close to the floor, full extension.',   tips: 'Front knee tracks over the toes.' },
];

// Hebrew technique standards (shown when the user's language is Hebrew).
const HEBREW_STANDARDS: Record<string, string> = {
  scap_pull:             'תלייה עם ידיים ישרות, הורדת השכמות ומשיכתן לאחור בלי לכופף מרפקים',
  australian_row:        'גוף ישר, חזה נוגע במוט, יישור ידיים מלא למטה',
  negative_pullup:       'קפיצה לנקודה העליונה וירידה מבוקרת של 4 שניות עד יישור מלא',
  pullup:                'סנטר מעל המוט, יישור ידיים מלא למטה, בלי תנופה',
  bench_dip:             'ידיים על הספסל, ירידה עד מרפקים ב־90°, דחיפה ליישור מלא',
  negative_dip:          'מתחילים ביישור מלא, ירידה של 4 שניות עד מרפקים ב־90°',
  dip:                   'מרפקים ב־90° למטה, יישור מלא למעלה, בלי תנופה',
  incline_pushup:        'ידיים על הספסל, גוף ישר, חזה לקצה הספסל, יישור מלא',
  knee_pushup:           'על הברכיים, גוף ישר מהברכיים לראש, חזה קרוב לרצפה',
  pushup:                'גוף ישר, חזה עד אגרוף מהרצפה, יישור מלא',
  box_squat:             'ישיבה לאחור עד נגיעה בספסל, קימה ליישור מלא של הירך',
  bodyweight_squat:      'אגן מתחת לגובה הברך, עקבים על הרצפה, יישור מלא למעלה',
  bulgarian_split_squat: 'רגל אחורית על הספסל, ברך אחורית קרובה לרצפה, יישור מלא',
};

const PROGRESSION_STAGES = [
  { goal_id: 'pullups', stage: 1, exercise_id: 'scap_pull',       sets: 3, target_min: 8, target_max: 12, rest_seconds: 60,  advance_rule: 'Max reps on all sets in two workouts in a row', regress_rule: null },
  { goal_id: 'pullups', stage: 2, exercise_id: 'australian_row',  sets: 3, target_min: 6, target_max: 12, rest_seconds: 90,  advance_rule: 'Max reps on all sets in two workouts in a row', regress_rule: 'Below min in two workouts in a row' },
  { goal_id: 'pullups', stage: 3, exercise_id: 'negative_pullup', sets: 3, target_min: 3, target_max: 6,  rest_seconds: 120, advance_rule: 'Max reps on all sets in two workouts in a row', regress_rule: 'Below min in two workouts in a row' },
  { goal_id: 'pullups', stage: 4, exercise_id: 'pullup',          sets: 3, target_min: 1, target_max: 5,  rest_seconds: 150, advance_rule: 'Max reps on all sets in two workouts in a row', regress_rule: 'Below min in two workouts in a row' },
  // PLACEHOLDER stages — replace with the framework file.
  { goal_id: 'dips',    stage: 1, exercise_id: 'bench_dip',             sets: 3, target_min: 8, target_max: 15, rest_seconds: 60,  advance_rule: 'Max reps on all sets in two workouts in a row', regress_rule: null },
  { goal_id: 'dips',    stage: 2, exercise_id: 'negative_dip',          sets: 3, target_min: 3, target_max: 6,  rest_seconds: 120, advance_rule: 'Max reps on all sets in two workouts in a row', regress_rule: 'Below min in two workouts in a row' },
  { goal_id: 'dips',    stage: 3, exercise_id: 'dip',                   sets: 3, target_min: 1, target_max: 8,  rest_seconds: 150, advance_rule: 'Max reps on all sets in two workouts in a row', regress_rule: 'Below min in two workouts in a row' },
  { goal_id: 'pushups', stage: 1, exercise_id: 'incline_pushup',        sets: 3, target_min: 8, target_max: 15, rest_seconds: 60,  advance_rule: 'Max reps on all sets in two workouts in a row', regress_rule: null },
  { goal_id: 'pushups', stage: 2, exercise_id: 'knee_pushup',           sets: 3, target_min: 8, target_max: 15, rest_seconds: 60,  advance_rule: 'Max reps on all sets in two workouts in a row', regress_rule: 'Below min in two workouts in a row' },
  { goal_id: 'pushups', stage: 3, exercise_id: 'pushup',                sets: 3, target_min: 3, target_max: 15, rest_seconds: 90,  advance_rule: 'Max reps on all sets in two workouts in a row', regress_rule: 'Below min in two workouts in a row' },
  { goal_id: 'squats',  stage: 1, exercise_id: 'box_squat',             sets: 3, target_min: 10, target_max: 20, rest_seconds: 60, advance_rule: 'Max reps on all sets in two workouts in a row', regress_rule: null },
  { goal_id: 'squats',  stage: 2, exercise_id: 'bodyweight_squat',      sets: 3, target_min: 10, target_max: 25, rest_seconds: 60, advance_rule: 'Max reps on all sets in two workouts in a row', regress_rule: 'Below min in two workouts in a row' },
  { goal_id: 'squats',  stage: 3, exercise_id: 'bulgarian_split_squat', sets: 3, target_min: 6, target_max: 12, rest_seconds: 90,  advance_rule: 'Max reps on all sets in two workouts in a row', regress_rule: 'Below min in two workouts in a row' },
];

// Hebrew display names (shown when the user's language is Hebrew).
const HEBREW_NAMES: Record<'skills' | 'goals' | 'exercises', Record<string, string>> = {
  skills: {
    '30_pullups':           '30 מתחים',
    'weighted_pullup':      'מתח עם 20 ק"ג',
    '1_oap':                'מתח ביד אחת',
    '2_oap':                '2 מתחים ביד אחת',
    '50_dips':              '50 מקבילים',
    'wall_handstand':       'עמידת ידיים על קיר 30 שניות',
    '1_hspu':               'שכיבת סמיכה בעמידת ידיים',
    'freestanding_hspu':    'שכיבת סמיכה בעמידת ידיים חופשית',
    'tuck_front_lever_10s': 'פרונט לבר מקופל 10 שניות',
    'adv_tuck_front_lever': 'פרונט לבר מקופל מתקדם',
    'full_front_lever':     'פרונט לבר מלא 5 שניות',
    '50_squats':            '50 סקוואטים',
    '15_bulgarian_split':   '15 סקוואט בולגרי',
    'pistol_squat':         'פיסטול סקוואט',
    '10_pistol_squats':     '10 פיסטול סקוואטים',
    'squat_100':            'סקוואט 100 ק"ג',
    'squat_140':            'סקוואט 140 ק"ג',
    'squat_180':            'סקוואט 180 ק"ג',
    'bench_80':             'לחיצת חזה 80 ק"ג',
    'bench_120':            'לחיצת חזה 120 ק"ג',
    'bench_160':            'לחיצת חזה 160 ק"ג',
    'dead_140':             'דדליפט 140 ק"ג',
    'dead_200':             'דדליפט 200 ק"ג',
    'dead_250':             'דדליפט 250 ק"ג',
  },
  goals: {
    pullups: 'מתח',
    dips:    'מקבילים',
    pushups: 'שכיבות סמיכה',
    squats:  'סקוואט',
  },
  exercises: {
    scap_pull:       'משיכת שכמות',
    australian_row:  'מתח אוסטרלי',
    negative_pullup: 'מתח שלילי',
    pullup:          'מתח',
    bench_dip:             'מקבילים על ספסל',
    negative_dip:          'מקבילים שליליים',
    dip:                   'מקבילים',
    incline_pushup:        'שכיבת סמיכה בשיפוע',
    knee_pushup:           'שכיבת סמיכה על הברכיים',
    pushup:                'שכיבת סמיכה',
    box_squat:             'סקוואט לספסל',
    bodyweight_squat:      'סקוואט משקל גוף',
    bulgarian_split_squat: 'סקוואט בולגרי',
  },
};

// Trophies that already have an exercise in the library.
const SKILL_EXERCISE_LINKS = [
  { id: '30_pullups',         exercise_id: 'pullup',                target_value: 30 },
  { id: '50_dips',            exercise_id: 'dip',                   target_value: 50 },
  { id: '50_squats',          exercise_id: 'bodyweight_squat',      target_value: 50 },
  { id: '15_bulgarian_split', exercise_id: 'bulgarian_split_squat', target_value: 15 },
];

// Sample personal setup for the Rois test user (shows data on Today / Progress).
const ROIS_SETUP = {
  location: { name: 'בית', equipment: ['pull_up_bar', 'bench'], is_default: true },
  schedule: { training_days: [0, 2, 4], session_minutes: 45 },
  goals: [
    { goal_id: 'pullups', priority: 1, kind: 'personal', exercise_id: 'pullup', target_value: 35, current_stage: 4 },
    { goal_id: 'squats',  priority: 2, kind: 'trophy',   skill_id: '50_squats', current_stage: 1 },
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function ok(label: string)                { console.log(`  ✅  ${label}`); }
function warn(label: string, msg: string) { console.warn(`  ⚠️   ${label}: ${msg}`); }

// ── Main ──────────────────────────────────────────────────────────────────────
async function seed() {
  console.log('\n🌱  UNLOCKED seed script\n');

  // 0. Training content: goals → exercises → progression stages
  console.log('🏋️  Seeding training content…');
  for (const [table, rows, conflict] of [
    ['goals',              GOALS,              'id'],
    ['exercises',          EXERCISES,          'id'],
    ['progression_stages', PROGRESSION_STAGES, 'goal_id,stage'],
  ] as const) {
    const { error } = await supabase.from(table).upsert(rows as object[], { onConflict: conflict });
    if (error) { console.error(`❌  ${table} failed:`, error.message); process.exit(1); }
    ok(`${rows.length} ${table} upserted`);
  }

  // 1. Upsert skill catalogue (prerequisite_id left null — deprecated)
  console.log('📚  Seeding skills…');
  const { error: skillErr } = await supabase
    .from('skills')
    .upsert(SKILLS, { onConflict: 'id' });
  if (skillErr) { console.error('❌  Skills failed:', skillErr.message); process.exit(1); }
  ok(`${SKILLS.length} skills upserted`);

  for (const link of SKILL_EXERCISE_LINKS) {
    const { error } = await supabase.from('skills')
      .update({ exercise_id: link.exercise_id, target_value: link.target_value })
      .eq('id', link.id);
    if (error) { warn(`link ${link.id}`, error.message); }
  }
  ok(`${SKILL_EXERCISE_LINKS.length} trophies linked to exercises`);

  for (const [table, names] of Object.entries(HEBREW_NAMES)) {
    for (const [id, name_he] of Object.entries(names)) {
      const { error } = await supabase.from(table).update({ name_he }).eq('id', id);
      if (error) { warn(`${table} ${id} name_he`, error.message); }
    }
  }
  for (const [id, standard_he] of Object.entries(HEBREW_STANDARDS)) {
    const { error } = await supabase.from('exercises').update({ standard_he }).eq('id', id);
    if (error) { warn(`exercises ${id} standard_he`, error.message); }
  }
  ok('Hebrew names and standards set');

  // 2. Upsert DAG dependency edges
  console.log('\n🔗  Seeding skill_dependencies…');
  const { error: depErr } = await supabase
    .from('skill_dependencies')
    .upsert(SKILL_DEPENDENCIES, { onConflict: 'skill_id,prerequisite_id' });
  if (depErr) { console.error('❌  Dependencies failed:', depErr.message); process.exit(1); }
  ok(`${SKILL_DEPENDENCIES.length} edges upserted (${SKILL_DEPENDENCIES.filter(d =>
    SKILL_DEPENDENCIES.filter(x => x.skill_id === d.skill_id).length > 1
  ).length / 2} multi-prerequisite skills)`);

  // 3. Create / upsert each user
  console.log('\n👤  Seeding users…');
  for (const user of USERS) {
    console.log(`\n  → ${user.profile.username} (${user.email})`);

    let userId: string;
    const { data: created, error: createErr } =
      await supabase.auth.admin.createUser({
        email:         user.email,
        password:      user.password,
        email_confirm: true,
        user_metadata: { username: user.profile.username },
      });

    if (createErr) {
      if (createErr.message.includes('already been registered') || createErr.message.includes('already exists')) {
        const { data: list } = await supabase.auth.admin.listUsers();
        const existing = list?.users.find((u) => u.email === user.email);
        if (!existing) { warn(user.email, 'could not locate existing user'); continue; }
        userId = existing.id;
        warn('auth user', 'already exists');
      } else {
        warn('auth user', createErr.message); continue;
      }
    } else {
      userId = created.user.id;
      ok('auth user created');
    }

    // Force-confirm + reset password on every run
    const { data: updated, error: updateErr } = await supabase.auth.admin.updateUserById(
      userId,
      { email_confirm: true, password: user.password, user_metadata: { username: user.profile.username } },
    );
    if (updateErr) { warn('confirm', updateErr.message); }
    else           { ok(`email confirmed at: ${updated.user.email_confirmed_at}`); }

    // Upsert profile
    const { error: profileErr } = await supabase
      .from('profiles')
      .upsert({ id: userId, email: user.email, ...user.profile, joined_at: new Date().toISOString() }, { onConflict: 'id' });
    if (profileErr) { warn('profile', profileErr.message); continue; }
    ok('profile upserted');

    // Upsert unlocked skills
    if (user.unlockedSkillIds.length > 0) {
      const rows = user.unlockedSkillIds.map((skill_id) => ({
        user_id: userId, skill_id, unlocked_at: new Date().toISOString(),
      }));
      const { error: unlockErr } = await supabase
        .from('user_unlocked_skills')
        .upsert(rows, { onConflict: 'user_id,skill_id' });
      if (unlockErr) { warn('unlocked skills', unlockErr.message); }
      else           { ok(`${rows.length} skills unlocked`); }
    }

    // Sample training setup (Rois only) — replaced on every run
    if (user.email === 'rois@unlocked.app') {
      await supabase.from('user_goals').delete().eq('user_id', userId);
      await supabase.from('training_locations').delete().eq('user_id', userId);
      const results = await Promise.all([
        supabase.from('training_locations').insert({ user_id: userId, ...ROIS_SETUP.location }),
        supabase.from('user_schedules').upsert({ user_id: userId, ...ROIS_SETUP.schedule }, { onConflict: 'user_id' }),
        supabase.from('user_goals').insert(ROIS_SETUP.goals.map((g) => ({ user_id: userId, ...g }))),
        supabase.from('consents').upsert({
          user_id: userId,
          terms_accepted_at:    new Date().toISOString(),
          plan_data_consent_at: new Date().toISOString(),
          health_screening_at:  new Date().toISOString(),
        }, { onConflict: 'user_id' }),
      ]);
      const failed = results.find((r) => r.error);
      if (failed?.error) { warn('training setup', failed.error.message); }
      else               { ok('sample goals, location and schedule set'); }
    }
  }

  console.log('\n✅  Seed complete.\n');
}

seed().catch((err) => { console.error('Fatal:', err); process.exit(1); });
