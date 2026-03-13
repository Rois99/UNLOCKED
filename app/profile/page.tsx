import { Ruler, Weight, Calendar, Activity, Trophy, Star, MapPin, BookOpen } from 'lucide-react';
import AppNavbar from '@/components/app/AppNavbar';
import StatCard from '@/components/profile/StatCard';
import TrophyCard from '@/components/profile/TrophyCard';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { calcAge, calcLevel } from '@/lib/skillUtils';

export const dynamic  = 'force-dynamic';
export const metadata = { title: 'Profile — UNLOCKED' };

// ── Types for the Supabase join query ────────────────────────────────────────

type UnlockedSkillRow = {
  skill_id:    string;
  unlocked_at: string;
  skills: {
    name:       string;
    xp:         number;
    category:   string;
    tree_type:  string;
    difficulty: string;
  } | null;
};

type ProfileRow = {
  id:        string;
  username:  string;
  email:     string;
  height_m:  number | null;
  weight_kg: number | null;
  dob:       string | null;
  bio:       string | null;
  location:  string | null;
  is_coach:  boolean;
  joined_at: string;
  user_unlocked_skills: UnlockedSkillRow[];
};

// ── Data fetching ─────────────────────────────────────────────────────────────

async function getProfile(): Promise<ProfileRow | null> {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select(`
      id, username, email, height_m, weight_kg, dob, bio, location, is_coach, joined_at,
      user_unlocked_skills (
        skill_id, unlocked_at,
        skills ( name, xp, category, tree_type, difficulty )
      )
    `)
    .eq('email', 'rois@unlocked.app')
    .single();

  if (error) {
    console.error('Profile fetch error:', error.message);
    return null;
  }
  return data as unknown as ProfileRow;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ProfilePage() {
  const profile = await getProfile();

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-950">
        <AppNavbar />
        <main className="flex items-center justify-center pt-40">
          <p className="text-slate-500">Profile not found.</p>
        </main>
      </div>
    );
  }

  const unlockedRows  = profile.user_unlocked_skills ?? [];
  const totalXP       = unlockedRows.reduce((sum, r) => sum + (r.skills?.xp ?? 0), 0);
  const level         = calcLevel(totalXP);
  const xpIntoLevel   = totalXP % 1000;
  const progressPct   = (xpIntoLevel / 1000) * 100;
  const age           = profile.dob ? calcAge(profile.dob) : null;
  const bmi           = profile.height_m && profile.weight_kg
    ? (profile.weight_kg / profile.height_m ** 2).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-slate-950">
      <AppNavbar />

      <main className="mx-auto max-w-4xl px-6 pt-24 pb-20">

        {/* ── Profile hero ──────────────────────────────────────────── */}
        <section className="mb-10 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
          <div className="h-28 bg-gradient-to-br from-cyan-950 via-slate-900 to-violet-950" />

          <div className="px-6 pb-6">
            {/* Avatar + level badge */}
            <div className="-mt-12 mb-4 flex items-end justify-between">
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-slate-900 bg-gradient-to-br from-cyan-400 to-violet-500 text-3xl font-black text-slate-950">
                {profile.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-white">
                <Star size={12} className="text-amber-400" fill="currentColor" />
                Level {level}
                {profile.is_coach && (
                  <span className="ml-1 rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-400">
                    Coach
                  </span>
                )}
              </div>
            </div>

            {/* Name, handle, meta */}
            <h1 className="text-3xl font-black text-white">{profile.username}</h1>
            <p className="text-sm text-slate-400">@{profile.username.toLowerCase()}</p>

            {profile.location && (
              <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                <MapPin size={11} />
                {profile.location}
              </p>
            )}

            {profile.bio && (
              <p className="mt-2 flex items-start gap-1.5 text-xs text-slate-400">
                <BookOpen size={11} className="mt-0.5 shrink-0 text-slate-500" />
                {profile.bio}
              </p>
            )}

            <p className="mt-1 text-xs text-slate-600">
              Member since {new Date(profile.joined_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
            </p>

            {/* XP bar */}
            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-400">
                  {totalXP.toLocaleString()} XP total
                </span>
                <span className="text-slate-600">
                  {xpIntoLevel} / 1000 to Level {level + 1}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats ─────────────────────────────────────────────────── */}
        <section className="mb-10">
          <SectionTitle>Athlete Stats</SectionTitle>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              label="Height"
              value={profile.height_m ? `${profile.height_m}m` : '—'}
              Icon={Ruler}
              accentClass="text-cyan-400 bg-cyan-500/10"
            />
            <StatCard
              label="Weight"
              value={profile.weight_kg ? `${profile.weight_kg}kg` : '—'}
              Icon={Weight}
              accentClass="text-violet-400 bg-violet-500/10"
            />
            <StatCard
              label="Age"
              value={age ? `${age} yrs` : '—'}
              sub={profile.dob
                ? `Born ${new Date(profile.dob).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
                : undefined}
              Icon={Calendar}
              accentClass="text-amber-400 bg-amber-500/10"
            />
            <StatCard
              label="BMI"
              value={bmi ?? '—'}
              sub={bmi ? 'Normal range' : undefined}
              Icon={Activity}
              accentClass="text-emerald-400 bg-emerald-500/10"
            />
          </div>
        </section>

        {/* ── Arsenal ───────────────────────────────────────────────── */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <SectionTitle>
              <Trophy size={16} className="text-amber-400" />
              Arsenal
            </SectionTitle>
            <span className="text-xs font-semibold text-slate-500">
              {unlockedRows.length} skills verified
            </span>
          </div>

          {unlockedRows.length === 0 ? (
            <p className="text-sm text-slate-600">No skills unlocked yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {unlockedRows.map((row) => {
                if (!row.skills) return null;
                // Build a shape compatible with TrophyCard's Skill prop
                const skill = {
                  id:             row.skill_id,
                  name:           row.skills.name,
                  xp:             row.skills.xp,
                  category:       row.skills.category,
                  treeType:       row.skills.tree_type,
                  difficulty:     row.skills.difficulty,
                  description:    '',
                  prerequisiteIds: [],
                };
                return <TrophyCard key={row.skill_id} skill={skill as never} />;
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
      {children}
    </h2>
  );
}
