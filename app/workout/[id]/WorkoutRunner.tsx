'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Hourglass, Minus, Plus, Repeat, SkipForward, TriangleAlert } from 'lucide-react';
import type { BodyArea, EndReason, ExerciseStatus, MeasureType, SwapReason } from '@/types';
import { dictionaries, type Dictionary, type Locale } from '@/lib/i18n/dictionaries';
import { finishWorkout, logSet, reportPain, skipExercise, swapExercise } from '../actions';

export type RunnerExercise = {
  id:           string;
  name:         string;
  standard:     string;
  bodyAreas:    BodyArea[];
  measure:      MeasureType;
  stage:        number | null;
  status:       ExerciseStatus;
  restSeconds:  number;
  sets:         { id: string; number: number; planned: number; actual: number | null }[];
  lastValues:   number[] | null;
  alternatives: { exerciseId: string; name: string; stage: number }[];
};

interface Props {
  workoutId:   string;
  explanation: string | null;
  exercises:   RunnerExercise[];
  locale:      Locale;
  areas:       Record<string, string>;
}

type Sheet = null | 'swap' | 'pain' | 'finish';

/** Current time; only called from event handlers and effects, never during render. */
const clock = () => Date.now();

export default function WorkoutRunner({ workoutId, explanation, exercises, locale, areas }: Props) {
  const t = dictionaries[locale].workout;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [sheet, setSheet] = useState<Sheet>(null);

  // Optimistic state: a saved set or skipped exercise moves the screen forward
  // at once, without waiting for the server round trip (a double tap can't
  // save the same set twice). The next server render confirms it.
  const [localActual,  setLocalActual]  = useState<Record<string, number>>({});
  const [localSkipped, setLocalSkipped] = useState<string[]>([]);
  const merged = exercises.map((e) => {
    const sets = e.sets.map((s) => ({ ...s, actual: s.actual ?? localActual[s.id] ?? null }));
    let status = e.status;
    if (status === 'pending' && localSkipped.includes(e.id)) status = 'skipped';
    if (status === 'pending' && sets.every((s) => s.actual !== null)) status = 'done';
    return { ...e, sets, status };
  });

  // Swapped rows stay in the data (for history) but are hidden from the list.
  const visible  = merged.filter((e) => e.status !== 'swapped');
  const current  = visible.find((e) => e.status === 'pending') ?? null;
  const index    = current ? visible.indexOf(current) : visible.length;
  const nextSet  = current?.sets.find((s) => s.actual === null) ?? null;
  const left     = visible.filter((e) => e.status === 'pending').length;

  // Edited values per set; a set nobody touched shows its planned value.
  const [edits, setEdits] = useState<Record<string, number>>({});
  const value = nextSet ? (edits[nextSet.id] ?? nextSet.planned) : 0;
  const setValue = (fn: (v: number) => number) => nextSet && setEdits({ ...edits, [nextSet.id]: fn(value) });

  // Rest timer: starts after each saved set.
  const [restEnd, setRestEnd] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!restEnd) return;
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, [restEnd]);
  const restLeft = restEnd ? Math.max(0, Math.ceil((restEnd - now) / 1000)) : 0;

  const run = (fn: () => Promise<unknown>, after?: () => void) =>
    startTransition(async () => {
      await fn();
      after?.();
      router.refresh();
    });

  const saveSet = () => {
    if (!current || !nextSet) return;
    const isLastSet = current.sets.filter((s) => s.actual === null).length === 1;
    const setId = nextSet.id;
    setLocalActual((m) => ({ ...m, [setId]: value }));
    if (!isLastSet || left > 1) { const t0 = clock(); setNow(t0); setRestEnd(t0 + current.restSeconds * 1000); }
    run(() => logSet(setId, value));
  };

  const skip = (id: string) => {
    setLocalSkipped((l) => [...l, id]);
    run(() => skipExercise(id));
  };

  const unit = current ? t.unit[current.measure] : '';

  return (
    <div className="space-y-4">
      {explanation && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-400">
          <span className="font-semibold text-slate-300">{t.whatChanged}: </span>{explanation}
        </div>
      )}

      {/* Progress through the workout */}
      <div className="flex gap-1.5">
        {visible.map((e) => (
          <div
            key={e.id}
            className={`h-1.5 flex-1 rounded-full ${
              e.status === 'done' ? 'bg-emerald-500' : e.status === 'skipped' ? 'bg-slate-600' : e === current ? 'bg-cyan-400' : 'bg-slate-800'
            }`}
          />
        ))}
      </div>

      {visible.length === 0 && <p className="text-sm text-slate-400">{t.empty}</p>}

      {current && nextSet && (
        <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{t.exerciseOf(index + 1, visible.length)}</span>
            {current.stage && <span>{t.stage(current.stage)}</span>}
          </div>

          <div>
            <h1 className="text-2xl font-black text-white">{current.name}</h1>
            {current.standard && (
              <p className="mt-1 text-sm text-slate-400">
                <span className="font-semibold text-slate-300">{t.standard}: </span>{current.standard}
              </p>
            )}
          </div>

          <p className="text-sm font-semibold text-slate-300">{t.setOf(nextSet.number, current.sets.length)}</p>

          {/* Value stepper — pre-filled with the plan, usually one tap to save */}
          <div className="flex items-center justify-center gap-6">
            <button
              type="button"
              aria-label="-1"
              onClick={() => setValue((v) => Math.max(0, v - 1))}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-700 text-slate-200 hover:border-slate-500"
            >
              <Minus size={20} />
            </button>
            <div className="min-w-24 text-center">
              <div className="text-5xl font-black text-white tabular-nums">{value}</div>
              <div className="mt-1 text-xs text-slate-500">{unit} · {t.planned(nextSet.planned)}</div>
            </div>
            <button
              type="button"
              aria-label="+1"
              onClick={() => setValue((v) => Math.min(999, v + 1))}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-700 text-slate-200 hover:border-slate-500"
            >
              <Plus size={20} />
            </button>
          </div>

          <button
            type="button"
            onClick={saveSet}
            className="w-full rounded-xl bg-cyan-500 py-3 text-base font-bold text-slate-950 transition-colors hover:bg-cyan-400 disabled:opacity-60"
          >
            {t.saveSet}
          </button>

          {/* Sets so far and last time */}
          <div className="rounded-xl bg-slate-950/60 p-3 text-sm">
            {current.sets.filter((s) => s.actual !== null).map((s) => (
              <div key={s.id} className="flex justify-between text-slate-300">
                <span>{t.setOf(s.number, current.sets.length)}</span>
                <span className="flex items-center gap-1.5 tabular-nums">
                  {s.actual} / {s.planned}
                  {s.actual! >= s.planned && <Check size={14} className="text-emerald-400" />}
                </span>
              </div>
            ))}
            <div className="mt-1 flex justify-between text-slate-500">
              <span>{t.lastTime}</span>
              <span className="tabular-nums">{current.lastValues ? current.lastValues.join(', ') : t.firstTime}</span>
            </div>
          </div>

          {restLeft > 0 && (
            <div className="flex items-center justify-between rounded-xl border border-cyan-500/30 bg-cyan-500/5 px-4 py-2.5 text-sm text-cyan-300">
              <span className="flex items-center gap-2"><Hourglass size={15} /> {t.rest} {Math.floor(restLeft / 60)}:{String(restLeft % 60).padStart(2, '0')}</span>
              <button type="button" onClick={() => setRestEnd(null)} className="text-xs font-semibold text-cyan-400 hover:text-cyan-300">
                {t.skipRest}
              </button>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            <SecondaryButton onClick={() => skip(current.id)} icon={<SkipForward size={14} />}>{t.skip}</SecondaryButton>
            <SecondaryButton onClick={() => setSheet('swap')} disabled={pending} icon={<Repeat size={14} />}>{t.swap}</SecondaryButton>
            <SecondaryButton onClick={() => setSheet('pain')} disabled={pending} icon={<TriangleAlert size={14} />} danger>{t.pain}</SecondaryButton>
          </div>
        </section>
      )}

      {/* All exercises */}
      <ul className="space-y-1.5">
        {visible.map((e) => (
          <li key={e.id} className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${e === current ? 'bg-slate-800/70 text-white' : 'text-slate-400'}`}>
            <span>{e.name}</span>
            <span className="text-xs">{t.status[e.status]}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        disabled={pending}
        onClick={() => (left === 0 ? run(() => finishWorkout(workoutId)) : setSheet('finish'))}
        className={`w-full rounded-xl py-3 text-sm font-bold transition-colors disabled:opacity-60 ${
          left === 0 ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400' : 'border border-slate-700 text-slate-300 hover:border-slate-500'
        }`}
      >
        {t.finish}
      </button>

      {sheet === 'swap' && current && (
        <SwapSheet t={t} exercise={current} pending={pending} onClose={() => setSheet(null)}
          onSwap={(reason, id) => run(() => swapExercise(current.id, reason, id), () => setSheet(null))} />
      )}
      {sheet === 'pain' && (
        <PainSheet t={t} areas={areas} pending={pending} onClose={() => setSheet(null)}
          onReport={(area, end) => run(async () => {
            await reportPain(workoutId, area);
            if (end) await finishWorkout(workoutId, 'pain');
          }, () => setSheet(null))} />
      )}
      {sheet === 'finish' && (
        <FinishSheet t={t} left={left} pending={pending} onClose={() => setSheet(null)}
          onFinish={(reason) => run(() => finishWorkout(workoutId, reason))} />
      )}
    </div>
  );
}

function SecondaryButton({ children, icon, onClick, disabled, danger }: {
  children: React.ReactNode; icon: React.ReactNode; onClick: () => void; disabled?: boolean; danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-semibold transition-colors disabled:opacity-60 ${
        danger ? 'border-red-500/30 text-red-400 hover:border-red-500/60' : 'border-slate-700 text-slate-300 hover:border-slate-500'
      }`}
    >
      {icon}{children}
    </button>
  );
}

function Sheet({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-md space-y-4 rounded-t-2xl border border-slate-800 bg-slate-900 p-5 sm:rounded-2xl"
        style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-white">{title}</h2>
        {children}
      </div>
    </div>
  );
}

function Chip({ active, onClick, children, danger }: { active: boolean; onClick: () => void; children: React.ReactNode; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
        active
          ? danger ? 'border-red-500/60 bg-red-500/15 text-red-300' : 'border-cyan-500/60 bg-cyan-500/15 text-cyan-300'
          : 'border-slate-700 text-slate-300 hover:border-slate-500'
      }`}
    >
      {children}
    </button>
  );
}

function SwapSheet({ t, exercise, pending, onClose, onSwap }: {
  t: Dictionary['workout']; exercise: RunnerExercise; pending: boolean; onClose: () => void;
  onSwap: (reason: SwapReason, exerciseId: string) => void;
}) {
  const [reason, setReason] = useState<SwapReason>('no_equipment');
  // "Too hard" only offers easier stages; other reasons allow the same stage.
  const options = useMemo(
    () => exercise.alternatives.filter((a) => reason !== 'too_hard' || exercise.stage === null || a.stage < exercise.stage),
    [exercise, reason],
  );
  const [choice, setChoice] = useState<string | null>(null);
  const picked = options.find((o) => o.exerciseId === choice) ?? options[0] ?? null;

  return (
    <Sheet title={t.swapTitle} onClose={onClose}>
      <p className="text-xs text-slate-500">{t.swapWhy}</p>
      <div className="flex flex-wrap gap-2">
        {(['no_equipment', 'too_hard', 'uncomfortable'] as const).map((r) => (
          <Chip key={r} active={reason === r} onClick={() => setReason(r)}>{t.swapReasons[r]}</Chip>
        ))}
      </div>
      <p className="text-xs text-slate-500">{t.alternatives}</p>
      {options.length === 0 ? (
        <p className="text-sm text-slate-400">{t.noAlternatives}</p>
      ) : (
        <div className="space-y-2">
          {options.map((o) => (
            <button
              key={o.exerciseId}
              type="button"
              onClick={() => setChoice(o.exerciseId)}
              className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-sm ${
                picked?.exerciseId === o.exerciseId ? 'border-cyan-500/60 bg-cyan-500/10 text-white' : 'border-slate-700 text-slate-300'
              }`}
            >
              <span>{o.name}</span>
              <span className="text-xs text-slate-500">{t.stage(o.stage)}</span>
            </button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={onClose} className="rounded-lg border border-slate-700 py-2.5 text-sm text-slate-300">{t.cancel}</button>
        <button
          type="button"
          disabled={!picked || pending}
          onClick={() => picked && onSwap(reason, picked.exerciseId)}
          className="rounded-lg bg-cyan-500 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-50"
        >
          {t.doSwap}
        </button>
      </div>
    </Sheet>
  );
}

