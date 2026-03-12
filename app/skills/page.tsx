import { Star } from 'lucide-react';
import AppNavbar from '@/components/app/AppNavbar';
import SkillsClient from '@/components/skills/SkillsClient';
import { MOCK_USER, SKILLS } from '@/data/mockData';
import { calcTotalXP, calcLevel } from '@/lib/skillUtils';

export const metadata = { title: 'Skill Tree — UNLOCKED' };

export default function SkillsPage() {
  const totalXP      = calcTotalXP(SKILLS, MOCK_USER.unlockedSkillIds);
  const level        = calcLevel(totalXP);
  const xpIntoLevel  = totalXP % 1000;
  const progressPct  = (xpIntoLevel / 1000) * 100;

  return (
    <div className="min-h-screen bg-slate-950">
      <AppNavbar />

      <main className="mx-auto max-w-3xl px-6 pt-28 pb-20 space-y-10">
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-4 text-center">
          <h1
            className="text-5xl font-black uppercase tracking-tight text-white sm:text-6xl"
            style={{ fontFamily: 'var(--font-condensed)' }}
          >
            Skill Tree
          </h1>
          <p className="text-slate-400 max-w-sm text-sm">
            Click a <span className="text-cyan-400 font-semibold">glowing node</span> to
            submit proof and unlock the skill.
          </p>

          {/* XP bar */}
          <div className="w-full max-w-xs">
            <div className="mb-1.5 flex justify-between text-xs">
              <span className="font-semibold text-slate-400">Level {level}</span>
              <span className="flex items-center gap-1 font-bold text-amber-400">
                <Star size={11} fill="currentColor" />
                {totalXP.toLocaleString()} XP
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* ── Radial tree (client island) ─────────────────────────────── */}
        <SkillsClient />
      </main>
    </div>
  );
}
