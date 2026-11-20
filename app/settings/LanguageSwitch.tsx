'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { setLocaleCookie } from '@/lib/i18n/client';
import type { Locale } from '@/lib/i18n/dictionaries';

interface Props {
  userId:  string;
  current: Locale;
  labels:  { he: string; en: string; error: string };
}

/** Saves the language on the profile, mirrors it to the cookie, re-renders the app. */
export default function LanguageSwitch({ userId, current, labels }: Props) {
  const router = useRouter();
  const [value,  setValue]  = useState<Locale>(current);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const choose = async (next: Locale) => {
    if (next === value || saving) return;
    setSaving(true);
    setFailed(false);

    const { error } = await createSupabaseBrowserClient()
      .from('profiles')
      .update({ language: next })
      .eq('id', userId);

    if (error) {
      setFailed(true);
      setSaving(false);
      return;
    }
    setValue(next);
    setLocaleCookie(next);
    router.refresh();
    setSaving(false);
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2" role="radiogroup">
        {(['he', 'en'] as const).map((l) => (
          <button
            key={l}
            type="button"
            role="radio"
            aria-checked={value === l}
            disabled={saving}
            onClick={() => choose(l)}
            className={`rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors ${
              value === l
                ? 'border-cyan-500/60 bg-cyan-500/10 text-cyan-300'
                : 'border-slate-700 text-slate-300 hover:border-slate-500'
            }`}
          >
            {labels[l]}
          </button>
        ))}
      </div>
      {failed && <p className="text-xs text-red-400">{labels.error}</p>}
    </div>
  );
}
