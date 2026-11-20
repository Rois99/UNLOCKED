import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import AppNavbar from '@/components/app/AppNavbar';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getI18n } from '@/lib/i18n/server';
import { isLocale } from '@/lib/i18n/dictionaries';
import LanguageSwitch from './LanguageSwitch';

export const dynamic  = 'force-dynamic';
export const metadata = { title: 'UNLOCKED' };

export default async function SettingsPage() {
  const serverClient = await createSupabaseServerClient();
  const { data: { user } } = await serverClient.auth.getUser();
  if (!user) redirect('/login');

  const { locale, t } = await getI18n();
  const ts = t.settingsPage;

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('language')
    .eq('id', user.id)
    .single();
  const saved = isLocale(profile?.language) ? profile.language : locale;

  return (
    <div className="min-h-screen bg-slate-950">
      <AppNavbar labels={t.nav} />

      <main className="mx-auto max-w-lg px-5 pt-24 pb-28 space-y-6">
        <Link
          href="/profile"
          className="flex items-center gap-1.5 text-xs text-slate-500 transition-colors hover:text-slate-300"
        >
          <ArrowLeft size={13} className="rtl:rotate-180" />
          {ts.back}
        </Link>

        <h1
          className="text-4xl font-black uppercase tracking-tight text-white"
          style={{ fontFamily: 'var(--font-condensed)' }}
        >
          {ts.title}
        </h1>

        <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-white">{ts.language}</h2>
            <p className="mt-0.5 text-xs text-slate-500">{ts.languageHelp}</p>
          </div>
          <LanguageSwitch
            userId={user.id}
            current={saved}
            labels={{ he: ts.hebrew, en: ts.english, error: ts.error }}
          />
        </section>
      </main>
    </div>
  );
}
