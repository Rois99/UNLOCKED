'use server';

import { redirect } from 'next/navigation';
import { requireUserId } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  BODY_AREAS as AREAS, EQUIPMENT_KEYS as EQUIPMENT, QUESTION_COUNT, RED_FLAG_QUESTIONS, SESSION_MINUTES as MINUTES,
  type OnboardingPayload,
} from '@/lib/onboarding';

export async function completeOnboarding(p: OnboardingPayload): Promise<{ error: string } | void> {
  const user = { id: await requireUserId() };

  // ── Validate everything server-side ────────────────────────────────────
  if (!Array.isArray(p.answers) || p.answers.length !== QUESTION_COUNT) return { error: 'answers' };
  const redFlag = RED_FLAG_QUESTIONS.some((i) => p.answers[i]);
  if (redFlag && !p.clearance) return { error: 'clearance' };
  if (!p.frozenAreas.every((a) => AREAS.includes(a))) return { error: 'areas' };

  if (p.goals.length < 1 || p.goals.length > 4) return { error: 'goals' };
  if (new Set(p.goals.map((g) => g.goalId)).size !== p.goals.length) return { error: 'goals' };

  const [{ data: stages }, { data: trophies }] = await Promise.all([
    supabaseAdmin.from('progression_stages').select('goal_id, stage, exercise_id'),
    supabaseAdmin.from('skills').select('id, exercise_id, exercises!inner(goal_id)').not('exercise_id', 'is', null),
  ]);

  const goalRows = [];
  for (const [i, g] of p.goals.entries()) {
    const track = (stages ?? []).filter((s) => s.goal_id === g.goalId).sort((a, b) => a.stage - b.stage);
    if (track.length === 0) return { error: 'goals' };
    if (!Number.isInteger(g.stage) || g.stage < 1 || g.stage > track.length) return { error: 'stage' };

    if (g.kind === 'trophy') {
      const ok = (trophies ?? []).some((t) => t.id === g.skillId && (t.exercises as unknown as { goal_id: string }).goal_id === g.goalId);
      if (!ok) return { error: 'trophy' };
      goalRows.push({ user_id: user.id, goal_id: g.goalId, priority: i + 1, kind: 'trophy', skill_id: g.skillId, current_stage: g.stage });
    } else if (g.kind === 'personal') {
      if (!Number.isInteger(g.target) || g.target! < 1 || g.target! > 999) return { error: 'target' };
      const topExercise = track[track.length - 1].exercise_id;
      goalRows.push({ user_id: user.id, goal_id: g.goalId, priority: i + 1, kind: 'personal', exercise_id: topExercise, target_value: g.target, current_stage: g.stage });
    } else {
      return { error: 'goals' };
    }
  }

  const days = [...new Set(p.days)].sort();
  if (days.length === 0 || !days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)) return { error: 'days' };
  if (!MINUTES.includes(p.minutes)) return { error: 'minutes' };
  const locName = p.location.name.trim();
  if (locName.length < 1 || locName.length > 40) return { error: 'location' };
  if (!p.location.equipment.every((e) => EQUIPMENT.includes(e))) return { error: 'equipment' };

  // ── Write ───────────────────────────────────────────────────────────────
  const now = new Date().toISOString();
  await supabaseAdmin.from('consents').upsert({
    user_id:                user.id,
    terms_accepted_at:      now,
    plan_data_consent_at:   now,
    improvement_consent_at: p.improve ? now : null,
    health_screening_at:    now,                       // answers themselves are never stored
    medical_clearance_at:   redFlag ? now : null,
  }, { onConflict: 'user_id' });

  for (const area of p.frozenAreas) {
    const { data: active } = await supabaseAdmin
      .from('frozen_areas').select('id').eq('user_id', user.id).eq('area', area).is('released_at', null).maybeSingle();
    if (!active) await supabaseAdmin.from('frozen_areas').insert({ user_id: user.id, area, source: 'onboarding' });
  }

  await supabaseAdmin.from('user_goals').update({ archived_at: now }).eq('user_id', user.id).is('archived_at', null);
  const { error: goalErr } = await supabaseAdmin.from('user_goals').insert(goalRows);
  if (goalErr) return { error: 'save' };

  await supabaseAdmin.from('user_schedules').upsert(
    { user_id: user.id, training_days: days, session_minutes: p.minutes },
    { onConflict: 'user_id' },
  );

  await supabaseAdmin.from('training_locations').update({ is_default: false }).eq('user_id', user.id);
  await supabaseAdmin.from('training_locations').insert({
    user_id: user.id, name: locName, equipment: p.location.equipment, is_default: true,
  });

  redirect('/today');
}
