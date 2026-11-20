import { redirect } from 'next/navigation';
import { TrendingUp } from 'lucide-react';
import AppNavbar from '@/components/app/AppNavbar';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getI18n } from '@/lib/i18n/server';

export const dynamic  = 'force-dynamic';
export const metadata = { title: 'UNLOCKED' };

/** Workouts needed before a trend is shown (no made-up numbers before that). */
const MIN_WORKOUTS_FOR_TREND = 2;

export default async function ProgressPage() {
  const serverClient = await createSupabaseServerClient();
  const { data: { user } } = await serverClient.auth.getUser();
  if (!user) redirect('/login');

  const { t } = await getI18n();
  const tp = t.progressPage;

  const { count } = await supabaseAdmin
    .from('workouts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .in('status', ['completed', 'partial']);

  const done      = count ?? 0;
  const remaining = Math.max(0, MIN_WORKOUTS_FOR_TREND - done);

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

        {remaining > 0 ? (
          <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center">
            <TrendingUp className="mx-auto text-slate-600" size={28} />
            <p className="mt-3 text-sm font-semibold text-white">{tp.moreWorkouts(remaining)}</p>
            <p className="mt-1 text-sm text-slate-400">{tp.trendBody}</p>
          </div>
        ) : (
          <p className="text-sm text-slate-400">{tp.logged(done)}</p>
        )}
      </main>
    </div>
  );
}
