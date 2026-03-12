import { Network, Star } from 'lucide-react';
import AppNavbar from '@/components/app/AppNavbar';
import SkillTree from '@/components/skills/SkillTree';
import { MOCK_USER, SKILLS } from '@/data/mockData';
import { calcTotalXP, calcLevel } from '@/lib/skillUtils';

export const metadata = { title: 'Skill Tree — UNLOCKED' };

export default function SkillsPage() {
  const totalXP = calcTotalXP(SKILLS, MOCK_USER.unlockedSkillIds);
  const level = calcLevel(totalXP);
  const xpIntoLevel = totalXP % 1000;
  const progressPct = (xpIntoLevel / 1000) * 100;

  return (
    <div className="min-h-screen bg-slate-950">
      <AppNavbar />

      <main className="mx-auto max-w-6xl px-6 pt-28 pb-20">
        {/* Page header */}
        <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Network size={16} className="text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">
                Skill Tree
              </span>
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tight text-white sm:text-5xl">
              Your Arsenal
            </h1>
            <p className="mt-2 text-slate-400">
              Click an available skill to submit proof and unlock it.
            </p>
          </div>

          {/* XP / Level widget */}
          <div className="w-full rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:w-64">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Level {level}
              </span>
              <span className="flex items-center gap-1 text-xs font-bold text-amber-400">
                <Star size={12} fill="currentColor" />
                {totalXP.toLocaleString()} XP
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="mt-1.5 text-right text-[10px] text-slate-600">
              {xpIntoLevel} / 1000 XP to Level {level + 1}
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="mb-8 flex flex-wrap items-center gap-4 text-xs font-semibold">
          <LegendItem color="bg-emerald-500" label="Unlocked" />
          <LegendItem color="bg-cyan-500" label="Available — click to claim" />
          <LegendItem color="bg-slate-600 opacity-60" label="Locked — prerequisite needed" />
        </div>

        {/* The tree (Client Component) */}
        <SkillTree unlockedSkillIds={MOCK_USER.unlockedSkillIds} />
      </main>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-2 text-slate-400">
      <span className={`inline-block h-2.5 w-2.5 rounded-full ${color}`} />
      {label}
    </span>
  );
}
