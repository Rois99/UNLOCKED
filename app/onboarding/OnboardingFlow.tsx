'use client';

import { useMemo, useState, useTransition } from 'react';
import { ArrowDown, ArrowUp, Check, Target, Trophy, X } from 'lucide-react';
import type { BodyArea } from '@/types';
import { dictionaries, type Locale } from '@/lib/i18n/dictionaries';
import {
  BODY_AREAS, EQUIPMENT_KEYS, QUESTION_COUNT, RED_FLAG_QUESTIONS, SENSITIVE_QUESTIONS, SESSION_MINUTES,
} from '@/lib/onboarding';
import { completeOnboarding } from './actions';

export type OnboardingGoal = {
  id:       string;
  name:     string;
  stages:   { stage: number; exerciseName: string; targetMin: number }[];
  trophies: { id: string; name: string }[];
};

type Choice = { goalId: string; kind: 'trophy' | 'personal'; skillId?: string; target?: number };
/** Opening check per goal: which question (hardest first) and the resulting stage. */
type Check = { q: number; value: string; stage: number | null };

interface Props {
  goals:     OnboardingGoal[];
  locale:    Locale;
  equipment: Record<string, string>;
  areas:     Record<string, string>;
  weekdays:  string[];
}

const STEPS = 4;

export default function OnboardingFlow({ goals, locale, equipment, areas, weekdays }: Props) {
  // Dictionaries hold functions, which cannot cross the server/client boundary,
  // so client components look them up by locale.
  const t = dictionaries[locale].onboarding;
  const [step,  setStep]  = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Step 1 — health and consents
  const [answers,   setAnswers]   = useState<(boolean | null)[]>(Array(QUESTION_COUNT).fill(null));
  const [clearance, setClearance] = useState(false);
  const [frozen,    setFrozen]    = useState<BodyArea[]>([]);
  const [terms,     setTerms]     = useState(false);
  const [planData,  setPlanData]  = useState(false);
  const [improve,   setImprove]   = useState(false);   // never pre-ticked
  const redFlag   = RED_FLAG_QUESTIONS.some((i) => answers[i] === true);
  const sensitive = SENSITIVE_QUESTIONS.some((i) => answers[i] === true);

  // Step 2 — goals in priority order
  const [choices, setChoices] = useState<Choice[]>([]);
  const goalById = useMemo(() => new Map(goals.map((g) => [g.id, g])), [goals]);

  // Step 3 — routine
  const [days,     setDays]     = useState<number[]>([0, 2, 4]);
  const [minutes,  setMinutes]  = useState(45);
  const [locName,  setLocName]  = useState(t.locationDefault);
  const [locEquip, setLocEquip] = useState<string[]>(['pull_up_bar']);

  // Step 4 — opening check
  const [checks, setChecks] = useState<Record<string, Check>>({});

  const toggle = <T,>(list: T[], item: T) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

  const validate = (): string | null => {
    if (step === 0) {
      if (answers.some((a) => a === null)) return t.answerAll;
      if (redFlag && !clearance) return t.clearanceRequired;
      if (!terms || !planData) return t.acceptRequired;
    }
    if (step === 1) {
      if (choices.length === 0) return t.pickOne;
      if (choices.some((c) => (c.kind === 'trophy' ? !c.skillId : !c.target || c.target < 1))) return t.setTarget;
    }
    if (step === 2 && days.length === 0) return t.pickDay;
    if (step === 3 && choices.some((c) => checks[c.goalId]?.stage == null)) return t.enterNumber;
    return null;
  };

  const next = () => {
    const problem = validate();
    if (problem) { setError(problem); return; }
    setError(null);
    if (step < STEPS - 1) { setStep(step + 1); window.scrollTo(0, 0); return; }

    startTransition(async () => {
      const res = await completeOnboarding({
        answers: answers.map(Boolean),
        clearance, frozenAreas: frozen, improve,
        goals: choices.map((c) => ({ ...c, stage: checks[c.goalId]!.stage! })),
        days, minutes,
        location: { name: locName, equipment: locEquip },
      });
      if (res?.error) setError(res.error);
    });
  };

  // ── Opening check: ask the hardest exercise first, step down on a low answer ──
  const answerCheck = (goal: OnboardingGoal, raw: number) => {
    const desc = [...goal.stages].sort((a, b) => b.stage - a.stage);
    const cur  = checks[goal.id] ?? { q: 0, value: '', stage: null };
    const s    = desc[cur.q];
    if (raw >= s.targetMin)             setChecks({ ...checks, [goal.id]: { ...cur, stage: s.stage } });
    else if (cur.q + 1 < desc.length)   setChecks({ ...checks, [goal.id]: { q: cur.q + 1, value: '', stage: null } });
    else                                setChecks({ ...checks, [goal.id]: { ...cur, stage: desc[desc.length - 1].stage } });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-500">{t.stepOf(step + 1, STEPS)}</p>
        <div className="flex gap-1.5">
          {Array.from({ length: STEPS }, (_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-cyan-400' : 'bg-slate-800'}`} />
          ))}
        </div>
      </div>

      {/* ── Step 1: health questionnaire and consents ────────────────────── */}
      {step === 0 && (
        <section className="space-y-4">
          <Title>{t.healthTitle}</Title>
          <p className="text-sm text-slate-400">{t.healthNote}</p>
          <div className="space-y-2">
            {t.questions.map((q, i) => (
              <div key={i} className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <span className="text-sm text-slate-200">{q}</span>
                <div className="flex shrink-0 gap-1.5">
                  {([true, false] as const).map((v) => (
                    <button
                      key={String(v)}
                      type="button"
                      onClick={() => setAnswers(answers.map((a, k) => (k === i ? v : a)))}
                      className={`rounded-md border px-3 py-1 text-xs font-semibold ${
                        answers[i] === v ? 'border-cyan-500/60 bg-cyan-500/15 text-cyan-300' : 'border-slate-700 text-slate-400'
                      }`}
                    >
                      {v ? t.yes : t.no}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {redFlag && (
            <div className="space-y-2 rounded-xl border border-red-500/40 bg-red-500/10 p-4">
              <p className="text-sm font-bold text-red-300">{t.redFlagTitle}</p>
              <p className="text-sm text-red-200/90">{t.redFlagBody}</p>
              <CheckRow checked={clearance} onChange={setClearance}>{t.clearance}</CheckRow>
            </div>
          )}

          {sensitive && (
            <div className="space-y-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
              <p className="text-sm text-amber-200">{t.sensitiveBody}</p>
              <div className="flex flex-wrap gap-2">
                {BODY_AREAS.map((a) => (
                  <Pill key={a} active={frozen.includes(a)} onClick={() => setFrozen(toggle(frozen, a))}>{areas[a]}</Pill>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2 pt-2">
            <CheckRow checked={terms} onChange={setTerms}>{t.terms}</CheckRow>
            <CheckRow checked={planData} onChange={setPlanData}>{t.planData}</CheckRow>
            <CheckRow checked={improve} onChange={setImprove}>{t.improve}</CheckRow>
          </div>
        </section>
      )}

      {/* ── Step 2: goals ────────────────────────────────────────────────── */}
      {step === 1 && (
        <section className="space-y-4">
          <Title>{t.goalsTitle}</Title>
          <p className="text-sm text-slate-400">{t.goalsHelp}</p>

          {choices.map((c, i) => {
            const g = goalById.get(c.goalId)!;
            return (
              <div key={c.goalId} className="space-y-3 rounded-xl border border-cyan-500/40 bg-slate-900/70 p-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-bold text-white">
                    {g.name}
                    {i === 0 && <span className="rounded-full bg-cyan-500/15 px-2 py-0.5 text-[11px] text-cyan-300">{t.primary}</span>}
                  </span>
                  <span className="flex gap-1">
                    {i > 0 && (
                      <IconButton label={t.moveUp} onClick={() => {
                        const next = [...choices]; [next[i - 1], next[i]] = [next[i], next[i - 1]]; setChoices(next);
                      }}><ArrowUp size={14} /></IconButton>
                    )}
                    {i < choices.length - 1 && (
                      <IconButton label={t.moveDown} onClick={() => {
                        const next = [...choices]; [next[i + 1], next[i]] = [next[i], next[i + 1]]; setChoices(next);
                      }}><ArrowDown size={14} /></IconButton>
                    )}
                    <IconButton label={t.remove} onClick={() => setChoices(choices.filter((x) => x.goalId !== c.goalId))}><X size={14} /></IconButton>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {(['trophy', 'personal'] as const).map((k) => (
                    <button
                      key={k}
                      type="button"
                      disabled={k === 'trophy' && g.trophies.length === 0}
                      onClick={() => setChoices(choices.map((x) => (x.goalId === c.goalId ? { goalId: x.goalId, kind: k } : x)))}
                      className={`flex items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-semibold disabled:opacity-40 ${
                        c.kind === k ? 'border-cyan-500/60 bg-cyan-500/15 text-cyan-300' : 'border-slate-700 text-slate-300'
                      }`}
                    >
                      {k === 'trophy' ? <Trophy size={13} /> : <Target size={13} />}
                      {k === 'trophy' ? t.trophy : t.personal}
                    </button>
                  ))}
                </div>

                {c.kind === 'trophy' ? (
                  <div className="flex flex-wrap gap-2">
                    {g.trophies.map((tr) => (
                      <Pill key={tr.id} active={c.skillId === tr.id}
                        onClick={() => setChoices(choices.map((x) => (x.goalId === c.goalId ? { ...x, skillId: tr.id } : x)))}>
                        {tr.name}
                      </Pill>
                    ))}
                  </div>
                ) : (
                  <label className="flex items-center gap-3 text-sm text-slate-300">
                    {t.targetReps}: {g.stages[g.stages.length - 1].exerciseName}
                    <input
                      type="number" min={1} max={999} inputMode="numeric"
                      value={c.target ?? ''}
                      onChange={(e) => setChoices(choices.map((x) => (x.goalId === c.goalId ? { ...x, target: Number(e.target.value) || undefined } : x)))}
                      className="w-20 rounded-lg border border-slate-700 bg-slate-950/60 px-2 py-1.5 text-center text-white focus:border-cyan-500/60 focus:outline-none"
                    />
                  </label>
                )}
              </div>
            );
          })}

          {choices.length < 4 && (
            <div className="grid grid-cols-2 gap-2">
              {goals.filter((g) => !choices.some((c) => c.goalId === g.id)).map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setChoices([...choices, { goalId: g.id, kind: g.trophies.length > 0 ? 'trophy' : 'personal' }])}
                  className="rounded-xl border border-dashed border-slate-700 py-4 text-sm font-semibold text-slate-300 hover:border-cyan-500/50 hover:text-white"
                >
                  + {g.name}
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Step 3: routine and place ────────────────────────────────────── */}
      {step === 2 && (
        <section className="space-y-5">
          <Title>{t.scheduleTitle}</Title>
          <div className="space-y-2">
            <p className="text-sm text-slate-300">{t.daysQ}</p>
            <div className="grid grid-cols-7 gap-1.5">
              {weekdays.map((d, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setDays(toggle(days, i))}
                  className={`rounded-lg border py-2.5 text-sm font-semibold ${
                    days.includes(i) ? 'border-cyan-500/60 bg-cyan-500/15 text-cyan-300' : 'border-dashed border-slate-700 text-slate-500'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500">{t.restDays(days.length, 7 - days.length)}</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-slate-300">{t.minutesQ}</p>
            <div className="flex gap-2">
              {SESSION_MINUTES.map((m) => (
                <Pill key={m} active={minutes === m} onClick={() => setMinutes(m)}>{m} {t.min}</Pill>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-slate-300">{t.locationQ}</p>
            <input
              value={locName}
              maxLength={40}
              onChange={(e) => setLocName(e.target.value)}
              aria-label={t.locationName}
              className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-cyan-500/60 focus:outline-none"
            />
            <p className="pt-1 text-sm text-slate-300">{t.equipmentQ}</p>
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT_KEYS.map((e) => (
                <Pill key={e} active={locEquip.includes(e)} onClick={() => setLocEquip(toggle(locEquip, e))}>{equipment[e]}</Pill>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Step 4: opening check ────────────────────────────────────────── */}
      {step === 3 && (
        <section className="space-y-4">
          <Title>{t.testTitle}</Title>
          <p className="text-sm text-slate-400">{t.testHelp}</p>
          {choices.map((c) => {
            const g    = goalById.get(c.goalId)!;
            const desc = [...g.stages].sort((a, b) => b.stage - a.stage);
            const cur  = checks[g.id] ?? { q: 0, value: '', stage: null };
            const q    = desc[cur.q];
            return (
              <div key={g.id} className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                <p className="font-bold text-white">{g.name}</p>
                {cur.stage !== null ? (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-emerald-300"><Check size={15} /> {t.startsAt(cur.stage)}</span>
                    <button type="button" className="text-xs text-slate-500 hover:text-slate-300"
                      onClick={() => setChecks({ ...checks, [g.id]: { q: 0, value: '', stage: null } })}>
                      ↺
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-slate-300">{t.howMany(q.exerciseName)}</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="number" min={0} max={999} inputMode="numeric"
                        value={cur.value}
                        onChange={(e) => setChecks({ ...checks, [g.id]: { ...cur, value: e.target.value } })}
                        className="w-24 rounded-lg border border-slate-700 bg-slate-950/60 px-2 py-2 text-center text-white focus:border-cyan-500/60 focus:outline-none"
                      />
                      <button
                        type="button"
                        disabled={cur.value === ''}
                        onClick={() => answerCheck(g, Number(cur.value))}
                        className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-40"
                      >
                        {t.next}
                      </button>
                      <button type="button" onClick={() => answerCheck(g, 0)} className="text-xs text-slate-400 underline-offset-2 hover:underline">
                        {t.cantYet}
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </section>
      )}

      {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

      <div className="flex gap-2">
        {step > 0 && (
          <button type="button" onClick={() => { setError(null); setStep(step - 1); }}
            className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-300">
            {t.back}
          </button>
        )}
        <button
          type="button"
          disabled={pending}
          onClick={next}
          className="flex-1 rounded-xl bg-cyan-500 py-3 text-base font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-60"
        >
          {pending ? t.saving : step === STEPS - 1 ? t.finish : t.next}
        </button>
      </div>
    </div>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return <h1 className="text-3xl font-black text-white" style={{ fontFamily: 'var(--font-condensed)' }}>{children}</h1>;
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
        active ? 'border-cyan-500/60 bg-cyan-500/15 text-cyan-300' : 'border-slate-700 text-slate-300 hover:border-slate-500'
      }`}
    >
      {children}
    </button>
  );
}

function CheckRow({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 text-sm text-slate-300">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-cyan-500" />
      <span>{children}</span>
    </label>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-700 text-slate-400 hover:text-white">
      {children}
    </button>
  );
}
