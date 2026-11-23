import { Flame, TrendingUp } from 'lucide-react';
import AppNavbar from '@/components/app/AppNavbar';
import { requireUserId } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getI18n } from '@/lib/i18n/server';
import { localName } from '@/lib/i18n/dictionaries';
import { buildSeries, weeklySummary, weekStart, type FinishedWorkout } from '@/lib/progress';
import ExerciseChart, { type ChartSeries } from './ExerciseChart';

export const dynamic  = 'force-dynamic';
export const metadata = { title: 'UNLOCKED' };

/** Workouts needed before a trend is shown (no made-up numbers before that). */
const MIN_WORKOUTS_FOR_TREND = 2;

type WorkoutRow = {
  id: string; started_at: string | null; finished_at: string | null;
  workout_exercises: { exercise_id: string; status: string; workout_sets: { actual_value: number | null }[] }[];
};

export default async function ProgressPage() {
  const user = { id: await requireUserId() };

  const { locale, t } = await getI18n();
  const tp = t.progressPage;

  const thisSunday = weekStart(new Date());
  const [{ data: rows }, { data: exercises }, { data: goals }, { data: schedule }, { data: override }] = await Promise.all([
    supabaseAdmin
      .from('workouts')
      .select('id, started_at, finished_at, workout_exercises(exercise_id, status, workout_sets(actual_value))')
      .eq('user_id', user.id)
      .in('status', ['completed', 'partial'])
      .not('finished_at', 'is', null),
    supabaseAdmin.from('exercises').select('id, name, name_he'),
    supabaseAdmin
      .from('user_goals')
      .select('priority, kind, exercise_id, target_value, skills(exercise_id, target_value)')
      .eq('user_id', user.id)
      .is('archived_at', null)
      .order('priority'),
    supabaseAdmin.from('user_schedules').select('training_days').eq('user_id', user.id).maybeSingle(),
    supabaseAdmin.from('schedule_overrides').select('training_days').eq('user_id', user.id)
      .eq('week_start', thisSunday.toISOString().slice(0, 10)).maybeSingle(),
  ]);

  const workouts: FinishedWorkout[] = ((rows ?? []) as WorkoutRow[]).map((w) => ({
    id: w.id,
    started_at: w.started_at,
    finished_at: w.finished_at!,
    exercises: w.workout_exercises
      .filter((e) => e.status === 'done')
      .map((e) => ({
        exercise_id: e.exercise_id,
        values: e.workout_sets.map((s) => s.actual_value).filter((v): v is number => v !== null),
      })),
  }));

  // ── Not enough data yet ────────────────────────────────────────────────
  if (workouts.length < MIN_WORKOUTS_FOR_TREND) {
    return (
      <Shell t={t}>
        <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center">
          <TrendingUp className="mx-auto text-slate-600" size={28} />
          <p className="mt-3 text-sm font-semibold text-white">{tp.moreWorkouts(MIN_WORKOUTS_FOR_TREND - workouts.length)}</p>
          <p className="mt-1 text-sm text-slate-400">{tp.trendBody}</p>
        </div>
      </Shell>
    );
  }

  // ── Series per exercise, goal exercises first (in priority order) ─────
  const series = buildSeries(workouts);
  const exName = new Map((exercises ?? []).map((e) => [e.id, localName(e, locale)]));
  type GoalRow = { kind: string; exercise_id: string | null; target_value: number | null; skills: { exercise_id: string | null; target_value: number | null } | null };
  const goalFor = new Map<string, number>();
  const goalOrder: string[] = [];
  for (const g of (goals ?? []) as unknown as GoalRow[]) {
    const ex  = g.kind === 'trophy' ? g.skills?.exercise_id : g.exercise_id;
    const val = g.kind === 'trophy' ? g.skills?.target_value : g.target_value;
    if (ex && val) { goalFor.set(ex, val); goalOrder.push(ex); }
  }
  const lastDate = (s: (typeof series)[number]) => Date.parse(s.points[s.points.length - 1].date);
  const chartSeries: ChartSeries[] = series
    .sort((a, b) => {
      const ga = goalOrder.indexOf(a.exerciseId), gb = goalOrder.indexOf(b.exerciseId);
      if (ga !== -1 || gb !== -1) return (ga === -1 ? 99 : ga) - (gb === -1 ? 99 : gb);
      return lastDate(b) - lastDate(a);
    })
    .map((s) => ({ exerciseId: s.exerciseId, name: exName.get(s.exerciseId) ?? s.exerciseId, goal: goalFor.get(s.exerciseId) ?? null, points: s.points }));

  // ── Weekly summary ─────────────────────────────────────────────────────
  const planned = (override?.training_days ?? schedule?.training_days ?? []).length;
  const week    = weeklySummary(workouts, series, planned);
  const fmt     = (d: Date) => d.toLocaleDateString(locale === 'he' ? 'he-IL' : 'en-GB', { day: 'numeric', month: 'numeric' });
  const volDiff = week.thisWeek.volume - week.lastWeek.volume;

  return (
    <Shell t={t}>
      <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
        {/* The date range is isolated left-to-right so it doesn't flip inside Hebrew text. */}
        <h2 className="text-sm font-bold text-white">{tp.weekTitle(`⁦${fmt(week.weekStart)}–${fmt(week.weekEnd)}⁩`)}</h2>
        {planned === 0 && <p className="text-xs text-slate-500">{tp.noPlan}</p>}
        <div className="grid grid-cols-2 gap-2">
          <Tile label={tp.workouts} value={planned > 0 ? `${week.thisWeek.workouts} / ${planned}` : `${week.thisWeek.workouts}`}
            sub={week.streak > 0 ? <span className="flex items-center gap-1 text-emerald-400"><Flame size={12} />{tp.streak}: {tp.weeks(week.streak)}</span> : null} />
          <Tile label={tp.volumeLabel} value={`${week.thisWeek.volume}`}
            sub={<span className={volDiff >= 0 ? 'text-emerald-400' : 'text-slate-400'}>{tp.vsLastWeek(volDiff)}</span>} />
          <Tile label={tp.minutes} value={`${week.thisWeek.minutes}`} sub={<span className="text-slate-500">{tp.min}</span>} />
          <Tile label={tp.records} value={`${week.thisWeek.records}`} sub={null} />
        </div>
        <p className="text-xs text-slate-500">{tp.monthCompare(week.monthAgo.workouts, week.monthAgo.volume)}</p>
      </section>

      <ExerciseChart locale={locale} series={chartSeries} />
    </Shell>
  );
}

function Shell({ t, children }: { t: Awaited<ReturnType<typeof getI18n>>['t']; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950">
      <AppNavbar labels={t.nav} />
      <main className="mx-auto max-w-xl px-5 pt-24 pb-28 space-y-5">
        <h1 className="text-4xl font-black uppercase tracking-tight text-white" style={{ fontFamily: 'var(--font-condensed)' }}>
          {t.progressPage.title}
        </h1>
        {children}
      </main>
    </div>
  );
}

function Tile({ label, value, sub }: { label: string; value: string; sub: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-slate-950/60 p-3">
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className="text-2xl font-bold tabular-nums text-white">{value}</p>
      {sub && <div className="mt-0.5 text-[11px]">{sub}</div>}
    </div>
  );
}
