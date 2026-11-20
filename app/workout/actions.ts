'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getI18n } from '@/lib/i18n/server';
import { localName } from '@/lib/i18n/dictionaries';
import {
  applyProgression, closeStaleWorkouts, createWorkout, fits, insertExercise, loadContent, loadFitContext,
} from '@/lib/training/plan';
import type { BodyArea, EndReason, Feedback, SwapReason } from '@/types';

const AREAS: BodyArea[]       = ['shoulder', 'elbow', 'wrist', 'lower_back', 'hip', 'knee', 'ankle', 'neck'];
const FEEDBACK: Feedback[]    = ['easy', 'ok', 'hard'];
const REASONS: SwapReason[]   = ['no_equipment', 'too_hard', 'uncomfortable'];
const END_REASONS: EndReason[] = ['out_of_time', 'tired', 'pain', 'other'];

async function requireUser() {
  const client = await createSupabaseServerClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect('/login');
  return user;
}

/** Loads a workout only if it belongs to the user. */
async function ownWorkout(userId: string, workoutId: string) {
  const { data } = await supabaseAdmin.from('workouts').select('*').eq('id', workoutId).eq('user_id', userId).maybeSingle();
  if (!data) throw new Error('Workout not found');
  return data;
}

/** Loads a workout exercise only if its workout belongs to the user. */
async function ownExercise(userId: string, weId: string) {
  const { data } = await supabaseAdmin
    .from('workout_exercises')
    .select('*, workouts!inner(user_id, status)')
    .eq('id', weId)
    .eq('workouts.user_id', userId)
    .maybeSingle();
  if (!data) throw new Error('Exercise not found');
  return data;
}

/** Opens today's workout, or the one already in progress. */
export async function startWorkout() {
  const user = await requireUser();
  await closeStaleWorkouts(user.id);

  const { data: open } = await supabaseAdmin
    .from('workouts').select('id').eq('user_id', user.id).eq('status', 'in_progress')
    .order('started_at', { ascending: false }).limit(1).maybeSingle();
  if (open) redirect(`/workout/${open.id}`);

  const { locale, t } = await getI18n();
  const id = await createWorkout(user.id, t.planTexts, (ex) => localName(ex, locale));
  redirect(`/workout/${id}`);
}

/** Saves the actual value of one set; marks the exercise done when every set is logged. */
export async function logSet(setId: string, value: number) {
  const user = await requireUser();
  if (!Number.isInteger(value) || value < 0 || value > 999) throw new Error('Invalid value');

  const { data: set } = await supabaseAdmin
    .from('workout_sets')
    .select('id, workout_exercise_id, workout_exercises!inner(workout_id, workouts!inner(user_id))')
    .eq('id', setId)
    .eq('workout_exercises.workouts.user_id', user.id)
    .maybeSingle();
  if (!set) throw new Error('Set not found');

  await supabaseAdmin.from('workout_sets').update({ actual_value: value, logged_at: new Date().toISOString() }).eq('id', setId);

  const { data: sets } = await supabaseAdmin.from('workout_sets').select('actual_value').eq('workout_exercise_id', set.workout_exercise_id);
  if ((sets ?? []).every((s) => s.actual_value !== null)) {
    await supabaseAdmin.from('workout_exercises').update({ status: 'done' }).eq('id', set.workout_exercise_id);
  }
  revalidatePath('/workout');
}

export async function skipExercise(weId: string) {
  const user = await requireUser();
  await ownExercise(user.id, weId);
  await supabaseAdmin.from('workout_exercises').update({ status: 'skipped' }).eq('id', weId);
  revalidatePath('/workout');
}

/**
 * Replaces an exercise with one from the same goal at the same or an easier
 * stage. Only "too hard" counts toward lowering difficulty (recorded on the row).
 */
export async function swapExercise(weId: string, reason: SwapReason, newExerciseId: string) {
  const user = await requireUser();
  if (!REASONS.includes(reason)) throw new Error('Invalid reason');
  const we = await ownExercise(user.id, weId);

  const [{ stages, exById }, fit, { data: goal }] = await Promise.all([
    loadContent(),
    loadFitContext(user.id),
    supabaseAdmin.from('user_goals').select('current_stage').eq('user_id', user.id).eq('goal_id', we.goal_id).is('archived_at', null).maybeSingle(),
  ]);
  const target = stages.find((s) => s.goal_id === we.goal_id && s.exercise_id === newExerciseId);
  const ex     = exById.get(newExerciseId);
  if (!target || !ex || !fits(ex, fit.ctx) || target.stage > (goal?.current_stage ?? 1)) throw new Error('Not an allowed alternative');

  await supabaseAdmin.from('workout_exercises').update({ status: 'swapped', swap_reason: reason }).eq('id', weId);
  await insertExercise(we.workout_id, we.position + 1, newExerciseId, we.goal_id, target, target.target_min, weId);
  revalidatePath('/workout');
}

/** Freezes a body area and skips the remaining exercises that involve it. */
export async function reportPain(workoutId: string, area: BodyArea) {
  const user = await requireUser();
  if (!AREAS.includes(area)) throw new Error('Invalid area');
  await ownWorkout(user.id, workoutId);

  const { data: active } = await supabaseAdmin
    .from('frozen_areas').select('id').eq('user_id', user.id).eq('area', area).is('released_at', null).maybeSingle();
  if (!active) {
    await supabaseAdmin.from('frozen_areas').insert({ user_id: user.id, area, source: 'pain_report' });
  }

  const { data: pending } = await supabaseAdmin
    .from('workout_exercises').select('id, exercises(body_areas)').eq('workout_id', workoutId).eq('status', 'pending');
  const affected = (pending ?? [])
    .filter((p) => ((p.exercises as unknown as { body_areas: string[] } | null)?.body_areas ?? []).includes(area))
    .map((p) => p.id);
  if (affected.length > 0) {
    await supabaseAdmin.from('workout_exercises').update({ status: 'skipped' }).in('id', affected);
  }
  revalidatePath('/workout');
}

/** Ends the workout: completed when nothing is pending, otherwise partial. */
export async function finishWorkout(workoutId: string, endReason?: EndReason) {
  const user = await requireUser();
  await ownWorkout(user.id, workoutId);
  if (endReason && !END_REASONS.includes(endReason)) throw new Error('Invalid reason');

  const { data: pending } = await supabaseAdmin
    .from('workout_exercises').select('id').eq('workout_id', workoutId).eq('status', 'pending');
  const status = (pending ?? []).length === 0 ? 'completed' : 'partial';

  await supabaseAdmin.from('workouts').update({
    status, finished_at: new Date().toISOString(), end_reason: endReason ?? null,
  }).eq('id', workoutId);
  redirect(`/workout/${workoutId}/done`);
}

/** Saves how the workout felt, then moves goals between stages. */
export async function saveFeedback(workoutId: string, feedback: Feedback, note: string, hardExerciseIds: string[]) {
  const user = await requireUser();
  if (!FEEDBACK.includes(feedback)) throw new Error('Invalid feedback');
  await ownWorkout(user.id, workoutId);

  await supabaseAdmin.from('workouts').update({ feedback, note: note.trim().slice(0, 1000) || null }).eq('id', workoutId);
  if (hardExerciseIds.length > 0) {
    await supabaseAdmin.from('workout_exercises').update({ feedback: 'hard' }).eq('workout_id', workoutId).in('id', hardExerciseIds);
  }
  await applyProgression(user.id, workoutId);
  redirect('/today');
}
