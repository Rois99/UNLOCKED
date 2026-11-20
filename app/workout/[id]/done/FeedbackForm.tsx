'use client';

import { useState, useTransition } from 'react';
import type { Feedback } from '@/types';
import { dictionaries, type Locale } from '@/lib/i18n/dictionaries';
import { saveFeedback } from '../../actions';

interface Props {
  workoutId: string;
  exercises: { id: string; name: string }[];
  locale:    Locale;
}

export default function FeedbackForm({ workoutId, exercises, locale }: Props) {
  const t = dictionaries[locale].donePage;
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [hard,     setHard]     = useState<string[]>([]);
  const [note,     setNote]     = useState('');
  const [error,    setError]    = useState(false);
  const [pending,  startTransition] = useTransition();

  const submit = () => {
    if (!feedback) { setError(true); return; }
    startTransition(() => saveFeedback(workoutId, feedback, note, hard));
  };

  return (
    <div className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-white">{t.howWasIt}</p>
        <div className="grid grid-cols-3 gap-2">
          {(['easy', 'ok', 'hard'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => { setFeedback(f); setError(false); }}
              className={`rounded-lg border py-2.5 text-sm font-semibold transition-colors ${
                feedback === f ? 'border-cyan-500/60 bg-cyan-500/15 text-cyan-300' : 'border-slate-700 text-slate-300 hover:border-slate-500'
              }`}
            >
              {t[f]}
            </button>
          ))}
        </div>
        {error && <p className="text-xs text-red-400">{t.pickFeedback}</p>}
      </div>

      {exercises.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500">{t.hardOnes}</p>
          <div className="flex flex-wrap gap-2">
            {exercises.map((e) => {
              const on = hard.includes(e.id);
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setHard(on ? hard.filter((x) => x !== e.id) : [...hard, e.id])}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                    on ? 'border-amber-500/60 bg-amber-500/15 text-amber-300' : 'border-slate-700 text-slate-300'
                  }`}
                >
                  {e.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <label className="block space-y-2">
        <span className="text-xs text-slate-500">{t.note}</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder={t.notePh}
          className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-cyan-500/60 focus:outline-none"
        />
      </label>

      <button
        type="button"
        disabled={pending}
        onClick={submit}
        className="w-full rounded-xl bg-cyan-500 py-3 text-base font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-60"
      >
        {t.finish}
      </button>
    </div>
  );
}
