/**
 * Seed script — populates Supabase Auth + profiles + skills + user_unlocked_skills.
 *
 * Run with:  npm run seed
 *
 * Uses the service role key (bypasses RLS) so never run in a browser context.
 */
import { createClient } from '@supabase/supabase-js';
import { config }       from 'dotenv';
import { resolve }      from 'path';

// Load .env.local from the project root
config({ path: resolve(process.cwd(), '.env.local') });

const url            = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url || !serviceRoleKey) {
  console.error('❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Skill catalogue (mirrors mockData.ts) ────────────────────────────────────
const SKILLS = [
  // Calisthenics · Pull
  { id: '30_pullups',           name: '30 Pull-ups',            description: 'Complete 30 consecutive pull-ups with full range of motion.',           category: 'pull',      tree_type: 'calisthenics', prerequisite_id: null,                    xp: 500,  difficulty: 'intermediate' },
  { id: '1_oap',                name: 'One-Arm Pull-up',        description: 'Complete a strict one-arm pull-up on both arms.',                        category: 'pull',      tree_type: 'calisthenics', prerequisite_id: '30_pullups',            xp: 2000, difficulty: 'elite' },
  { id: '2_oap',                name: '2× One-Arm Pull-ups',    description: 'Complete 2 consecutive OAPs on each arm.',                               category: 'pull',      tree_type: 'calisthenics', prerequisite_id: '1_oap',                 xp: 4000, difficulty: 'elite' },
  // Calisthenics · Push
  { id: '50_dips',              name: '50 Dips',                description: 'Complete 50 consecutive parallel bar dips.',                             category: 'push',      tree_type: 'calisthenics', prerequisite_id: null,                    xp: 500,  difficulty: 'intermediate' },
  { id: '1_hspu',               name: 'Handstand Push-up',      description: 'Complete a full strict HSPU against a wall.',                            category: 'push',      tree_type: 'calisthenics', prerequisite_id: '50_dips',               xp: 1500, difficulty: 'advanced' },
  { id: 'freestanding_hspu',    name: 'Freestanding HSPU',      description: 'Complete a HSPU in a freestanding handstand.',                           category: 'push',      tree_type: 'calisthenics', prerequisite_id: '1_hspu',                xp: 3000, difficulty: 'elite' },
  // Calisthenics · Lever
  { id: 'tuck_front_lever_10s', name: 'Tuck Front Lever 10s',   description: 'Hold a tuck front lever position for 10 seconds.',                       category: 'lever',     tree_type: 'calisthenics', prerequisite_id: null,                    xp: 800,  difficulty: 'intermediate' },
  { id: 'adv_tuck_front_lever', name: 'Adv. Tuck Front Lever',  description: 'Hold an advanced tuck front lever for 10 seconds.',                      category: 'lever',     tree_type: 'calisthenics', prerequisite_id: 'tuck_front_lever_10s',  xp: 1200, difficulty: 'advanced' },
  { id: 'full_front_lever',     name: 'Full Front Lever 5s',    description: 'Hold a full front lever position for 5 seconds.',                        category: 'lever',     tree_type: 'calisthenics', prerequisite_id: 'adv_tuck_front_lever',  xp: 2500, difficulty: 'elite' },
  // Gym · Squat
  { id: 'squat_100',            name: 'Squat 100 kg',           description: 'Complete a 1-rep max back squat of 100 kg.',                             category: 'squat',     tree_type: 'gym',          prerequisite_id: null,                    xp: 600,  difficulty: 'intermediate' },
  { id: 'squat_140',            name: 'Squat 140 kg',           description: 'Complete a 1-rep max back squat of 140 kg.',                             category: 'squat',     tree_type: 'gym',          prerequisite_id: 'squat_100',             xp: 1400, difficulty: 'advanced' },
  { id: 'squat_180',            name: 'Squat 180 kg',           description: 'Complete a 1-rep max back squat of 180 kg.',                             category: 'squat',     tree_type: 'gym',          prerequisite_id: 'squat_140',             xp: 3000, difficulty: 'elite' },
  // Gym · Bench
  { id: 'bench_80',             name: 'Bench Press 80 kg',      description: 'Complete a 1-rep max bench press of 80 kg.',                             category: 'bench',     tree_type: 'gym',          prerequisite_id: null,                    xp: 500,  difficulty: 'intermediate' },
  { id: 'bench_120',            name: 'Bench Press 120 kg',     description: 'Complete a 1-rep max bench press of 120 kg.',                            category: 'bench',     tree_type: 'gym',          prerequisite_id: 'bench_80',              xp: 1200, difficulty: 'advanced' },
  { id: 'bench_160',            name: 'Bench Press 160 kg',     description: 'Complete a 1-rep max bench press of 160 kg.',                            category: 'bench',     tree_type: 'gym',          prerequisite_id: 'bench_120',             xp: 2800, difficulty: 'elite' },
  // Gym · Deadlift
  { id: 'dead_140',             name: 'Deadlift 140 kg',        description: 'Complete a 1-rep max deadlift of 140 kg.',                               category: 'deadlift',  tree_type: 'gym',          prerequisite_id: null,                    xp: 700,  difficulty: 'intermediate' },
  { id: 'dead_200',             name: 'Deadlift 200 kg',        description: 'Complete a 1-rep max deadlift of 200 kg.',                               category: 'deadlift',  tree_type: 'gym',          prerequisite_id: 'dead_140',              xp: 1800, difficulty: 'advanced' },
  { id: 'dead_250',             name: 'Deadlift 250 kg',        description: 'Complete a 1-rep max deadlift of 250 kg.',                               category: 'deadlift',  tree_type: 'gym',          prerequisite_id: 'dead_200',              xp: 3500, difficulty: 'elite' },
];

// ── Test users ───────────────────────────────────────────────────────────────
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
    unlockedSkillIds: [
      '30_pullups', '50_dips', '1_hspu', '1_oap', 'tuck_front_lever_10s',
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
      '30_pullups', '1_oap', '2_oap',
      '50_dips', '1_hspu',
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
      '30_pullups', '1_oap', '2_oap',
      '50_dips', '1_hspu', 'freestanding_hspu',
      'tuck_front_lever_10s', 'adv_tuck_front_lever', 'full_front_lever',
      'squat_100', 'squat_140', 'bench_80', 'bench_120', 'dead_140', 'dead_200',
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function ok(label: string) { console.log(`  ✅  ${label}`); }
function warn(label: string, msg: string) { console.warn(`  ⚠️   ${label}: ${msg}`); }

// ── Main ──────────────────────────────────────────────────────────────────────
async function seed() {
  console.log('\n🌱  UNLOCKED seed script\n');

  // 1. Upsert skill catalogue
  console.log('📚  Seeding skills…');
  const { error: skillErr } = await supabase
    .from('skills')
    .upsert(SKILLS, { onConflict: 'id' });
  if (skillErr) { console.error('❌  Skills upsert failed:', skillErr.message); process.exit(1); }
  ok(`${SKILLS.length} skills upserted`);

  // 2. Create / upsert each user
  console.log('\n👤  Seeding users…');
  for (const user of USERS) {
    console.log(`\n  → ${user.profile.username} (${user.email})`);

    // 2a. Create auth user (or fetch existing)
    let userId: string;
    const { data: created, error: createErr } =
      await supabase.auth.admin.createUser({
        email:             user.email,
        password:          user.password,
        email_confirm:     true,
        user_metadata:     { username: user.profile.username },
      });

    if (createErr) {
      if (createErr.message.includes('already been registered') || createErr.message.includes('already exists')) {
        // Fetch existing auth user by email
        const { data: list } = await supabase.auth.admin.listUsers();
        const existing = list?.users.find((u) => u.email === user.email);
        if (!existing) { warn(user.email, 'could not find existing user'); continue; }
        userId = existing.id;
        warn('auth user', 'already exists — forcing email confirmation + password reset');
      } else {
        warn('auth user', createErr.message);
        continue;
      }
    } else {
      userId = created.user.id;
      ok('auth user created');
    }

    // Force-confirm email and reset password regardless of how we got the userId.
    // This fixes users created before email_confirm:true was enforced.
    const { data: updated, error: updateErr } = await supabase.auth.admin.updateUserById(
      userId,
      {
        email_confirm:      true,
        password:           user.password,
        user_metadata:      { username: user.profile.username },
      },
    );
    if (updateErr) {
      warn('email confirm', updateErr.message);
    } else {
      const confirmedAt = updated.user.email_confirmed_at;
      ok(`email confirmed at: ${confirmedAt}`);
    }

    // 2b. Upsert profile
    const { error: profileErr } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: user.email,
        ...user.profile,
        joined_at: new Date().toISOString(),
      }, { onConflict: 'id' });
    if (profileErr) { warn('profile', profileErr.message); continue; }
    ok('profile upserted');

    // 2c. Insert unlocked skills
    if (user.unlockedSkillIds.length > 0) {
      const rows = user.unlockedSkillIds.map((skill_id) => ({
        user_id:     userId,
        skill_id,
        unlocked_at: new Date().toISOString(),
      }));
      const { error: unlockedErr } = await supabase
        .from('user_unlocked_skills')
        .upsert(rows, { onConflict: 'user_id,skill_id' });
      if (unlockedErr) { warn('unlocked skills', unlockedErr.message); }
      else ok(`${rows.length} skills unlocked`);
    }
  }

  console.log('\n✅  Seed complete.\n');
}

seed().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
