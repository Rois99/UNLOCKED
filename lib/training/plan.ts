/**
 * Rule-based workout planning and stage progression.
 *
 * This is the fallback generator from the decisions doc: it only uses the
 * framework content (goals → progression stages → exercises) and the user's
 * own logged sets. The AI generator will sit behind the same entry points.
 *
 * Server-only: uses the service-role client and must be called after the
 * caller has verified which user it is acting for.
 */
import { supabaseAdmin } from '@/lib/supabase-admin';
import type { BodyArea, Exercise, Feedback, ProgressionStage, UserGoal } from '@/types';

export type FitContext = { equipment: string[] | null; frozen: BodyArea[] };

/** An exercise fits when its equipment is available and none of its body areas is frozen. */
export function fits(ex: Pick<Exercise, 'equipment' | 'body_areas'>, ctx: FitContext): boolean {
  const equipmentOk = ctx.equipment === null || ex.equipment.every((e) => ctx.equipment!.includes(e));
  const areasOk     = !ex.body_areas.some((a) => ctx.frozen.includes(a));
  return equipmentOk && areasOk;
}

export async function loadFitContext(userId: string, locationId?: string | null) {
  const locQuery = supabaseAdmin.from('training_locations').select('id, equipment').eq('user_id', userId);
  const [{ data: loc }, { data: frozen }] = await Promise.all([
    locationId ? locQuery.eq('id', locationId).maybeSingle() : locQuery.eq('is_default', true).maybeSingle(),
    supabaseAdmin.from('frozen_areas').select('area').eq('user_id', userId).is('released_at', null),
  ]);
  return {
    locationId: (loc?.id as string | undefined) ?? null,
    ctx: {
      equipment: (loc?.equipment as string[] | undefined) ?? null,
      frozen:    (frozen ?? []).map((f) => f.area as BodyArea),
    } satisfies FitContext,
  };
}

export async function loadContent() {
  const [{ data: stages }, { data: exercises }] = await Promise.all([
    supabaseAdmin.from('progression_stages').select('*'),
    supabaseAdmin.from('exercises').select('*'),
  ]);
  const exById = new Map((exercises ?? []).map((e) => [e.id as string, e as Exercise]));
  return { stages: (stages ?? []) as ProgressionStage[], exById };
}

type LastPerformance = { values: number[]; feedback: Feedback | null; workoutFeedback: Feedback | null };

/** Most recent finished performance of an exercise by this user (excluding one workout). */
export async function lastPerformance(userId: string, exerciseId: string, excludeWorkoutId?: string): Promise<LastPerformance | null> {
  const { data } = await supabaseAdmin
    .from('workout_exercises')
    .select('id, feedback, workout_id, workouts!inner(user_id, status, finished_at, feedback), workout_sets(set_number, actual_value)')
    .eq('exercise_id', exerciseId)
    .eq('status', 'done')
    .eq('workouts.user_id', userId)
    .in('workouts.status', ['completed', 'partial'])
    .limit(20);

  type Row = {
    workout_id: string;
    feedback: Feedback | null;
    workouts: { finished_at: string | null; feedback: Feedback | null };
    workout_sets: { set_number: number; actual_value: number | null }[];
  };
  const rows = ((data ?? []) as unknown as Row[])
    .filter((r) => r.workout_id !== excludeWorkoutId && r.workouts?.finished_at)
    .sort((a, b) => (b.workouts.finished_at! > a.workouts.finished_at! ? 1 : -1));
  const last = rows[0];
  if (!last) return null;
  const values = last.workout_sets
    .sort((a, b) => a.set_number - b.set_number)
    .map((s) => s.actual_value)
    .filter((v): v is number => v !== null);
  if (values.length === 0) return null;
  return { values, feedback: last.feedback, workoutFeedback: last.workouts.feedback };
}

/** The stage to train for a goal: its current stage, or the nearest easier one that fits. */
export function pickStage(goal: Pick<UserGoal, 'goal_id' | 'current_stage'>, stages: ProgressionStage[], exById: Map<string, Exercise>, ctx: FitContext) {
  const track = stages.filter((s) => s.goal_id === goal.goal_id && s.stage <= goal.current_stage).sort((a, b) => b.stage - a.stage);
  for (const s of track) {
    const ex = exById.get(s.exercise_id);
    if (ex && fits(ex, ctx)) return { stage: s, exercise: ex, lowered: s.stage < goal.current_stage };
  }
  return null;
}

export type PlanTexts = {
  first:      string;
  keep:       string;
  easier:     (exercise: string) => string;
  lowerStage: (exercise: string) => string;
};

/**
 * Creates today's workout for the user (status in_progress) and returns its id.
 * Every active goal gets its stage exercise; the planned value per set builds
 * on the last performance (+1 when it felt easy), clamped to the stage range.
 */
