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
  { id: '30_pullups',           name: '30 Pull-ups',            description: 'Complete 30 consecutive pull-ups with full range of motion.',      category: 'pull',     tree_type: 'calisthenics', xp: 500,  difficulty: 'intermediate' },
  { id: 'weighted_pullup',      name: 'Weighted Pull-up +20kg', description: 'Complete 5 strict pull-ups with 20 kg of added weight.',            category: 'pull',     tree_type: 'calisthenics', xp: 1000, difficulty: 'advanced' },
  { id: '1_oap',                name: 'One-Arm Pull-up',        description: 'Complete a strict one-arm pull-up on both arms.',                   category: 'pull',     tree_type: 'calisthenics', xp: 2000, difficulty: 'elite' },
  { id: '2_oap',                name: '2× One-Arm Pull-ups',    description: 'Complete 2 consecutive OAPs on each arm.',                          category: 'pull',     tree_type: 'calisthenics', xp: 4000, difficulty: 'elite' },
  // Calisthenics · Push
  { id: '50_dips',              name: '50 Dips',                description: 'Complete 50 consecutive parallel bar dips.',                        category: 'push',     tree_type: 'calisthenics', xp: 500,  difficulty: 'intermediate' },
  { id: 'wall_handstand',       name: 'Wall Handstand 30s',     description: 'Hold a straight-body wall handstand for 30 seconds.',               category: 'push',     tree_type: 'calisthenics', xp: 600,  difficulty: 'intermediate' },
  { id: '1_hspu',               name: 'Handstand Push-up',      description: 'Complete a full strict HSPU against a wall.',                       category: 'push',     tree_type: 'calisthenics', xp: 1500, difficulty: 'advanced' },
  { id: 'freestanding_hspu',    name: 'Freestanding HSPU',      description: 'Complete a HSPU in a freestanding handstand.',                      category: 'push',     tree_type: 'calisthenics', xp: 3000, difficulty: 'elite' },
  // Calisthenics · Lever
  { id: 'tuck_front_lever_10s', name: 'Tuck Front Lever 10s',   description: 'Hold a tuck front lever position for 10 seconds.',                  category: 'lever',    tree_type: 'calisthenics', xp: 800,  difficulty: 'intermediate' },
  { id: 'adv_tuck_front_lever', name: 'Adv. Tuck Front Lever',  description: 'Hold an advanced tuck front lever for 10 seconds.',                 category: 'lever',    tree_type: 'calisthenics', xp: 1200, difficulty: 'advanced' },
  { id: 'full_front_lever',     name: 'Full Front Lever 5s',    description: 'Hold a full front lever position for 5 seconds.',                   category: 'lever',    tree_type: 'calisthenics', xp: 2500, difficulty: 'elite' },
  // Gym · Squat
  { id: 'squat_100',            name: 'Squat 100 kg',           description: 'Complete a 1-rep max back squat of 100 kg.',                        category: 'squat',    tree_type: 'gym',          xp: 600,  difficulty: 'intermediate' },
  { id: 'squat_140',            name: 'Squat 140 kg',           description: 'Complete a 1-rep max back squat of 140 kg.',                        category: 'squat',    tree_type: 'gym',          xp: 1400, difficulty: 'advanced' },
  { id: 'squat_180',            name: 'Squat 180 kg',           description: 'Complete a 1-rep max back squat of 180 kg.',                        category: 'squat',    tree_type: 'gym',          xp: 3000, difficulty: 'elite' },
  // Gym · Bench
  { id: 'bench_80',             name: 'Bench Press 80 kg',      description: 'Complete a 1-rep max bench press of 80 kg.',                        category: 'bench',    tree_type: 'gym',          xp: 500,  difficulty: 'intermediate' },
  { id: 'bench_120',            name: 'Bench Press 120 kg',     description: 'Complete a 1-rep max bench press of 120 kg.',                       category: 'bench',    tree_type: 'gym',          xp: 1200, difficulty: 'advanced' },
  { id: 'bench_160',            name: 'Bench Press 160 kg',     description: 'Complete a 1-rep max bench press of 160 kg.',                       category: 'bench',    tree_type: 'gym',          xp: 2800, difficulty: 'elite' },
  // Gym · Deadlift
  { id: 'dead_140',             name: 'Deadlift 140 kg',        description: 'Complete a 1-rep max deadlift of 140 kg.',                          category: 'deadlift', tree_type: 'gym',          xp: 700,  difficulty: 'intermediate' },
  { id: 'dead_200',             name: 'Deadlift 200 kg',        description: 'Complete a 1-rep max deadlift of 200 kg.',                          category: 'deadlift', tree_type: 'gym',          xp: 1800, difficulty: 'advanced' },
  { id: 'dead_250',             name: 'Deadlift 250 kg',        description: 'Complete a 1-rep max deadlift of 250 kg.',                          category: 'deadlift', tree_type: 'gym',          xp: 3500, difficulty: 'elite' },
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
  // Lever chain
  { skill_id: 'adv_tuck_front_lever', prerequisite_id: 'tuck_front_lever_10s' },
  { skill_id: 'full_front_lever',    prerequisite_id: 'adv_tuck_front_lever' },
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
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function ok(label: string)                { console.log(`  ✅  ${label}`); }
function warn(label: string, msg: string) { console.warn(`  ⚠️   ${label}: ${msg}`); }

// ── Main ──────────────────────────────────────────────────────────────────────
async function seed() {
  console.log('\n🌱  UNLOCKED seed script\n');

  // 1. Upsert skill catalogue (prerequisite_id left null — deprecated)
  console.log('📚  Seeding skills…');
  const { error: skillErr } = await supabase
    .from('skills')
    .upsert(SKILLS, { onConflict: 'id' });
  if (skillErr) { console.error('❌  Skills failed:', skillErr.message); process.exit(1); }
  ok(`${SKILLS.length} skills upserted`);

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
  }

  console.log('\n✅  Seed complete.\n');
}

seed().catch((err) => { console.error('Fatal:', err); process.exit(1); });
