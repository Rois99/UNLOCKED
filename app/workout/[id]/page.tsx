import { notFound, redirect } from 'next/navigation';
import AppNavbar from '@/components/app/AppNavbar';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getI18n } from '@/lib/i18n/server';
import { localName } from '@/lib/i18n/dictionaries';
import { fits, lastPerformance, loadContent, loadFitContext } from '@/lib/training/plan';
import type { ExerciseStatus, MeasureType } from '@/types';
import WorkoutRunner, { type RunnerExercise } from './WorkoutRunner';

export const dynamic  = 'force-dynamic';
export const metadata = { title: 'UNLOCKED' };

export default async function WorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await createSupabaseServerClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect('/login');

  const { data: workout } = await supabaseAdmin
    .from('workouts').select('*').eq('id', id).eq('user_id', user.id).maybeSingle();
  if (!workout) notFound();
  if (workout.status !== 'in_progress') redirect(`/workout/${id}/done`);

  const { locale, t } = await getI18n();
  const [{ data: rows }, { stages, exById }, fit, { data: goals }] = await Promise.all([
    supabaseAdmin.from('workout_exercises').select('*, workout_sets(*)').eq('workout_id', id).order('position'),
    loadContent(),
    loadFitContext(user.id, workout.location_id),
    supabaseAdmin.from('user_goals').select('goal_id, current_stage').eq('user_id', user.id).is('archived_at', null),
  ]);

  // Previous performances in parallel (one round trip each to the database).
  const lasts = await Promise.all((rows ?? []).map((r) => lastPerformance(user.id, r.exercise_id, id)));

  const exercises: RunnerExercise[] = [];
  for (const [i, row] of (rows ?? []).entries()) {
    const ex = exById.get(row.exercise_id);
    if (!ex) continue;
    const stage = stages.find((s) => s.goal_id === row.goal_id && s.exercise_id === row.exercise_id);
    const goalStage = goals?.find((g) => g.goal_id === row.goal_id)?.current_stage ?? 1;
    const last = lasts[i];

    const alternatives = stages
      .filter((s) => s.goal_id === row.goal_id && s.stage <= goalStage && s.exercise_id !== row.exercise_id)
      .sort((a, b) => b.stage - a.stage)
      .flatMap((s) => {
        const alt = exById.get(s.exercise_id);
        return alt && fits(alt, fit.ctx) ? [{ exerciseId: alt.id, name: localName(alt, locale), stage: s.stage }] : [];
      });

    exercises.push({
      id:          row.id,
      name:        localName(ex, locale),
      standard:    (locale === 'he' && ex.standard_he) || ex.standard || '',
      bodyAreas:   ex.body_areas,
      measure:     ex.measure_type as MeasureType,
      stage:       stage?.stage ?? null,
      status:      row.status as ExerciseStatus,
      restSeconds: row.rest_seconds,
      sets: (row.workout_sets as { id: string; set_number: number; planned_value: number | null; actual_value: number | null }[])
        .sort((a, b) => a.set_number - b.set_number)
        .map((s) => ({ id: s.id, number: s.set_number, planned: s.planned_value ?? row.target_min, actual: s.actual_value })),
      lastValues:  last?.values ?? null,
      alternatives,
    });
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <AppNavbar labels={t.nav} />
      <main className="mx-auto max-w-xl px-5 pt-24 pb-28">
        <WorkoutRunner
          workoutId={id}
          explanation={workout.explanation}
          exercises={exercises}
          locale={locale}
          areas={t.areas}
        />
      </main>
    </div>
  );
}
