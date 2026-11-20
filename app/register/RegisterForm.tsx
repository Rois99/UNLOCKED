'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { setLocaleCookie } from '@/lib/i18n/client';
import type { Dictionary, Locale } from '@/lib/i18n/dictionaries';

interface Props {
  initialLocale: Locale;
  t:             Dictionary['register'];
  languages:     Record<Locale, string>;
}

export default function RegisterForm({ initialLocale, t, languages }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [language, setLanguage] = useState<Locale>(initialLocale);
  const [error, setError]       = useState<string | null>(null);
  const [sent, setSent]         = useState(false);
  const [loading, setLoading]   = useState(false);

  // Switching language re-renders the form in that language right away.
  const chooseLanguage = (l: Locale) => {
    setLanguage(l);
    setLocaleCookie(l);
    router.refresh();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username.trim() || !form.email.trim() || form.password.length < 8) { setError(t.fillAll); return; }
    setLoading(true);
    setError(null);

    const { data, error: signUpError } = await createSupabaseBrowserClient().auth.signUp({
      email:    form.email.trim(),
      password: form.password,
      options:  {
        data: { username: form.username.trim(), language },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    if (signUpError) { setError(signUpError.message || t.errorGeneric); setLoading(false); return; }
    setLocaleCookie(language);

    // With email confirmation on, there is no session until the link is clicked.
    if (data.session) { router.push('/onboarding'); router.refresh(); }
    else { setSent(true); setLoading(false); }
  };

  const input = 'w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-cyan-500/60 focus:outline-none';

  return (
    <div className="w-full max-w-sm space-y-6 rounded-2xl border border-slate-700/60 bg-slate-900/90 p-8">
      <h1 className="text-center text-2xl font-black text-white" style={{ fontFamily: 'var(--font-condensed)' }}>{t.title}</h1>

      {sent ? (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">{t.checkEmail}</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-400">{t.language}</span>
            <div className="grid grid-cols-2 gap-2">
              {(['he', 'en'] as const).map((l) => (
                <button key={l} type="button" onClick={() => chooseLanguage(l)}
                  className={`rounded-lg border py-2 text-sm font-semibold ${
                    language === l ? 'border-cyan-500/60 bg-cyan-500/15 text-cyan-300' : 'border-slate-700 text-slate-300'
                  }`}>
                  {languages[l]}
                </button>
              ))}
            </div>
          </div>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-slate-400">{t.username}</span>
            <input className={input} value={form.username} maxLength={30} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-slate-400">{t.email}</span>
            <input className={input} type="email" dir="ltr" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-slate-400">{t.password}</span>
            <input className={input} type="password" dir="ltr" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <span className="text-[11px] text-slate-500">{t.passwordHelp}</span>
          </label>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full rounded-xl bg-cyan-500 py-3 font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-60">
            {loading ? t.creating : t.submit}
          </button>
        </form>
      )}

      <p className="text-center text-sm text-slate-500">
        {t.haveAccount} <Link href="/login" className="font-semibold text-cyan-400 hover:text-cyan-300">{t.signIn}</Link>
      </p>
    </div>
  );
}
