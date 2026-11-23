import { notFound, redirect } from 'next/navigation';
import { Trophy } from 'lucide-react';
import AppNavbar from '@/components/app/AppNavbar';
import { requireUserId } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getI18n } from '@/lib/i18n/server';
import { localName } from '@/lib/i18n/dictionaries';
import { lastPerformances } from '@/lib/training/plan';
import FeedbackForm from './FeedbackForm';

export const dynamic  = 'force-dynamic';
export const metadata = { title: 'UNLOCKED' };

type Row = {
  id: string; exercise_id: string; status: string;
  exercises: { name: string; name_he: string | null } | null;
  workout_sets: { actual_value: number | null }[];
};

export default async function WorkoutDonePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = { id: await requireUserId() };

  const { data: workout } = await supabaseAdmin.from('workouts').select('*').eq('id', id).eq('user_id', user.id).maybeSingle();
  if (!workout) notFound();
  if (workout.status === 'in_progress') redirect(`/workout/${id}`);

  const { locale, t } = await getI18n();
  const td = t.donePage;

  const { data } = await supabaseAdmin
    .from('workout_exercises')
    .select('id, exercise_id, status, exercises(name, name_he), workout_sets(actual_value)')
    .eq('workout_id', id)
    .order('position');
  const rows   = ((data ?? []) as unknown as Row[]).filter((r) => r.status !== 'swapped');
  const done   = rows.filter((r) => r.status === 'done');
  const minutes = workout.started_at && workout.finished_at
    ? Math.max(1, Math.round((Date.parse(workout.finished_at) - Date.parse(workout.started_at)) / 60000))
    : 0;

  // New best = best set today beats the best set of the previous session.
  const bests: string[] = [];
  const prevAll = await lastPerformances(user.id, done.map((r) => r.exercise_id), id);
  for (const r of done) {
    const today = Math.max(...r.workout_sets.map((s) => s.actual_value ?? 0));
    const prev  = prevAll.get(r.exercise_id) ?? null;
    if (prev && today > Math.max(...prev.values)) {
      bests.push(td.newBest(localName(r.exercises, locale), today, Math.max(...prev.values)));
    }
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <AppNavbar labels={t.nav} />
      <main className="mx-auto max-w-xl px-5 pt-24 pb-28 space-y-5">
        <div>
          <h1 className="text-3xl font-black text-white" style={{ fontFamily: 'var(--font-condensed)' }}>{td.title}</h1>
          <p className="mt-1 text-sm text-slate-400">{td.summary(done.length, rows.length, minutes)}</p>
        </div>

        {bests.map((b) => (
          <div key={b} className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
            <Trophy size={16} className="shrink-0 text-amber-400" /> {b}
          </div>
        ))}

        <FeedbackForm
          workoutId={id}
          exercises={done.map((r) => ({ id: r.id, name: localName(r.exercises, locale) }))}
          locale={locale}
        />
      </main>
    </div>
  );
}
