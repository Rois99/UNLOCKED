import { Ruler, Weight, Calendar, Activity, Trophy, Star } from 'lucide-react';
import AppNavbar from '@/components/app/AppNavbar';
import StatCard from '@/components/profile/StatCard';
import TrophyCard from '@/components/profile/TrophyCard';
import { MOCK_USER, SKILLS } from '@/data/mockData';
import { calcAge, calcTotalXP, calcLevel } from '@/lib/skillUtils';

export const metadata = { title: 'Profile — UNLOCKED' };

export default function ProfilePage() {
  const age = calcAge(MOCK_USER.dob);
  const bmi = MOCK_USER.weightKg / MOCK_USER.heightM ** 2;
  const totalXP = calcTotalXP(SKILLS, MOCK_USER.unlockedSkillIds);
  const level = calcLevel(totalXP);
  const xpIntoLevel = totalXP % 1000;
  const progressPct = (xpIntoLevel / 1000) * 100;

  const unlockedSkills = SKILLS.filter((s) =>
    MOCK_USER.unlockedSkillIds.includes(s.id)
  );

  return (
    <div className="min-h-screen bg-slate-950">
      <AppNavbar />

      <main className="mx-auto max-w-4xl px-6 pt-24 pb-20">

        {/* ── Profile hero ─────────────────────────────────────────────── */}
        <section className="mb-10 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
          {/* Banner gradient */}
          <div className="h-28 bg-gradient-to-br from-cyan-950 via-slate-900 to-violet-950" />

          <div className="px-6 pb-6">
            {/* Avatar */}
            <div className="-mt-12 mb-4 flex items-end justify-between">
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-slate-900 bg-gradient-to-br from-cyan-400 to-violet-500 text-3xl font-black text-slate-950">
                {MOCK_USER.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-white">
                <Star size={12} className="text-amber-400" fill="currentColor" />
                Level {level}
              </div>
            </div>

            {/* Name & meta */}
            <h1 className="text-3xl font-black text-white">{MOCK_USER.username}</h1>
            <p className="text-sm text-slate-400">@{MOCK_USER.username.toLowerCase()}</p>
            <p className="mt-1 text-xs text-slate-600">
              Member since {new Date(MOCK_USER.joinedAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
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

        {/* ── Stats ────────────────────────────────────────────────────── */}
        <section className="mb-10">
          <SectionTitle>Athlete Stats</SectionTitle>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              label="Height"
              value={`${MOCK_USER.heightM}m`}
              Icon={Ruler}
              accentClass="text-cyan-400 bg-cyan-500/10"
            />
            <StatCard
              label="Weight"
              value={`${MOCK_USER.weightKg}kg`}
              Icon={Weight}
              accentClass="text-violet-400 bg-violet-500/10"
            />
            <StatCard
              label="Age"
              value={`${age} yrs`}
              sub={`Born ${new Date(MOCK_USER.dob).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
              Icon={Calendar}
              accentClass="text-amber-400 bg-amber-500/10"
            />
            <StatCard
              label="BMI"
              value={bmi.toFixed(1)}
              sub="Normal range"
              Icon={Activity}
              accentClass="text-emerald-400 bg-emerald-500/10"
            />
          </div>
        </section>

        {/* ── Unlocked Arsenal ─────────────────────────────────────────── */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <SectionTitle>
              <Trophy size={16} className="text-amber-400" />
              Arsenal
            </SectionTitle>
            <span className="text-xs font-semibold text-slate-500">
              {unlockedSkills.length} skills verified
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {unlockedSkills.map((skill) => (
              <TrophyCard key={skill.id} skill={skill} />
            ))}
          </div>
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
