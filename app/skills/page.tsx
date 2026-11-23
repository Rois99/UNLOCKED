import { Star } from 'lucide-react';
import AppNavbar    from '@/components/app/AppNavbar';
import SkillsClient from '@/components/skills/SkillsClient';
import { requireUserId } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import type { DbSkillRow, DbDependencyRow } from '@/lib/skillUtils';
import { calcLevel } from '@/lib/skillUtils';
import { getI18n } from '@/lib/i18n/server';
import { localName } from '@/lib/i18n/dictionaries';

export const dynamic  = 'force-dynamic';
export const metadata = { title: 'UNLOCKED' };

export default async function SkillsPage() {
  // ── Resolve authenticated user ───────────────────────────────────────────
  const user = { id: await requireUserId() };

  const { locale, t } = await getI18n();
  const ts = t.skillsPage;

  // ── Fetch all skills, dependency edges, and current user's progress ─────
  // All three in one round trip.
  const [
    { data: skills = [] },
    { data: deps   = [] },
    { data: unlockedRows = [] },
  ] = await Promise.all([
    supabaseAdmin.from('skills').select('*').order('xp'),
    supabaseAdmin.from('skill_dependencies').select('skill_id, prerequisite_id'),
    supabaseAdmin.from('user_unlocked_skills').select('skill_id').eq('user_id', user.id),
  ]);
  const unlockedSkillIds = (unlockedRows ?? []).map((r: { skill_id: string }) => r.skill_id);

  // ── XP header stats ──────────────────────────────────────────────────────
  const totalXP    = (skills as DbSkillRow[])
    .filter((s) => unlockedSkillIds.includes(s.id))
    .reduce((sum, s) => sum + s.xp, 0);
  const level       = calcLevel(totalXP);
  const xpIntoLevel = totalXP % 1000;
  const progressPct = (xpIntoLevel / 1000) * 100;

  return (
    <div className="min-h-screen bg-slate-950">
      <AppNavbar labels={t.nav} />

      <main className="mx-auto max-w-3xl px-6 pt-28 pb-20 space-y-10">
        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-4 text-center">
          <h1
            className="text-5xl font-black uppercase tracking-tight text-white sm:text-6xl"
            style={{ fontFamily: 'var(--font-condensed)' }}
          >
            {ts.title}
          </h1>
          <p className="text-slate-400 max-w-sm text-sm">
            {ts.hintStart}<span className="text-cyan-400 font-semibold">{ts.hintNode}</span>{ts.hintEnd}
          </p>

          <div className="w-full max-w-xs">
            <div className="mb-1.5 flex justify-between text-xs">
              <span className="font-semibold text-slate-400">{ts.level(level)}</span>
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

        {/* ── Skill tree client island ───────────────────────────────── */}
        <SkillsClient
          allSkills={(skills as (DbSkillRow & { name_he?: string | null })[]).map((s) => ({ ...s, name: localName(s, locale) }))}
          allDeps={deps            as DbDependencyRow[]}
          unlockedSkillIds={unlockedSkillIds}
          labels={{ dragHint: ts.dragHint, or: ts.or }}
        />
      </main>
    </div>
  );
}
