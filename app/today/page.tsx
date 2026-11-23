import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CalendarCheck, MapPin, Target, Trophy } from 'lucide-react';
import AppNavbar from '@/components/app/AppNavbar';
import { requireUserId } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getI18n } from '@/lib/i18n/server';
import { localName } from '@/lib/i18n/dictionaries';
import { dayLabel, nextTrainingDay } from '@/lib/schedule';
import type { TrainingLocation, UserGoal, UserSchedule } from '@/types';
import { closeStaleWorkouts } from '@/lib/training/plan';
import { startWorkout } from '@/app/workout/actions';

export const dynamic  = 'force-dynamic';
export const metadata = { title: 'UNLOCKED' };

type Named = { name: string; name_he: string | null } | null;
type GoalRow = UserGoal & { goals: Named; skills: Named; exercises: Named };

export default async function TodayPage() {
  const user = { id: await requireUserId() };

  const { locale, t } = await getI18n();
  const tp = t.todayPage;

  await closeStaleWorkouts(user.id);

  const [{ data: goals }, { data: schedule }, { data: location }, { data: consents }, { data: openWorkout }] = await Promise.all([
    supabaseAdmin
      .from('user_goals')
      .select('*, goals(name, name_he), skills(name, name_he), exercises(name, name_he)')
      .eq('user_id', user.id)
      .is('archived_at', null)
      .order('priority'),
    supabaseAdmin.from('user_schedules').select('*').eq('user_id', user.id).maybeSingle(),
    supabaseAdmin.from('training_locations').select('*').eq('user_id', user.id).eq('is_default', true).maybeSingle(),
    supabaseAdmin.from('consents').select('health_screening_at').eq('user_id', user.id).maybeSingle(),
    supabaseAdmin.from('workouts').select('id').eq('user_id', user.id).eq('status', 'in_progress').limit(1).maybeSingle(),
  ]);

  // New users go through onboarding first: questionnaire, goals, routine, opening check.
  if (!consents?.health_screening_at || (goals ?? []).length === 0) redirect('/onboarding');

  const activeGoals = (goals ?? []) as GoalRow[];
  const sched       = schedule as UserSchedule | null;
  const loc         = location as TrainingLocation | null;
  const next        = sched ? nextTrainingDay(sched.training_days) : null;

  return (
    <div className="min-h-screen bg-slate-950">
      <AppNavbar labels={t.nav} />

      <main className="mx-auto max-w-xl px-5 pt-24 pb-28 space-y-5">
        <h1
          className="text-4xl font-black uppercase tracking-tight text-white"
          style={{ fontFamily: 'var(--font-condensed)' }}
        >
          {tp.title}
        </h1>

        {/* ── Goals ─────────────────────────────────────────────────── */}
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">{tp.yourGoals}</h2>
          {activeGoals.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-700 p-4">
              <p className="text-sm font-semibold text-white">{tp.pickGoal}</p>
              <p className="mt-1 text-sm text-slate-400">{tp.pickGoalBody}</p>
            </div>
          ) : (
            activeGoals.map((g) => (
              <div key={g.id} className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    {g.kind === 'trophy'
                      ? <Trophy size={15} className="text-amber-400" />
                      : <Target size={15} className="text-cyan-400" />}
                    {g.kind === 'trophy'
                      ? localName(g.skills, locale)
                      : `${localName(g.exercises, locale)} · ${g.target_value} ${tp.reps}`}
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    g.priority === 1 ? 'bg-cyan-500/15 text-cyan-300' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {g.priority === 1 ? tp.primary : `#${g.priority}`}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-slate-500">
                  {tp.track(localName(g.goals, locale), g.current_stage)}
                </p>
              </div>
            ))
          )}
        </section>

        {/* ── Next workout ──────────────────────────────────────────── */}
        <section className="rounded-xl border border-cyan-500/30 bg-slate-900/70 p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
            <CalendarCheck size={14} /> {tp.nextWorkout}
          </div>
          {next && sched ? (
            <>
              <p className="text-lg font-bold text-white">{dayLabel(next.daysAway, next.date, t)}</p>
              <p className="text-sm text-slate-400">
                {tp.trainingDays(sched.training_days.map((d) => t.weekdaysShort[d]).join(', '), sched.session_minutes)}
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-400">{tp.setDays}</p>
          )}
          {openWorkout && <p className="text-xs text-amber-300">{tp.openWorkout}</p>}
          <form action={startWorkout} className="pt-1">
            <button
              type="submit"
              className="w-full rounded-xl bg-cyan-500 py-3 text-base font-bold text-slate-950 transition-colors hover:bg-cyan-400"
            >
              {openWorkout ? tp.resume : tp.start}
            </button>
          </form>
          {loc && (
            <p className="flex items-center gap-1.5 pt-1 text-xs text-slate-500">
              <MapPin size={13} /> {loc.name}
            </p>
          )}
        </section>

        <Link href="/skills" className="block text-center text-sm font-semibold text-cyan-400 hover:text-cyan-300">
          {tp.seePath}
        </Link>
      </main>
    </div>
  );
}