export async function createWorkout(userId: string, texts: PlanTexts, exName: (ex: Exercise) => string): Promise<string> {
  const [{ data: goals }, content, fit] = await Promise.all([
    supabaseAdmin.from('user_goals').select('*').eq('user_id', userId).is('archived_at', null).order('priority'),
    loadContent(),
    loadFitContext(userId),
  ]);

  const notes: string[] = [];
  const rows: {
    exercise: Exercise; goalId: string; stage: ProgressionStage; planned: number;
  }[] = [];

  for (const goal of (goals ?? []) as UserGoal[]) {
    const pick = pickStage(goal, content.stages, content.exById, fit.ctx);
    if (!pick) continue;
    const last = await lastPerformance(userId, pick.exercise.id);
    let planned = last ? Math.max(...last.values) : pick.stage.target_min;
    const feltEasy = last && (last.feedback === 'easy' || last.workoutFeedback === 'easy');
    if (feltEasy) {
      planned += 1;
      notes.push(texts.easier(exName(pick.exercise)));
    }
    planned = Math.min(Math.max(planned, pick.stage.target_min), pick.stage.target_max);
    if (pick.lowered) notes.push(texts.lowerStage(exName(pick.exercise)));
    rows.push({ exercise: pick.exercise, goalId: goal.goal_id, stage: pick.stage, planned });
  }

  const { data: prior } = await supabaseAdmin
    .from('workouts').select('id', { count: 'exact', head: false }).eq('user_id', userId).in('status', ['completed', 'partial']).limit(1);
  const explanation = notes.length > 0 ? notes.join(' ') : (prior && prior.length > 0 ? texts.keep : texts.first);

  const today = new Date().toISOString().slice(0, 10);
  const { data: workout, error } = await supabaseAdmin
    .from('workouts')
    .insert({
      user_id: userId, scheduled_date: today, status: 'in_progress', started_at: new Date().toISOString(),
      location_id: fit.locationId, generator: 'rules', explanation,
    })
    .select('id')
    .single();
  if (error || !workout) throw new Error(error?.message ?? 'Could not create workout');

  for (const [i, r] of rows.entries()) {
    await insertExercise(workout.id, (i + 1) * 10, r.exercise.id, r.goalId, r.stage, r.planned);
  }
  return workout.id as string;
}

/** Inserts one exercise into a workout with one empty set row per planned set. */
export async function insertExercise(
  workoutId: string, position: number, exerciseId: string, goalId: string | null,
  stage: Pick<ProgressionStage, 'sets' | 'target_min' | 'target_max' | 'rest_seconds'>, planned: number,
  replacesId?: string,
) {
  const { data: we, error } = await supabaseAdmin
    .from('workout_exercises')
    .insert({
      workout_id: workoutId, position, exercise_id: exerciseId, goal_id: goalId,
      planned_sets: stage.sets, target_min: stage.target_min, target_max: stage.target_max,
      rest_seconds: stage.rest_seconds, replaces_id: replacesId ?? null,
    })
    .select('id')
    .single();
  if (error || !we) throw new Error(error?.message ?? 'Could not add exercise');
  await supabaseAdmin.from('workout_sets').insert(
    Array.from({ length: stage.sets }, (_, k) => ({ workout_exercise_id: we.id, set_number: k + 1, planned_value: planned })),
  );
  return we.id as string;
}

/**
 * After a finished workout: move each goal up a stage when every set hit the
 * stage maximum in this and the previous session, and down a stage when sets
 * fell below the minimum in both. Only exercises at the goal's current stage count.
 */
export async function applyProgression(userId: string, workoutId: string) {
  const [{ data: exercises }, { data: goals }, content] = await Promise.all([
    supabaseAdmin.from('workout_exercises').select('*, workout_sets(actual_value)').eq('workout_id', workoutId).eq('status', 'done'),
    supabaseAdmin.from('user_goals').select('*').eq('user_id', userId).is('archived_at', null),
    loadContent(),
  ]);

  for (const we of exercises ?? []) {
    const goal = (goals ?? []).find((g) => g.goal_id === we.goal_id) as UserGoal | undefined;
    if (!goal) continue;
    const stage = content.stages.find((s) => s.goal_id === goal.goal_id && s.exercise_id === we.exercise_id);
    if (!stage || stage.stage !== goal.current_stage) continue;

    const values = (we.workout_sets as { actual_value: number | null }[]).map((s) => s.actual_value ?? 0);
    const prev   = await lastPerformance(userId, we.exercise_id, workoutId);
    const allMax = (v: number[]) => v.length > 0 && v.every((x) => x >= stage.target_max);
    const below  = (v: number[]) => v.some((x) => x < stage.target_min);

    let next = goal.current_stage;
    const hasNext = content.stages.some((s) => s.goal_id === goal.goal_id && s.stage === goal.current_stage + 1);
    if (allMax(values) && prev && allMax(prev.values) && hasNext) next += 1;
    else if (below(values) && prev && below(prev.values) && goal.current_stage > 1) next -= 1;

    if (next !== goal.current_stage) {
      await supabaseAdmin.from('user_goals').update({ current_stage: next }).eq('id', goal.id);
    }
  }
}

/** Workouts left open for more than 3 hours are saved as partial. */
export async function closeStaleWorkouts(userId: string) {
  const cutoff = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
  await supabaseAdmin
    .from('workouts')
    .update({ status: 'partial', finished_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('status', 'in_progress')
    .lt('started_at', cutoff);
}
