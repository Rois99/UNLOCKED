'use client';

import { useState } from 'react';
import { Trophy } from 'lucide-react';
import { dictionaries, type Locale } from '@/lib/i18n/dictionaries';
import { pointBefore, type SessionPoint } from '@/lib/progress';

export type ChartSeries = {
  exerciseId: string;
  name:       string;
  goal:       number | null;   // reps in a row; compared with the best set
  points:     SessionPoint[];
};

type Metric = 'volume' | 'best';

interface Props {
  locale: Locale;
  series: ChartSeries[];
}

// Chart geometry (SVG units; the SVG scales to the card width).
const W = 600, H = 220, PAD_L = 36, PAD_R = 16, PAD_T = 16, PAD_B = 28;

export default function ExerciseChart({ locale, series }: Props) {
  const t = dictionaries[locale].progressPage;
  // Start on the highest-priority exercise that already has a trend to show.
  const [selected, setSelected] = useState((series.find((s) => s.points.length >= 2) ?? series[0])?.exerciseId ?? '');
  const [metric,   setMetric]   = useState<Metric>('volume');

  const current = series.find((s) => s.exerciseId === selected) ?? series[0];
  if (!current) return null;

  const values  = current.points.map((p) => (metric === 'volume' ? p.volume : p.best));
  const goal    = metric === 'best' ? current.goal : null;      // a rep goal is about one set, not volume
  const latest  = values[values.length - 1];
  const record  = Math.max(...values);
  const past    = pointBefore(current.points, 28);
  const pastVal = past ? (metric === 'volume' ? past.volume : past.best) : null;

  const yMax   = Math.max(1, ...values, goal ?? 0) * 1.12;
  const xFor   = (i: number) => PAD_L + (values.length === 1 ? (W - PAD_L - PAD_R) / 2 : (i * (W - PAD_L - PAD_R)) / (values.length - 1));
  const yFor   = (v: number) => PAD_T + (1 - v / yMax) * (H - PAD_T - PAD_B);
  const ticks  = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(f * yMax));
  const date   = (iso: string) => new Date(iso).toLocaleDateString(locale === 'he' ? 'he-IL' : 'en-GB', { day: 'numeric', month: 'numeric' });

  return (
    <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">{t.exercisesTitle}</h2>

      {/* Exercise picker */}
      <div className="flex flex-wrap gap-2">
        {series.map((s) => (
          <button
            key={s.exerciseId}
            type="button"
            onClick={() => setSelected(s.exerciseId)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
              s.exerciseId === current.exerciseId ? 'border-cyan-500/60 bg-cyan-500/15 text-cyan-300' : 'border-slate-700 text-slate-300 hover:border-slate-500'
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* Metric toggle: volume by default, best set on request */}
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-slate-700 p-0.5">
          {(['volume', 'best'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMetric(m)}
              className={`rounded-md px-3 py-1 text-xs font-semibold ${metric === m ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
            >
              {m === 'volume' ? t.volume : t.bestSet}
            </button>
          ))}
        </div>
        <span className="text-[11px] text-slate-500">{metric === 'volume' ? t.volumeHelp : t.bestHelp}</span>
      </div>

      {/* Key numbers */}
      <div className="grid grid-cols-3 gap-2">
        <Stat label={t.latest} value={latest} />
        <Stat label={t.record} value={record} accent />
        <Stat label={t.sessions(values.length)} value={pastVal !== null ? t.monthAgo(pastVal) : '—'} small />
      </div>

      {values.length < 2 ? (
        <p className="rounded-lg border border-dashed border-slate-700 p-4 text-center text-sm text-slate-400">{t.notEnough}</p>
      ) : (
        // Time runs left to right on the chart in both languages.
        <div dir="ltr">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${current.name} · ${metric === 'volume' ? t.volume : t.bestSet}`}>
            {ticks.map((v) => (
              <g key={v}>
                <line x1={PAD_L} x2={W - PAD_R} y1={yFor(v)} y2={yFor(v)} stroke="rgb(30 41 59)" strokeWidth="1" />
                <text x={PAD_L - 8} y={yFor(v) + 4} textAnchor="end" fontSize="11" fill="rgb(100 116 139)">{v}</text>
              </g>
            ))}

            {goal !== null && (
              <g>
                <line x1={PAD_L} x2={W - PAD_R} y1={yFor(goal)} y2={yFor(goal)} stroke="rgb(251 191 36)" strokeWidth="1.25" strokeDasharray="5 5" />
                <text x={W - PAD_R} y={yFor(goal) - 6} textAnchor="end" fontSize="11" fill="rgb(251 191 36)">{t.goal(goal)}</text>
              </g>
            )}

            <polyline
              fill="none"
              stroke="rgb(34 211 238)"
              strokeWidth="2.5"
              strokeLinejoin="round"
              points={values.map((v, i) => `${xFor(i)},${yFor(v)}`).join(' ')}
            />
            {current.points.map((p, i) => {
              const isRecord = metric === 'volume' ? p.isRecord.volume : p.isRecord.best;
              return (
                <circle
                  key={p.date}
                  cx={xFor(i)}
                  cy={yFor(values[i])}
                  r={isRecord ? 5.5 : 3.5}
                  fill={isRecord ? 'rgb(251 191 36)' : 'rgb(34 211 238)'}
                >
                  <title>{`${date(p.date)}: ${values[i]}`}</title>
                </circle>
              );
            })}

            <text x={xFor(0)} y={H - 8} textAnchor="start" fontSize="11" fill="rgb(100 116 139)">{date(current.points[0].date)}</text>
            <text x={xFor(values.length - 1)} y={H - 8} textAnchor="end" fontSize="11" fill="rgb(100 116 139)">{date(current.points[current.points.length - 1].date)}</text>
          </svg>
          <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
            <Trophy size={12} className="text-amber-400" /> {t.record}
          </p>
        </div>
      )}
    </section>
  );
}

function Stat({ label, value, accent, small }: { label: string; value: number | string; accent?: boolean; small?: boolean }) {
  return (
    <div className="rounded-lg bg-slate-950/60 p-2.5">
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className={`${small ? 'mt-1 text-xs' : 'text-xl'} font-bold tabular-nums ${accent ? 'text-amber-400' : 'text-white'}`}>{value}</p>
    </div>
  );
}
