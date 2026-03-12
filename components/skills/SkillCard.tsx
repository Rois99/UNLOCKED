import { CheckCircle2, Lock, Upload, Star } from 'lucide-react';
import type { Skill, SkillState, Difficulty } from '@/types';

interface SkillCardProps {
  skill: Skill;
  state: SkillState;
  onClick?: () => void;
}

const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; className: string }> = {
  beginner:     { label: 'Beginner',     className: 'bg-emerald-500/15 text-emerald-400' },
  intermediate: { label: 'Intermediate', className: 'bg-blue-500/15 text-blue-400' },
  advanced:     { label: 'Advanced',     className: 'bg-violet-500/15 text-violet-400' },
  elite:        { label: 'Elite',        className: 'bg-orange-500/15 text-orange-400' },
};

export default function SkillCard({ skill, state, onClick }: SkillCardProps) {
  const isClickable = state === 'available';
  const diff = DIFFICULTY_CONFIG[skill.difficulty];

  const cardBase =
    'relative flex w-52 shrink-0 flex-col gap-3 rounded-xl border p-4 transition-all duration-200';

  const cardVariant: Record<SkillState, string> = {
    unlocked:
      'border-emerald-500/40 bg-emerald-950/30 card-glow-emerald',
    available:
      'border-cyan-500/30 bg-slate-900 hover:border-cyan-400/60 hover:bg-slate-800/60 card-glow-cyan cursor-pointer',
    locked:
      'border-slate-800 bg-slate-900/40 opacity-50 cursor-not-allowed',
  };

  return (
    <div
      className={`${cardBase} ${cardVariant[state]}`}
      onClick={isClickable ? onClick : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => e.key === 'Enter' && onClick?.() : undefined}
    >
      {/* State badge (top-right) */}
      <StateBadge state={state} />

      {/* Header: difficulty + XP */}
      <div className="flex items-center justify-between">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${diff.className}`}>
          {diff.label}
        </span>
        <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400">
          <Star size={11} fill="currentColor" />
          {skill.xp.toLocaleString()} XP
        </span>
      </div>

      {/* Skill name */}
      <div>
        <h3 className={`text-sm font-bold leading-tight ${state === 'locked' ? 'text-slate-500' : 'text-white'}`}>
          {skill.name}
        </h3>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-500 line-clamp-2">
          {skill.description}
        </p>
      </div>

      {/* CTA hint for available skills */}
      {state === 'available' && (
        <div className="mt-auto flex items-center gap-1.5 text-[11px] font-semibold text-cyan-400">
          <Upload size={12} />
          Upload Proof to Unlock
        </div>
      )}
    </div>
  );
}

function StateBadge({ state }: { state: SkillState }) {
  if (state === 'unlocked') {
    return (
      <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(52,211,153,0.5)]">
        <CheckCircle2 size={14} strokeWidth={3} className="text-slate-950" />
      </div>
    );
  }
  if (state === 'locked') {
    return (
      <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-700">
        <Lock size={12} strokeWidth={2.5} className="text-slate-400" />
      </div>
    );
  }
  return null;
}