function PainSheet({ t, areas, pending, onClose, onReport }: {
  t: Dictionary['workout']; areas: Record<string, string>; pending: boolean; onClose: () => void;
  onReport: (area: BodyArea, endWorkout: boolean) => void;
}) {
  const [area, setArea] = useState<BodyArea | null>(null);
  return (
    <Sheet title={t.painTitle} onClose={onClose}>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(areas) as BodyArea[]).map((a) => (
          <Chip key={a} danger active={area === a} onClick={() => setArea(a)}>{areas[a]}</Chip>
        ))}
      </div>
      {area && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">{t.painNote(areas[area])}</p>
      )}
      <div className="grid grid-cols-2 gap-2">
        <button type="button" disabled={!area || pending} onClick={() => area && onReport(area, true)}
          className="rounded-lg border border-slate-700 py-2.5 text-sm text-slate-300 disabled:opacity-50">{t.endToday}</button>
        <button type="button" disabled={!area || pending} onClick={() => area && onReport(area, false)}
          className="rounded-lg bg-cyan-500 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-50">{t.continueWithout}</button>
      </div>
    </Sheet>
  );
}

function FinishSheet({ t, left, pending, onClose, onFinish }: {
  t: Dictionary['workout']; left: number; pending: boolean; onClose: () => void; onFinish: (reason?: EndReason) => void;
}) {
  const [reason, setReason] = useState<EndReason | undefined>(undefined);
  return (
    <Sheet title={t.finishEarly} onClose={onClose}>
      <p className="text-sm text-slate-300">{t.remaining(left)}</p>
      <p className="text-xs text-slate-500">{t.notHard}</p>
      <p className="text-xs text-slate-500">{t.whyEnd}</p>
      <div className="flex flex-wrap gap-2">
        {(['out_of_time', 'tired', 'other'] as const).map((r) => (
          <Chip key={r} active={reason === r} onClick={() => setReason(reason === r ? undefined : r)}>{t.endReasons[r]}</Chip>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={onClose} className="rounded-lg border border-slate-700 py-2.5 text-sm text-slate-300">{t.backToWorkout}</button>
        <button type="button" disabled={pending} onClick={() => onFinish(reason)}
          className="rounded-lg bg-cyan-500 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-50">{t.savePartial}</button>
      </div>
    </Sheet>
  );
}
