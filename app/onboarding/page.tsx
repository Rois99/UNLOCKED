import { redirect } from 'next/navigation';
import { requireUserId } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getI18n } from '@/lib/i18n/server';
import { localName } from '@/lib/i18n/dictionaries';
import OnboardingFlow, { type OnboardingGoal } from './OnboardingFlow';

export const dynamic  = 'force-dynamic';
export const metadata = { title: 'UNLOCKED' };

export default async function OnboardingPage() {
  const user = { id: await requireUserId() };

  const { locale, t } = await getI18n();

  const [{ data: goals }, { data: stages }, { data: exercises }, { data: trophies }, { data: consents }, { data: active }] = await Promise.all([
    supabaseAdmin.from('goals').select('*').order('sort_order'),
    supabaseAdmin.from('progression_stages').select('*'),
    supabaseAdmin.from('exercises').select('*'),
    supabaseAdmin.from('skills').select('id, name, name_he, target_value, exercise_id').not('exercise_id', 'is', null).order('xp'),
    supabaseAdmin.from('consents').select('health_screening_at').eq('user_id', user.id).maybeSingle(),
    supabaseAdmin.from('user_goals').select('id').eq('user_id', user.id).is('archived_at', null).limit(1),
  ]);

  // Already onboarded → straight to Today.
  if (consents?.health_screening_at && (active ?? []).length > 0) redirect('/today');

  const exById = new Map((exercises ?? []).map((e) => [e.id, e]));
  const options: OnboardingGoal[] = (goals ?? [])
    .map((g) => {
      const track = (stages ?? []).filter((s) => s.goal_id === g.id).sort((a, b) => a.stage - b.stage);
      return {
        id:   g.id,
        name: localName(g, locale),
        stages: track.map((s) => {
          const ex = exById.get(s.exercise_id);
          return { stage: s.stage, exerciseName: ex ? localName(ex, locale) : s.exercise_id, targetMin: s.target_min };
        }),
        trophies: (trophies ?? [])
          .filter((tr) => exById.get(tr.exercise_id!)?.goal_id === g.id)
          .map((tr) => ({ id: tr.id, name: localName(tr, locale) })),
      };
    })
    .filter((g) => g.stages.length > 0);

  return (
    <div className="min-h-screen bg-slate-950">
      <main className="mx-auto max-w-xl px-5 pt-10 pb-16">
        <OnboardingFlow
          goals={options}
          locale={locale}
          equipment={t.equipment}
          areas={t.areas}
          weekdays={t.weekdaysShort}
        />
      </main>
    </div>
  );
}
